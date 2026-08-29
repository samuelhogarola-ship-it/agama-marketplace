import { expect, test } from "@playwright/test";

test("TodoPlástico conserva su Umami Agama cuando faltan variables de build", async () => {
  const { resolvePublicUmamiConfig } = await import("../../src/lib/umami-public");

  expect(resolvePublicUmamiConfig({})).toEqual({
    url: "https://analytics.2.24.10.239.sslip.io",
    websiteId: "6e0256c7-fb46-4ed1-bfd8-fa030d599504",
  });
});

test("TodoPlástico no acepta por error el VPS personal", async () => {
  const { resolvePublicUmamiConfig } = await import("../../src/lib/umami-public");

  expect(resolvePublicUmamiConfig({
    NEXT_PUBLIC_UMAMI_URL: "https://analytics.187.124.55.36.sslip.io",
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: "personal-site-id",
  })).toEqual({
    url: "https://analytics.2.24.10.239.sslip.io",
    websiteId: "6e0256c7-fb46-4ed1-bfd8-fa030d599504",
  });
});
