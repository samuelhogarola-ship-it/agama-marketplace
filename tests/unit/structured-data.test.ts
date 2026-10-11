import test from 'node:test';
import assert from 'node:assert/strict';
import { listingStructuredData, companyStructuredData } from '../../src/lib/structured-data.ts';
const listing = {title:'Envase', description:'Envase PET', type:'product', price_mxn:null};
test('unpriced products never claim stock or a priced offer', () => {
  const data = listingStructuredData(listing, [], 'Envases');
  assert.equal(data['@type'], 'Product');
  assert.equal(data.offers, undefined);
  const priced = listingStructuredData({...listing,price_mxn:0}, [], 'Envases');
  assert.equal(priced.offers?.price, 0);
  assert.ok(!('availability' in priced.offers!));
  for (const price of [-1,NaN,Infinity]) assert.equal(listingStructuredData({...listing,price_mxn:price}, []).offers, undefined);
});
test('services and general ads are not misrepresented as products', () => {
  assert.equal(listingStructuredData({...listing,type:'service'}, [])['@type'], 'Service');
  assert.equal(listingStructuredData({...listing,type:'ad'}, [])['@type'], 'CreativeWork');
});
test('company schema uses its own profile URL without inventing a local address', () => {
  const data = companyStructuredData({name:'Empresa',location:'México, CDMX',website:'https://example.com'}, 'https://todo-plastico.com/e/empresa');
  assert.equal(data['@type'],'Organization');
  assert.equal(data.url,'https://todo-plastico.com/e/empresa');
  assert.equal(data.address,'México, CDMX');
  assert.deepEqual(data.sameAs,['https://example.com']);
});
