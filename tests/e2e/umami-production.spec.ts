import { expect, test } from "@playwright/test";

test("el build sin variables públicas carga el tracker Agama", async ({ page }) => {
  await page.route("https://analytics.2.24.10.239.sslip.io/script.js", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });

  await page.goto("/");

  const tracker = page.locator('script[data-website-id="6e0256c7-fb46-4ed1-bfd8-fa030d599504"]');
  await expect(tracker).toHaveAttribute(
    "src",
    "https://analytics.2.24.10.239.sslip.io/script.js",
  );
  await expect(tracker).toHaveAttribute(
    "data-domains",
    "todo-plastico.com,www.todo-plastico.com",
  );
});
