import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { AUTH_DIR } from './global-setup';

/**
 * Generate in the background: pressing Generate queues the students on the
 * server, which prints them (REPORT_GENERATION_WORKER=true on the e2e API),
 * and the page follows along. Real printing, fake storage, the synthetic
 * PLAYGROUND school. Each test dismisses its card so the next starts clean.
 */

const API = process.env.E2E_API_URL ?? 'http://localhost:4310/api';
const TERM = 'Term 1';

test.describe.configure({ mode: 'serial' });
test.use({ storageState: path.join(AUTH_DIR, 'admin.json') });

function authToken(role: 'admin' | 'teacher' = 'admin'): string {
  const state = JSON.parse(fs.readFileSync(path.join(AUTH_DIR, `${role}.json`), 'utf8')) as {
    origins: Array<{ localStorage: Array<{ name: string; value: string }> }>;
  };
  return state.origins.flatMap((o) => o.localStorage).find((e) => e.name === 'auth_token')?.value ?? '';
}

const api = (request: APIRequestContext, method: 'GET' | 'POST' | 'DELETE', url: string, data?: unknown) =>
  request.fetch(`${API}${url}`, { method, data, headers: { Authorization: `Bearer ${authToken()}` } });

const card = (page: Page) => page.locator('section[aria-label$="generated"], section[aria-label^="Generating"]');

