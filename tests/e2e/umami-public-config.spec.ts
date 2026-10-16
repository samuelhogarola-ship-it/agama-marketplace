import { expect, test } from "@playwright/test";
import { resolvePublicUmamiConfig } from "../../src/lib/umami-public";

test("TodoPlásticos no carga Umami cuando falta el website ID", async () => {
  expect(resolvePublicUmamiConfig({})).toBeNull();
  expect(resolvePublicUmamiConfig({
    NEXT_PUBLIC_UMAMI_URL: "https://analytics.example.test",
  })).toBeNull();
});

test("TodoPlásticos usa el sitio Umami configurado por entorno", async () => {
  expect(resolvePublicUmamiConfig({
    NEXT_PUBLIC_UMAMI_URL: "https://analytics.example.test/",
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: "staging-website-id",
  })).toEqual({
    url: "https://analytics.example.test",
    websiteId: "staging-website-id",
  });
});

test("un ID sin host no activa el tracker público", () => {
  expect(resolvePublicUmamiConfig({
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: "staging-website-id",
  })).toBeNull();
});
