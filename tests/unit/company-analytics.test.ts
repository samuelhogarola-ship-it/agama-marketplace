import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsDays, companyAnalytics, readCompanyListings } from '../../src/lib/company-analytics.ts';
const end = 1_000_000_000;
const stat = (value:number) => ({pageviews:{value,prev:0}, visitors:{value:1,prev:0}, visits:{value:1,prev:0}, bounces:{value:0,prev:0}, totaltime:{value:0,prev:0}});
function fixture() {
  const paths:string[] = [];
  return {paths, client:{
    getStats: async (_start:number, until:number, url:string) => {paths.push(url); return stat(until === end ? 7 : 3);},
    getPageviews: async () => ({pageviews:[],sessions:[]}),
    getMetrics: async () => [],
    getContactClicks: async (_start:number,_end:number,url:string) => {
      paths.push(url);
      return url === '/e/empresa-a' ? 2 : url === '/p/envases-1' ? 4 : 1000;
    },
  }};
}
test('company contacts exclude other companies and previous listing views are real', async () => {
  const {paths, client} = fixture();
  const result = await companyAnalytics(client, 'empresa-a', [{id:1,slug:'envases',title:'Envases',status:'published'}], 7, end);
  assert.equal(result.contactClicks, 6);
  assert.equal(result.prevPeriod.listingPageviews, 3);
  assert.equal(result.prevPeriod.profilePageviews, 3);
  assert.ok(paths.every(path => ['/e/empresa-a','/p/envases-1'].includes(path)));
});
test('all owned listings are included, with legacy slugs and duplicate protection', async () => {
  const {client,paths} = fixture();
  const listings = Array.from({length:21},(_,i)=>({id:i+1,slug:null,title:'Producto',status:'published'}));
  const result = await companyAnalytics(client, 'empresa-a', [...listings,listings[0]], 7, end);
  assert.equal(result.listings.perListing.length,21);
  assert.equal(result.listings.totalPageviews,147);
  assert.ok(paths.includes('/p/anuncio-21'));
});
test('unavailable analytics never become zero activity', async () => {
  const {client} = fixture();
  await assert.rejects(companyAnalytics({...client,getContactClicks:async()=>null}, 'empresa-a', [], 7, end), /analytics_unavailable/);
  await assert.rejects(companyAnalytics({...client,getStats:async()=>null}, 'empresa-a', [], 7, end), /analytics_unavailable/);
});
test('days must be a bounded positive integer', () => {
  for (const value of ['-1','0','NaN','Infinity','1.5','91','1e2']) assert.equal(analyticsDays(value),null);
  assert.equal(analyticsDays(null),30);
  assert.equal(analyticsDays('7'),7);
  assert.equal(analyticsDays('90'),90);
});

test('owned listings are paginated beyond the database response limit and errors stay explicit', async () => {
  const listings = Array.from({length:1001},(_,id)=>({id,slug:'producto',title:'Producto',status:'published'}));
  const result = await readCompanyListings(async(from,to)=>({data:listings.slice(from,to+1),error:null}));
  assert.equal(result.length,1001);
  await assert.rejects(readCompanyListings(async(from,to)=> from === 0
    ? {data:listings.slice(from,to+1),error:null}
    : {data:null,error:{message:'offline'}}), /analytics_unavailable/);
});
