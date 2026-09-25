import { expect, test } from '@playwright/test';
test.skip(process.env.COMPONENT_FIXTURES !== '1', 'Component fixture is mounted only by CI');

test('postal lookup fills a zone, selects a colony and preserves leading zero on submit', async ({ page, request }) => {
  const response = await request.get('/api/codigos-postales?cp=01000');
  expect(response.status()).toBe(200);
  expect((await response.json()).zones[0].colonies).toContain('San Ángel');
  expect((await request.get('/api/codigos-postales?cp=123')).status()).toBe(400);
  await page.goto('/checks-address');
  await page.getByLabel('Código postal *').fill('01 030');
  await expect(page.getByLabel('Código postal *')).toHaveValue('01030');
  await expect(page.getByLabel('Estado *', { exact: true })).toHaveValue('Ciudad de México');
  await page.getByLabel('Colonia o localidad *').selectOption({ label: 'Florida' });
  await page.getByLabel('Calle *', { exact: true }).fill('Revolución');
  await page.getByLabel('Número exterior *').fill('S/N');
  await page.getByRole('button', { name: 'Comprobar dirección' }).click();
  await expect(page.locator('output')).toContainText('"postalCode":"01030"');
  await expect(page.locator('output')).toContainText('"colony":"Florida"');
  await expect(page.locator('output')).toContainText('"location":"Álvaro Obregón, Ciudad de México"');
  await page.getByLabel('Código postal *').fill('64000');
  await expect(page.getByLabel('Estado *', { exact: true })).toHaveValue('Nuevo León');
  await expect(page.getByLabel('Municipio o alcaldía *')).toHaveValue('Monterrey');
  await expect(page.getByLabel('Calle *', { exact: true })).toHaveValue('Revolución');
});

test('required fields and unavailable lookup allow complete manual address, never blank postal code', async ({ page }) => {
  await page.route('**/api/codigos-postales?*', route => route.fulfill({ status: 503, json: { error: 'unavailable' } }));
  await page.goto('/checks-address');
  await page.getByRole('button', { name: 'Comprobar dirección' }).click();
  await expect(page.locator('output')).toBeEmpty();
  await page.getByLabel('Código postal *').fill('12345');
  await expect(page.locator('#address-postal-status')).toContainText('manualmente');
  await page.getByLabel('Estado *', { exact: true }).fill('Estado de prueba');
  await page.getByLabel('Municipio o alcaldía *').fill('Municipio de prueba');
  await page.getByLabel('Colonia o localidad *').fill('Colonia de prueba');
  await page.getByLabel('Calle *', { exact: true }).fill('Calle de prueba');
  await page.getByLabel('Número exterior *').fill('15A');
  await page.getByRole('button', { name: 'Comprobar dirección' }).click();
  await expect(page.locator('output')).toContainText('"postalCode":"12345"');
});

test('a late lookup cannot replace the zone of a different postal code', async ({ page }) => {
  let release!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/codigos-postales?cp=01000', async route => {
    await wait;
    await route.fulfill({ json: { zones: [{ state:'Ciudad de México', municipality:'Álvaro Obregón', colonies:['San Ángel'] }] } }).catch(() => {});
  });
  await page.goto('/checks-address');
  await page.getByLabel('Código postal *').fill('01000');
  await expect(page.locator('#address-postal-status')).toContainText('Buscando');
  await page.getByLabel('Código postal *').fill('64000');
  await expect(page.getByLabel('Estado *', { exact: true })).toHaveValue('Nuevo León');
  release();
  await expect(page.getByLabel('Estado *', { exact: true })).toHaveValue('Nuevo León');
});
