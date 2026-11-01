import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { AUTH_DIR } from './global-setup';

/**
 * School Settings → Principal and School board, printed by the report engine
 * on the JK report card ("Board: …", "Principal: …"), and hidden again once
 * they are cleared.
 */

const API = process.env.E2E_API_URL ?? 'http://localhost:4310/api';
const PRINCIPAL = 'Principal Sample';

test.describe.configure({ mode: 'serial' });
test.use({ storageState: path.join(AUTH_DIR, 'admin.json') });

function authToken(): string {
  const state = JSON.parse(fs.readFileSync(path.join(AUTH_DIR, 'admin.json'), 'utf8')) as {
    origins: Array<{ localStorage: Array<{ name: string; value: string }> }>;
  };
  return state.origins.flatMap((o) => o.localStorage).find((e) => e.name === 'auth_token')?.value ?? '';
}

const api = (request: APIRequestContext, method: 'GET' | 'POST', url: string, data?: unknown) =>
  request.fetch(`${API}${url}`, { method, data, headers: { Authorization: `Bearer ${authToken()}` } });

async function editNames(page: Page, principal: string, board: string) {
  await page.goto('/admin-panel/school-settings');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByLabel('Principal', { exact: true }).fill(principal);
  await page.getByLabel('School board', { exact: true }).fill(board);
  await page.getByRole('button', { name: 'Update School Information' }).click();
  await expect(page.getByText('School information updated successfully')).toBeVisible();
}

/** Generates a JK student's Term 1 report card and returns the PDF's text. */
async function jkReportCardText(request: APIRequestContext): Promise<string> {
  const students = await (await api(request, 'GET', '/report-templates/preview/students?grade=JK')).json();
  const studentId = students.students[0].studentId;
  const res = await api(request, 'POST', '/jk/report-card/generate', { studentId, term: 'Term 1' });
  expect(res.status()).toBe(200);
  const filePath = (await res.json()).data.filePath as string;
  const signed = await (await api(request, 'GET', `/report-cards/signed-url?path=${encodeURIComponent(filePath)}`)).json();
  const pdf = Buffer.from(await (await request.get(signed.url)).body());
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  return pdfText(pdf);
}

async function pdfText(buf: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    out += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
  }
  return out.replace(/ /g, ' ');
}

test('the principal and board set in School Settings print on the JK report card', async ({ page, request }) => {
  await editNames(page, PRINCIPAL, 'Private');
  await expect(page.getByTestId('school-principal')).toHaveText(PRINCIPAL);
  await expect(page.getByTestId('school-board')).toHaveText('Private');

  // Saved, not just shown: a fresh load reads them back.
  await page.reload();
  await expect(page.getByTestId('school-principal')).toHaveText(PRINCIPAL);

  const text = await jkReportCardText(request);
  expect(text).toMatch(/Principal:\s*Principal\s+Sample/);
  expect(text).toMatch(/Board:\s*Private/);
});

test('clearing them hides both lines on the report card', async ({ page, request }) => {
  await editNames(page, '', '');
  await expect(page.getByTestId('school-principal')).toHaveText('Not set');
  await expect(page.getByTestId('school-board')).toHaveText('Not set');

  const text = await jkReportCardText(request);
  expect(text).not.toMatch(/Principal:/);
  expect(text).not.toMatch(/Board:/);
  expect(text).toMatch(/Telephone:/);
});
