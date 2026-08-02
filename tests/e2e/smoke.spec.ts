import { test, expect } from "@playwright/test";

test.describe("smoke — páginas públicas", () => {
  test("home renderiza con marca TodoPlástico", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Encuentra lo que mueve al plástico");
    await expect(page.getByText(/Patrocinado por: AGAMA Pigmentos y Masterbatch/).first()).toBeVisible();
  });

  test("categorías y landing de categoría", async ({ page }) => {
    await page.goto("/categorias");
    await page.getByRole("link", { name: "Tarimas y contenedores", exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Tarimas y contenedores para la industria plástica en México");
  });

  test("categoría inexistente da 404", async ({ page }) => {
    const res = await page.goto("/c/categoria-que-no-existe");
    expect(res?.status()).toBe(404);
  });

  test("páginas legales", async ({ page }) => {
    for (const [path, title] of [
      ["/legal/terminos", "Términos de uso"],
      ["/legal/privacidad", "Aviso de privacidad"],
      ["/legal/cookies", "Política de cookies"],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
    }
  });

  test("banner de cookies aparece y se puede rechazar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("cookies esenciales")).toBeVisible();
    await page.getByRole("button", { name: "Solo esenciales" }).click({ force: true });
    await expect(page.getByText("cookies esenciales")).toBeHidden();
    await page.reload();
    await expect(page.getByText("cookies esenciales")).toBeHidden();
  });

  test("login ofrece enlace mágico", async ({ page }) => {
    await page.goto("/ingresar");
    await expect(page.getByRole("button", { name: /Enviarme enlace/ })).toBeVisible();
  });

  test("panel redirige a ingresar sin sesión", async ({ page }) => {
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/ingresar/);
  });

  test("SEO: robots y sitemap responden", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("sitemap");
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
  });

  test("SEO: JSON-LD en landing de categoría", async ({ page }) => {
    await page.goto("/c/tarimas-y-contenedores");
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toBeTruthy();
    const data = JSON.parse(jsonLd!);
    expect(data["@type"]).toBe("CollectionPage");
  });
});
