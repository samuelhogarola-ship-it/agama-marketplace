import test from 'node:test';
import assert from 'node:assert/strict';
import { readSitemapRows } from '../../src/lib/sitemap-pages.ts';
test('sitemap follows all database pages including beyond 5000 rows', async () => {
  const rows = Array.from({length:5101}, (_,id)=>({id}));
  const result = await readSitemapRows(async (from,to)=>({data:rows.slice(from,to+1),error:null}));
  assert.deepEqual(result, rows);
});
test('database failure cannot masquerade as an empty successful sitemap', async () => {
  await assert.rejects(readSitemapRows(async()=>({data:null,error:{message:'offline'}})), /Sitemap data unavailable/);
});
test('failure after the first page never returns partial rows', async () => {
  await assert.rejects(readSitemapRows(async(from) => from === 0
    ? {data:Array.from({length:500}, (_,id)=>({id})),error:null}
    : {data:null,error:{message:'timeout'}}), /Sitemap data unavailable/);
});
