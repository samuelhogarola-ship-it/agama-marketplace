import assert from "node:assert/strict";
import test from "node:test";
import { resolveAuthOrigin, sanitizeAuthNext } from "../../src/lib/auth-redirect.ts";

test("production auth links use the configured public site", () => {
  assert.equal(
    resolveAuthOrigin({
      nodeEnv: "production",
      configuredSiteUrl: "https://todo-plastico.com/",
      forwardedHost: "attacker.example",
      forwardedProto: "https",
      host: "attacker.example",
    }),
    "https://todo-plastico.com",
  );
});

test("development auth links preserve the localhost request origin", () => {
  assert.equal(
    resolveAuthOrigin({
      nodeEnv: "development",
      configuredSiteUrl: "https://todo-plastico.com",
      forwardedHost: null,
      forwardedProto: null,
      host: "localhost:3000",
    }),
    "http://localhost:3000",
  );
});

test("auth redirects reject external and protocol-relative destinations", () => {
  assert.equal(sanitizeAuthNext("https://attacker.example", "/panel"), "/panel");
  assert.equal(sanitizeAuthNext("//attacker.example", "/panel"), "/panel");
  assert.equal(sanitizeAuthNext("/panel/ajustes", "/panel"), "/panel/ajustes");
});
