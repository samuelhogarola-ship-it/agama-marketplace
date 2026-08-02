import { defineConfig, devices } from '@playwright/test';

// Suites previstas en docs/stack.md: smoke, auth, publish, moderation, messaging, seo.
// Activo desde Fase 1 (scaffold Next.js). El webServer arranca el dev server local.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3210',
    trace: 'on-first-retry',
    locale: 'es-MX',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    command: 'npm run dev -- --hostname 0.0.0.0 --port 3210',
    url: 'http://localhost:3210',
    reuseExistingServer: !process.env.CI,
  },
});
