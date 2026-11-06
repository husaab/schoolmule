import { expect, test, type Locator, type Page } from '@playwright/test';
import path from 'node:path';
import { AUTH_DIR } from './global-setup';

/**
 * The grades 1–8 built-ins are starting points: every part of their look can
 * be changed in the designer, and the change reaches the printed page.
 */

const RUN = Date.now().toString(36);

test.describe.configure({ mode: 'serial' });
test.use({ storageState: path.join(AUTH_DIR, 'admin.json') });

const pageErrors: string[] = [];
const frame = (page: Page) => page.getByTestId('designer-canvas').frameLocator('iframe');
const css = (el: Locator, prop: string) => el.evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), prop);

async function customize(page: Page, design: string, docType: 'report_card' | 'progress_report', name: string) {
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.goto('/admin-panel/report-templates');
  await page.getByTestId('tab-templates').click();
  await page.getByTestId('new-template').click();
  await page.getByTestId('new-template-name').fill(name);
  await page.locator('#tpl-doc').selectOption(docType);
  await page.getByTestId('new-template-from').selectOption(design);
  await page.getByTestId('create-template').click();
  await page.waitForURL(/\/admin-panel\/report-templates\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId('page-count')).toHaveText(/page/);
  await previewGrade4(page);
}

/** The designer picks its first preview while it loads, so keep asking until Grade 4's cards show. */
async function previewGrade4(page: Page) {
  await expect(async () => {
    await page.getByTestId('preview-picker').selectOption('4');
    await expect(frame(page).locator('.rk-card').first()).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 30_000 });
}

async function selectLayer(page: Page, name: string) {
  await page.getByTestId('rail-tab-layers').click();
  await page.getByTestId('layers-panel').getByRole('button', { name, exact: true }).first().click();
  await expect(page.getByTestId('inspector')).toBeVisible();
}

async function openSection(page: Page, title: string) {
  const section = page.getByTestId('inspector').getByRole('button', { name: title, exact: true });
  await section.click();
}

/** How many lines a piece of text prints on, measured in the browser. */
const lineCount = (el: Locator) =>
  el.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
  });

async function expectOneLine(page: Page, labels: string[]) {
  for (const label of labels) {
    const el = frame(page).getByText(label, { exact: true }).first();
    await expect(el).toBeVisible();
    expect(await lineCount(el), `"${label}" stays on one line`).toBe(1);
  }
}

async function waitSaved(page: Page) {
  await expect(page.getByTestId('save-state')).toHaveText('Draft saved', { timeout: 15_000 });
}

test.afterAll(() => {
  expect(pageErrors, 'no uncaught errors in the designer').toEqual([]);
});

test('report card: the line choice, the subject bar and the comment box are editable', async ({ page }) => {
  await customize(page, 'report-card-standard', 'report_card', `E2E honour card ${RUN}`);
  const inspector = page.getByTestId('inspector');

  // The student grid draws row lines only until told otherwise.
  const nameCell = frame(page).getByText('Name of Student:');
  await expect(nameCell).toBeVisible();
  expect(await css(nameCell, 'border-left-width')).toBe('0px');
  await selectLayer(page, 'Student information');
  await openSection(page, 'Lines & text');
  await inspector.getByRole('button', { name: 'Every line' }).click();
  await expect.poll(() => css(frame(page).getByText('Name of Student:'), 'border-left-width')).toBe('1px');
  await inspector.getByRole('button', { name: 'Rows only' }).click();
  await expect.poll(() => css(frame(page).getByText('Name of Student:'), 'border-left-width')).toBe('0px');

  // The subject bar's font and its top line.
  await selectLayer(page, 'Subjects');
  await openSection(page, 'Look');
  const bar = frame(page).locator('.rk-card-head').first();
  await expect(bar).toBeVisible();
  expect(await css(bar, 'border-top-width')).toBe('3px');
  expect(await css(bar, 'font-family')).toContain('Libre Baskerville');
  await page.getByTestId('bar-subject-top-width').fill('6');
  await expect.poll(() => css(frame(page).locator('.rk-card-head').first(), 'border-top-width')).toBe('6px');
  await page.getByTestId('bar-subject-font').selectOption('Lato');
  await expect.poll(() => css(frame(page).locator('.rk-card-head').first(), 'font-family')).toContain('Lato');

  // The comment box: its height and its gold bar.
  await openSection(page, 'Card details');
  const box = frame(page).getByText(/shows enthusiasm in english/).first();
  await expect(box).toBeVisible();
  expect(await css(box, 'min-height')).toBe('170px');
  await page.getByTestId('comment-box-min-height').fill('120');
  await expect.poll(() => css(frame(page).getByText(/shows enthusiasm in english/).first(), 'min-height')).toBe('120px');
  await page.getByTestId('comment-box-accent-width').fill('6');
  await expect.poll(() => css(frame(page).getByText(/shows enthusiasm in english/).first(), 'border-left-width')).toBe('6px');
  await waitSaved(page);

  // Saved: a reload brings the edits back.
  await page.reload();
  await expect(page.getByTestId('page-count')).toHaveText(/page/);
  await previewGrade4(page);
  await expect.poll(() => css(frame(page).locator('.rk-card-head').first(), 'border-top-width')).toBe('6px');

  // And the edited template passes the server's checks.
  await page.getByTestId('open-publish').click();
  await page.getByTestId('confirm-publish').click();
  await expect(page.getByText(/Published v1/)).toBeVisible();
});

