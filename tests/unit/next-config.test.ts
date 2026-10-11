import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../../next.config.ts";

async function contentSecurityPolicyFor(nodeEnv: string) {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;

  try {
    const headerGroups = await nextConfig.headers?.();
    const securityHeaders = headerGroups?.[0]?.headers ?? [];
    return securityHeaders.find((header) => header.key === "Content-Security-Policy")?.value;
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
}

test("development CSP permits the Next.js client runtime to evaluate modules", async () => {
  const csp = await contentSecurityPolicyFor("development");

  assert.match(csp ?? "", /script-src[^;]*'unsafe-eval'/);
});

test("production CSP does not permit string evaluation", async () => {
  const csp = await contentSecurityPolicyFor("production");

  assert.doesNotMatch(csp ?? "", /script-src[^;]*'unsafe-eval'/);
});
