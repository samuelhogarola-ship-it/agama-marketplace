import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../../next.config.ts";

async function contentSecurityPolicyFor(nodeEnv: string) {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousUmamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
  process.env.NODE_ENV = nodeEnv;

  try {
    const headerGroups = await nextConfig.headers?.();
    const securityHeaders = headerGroups?.[0]?.headers ?? [];
    return securityHeaders.find((header) => header.key === "Content-Security-Policy")?.value;
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    if (previousUmamiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_UMAMI_URL;
    } else {
      process.env.NEXT_PUBLIC_UMAMI_URL = previousUmamiUrl;
    }
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

test("production CSP permits the configured Umami origin", async () => {
  const previousUmamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
  const previousUmamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  process.env.NEXT_PUBLIC_UMAMI_URL = "https://analytics.example.test/path";
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = "configured-site-id";

  try {
    const csp = await contentSecurityPolicyFor("production");

    assert.match(csp ?? "", /script-src[^;]*https:\/\/analytics\.example\.test/);
    assert.match(csp ?? "", /connect-src[^;]*https:\/\/analytics\.example\.test/);
  } finally {
    if (previousUmamiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_UMAMI_URL;
    } else {
      process.env.NEXT_PUBLIC_UMAMI_URL = previousUmamiUrl;
    }
    if (previousUmamiWebsiteId === undefined) {
      delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    } else {
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = previousUmamiWebsiteId;
    }
  }
});

test("production CSP omits Umami when the website ID is missing", async () => {
  const previousUmamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
  const previousUmamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  process.env.NEXT_PUBLIC_UMAMI_URL = "https://analytics.example.test";
  delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  try {
    const csp = await contentSecurityPolicyFor("production");

    assert.doesNotMatch(csp ?? "", /analytics\.example\.test/);
  } finally {
    if (previousUmamiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_UMAMI_URL;
    } else {
      process.env.NEXT_PUBLIC_UMAMI_URL = previousUmamiUrl;
    }
    if (previousUmamiWebsiteId === undefined) {
      delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    } else {
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = previousUmamiWebsiteId;
    }
  }
});
