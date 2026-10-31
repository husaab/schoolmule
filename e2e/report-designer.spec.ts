import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { AUTH_DIR } from './global-setup';

/**
 * Report Template Designer, end to end, as an admin of the synthetic
 * PLAYGROUND school: customise a SchoolMule design, edit it on the canvas,
 * set rules, preview real students, publish, assign it, fill extra fields,
 * generate real reports through the engine, and clean up.
 */

const API = process.env.E2E_API_URL ?? 'http://localhost:4310/api';
const RUN = Date.now().toString(36);
const NAME = `E2E SK progress ${RUN}`;

test.describe.configure({ mode: 'serial' });
test.use({ storageState: path.join(AUTH_DIR, 'admin.json') });

let templateId = '';
let token = '';

/** The admin's API token, from the session global-setup saved. */
function authToken(): string {
  if (!token) {
    const state = JSON.parse(fs.readFileSync(path.join(AUTH_DIR, 'admin.json'), 'utf8')) as {
      origins: Array<{ localStorage: Array<{ name: string; value: string }> }>;
    };
    token = state.origins.flatMap((o) => o.localStorage).find((e) => e.name === 'auth_token')?.value ?? '';
  }
  return token;
}

async function api(request: APIRequestContext, _page: Page, method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: unknown) {
  const t = authToken();
  return request.fetch(`${API}${url}`, { method, data, headers: { Authorization: `Bearer ${t}` } });
}

async function overlayBox(page: Page) {
  const box = await page.getByTestId('designer-overlay').boundingBox();
  if (!box) throw new Error('canvas overlay not found');
  return box;
}

/** Drag with real pointer events in small steps (so snapping/hover logic runs). */
async function drag(page: Page, from: { x: number; y: number }, by: { x: number; y: number }, steps = 12) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) await page.mouse.move(from.x + (by.x * i) / steps, from.y + (by.y * i) / steps);
  await page.mouse.up();
}

async function waitSaved(page: Page) {
  await expect(page.getByTestId('save-state')).toHaveText('Draft saved', { timeout: 15_000 });
}

test('lists the SchoolMule designs with live thumbnails', async ({ page }) => {
  await page.goto('/admin-panel/report-templates');
  const defaults = page.getByTestId('default-list');
  await expect(defaults.locator('[data-testid^="default-card-"]')).toHaveCount(7);
  for (const key of ['progress-jk', 'progress-sk', 'progress-standard', 'report-card-standard', 'report-card-t1t2final', 'report-card-jk', 'report-card-sk']) {
    await expect(page.getByTestId(`default-card-${key}`)).toBeVisible();
  }
  // A thumbnail actually rendered pages inside its frame.
  const frame = page.getByTestId('default-card-progress-sk').frameLocator('iframe');
  await expect(frame.locator('.rk-page').first()).toBeVisible();
});

test('customises the SK design and opens it in the designer', async ({ page }) => {
  await page.goto('/admin-panel/report-templates');
  await page.getByTestId('customize-progress-sk').click();
  await page.getByTestId('new-template-name').fill(NAME);
  await page.getByTestId('create-template').click();
  await page.waitForURL(/\/admin-panel\/report-templates\/[0-9a-f-]{36}$/);
  templateId = page.url().split('/').pop()!;
  await expect(page.getByTestId('page-count')).toHaveText(/3 pages · Letter/);
  await expect(page.getByTestId('save-state')).toHaveText('Draft saved');
  // The real report pages render in the canvas frame, logo included (school asset).
  const frame = page.getByTestId('designer-canvas').frameLocator('iframe');
  await expect(frame.locator('.rk-page')).toHaveCount(3);
  await expect(frame.getByText('LEARNING SKILLS')).toBeVisible();
});

