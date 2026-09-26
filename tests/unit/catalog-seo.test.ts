import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogMetadata, pageNumber } from '../../src/lib/catalog-seo.ts';

test('pagination has its own canonical while first page and tracking normalize', () => {
  assert.equal(catalogMetadata('/empresas', {page:'2', utm_source:'mail'}, ['q']).alternates.canonical, '/empresas?page=2');
  assert.equal(catalogMetadata('/empresas', {page:'1'}, ['q']).alternates.canonical, '/empresas');
  assert.equal(catalogMetadata('/empresas', {utm_source:'mail'}, ['q']).robots.index, true);
});
test('filters are not indexed and retain normalized self canonicals', () => {
  const meta = catalogMetadata('/empresas', {q:' envases ', page:'2'}, ['q']);
  assert.equal(meta.alternates.canonical, '/empresas?q=envases&page=2');
  assert.deepEqual(meta.robots, {index:false, follow:true});
  assert.equal(catalogMetadata('/c/envases', {sort:'newest', location:''}, ['sort','location']).robots.index, true);
});
test('malformed pagination cannot reach database range arithmetic', () => {
  for (const value of ['NaN','Infinity','-1','0','1.5','1e9','999999999999999999']) assert.equal(pageNumber(value), 1);
  assert.equal(pageNumber(['3','8']), 3);
});
