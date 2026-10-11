import { test, expect } from "@playwright/test";

test("company registration limits RFC input and rejects a personal RFC", async ({ page }) => {
  await page.goto("/registro");
  const rfc = page.getByLabel(/RFC de la empresa/);
  await rfc.fill("abc010203xy9");
  await expect(rfc).toHaveValue("ABC010203XY9");
  await rfc.press("End");
  await rfc.press("A");
  await expect(rfc).toHaveValue("ABC010203XY9");
  await rfc.fill("ABC-010203-XY9");
  await expect(rfc).toHaveValue("ABC010203XY9");
  await rfc.fill("ABCD010203XY9");
  expect(await rfc.evaluate((input: HTMLInputElement) => input.validity.patternMismatch)).toBe(true);
});