test('drags, snaps, resizes, undoes and nudges a header element; the draft survives a reload', async ({ page }) => {
  await page.goto(`/admin-panel/report-templates/${templateId}`);
  await expect(page.getByTestId('page-count')).toHaveText(/3 pages/);
  const o = await overlayBox(page);
  // The title text sits at (330, 52), 430×44, in the first-page header.
  await page.mouse.click(o.x + 330 + 200, o.y + 52 + 22);
  await expect(page.getByTestId('element-selection')).toBeVisible();
  await expect(page.getByTestId('element-x')).toHaveValue('330');

  await drag(page, { x: o.x + 530, y: o.y + 74 }, { x: -150, y: 8 });
  await expect(page.getByTestId('element-x')).toHaveValue('180');
  await expect(page.getByTestId('element-y')).toHaveValue('60');

  // 11px right → its centre lands 2px from the page centre → snaps to x=193.
  await drag(page, { x: o.x + 280, y: o.y + 80 }, { x: 11, y: 0 }, 11);
  await expect(page.getByTestId('element-x')).toHaveValue('193');

  const handle = await page.getByTestId('handle-e').boundingBox();
  await drag(page, { x: handle!.x + handle!.width / 2, y: handle!.y + handle!.height / 2 }, { x: -60, y: 0 });
  await expect(page.getByTestId('element-w')).toHaveValue('370');

  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.getByTestId('element-w')).toHaveValue('430');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(page.getByTestId('element-w')).toHaveValue('370');

  await page.keyboard.press('Shift+ArrowLeft');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByTestId('element-x')).toHaveValue('183');
  await expect(page.getByTestId('element-y')).toHaveValue('61');
  await waitSaved(page);

  await page.reload();
  await expect(page.getByTestId('page-count')).toHaveText(/3 pages/);
  const o2 = await overlayBox(page);
  await page.mouse.click(o2.x + 183 + 100, o2.y + 61 + 20);
  await expect(page.getByTestId('element-x')).toHaveValue('183');
  await expect(page.getByTestId('element-w')).toHaveValue('370');
});

test('edits text in place and through the inspector with a merge field', async ({ page }) => {
  await page.goto(`/admin-panel/report-templates/${templateId}`);
  await expect(page.getByTestId('page-count')).toHaveText(/3 pages/);
  const o = await overlayBox(page);
  await page.mouse.dblclick(o.x + 183 + 100, o.y + 61 + 20);
  const editor = page.getByTestId('inline-text-editor');
  await expect(editor).toBeVisible();
  await editor.fill('Report for {{student.firstName}}');
  await editor.press('ControlOrMeta+Enter');
  const frame = page.getByTestId('designer-canvas').frameLocator('iframe');
  await expect(frame.getByText('Report for Sara')).toBeVisible();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(frame.getByText(/Progress Report:\s+2026 - 2027/)).toBeVisible();
  await waitSaved(page);
});

test('adds blocks and canvas elements, resizes a zone and a block', async ({ page }) => {
  await page.goto(`/admin-panel/report-templates/${templateId}`);
  await expect(page.getByTestId('page-count')).toHaveText(/3 pages/);
  // Header zone height by its handle.
  await page.getByTestId('rail-tab-layers').click();
  await page.getByTestId('layers-panel').getByRole('button', { name: 'First-page header' }).click();
  await expect(page.getByTestId('zone-height')).toHaveValue('132');
  const zh = await page.getByTestId('zone-height-handle').first().boundingBox();
  await drag(page, { x: zh!.x + zh!.width / 2, y: zh!.y + zh!.height / 2 }, { x: 0, y: 20 });
  await expect(page.getByTestId('zone-height')).toHaveValue('152');
  // Add a box to the header and move it.
  await page.getByTestId('add-element-box').click();
  await expect(page.getByTestId('element-selection')).toBeVisible();
  const before = Number(await page.getByTestId('element-x').inputValue());
  const sel = await page.getByTestId('element-selection').boundingBox();
  await drag(page, { x: sel!.x + sel!.width / 2, y: sel!.y + sel!.height / 2 }, { x: 40, y: 0 });
  await expect(page.getByTestId('element-x')).not.toHaveValue(String(before));
  await page.getByTestId('element-delete').click();

  // A text block printing an extra field, narrowed by its width handle.
  await page.getByTestId('rail-tab-add').click();
  await page.getByTestId('add-block-text').click();
  await page.getByTestId('block-text').fill('Next year: **{{student.firstName}}** moves up.');
  const frame = page.getByTestId('designer-canvas').frameLocator('iframe');
  await expect(frame.getByText('moves up.')).toBeVisible();
  await page.getByTestId('inspector').getByRole('button', { name: 'Layout' }).click();
  await expect(page.getByTestId('block-width')).toHaveValue('100');
  await page.getByTestId('block-width-handle').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const wh = await page.getByTestId('block-width-handle').boundingBox();
  await drag(page, { x: wh!.x + wh!.width / 2, y: wh!.y + wh!.height / 2 }, { x: -350, y: 0 });
  await expect(page.getByTestId('block-width')).toHaveValue(/^(45|50|55)$/);
  await waitSaved(page);
});

