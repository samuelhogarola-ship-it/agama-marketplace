import {test, expect} from '@playwright/test';
for (const path of ['/empresas', '/c/envases-y-botellas']) {
  test(`canonical pagination and noindex filters: ${path}`, async ({page}) => {
    await page.goto(`${path}?page=2&utm_source=test`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path}\\?page=2$`));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await page.goto(`${path}?location=Mexico`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await page.goto(`${path}?page=Infinity`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path}$`));
  });
}
test('directory title includes the brand exactly once', async ({page}) => {
  await page.goto('/empresas');
  expect((await page.title()).match(/TodoPlásticos/g)).toHaveLength(1);
});
