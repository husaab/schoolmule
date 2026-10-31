import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests (Report Template Designer). They drive a real browser
 * against a running web app + backend on an ISOLATED database — never the
 * dev servers on :3000/:4000, whose backend .env points at production.
 *
 * Start the stack first (see schoolmule-backend/scripts/e2e/README.md):
 *   web  → http://localhost:3310  (E2E_WEB_URL)
 *   api  → http://localhost:4310/api (E2E_API_URL)
 * then: npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.E2E_WEB_URL ?? 'http://localhost:3310',
    viewport: { width: 1600, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } } }],
});
