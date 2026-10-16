import { expect, test } from "@playwright/test";

test("el build sin website ID público no carga ningún tracker Umami", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("script[data-website-id]")).toHaveCount(0);
});
