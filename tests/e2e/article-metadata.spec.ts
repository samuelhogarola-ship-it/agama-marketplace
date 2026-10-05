import { expect, test } from '@playwright/test';
import { PUBLISHED_ARTICLES } from '../../src/lib/articles';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://todo-plastico.com';

test('article share tags and schema describe the same published guide', async ({ page }) => {
  const article = PUBLISHED_ARTICLES[0];
  const url = new URL(`/articulos/${article.slug}`, base).href;
  const image = new URL(article.cover, base).href;
  await page.goto(`/articulos/${article.slug}`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', url);
  for (const [property, content] of Object.entries({
    'og:type': 'article', 'og:title': article.title,
    'og:description': article.excerpt, 'og:url': url, 'og:image': image,
    'article:published_time': article.date,
    'article:modified_time': article.updatedAt ?? article.date,
  })) {
    await expect(page.locator(`meta[property="${property}"]`)).toHaveAttribute('content', content);
  }
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', article.title);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', image);
  const schema = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!);
  expect(schema.image).toBe(image);
  expect(schema.mainEntityOfPage['@id']).toBe(url);
  expect(schema.datePublished).toBe(article.date);
  expect(schema.dateModified).toBe(article.updatedAt ?? article.date);
});

test('category index includes the brand only once in its title', async ({ page }) => {
  await page.goto('/categorias');
  await expect(page).toHaveTitle('Productos plásticos por categoría | TodoPlásticos');
});