/** Opens Generate missing, ticks exactly these students, and presses Generate. */
async function generateMissing(page: Page, names: string[], opts: { reportDate?: string; all?: boolean } = {}) {
  await page.getByRole('button', { name: /^Generate missing \(\d+\)$/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  if (!opts.all) {
    await dialog.getByRole('button', { name: 'Clear', exact: true }).click();
    for (const name of names) await dialog.getByRole('checkbox', { name }).check();
  }
  if (opts.reportDate) await dialog.locator('#pr-missing-date').fill(opts.reportDate);
  await dialog.getByRole('button', { name: /^Generate \d+ / }).click();
  await expect(dialog).toBeHidden();
}

async function dismissCard(page: Page) {
  await card(page).getByRole('button', { name: 'Dismiss' }).click();
  await expect(card(page)).toHaveCount(0);
}

async function pdfText(buf: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    out += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
  }
  return out.replace(/ /g, ' ');
}

test('a batch keeps going after leaving the page, and its results wait', async ({ page }) => {
  const names = ['Ameera Sayed', 'Aya Abbas', 'Yara Elmasri'];
  await page.goto(`/report-cards?term=${encodeURIComponent(TERM)}&grades=1`);
  await generateMissing(page, names);
  await expect(card(page).getByText(/^Generating report cards · \d of 3$/)).toBeVisible();
  // Nothing is locked: the page's other buttons still work.
  await expect(page.getByRole('button', { name: /^Generate missing \(\d+\)$/ })).toBeEnabled();

  await page.goto('/dashboard');
  await page.goto(`/report-cards?term=${encodeURIComponent(TERM)}&grades=1`);
  await expect(card(page).getByText('3 report cards ready')).toBeVisible({ timeout: 60_000 });
  for (const name of names) await expect(page.getByRole('button', { name: `View ${name}'s report card` }).first()).toBeVisible();
  await dismissCard(page);
});

test('a skipped student is explained, and Dismiss clears the card', async ({ page, request }) => {
  const created = await (await api(request, 'POST', '/students', { name: 'Skipped Pupil', grade: '5', school: 'PLAYGROUND' })).json();
  const studentId = created.data.studentId as string;
  try {
    await page.goto(`/reports/progress-reports?term=${encodeURIComponent(TERM)}&grades=5`);
    await generateMissing(page, ['Skipped Pupil', 'Batool Zoabi']);
    await expect(card(page).getByText('1 progress report ready · 1 student skipped')).toBeVisible({ timeout: 60_000 });

    await card(page).getByRole('button', { name: 'See details' }).click();
    const details = page.getByRole('dialog');
    await expect(details.getByText('Skipped Pupil')).toBeVisible();
    await expect(details.getByText(`Not in any ${TERM} class yet. Add them to a class, then generate again.`)).toBeVisible();
    await details.getByRole('button', { name: 'Done' }).click();

    await dismissCard(page);
    await page.reload();
    await expect(page.getByRole('button', { name: /^Generate missing \(\d+\)$/ })).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  } finally {
    await api(request, 'DELETE', `/students/${studentId}`);
  }
});

test('Stop drops what has not started', async ({ page }) => {
  await page.goto(`/report-cards?term=${encodeURIComponent(TERM)}&grades=2`);
  await generateMissing(page, [], { all: true });
  await expect(card(page).getByText(/^Generating report cards · \d+ of 12$/)).toBeVisible();
  await card(page).getByRole('button', { name: 'Stop' }).click();

  const stopped = card(page).getByText(/^Stopped · \d+ report cards? ready · \d+ not started$/);
  await expect(stopped).toBeVisible({ timeout: 30_000 });
  const [, made, left] = /(\d+) report cards? ready · (\d+) not started/.exec((await stopped.textContent()) ?? '')!.map(Number);
  expect(made + left).toBe(12);
  expect(left).toBeGreaterThan(0);
  await expect(page.getByText('Queued', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^View .*'s report card$/ })).toHaveCount(made);
  await dismissCard(page);
});

test('one row: no card, a toast, and no Generate button while it waits', async ({ page }) => {
  await page.goto(`/report-cards?term=${encodeURIComponent(TERM)}&grades=3`);
  const row = page.locator('tbody tr', { hasText: 'Sakina Sabbagh' });
  await row.getByRole('button', { name: "Generate Sakina Sabbagh's report card" }).click();
  await expect(row.getByRole('status')).toHaveText(/Queued|Generating…/);
  await expect(row.getByRole('button', { name: "Generate Sakina Sabbagh's report card" })).toHaveCount(0);
  await expect(card(page)).toHaveCount(0);

  await expect(page.getByText("Sakina Sabbagh's report card is ready")).toBeVisible({ timeout: 60_000 });
  await expect(row.getByRole('button', { name: "View Sakina Sabbagh's report card" })).toBeVisible({ timeout: 20_000 });
  await expect(card(page)).toHaveCount(0);
});

test('a waiting student offers no email and no delete', async ({ page }) => {
  await page.goto(`/report-cards?term=${encodeURIComponent(TERM)}&grades=1`);
  // Everyone in grade 1, Yara (who has a report card) last.
  await page.getByRole('checkbox', { name: 'Select every student shown' }).first().check();
  await page.getByRole('button', { name: /^Generate 12$/ }).click();

  const yara = page.locator('tbody tr', { hasText: 'Yara Elmasri' });
  await expect(yara.getByRole('status')).toHaveText('Queued');
  await expect(yara.getByRole('button', { name: 'Email family' })).toHaveCount(0);
  await expect(yara.getByText('After the new version')).toBeVisible();
  // Still viewable and downloadable, nothing else.
  await expect(yara.getByRole('button', { name: "View Yara Elmasri's report card" })).toBeVisible();
  await yara.getByRole('button', { name: 'More for Yara Elmasri' }).click();
  await expect(page.getByRole('menuitem')).toHaveText(['Download PDF']);
  await page.keyboard.press('Escape');

  await yara.getByRole('checkbox', { name: 'Select Yara Elmasri' }).check();
  await expect(page.getByRole('button', { name: 'Email families (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Delete (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Download ZIP (1)' })).toBeEnabled();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();

  await expect(card(page).getByText('12 report cards ready')).toBeVisible({ timeout: 90_000 });
  await expect(yara.getByRole('button', { name: 'Email family' })).toBeVisible();
  await dismissCard(page);
});

test('a teacher sees the run and who started it', async ({ browser, request }) => {
  const students = await (await api(request, 'GET', '/students?school=PLAYGROUND')).json();
  const grade8 = (students.data as { studentId: string; grade: string }[]).filter((s) => String(s.grade) === '8').map((s) => s.studentId);
  const started = await api(request, 'POST', '/report-generation/runs', { reportType: 'report_card', term: TERM, studentIds: grade8 });
  expect(started.status()).toBe(202);
  const runId = (await started.json()).data.run.runId as string;

  const teacher = await browser.newContext({ storageState: path.join(AUTH_DIR, 'teacher.json') });
  try {
    const page = await teacher.newPage();
    await page.goto(`/report-cards?term=${encodeURIComponent(TERM)}`);
    await expect(card(page).getByText(/^Generating report cards · \d+ of \d+$/)).toBeVisible();
    await expect(card(page).getByText(/^Started by /)).toBeVisible();
    await expect(card(page).getByText(/ready/)).toBeVisible({ timeout: 90_000 });
    await dismissCard(page);
  } finally {
    await teacher.close();
    await api(request, 'POST', `/report-generation/runs/${runId}/dismiss`);
  }
});

test('progress reports go through the same queue, with the report date', async ({ page, request }) => {
  await page.goto(`/reports/progress-reports?term=${encodeURIComponent(TERM)}`);
  await generateMissing(page, ['Sara Haddad', 'Aisha Ismail'], { reportDate: '2026-11-20' });
  await expect(card(page).getByText(/^Generating progress reports · \d of 2$/)).toBeVisible();
  await expect(card(page).getByText('2 progress reports ready')).toBeVisible({ timeout: 60_000 });

  const reports = (await (await api(request, 'GET', `/progress-reports/reports/term/${encodeURIComponent(TERM)}/school/PLAYGROUND`)).json()).data as {
    student_name: string;
    file_path: string;
  }[];
  const fileOf = (name: string) => reports.find((r) => r.student_name === name)?.file_path ?? '';
  for (const name of ['Sara Haddad', 'Aisha Ismail']) expect(fileOf(name)).not.toBe('');

  const signed = await (await api(request, 'GET', `/progress-reports/signed-url?path=${encodeURIComponent(fileOf('Sara Haddad'))}`)).json();
  const pdf = Buffer.from(await (await request.get(signed.url)).body());
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  const text = await pdfText(pdf);
  expect(text).toContain('Sara');
  expect(text).toContain('November 20, 2026');
  await dismissCard(page);
});
