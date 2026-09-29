import { test, expect } from '@playwright/test';
import { FAMILY_EDITORIAL } from '../../src/lib/family-editorial';
import { PUBLISHED_ARTICLES } from '../../src/lib/articles';

for (const [slug, content] of Object.entries(FAMILY_EDITORIAL)) {
  test(`family ${slug} has useful copy and links to a published guide`,async({page})=>{
    await page.goto(`/c/${slug}`);
    await expect(page.getByRole('heading',{level:1})).toHaveText(content.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',content.description);
    await expect(page.getByRole('heading',{name:'Datos para pedir una cotización'})).toBeVisible();
    await expect(page.locator(`a[href="/articulos/${content.article}"]`)).toBeVisible();
  });
}
for (const article of PUBLISHED_ARTICLES.filter(a=>a.updatedAt==='2026-09-29')) {
  test(`guide ${article.slug} exposes updated copy and a catalogue destination`,async({page})=>{
    await page.goto(`/articulos/${article.slug}`);
    await expect(page.getByRole('heading',{level:1})).toHaveText(article.title);
    await expect(page.getByRole('navigation',{name:'Consultar productos'})).toBeVisible();
    const schema = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(schema!).datePublished).toBe(article.date);
    expect(JSON.parse(schema!).dateModified).toBe(article.updatedAt);
  });
}
test('article to catalogue click records the actual article and family once',async({page})=>{
  await page.route('https://analytics.2.24.10.239.sslip.io/script.js', route=>route.abort());
  await page.addInitScript(()=>{
    window.umami={track:(name,data)=>{const events=JSON.parse(sessionStorage.getItem('editorial-events') || '[]'); events.push({name,data}); sessionStorage.setItem('editorial-events',JSON.stringify(events));}};
  });
  await page.goto('/articulos/como-elegir-un-envase-plastico-para-tu-producto');
  await page.getByRole('navigation',{name:'Consultar productos'}).getByRole('link',{name:'Envases y botellas',exact:true}).click();
  await expect(page).toHaveURL(/\/c\/envases-y-botellas$/);
  const event = await page.evaluate(()=>JSON.parse(sessionStorage.getItem('editorial-events')!));
  expect(event).toEqual([{name:'content_catalog_click',data:{category:'envases-y-botellas',article_slug:'como-elegir-un-envase-plastico-para-tu-producto'}}]);
});
test('paginated families do not repeat the extended editorial section',async({page})=>{
  await page.goto('/c/envases-y-botellas?page=2');
  await expect(page.getByRole('heading',{name:'Datos para pedir una cotización'})).toHaveCount(0);
});
