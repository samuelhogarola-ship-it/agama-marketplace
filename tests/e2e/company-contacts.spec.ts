import { test, expect } from "@playwright/test";

test.describe("company contact form", () => {
  test.skip(process.env.COMPONENT_FIXTURES !== "1", "Fixture is mounted only in the CI test build");
  test("requires one complete contact, allows combinations and omits disabled channels", async ({ page }) => {
    await page.goto("/checks-contacts");
    const submit = page.getByRole("button", { name: "Comprobar", exact: true });
    const result = page.locator("output");
    await submit.click();
    await expect(result).toContainText("al menos una");
    await page.getByLabel("Contacto por correo electrónico", { exact: true }).check();
    await page.getByLabel("Correo electrónico público", { exact: true }).fill("ventas@example.com");
    await submit.click();
    await expect(result).toHaveText('{"phone":null,"email":"ventas@example.com","whatsapp":null}');
    await page.getByLabel("Contacto por teléfono", { exact: true }).check();
    await page.getByLabel("Número de teléfono", { exact: true }).fill("55 ab 1234-5678");
    await expect(page.getByLabel("Número de teléfono", { exact: true })).toHaveValue("5512345678");
    await submit.click();
    expect(await page.getByLabel("País y prefijo de teléfono").evaluate((e: HTMLSelectElement) => e.validity.valueMissing)).toBe(true);
    await page.getByLabel("País y prefijo de teléfono").selectOption("MX");
    await submit.click();
    await expect(result).toHaveText('{"phone":"+525512345678","email":"ventas@example.com","whatsapp":null}');
    await page.getByLabel("Contacto por WhatsApp", { exact: true }).check();
    await page.getByLabel("Buscar país para whatsapp").fill("SP");
    await page.getByLabel("País y prefijo de whatsapp").selectOption("ES");
    await page.getByLabel("Número de whatsapp").fill("612345678");
    await submit.click();
    await expect(result).toHaveText('{"phone":"+525512345678","email":"ventas@example.com","whatsapp":"+34612345678"}');
    await page.getByLabel("Contacto por teléfono", { exact: true }).uncheck();
    await page.getByLabel("Contacto por correo electrónico", { exact: true }).uncheck();
    await submit.click();
    await expect(result).toHaveText('{"phone":null,"email":null,"whatsapp":"+34612345678"}');
  });

  test("international pastes and country changes do not truncate phone numbers", async ({ page }) => {
    await page.goto("/checks-contacts");
    await page.getByLabel("Contacto por teléfono", { exact: true }).check();
    const number = page.getByLabel("Número de teléfono", { exact: true });
    await number.fill("0034612345678");
    await expect(number).toHaveValue("612345678");
    await expect(page.getByLabel("País y prefijo de teléfono")).toHaveValue("ES");
    await number.fill("+52 55 1234 5678");
    await expect(number).toHaveValue("5512345678");
    await number.press("End");
    await number.press("9");
    await expect(number).toHaveValue("5512345678");
    expect(await number.evaluate((e: HTMLInputElement) => e.validity.customError)).toBe(true);
    await page.getByLabel("País y prefijo de teléfono").selectOption("ES");
    await expect(number).toHaveValue("5512345678");
    await page.getByRole("button", { name: "Comprobar", exact: true }).click();
    await expect(page.locator("output")).toContainText("demasiadas cifras");
  });
});
