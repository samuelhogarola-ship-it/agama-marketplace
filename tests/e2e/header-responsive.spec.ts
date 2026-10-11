import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1440]) {
  test(`header stays usable at ${width}px`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    await page.route('https://analytics.2.24.10.239.sslip.io/**', route => route.abort());
    await page.goto('/ingresar', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Solo esenciales', exact: true }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    if (width < 768) {
      const menu = page.getByRole('button', { name: 'Abrir menú', exact: true });
      const box = await menu.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      await menu.click();
      await expect(page.getByRole('navigation', { name: 'Menú principal', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Cerrar menú', exact: true }).click();
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      const search = page.locator('header').getByRole('button', { name: 'Buscar', exact: true }).filter({ visible: true });
      const searchBox = await search.boundingBox();
      expect(searchBox).not.toBeNull();
      expect(searchBox!.x + searchBox!.width).toBeLessThanOrEqual(width);
      await search.click();
      await expect(page.locator('header').getByRole('searchbox', { name: 'Buscar en TodoPlásticos', exact: true })).toBeVisible();
    } else {
      await expect(page.locator('header').getByRole('searchbox', { name: 'Buscar en TodoPlásticos', exact: true })).toBeVisible();
    }
  });
}
