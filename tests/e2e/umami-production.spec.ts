import { expect, test } from "@playwright/test";

test("el tracker público de Umami solo carga con configuración completa", async ({ page }) => {
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL?.replace(/\/+$/, "");
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  if (umamiUrl) {
    await page.route(`${umamiUrl}/script.js`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
    });
  }

  await page.goto("/");

  if (!umamiUrl || !websiteId) {
    await expect(page.locator('script[data-website-id]')).toHaveCount(0);
    return;
  }

  const tracker = page.locator(`script[data-website-id="${websiteId}"]`);
  await expect(tracker).toHaveAttribute("src", `${umamiUrl}/script.js`);
  await expect(tracker).toHaveAttribute(
    "data-domains",
    "todo-plastico.com,www.todo-plastico.com",
  );
});
