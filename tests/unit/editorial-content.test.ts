import test from 'node:test';
import assert from 'node:assert/strict';
import { FAMILY_EDITORIAL } from '../../src/lib/family-editorial.ts';
import { CATEGORIES } from '../../src/lib/categories.ts';
import { PUBLISHED_ARTICLES } from '../../src/lib/articles.ts';

test('eight families link to published guides and existing related categories',()=>{
  assert.equal(Object.keys(FAMILY_EDITORIAL).length,8);
  for (const [slug, content] of Object.entries(FAMILY_EDITORIAL)) {
    assert.ok(CATEGORIES.some(c=>c.slug===slug));
    assert.ok(PUBLISHED_ARTICLES.some(a=>a.slug===content.article));
    for (const related of content.related) assert.ok(CATEGORIES.some(c=>c.slug===related));
  }
});
test('four updated guides retain original publication dates and have category destinations',()=>{
  const revised=PUBLISHED_ARTICLES.filter(a=>a.sections && a.familySlugs && a.sources);
  assert.equal(revised.length,4);
  for (const article of revised) {
    assert.ok(article.date < article.updatedAt!);
    assert.ok(article.sections && article.sections.length>=4);
    assert.ok(article.familySlugs?.every(slug=>CATEGORIES.some(c=>c.slug===slug)));
    assert.ok(article.sources?.length);
  }
});
