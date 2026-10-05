import test from 'node:test';
import assert from 'node:assert/strict';
import { articleSeo } from '../../src/lib/article-seo.ts';
import { PUBLISHED_ARTICLES } from '../../src/lib/articles.ts';

const base = 'https://todo-plastico.com';
test('published articles share their real canonical, image and dates across metadata and schema', () => {
  for (const article of PUBLISHED_ARTICLES) {
    const { metadata, jsonLd } = articleSeo(article, `${base}/`);
    const url = `${base}/articulos/${article.slug}`;
    const image = new URL(article.cover, base).href;
    assert.equal(metadata.alternates?.canonical, url);
    assert.equal(jsonLd.url, url);
    assert.equal(jsonLd.mainEntityOfPage['@id'], url);
    assert.equal(jsonLd.image, image);
    assert.equal(jsonLd.datePublished, article.date);
    assert.equal(jsonLd.dateModified, article.updatedAt ?? article.date);
    assert.equal(jsonLd.author.name, article.author ?? 'TodoPlásticos');
    assert.equal(jsonLd.author['@type'], article.author ? 'Person' : 'Organization');
    assert.equal(metadata.title, article.title);
    assert.deepEqual(metadata.openGraph, {
      type: 'article', title: article.title, description: article.excerpt,
      url, siteName: 'TodoPlásticos', locale: 'es_MX',
      images: [{ url: image, alt: article.title }],
      publishedTime: article.date, modifiedTime: article.updatedAt ?? article.date,
    });
    assert.deepEqual(metadata.twitter, {
      card: 'summary_large_image', title: article.title,
      description: article.excerpt, images: [image],
    });
  }
});

test('metadata uses the configured origin without changing an external cover or inventing author identity', () => {
  const article = { ...PUBLISHED_ARTICLES[0], author: undefined, authorTitle: undefined, updatedAt: undefined, cover: 'https://images.example.test/cover.png' };
  const { metadata, jsonLd } = articleSeo(article, 'https://preview.example.test/');
  assert.equal(metadata.alternates?.canonical, `https://preview.example.test/articulos/${article.slug}`);
  assert.equal(jsonLd.image, article.cover);
  assert.equal(jsonLd.dateModified, article.date);
  assert.deepEqual(jsonLd.author, { '@type': 'Organization', name: 'TodoPlásticos' });
});