test('show/hide rules follow the previewed student', async ({ page }) => {
  await page.goto(`/admin-panel/report-templates/${templateId}`);
  await expect(page.getByTestId('page-count')).toHaveText(/3 pages/);
  await page.getByTestId('rail-tab-layers').click();
  await page.getByTestId('layers-panel').getByRole('button', { name: 'Learning skills' }).click();
  await page.getByTestId('add-condition').click();
  await page.getByTestId('condition-editor').getByRole('button', { name: 'SK', exact: true }).click();
  await expect(page.getByTestId('condition-editor')).toContainText('Shown for this preview');
  await page.getByTestId('preview-picker').selectOption('2');
  await expect(page.getByTestId('condition-editor')).toContainText('Hidden for this preview');
  const frame = page.getByTestId('designer-canvas').frameLocator('iframe');
  await expect(frame.getByText('LEARNING SKILLS')).toHaveCount(0);
  await page.getByTestId('preview-picker').selectOption('SK');
  await expect(frame.getByText('LEARNING SKILLS')).toBeVisible();
  await waitSaved(page);
});

test('rules: rating scale, mark display tester and a required extra field', async ({ page }) => {
  await page.goto(`/admin-panel/report-templates/${templateId}`);
  await page.getByTestId('rail-tab-rules').click();
  const scales = page.locator('[data-testid^="scale-"]');
  const before = await scales.count();
  await page.getByTestId('add-scale').click();
  await expect(scales).toHaveCount(before + 1);
  await page.getByTestId('mark-tester-score').fill('49.6');
  await expect(page.getByTestId('mark-tester-result')).toHaveText('R');
  await page.getByTestId('mark-tester-score').fill('87.25');
  await expect(page.getByTestId('mark-tester-result')).toHaveText('87.3%');

  await page.getByTestId('add-extra-field').click();
  const field = page.locator('[data-testid^="extra-field-"]').last();
  await field.locator('input').first().fill('Next year placement');
  await expect(field.locator('code')).toHaveText('extra.next_year_placement');
  await field.getByRole('switch').click(); // required
  await waitSaved(page);
});

test('previews a real student and the server PDF matches the editor', async ({ page }) => {
  await page.goto(`/admin-panel/report-templates/${templateId}`);
  await expect(page.getByTestId('page-count')).toHaveText(/pages/);
  await page.getByTestId('preview-picker').selectOption('__pick');
  await page.getByTestId('picker-grade-SK').click();
  const student = page.getByTestId('picker-student').first();
  const name = (await student.locator('span').first().innerText()).trim();
  await student.click();
  await expect(page.getByTestId('designer-canvas').frameLocator('iframe').getByText(name).first()).toBeVisible();
  const editorPages = (await page.getByTestId('page-count').innerText()).match(/\d+/)![0];
  await page.getByTestId('check-pdf').click();
  await expect(page.getByTestId('pdf-frame')).toBeVisible({ timeout: 40_000 });
  await expect(page.getByText(`${editorPages} pages — same as the editor`)).toBeVisible();
});

