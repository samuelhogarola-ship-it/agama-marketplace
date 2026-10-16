import assert from "node:assert/strict";
import test from "node:test";
import { resolvePublicUmamiConfig } from "../../src/lib/umami-public.ts";

test("public Umami config is inert without a website ID", () => {
  assert.equal(resolvePublicUmamiConfig({}), null);
  assert.equal(
    resolvePublicUmamiConfig({
      NEXT_PUBLIC_UMAMI_URL: "https://analytics.example.test",
    }),
    null,
  );
});

test("public Umami config uses the environment website per deployment", () => {
  assert.deepEqual(
    resolvePublicUmamiConfig({
      NEXT_PUBLIC_UMAMI_URL: "https://analytics.example.test/",
      NEXT_PUBLIC_UMAMI_WEBSITE_ID: "staging-website-id",
    }),
    {
      url: "https://analytics.example.test",
      websiteId: "staging-website-id",
    },
  );
});
