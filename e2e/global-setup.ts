import { chromium, type FullConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/** Sign in once per role through the real login page and keep the session. */
export const AUTH_DIR = path.join(__dirname, '.auth');

const ACCOUNTS = {
  admin: { email: 'admin@playground.test', password: 'Playground2026!' },
  teacher: { email: 'teacher@playground.test', password: 'Playground2026!' },
};

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:3310';
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const [role, acct] of Object.entries(ACCOUNTS)) {
      const page = await browser.newPage();
      await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
      await page.locator('input[type="email"], input[name="email"]').first().fill(acct.email);
      await page.locator('input[type="password"]').first().fill(acct.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForFunction(() => !!localStorage.getItem('auth_token'), null, { timeout: 30_000 });
      await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30_000 });
      await page.context().storageState({ path: path.join(AUTH_DIR, `${role}.json`) });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
