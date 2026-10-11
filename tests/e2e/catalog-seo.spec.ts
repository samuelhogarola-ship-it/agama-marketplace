import {test, expect} from '@playwright/test';

// Metadata does not depend on third-party trackers or image loading.
test.setTimeout(60_000);
for (const path of ['/empresas', '/c/envases-y-botellas']) {
  test(`canonical pagination and noindex filters: ${path}`, async ({page}) => {
    await page.goto(`${path}?page=2&utm_source=test`, {waitUntil: "domcontentloaded"});
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path}\\?page=2$`));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await page.goto(`${path}?location=Mexico`, {waitUntil: "domcontentloaded"});
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await page.goto(`${path}?page=Infinity`, {waitUntil: "domcontentloaded"});
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path}$`));
  });
}
test('directory title includes the brand exactly once', async ({page}) => {
  await page.goto('/empresas', {waitUntil: 'domcontentloaded'});
  expect((await page.title()).match(/TodoPlásticos/g)).toHaveLength(1);
});
