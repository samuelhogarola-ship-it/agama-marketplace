import { expect, test } from "@playwright/test";
import { resolvePublicUmamiConfig } from "../../src/lib/umami-public";

test("TodoPlásticos deja Umami inerte cuando faltan variables de build", async () => {
  expect(resolvePublicUmamiConfig({})).toBeNull();
});

test("TodoPlásticos usa la pareja de entorno cuando está completa", async () => {
  expect(resolvePublicUmamiConfig({
    NEXT_PUBLIC_UMAMI_URL: "https://analytics.187.124.55.36.sslip.io",
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: "personal-site-id",
  })).toEqual({
    url: "https://analytics.187.124.55.36.sslip.io",
    websiteId: "personal-site-id",
  });
});

test("una configuración parcial no activa el tracker público", () => {
  expect(resolvePublicUmamiConfig({
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: "123e4567-e89b-42d3-a456-426614174000",
  })).toBeNull();

  expect(resolvePublicUmamiConfig({
    NEXT_PUBLIC_UMAMI_URL: "https://analytics.2.24.10.239.sslip.io",
  })).toBeNull();
});

test("normaliza la URL para no duplicar barras", () => {
  expect(resolvePublicUmamiConfig({
    NEXT_PUBLIC_UMAMI_URL: "https://analytics.2.24.10.239.sslip.io/",
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: "123e4567-e89b-42d3-a456-426614174000",
  })).toEqual({
    url: "https://analytics.2.24.10.239.sslip.io",
    websiteId: "123e4567-e89b-42d3-a456-426614174000",
  });
});
