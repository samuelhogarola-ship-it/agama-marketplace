import assert from "node:assert/strict";
import test from "node:test";

import { startProCheckout } from "../../src/lib/pro-checkout.ts";

test("Pro checkout redirects to the Stripe session returned by the API", async () => {
  const destinations: string[] = [];

  const result = await startProCheckout({
    request: async () =>
      new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/test" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    redirect: (url) => destinations.push(url),
  });

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(destinations, ["https://checkout.stripe.com/c/pay/test"]);
});

test("Pro checkout exposes the API error without redirecting", async () => {
  const destinations: string[] = [];

  const result = await startProCheckout({
    request: async () =>
      new Response(JSON.stringify({ error: "Plan Pro no disponible aún." }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    redirect: (url) => destinations.push(url),
  });

  assert.deepEqual(result, {
    ok: false,
    error: "Plan Pro no disponible aún.",
  });
  assert.deepEqual(destinations, []);
});

test("Pro checkout reports a network failure without redirecting", async () => {
  const destinations: string[] = [];

  const result = await startProCheckout({
    request: async () => {
      throw new Error("offline");
    },
    redirect: (url) => destinations.push(url),
  });

  assert.deepEqual(result, {
    ok: false,
    error: "Error de red. Inténtalo de nuevo.",
  });
  assert.deepEqual(destinations, []);
});

test("Pro checkout rejects a non-string checkout URL", async () => {
  const destinations: string[] = [];

  const result = await startProCheckout({
    request: async () => Response.json({ url: { unexpected: true } }),
    redirect: (url) => destinations.push(url),
  });

  assert.deepEqual(result, { ok: false, error: "No se pudo iniciar el pago." });
  assert.deepEqual(destinations, []);
});

test("Pro checkout ignores a non-string API error", async () => {
  const result = await startProCheckout({
    request: async () => Response.json({ error: { unexpected: true } }, { status: 503 }),
    redirect: () => assert.fail("must not redirect"),
  });

  assert.deepEqual(result, { ok: false, error: "No se pudo iniciar el pago." });
});