test('the student grid keeps every label on one line', async ({ page }) => {
  await customize(page, 'report-card-standard', 'report_card', `E2E honour labels ${RUN}`);
  await expectOneLine(page, ['Name of Student:', 'OEN:', 'Days of Absence:', 'Grade:', 'Homeroom Teacher:']);
  await customize(page, 'progress-standard', 'progress_report', `E2E honour labels p ${RUN}`);
  await expectOneLine(page, ['Student Name:', 'Term:', 'Grade:', 'Homeroom Teacher:', 'OEN:']);
});

test('report card: a cell label and its colour can be changed', async ({ page }) => {
  await customize(page, 'report-card-standard', 'report_card', `E2E honour key ${RUN}`);
  await selectLayer(page, 'Work habits key');
  await expect(frame(page).getByText('Needs Improvement')).toBeVisible();
  await page.getByTestId('cell-label').first().fill('Keep working');
  await expect(frame(page).getByText('Keep working')).toBeVisible();
  await expect(frame(page).getByText('Needs Improvement')).toHaveCount(0);
  await page.getByTestId('cell-label-size').first().fill('20');
  await expect.poll(() => css(frame(page).getByText('Keep working'), 'font-size')).toBe('20px');
  // Emptying the label takes it off the page and leaves the letter.
  await page.getByTestId('cell-label').first().fill('');
  await expect(frame(page).getByText('Keep working')).toHaveCount(0);
  await waitSaved(page);
});

test('progress report: the tiles and the marks layout are editable', async ({ page }) => {
  await customize(page, 'progress-standard', 'progress_report', `E2E honour progress ${RUN}`);
  await selectLayer(page, 'Subjects');
  await openSection(page, 'Card details');
  const tile = () => frame(page).getByText('Work Habits').first().locator('xpath=following-sibling::div[1]');
  await expect(tile()).toBeVisible();
  expect(await css(tile(), 'padding-top')).toBe('6px');
  expect(await css(tile(), 'border-top-left-radius')).toBe('0px');
  await page.getByTestId('tile-padding').fill('12');
  await expect.poll(() => css(tile(), 'padding-top')).toBe('12px');
  await page.getByTestId('tile-radius').fill('8');
  await expect.poll(() => css(tile(), 'border-top-left-radius')).toBe('8px');

  // Back to a marks table: the tile controls go away with the tiles.
  await page.getByTestId('inspector').getByRole('button', { name: 'Table', exact: true }).click();
  await expect(page.getByTestId('tile-padding')).toHaveCount(0);
  await expect(frame(page).locator('.rk-card .rk-table').first()).toBeVisible();
  await waitSaved(page);
});

test('First, Second and Final Term card: the term labels and final row are editable', async ({ page }) => {
  await customize(page, 'report-card-t1t2final', 'report_card', `E2E honour terms ${RUN}`);
  await selectLayer(page, 'Subjects');
  await openSection(page, 'Card details');
  const finalCell = frame(page).getByText('Final Term', { exact: true }).first();
  await expect(finalCell).toBeVisible();
  expect(await css(finalCell, 'background-color')).toBe('rgb(251, 247, 234)');
  await page.getByTestId('final-row-fill').getByRole('button').first().click();
  await page.getByTestId('final-row-fill').getByPlaceholder('#hex').fill('#ffeeaa');
  await expect.poll(() => css(frame(page).getByText('Final Term', { exact: true }).first(), 'background-color')).toBe('rgb(255, 238, 170)');
  await waitSaved(page);
});