test('publishes, lists versions and restores one', async ({ page }) => {
  await page.goto(`/admin-panel/report-templates/${templateId}`);
  await expect(page.getByTestId('page-count')).toHaveText(/pages/);
  await page.getByTestId('open-publish').click();
  await page.getByTestId('publish-note').fill('e2e v1');
  await page.getByTestId('confirm-publish').click();
  await expect(page.getByText('Published v1')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('open-publish').click();
  await page.getByTestId('confirm-publish').click();
  await expect(page.getByText('Published v2')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('open-versions').click();
  const dialog = page.getByTestId('versions-dialog');
  await expect(dialog).toContainText('Version 2');
  await expect(dialog).toContainText('e2e v1');
  page.once('dialog', (d) => d.accept());
  await dialog.locator('li', { hasText: 'Version 1' }).getByRole('button', { name: 'Restore to draft' }).click();
  await expect(page.getByText('Draft restored from version 1')).toBeVisible();
});

test('assigns the template to SK and the coverage matrix shows it', async ({ page }) => {
  await page.goto('/admin-panel/report-templates?tab=printing');
  await page.getByTestId('add-rule').click();
  await page.getByTestId('rule-target').selectOption({ label: NAME });
  await page.getByTestId('rule-grade-SK').click();
  await page.getByTestId('save-rule').click();
  await expect(page.getByTestId('rule-list')).toContainText(NAME);
  await expect(page.getByTestId('coverage-matrix').locator('tr', { hasText: /^SK/ })).toContainText(NAME);
});

test('a required extra field blocks generation until it is filled in, then the engine prints the report', async ({ page, request }) => {
  const students = await (await api(request, page, 'GET', '/report-templates/preview/students?grade=SK')).json();
  const studentId = students.students[0].studentId;

  const blocked = await api(request, page, 'POST', '/progress-reports/generate', { studentId, term: 'Term 1' });
  expect(blocked.status()).toBe(422);
  expect((await blocked.json()).message).toMatch(/Next year placement/);

  await page.goto('/admin-panel/report-templates?tab=fields');
  await page.getByTestId('fields-doc').selectOption('progress_report');
  await page.getByTestId('fields-grade').selectOption('SK');
  const grid = page.getByTestId('fields-grid');
  await expect(grid).toContainText('Next year placement');
  const input = grid.locator('tbody tr').first().getByTestId('field-input-next_year_placement');
  await input.fill('Grade 1');
  await input.blur();
  await expect(input).toHaveClass(/emerald/);

  const ok = await api(request, page, 'POST', '/progress-reports/generate', { studentId, term: 'Term 1' });
  expect(ok.status()).toBe(200);
  const body = JSON.stringify(await ok.json());
  const filePath = /"filePath":"([^"]+)"/.exec(body)?.[1];
  expect(filePath).toBeTruthy();

  // The stored PDF was printed from OUR published template: it carries the
  // text block only this template has, with the student's first name.
  const signed = await (await api(request, page, 'GET', `/progress-reports/signed-url?path=${encodeURIComponent(filePath!)}`)).json();
  const url = signed.signedUrl ?? signed.data?.signedUrl ?? signed.url;
  const pdf = Buffer.from(await (await request.get(url)).body());
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  const text = await pdfText(pdf);
  expect(text).toContain('moves up.');
  expect(text).toContain(students.students[0].name.split(' ')[0]);
});

async function pdfText(buf: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    out += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
  }
  return out.replace(/\s+/g, ' ');
}

test('a teacher cannot open the designer', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'teacher.json') });
  const page = await ctx.newPage();
  await page.goto('/admin-panel/report-templates');
  await expect(page).not.toHaveURL(/\/admin-panel\/report-templates/, { timeout: 30_000 });
  await expect(page.getByText('Report templates', { exact: true })).toHaveCount(0);
  await ctx.close();
});

test('the designer asks for a bigger screen on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/admin-panel/report-templates/${templateId}`);
  await expect(page.getByText('The report designer needs a bigger screen')).toBeVisible();
});

test('cleans up: an assigned template cannot be deleted, then it can', async ({ page }) => {
  await page.goto('/admin-panel/report-templates?tab=printing');
  page.once('dialog', (d) => d.accept());
  await page.getByTestId('rule-list').locator('li', { hasText: NAME }).getByTestId('delete-rule').click();
  await expect(page.getByTestId('rule-list').or(page.getByText('No rules yet'))).not.toContainText(NAME);

  await page.goto('/admin-panel/report-templates');
  await page.getByTestId('tab-templates').click(); // the page remembers the last tab
  const card = page.getByTestId(`template-card-${templateId}`);
  await card.getByTestId('rename-template').click();
  await page.getByTestId('rename-input').fill(`${NAME} (renamed)`);
  await page.getByTestId('confirm-rename').click();
  await expect(card).toContainText('(renamed)');
  await card.getByTestId('delete-template').click();
  await page.getByTestId('confirm-delete-template').click();
  await expect(page.getByText(/Template (archived|deleted)/)).toBeVisible();
  await expect(page.getByTestId(`template-card-${templateId}`)).toHaveCount(0);
});
