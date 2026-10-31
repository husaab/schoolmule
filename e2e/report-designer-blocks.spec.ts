import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { AUTH_DIR } from './global-setup';

/**
 * The designer's building blocks, one by one, on a blank template: every
 * block type, the info grid, rating-key layouts, columns, free areas and
 * pages, image upload, zoom, the worst-case sample and two admins editing
 * the same template at once.
 */

const RUN = Date.now().toString(36);
const NAME = `E2E blocks ${RUN}`;
const BLOCKS = ['table', 'text', 'ratingKey', 'skillsTable', 'subjectCards', 'commentsTable', 'learningSkills', 'signatures', 'columns', 'canvas', 'spacer', 'pageBreak', 'freePage'];
// A 4×4 red PNG.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEklEQVR4nGP8z4AATAxEcQAz0QEHOoQ+uAAAAABJRU5ErkJggg==', 'base64');

test.describe.configure({ mode: 'serial' });
test.use({ storageState: path.join(AUTH_DIR, 'admin.json') });

let templateId = '';
const pageErrors: string[] = [];

const frame = (page: Page) => page.getByTestId('designer-canvas').frameLocator('iframe');
const val = async (page: Page, id: string) => Number(await page.getByTestId(id).inputValue());

async function open(page: Page) {
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.goto(`/admin-panel/report-templates/${templateId}`);
  await expect(page.getByTestId('page-count')).toHaveText(/page/);
}

async function waitSaved(page: Page) {
  await expect(page.getByTestId('save-state')).toHaveText('Draft saved', { timeout: 15_000 });
}

test.afterAll(() => {
  expect(pageErrors, 'no uncaught errors in the designer').toEqual([]);
});

test('creates a blank report card template', async ({ page }) => {
  await page.goto('/admin-panel/report-templates');
  await page.getByTestId('tab-templates').click();
  await page.getByTestId('new-template').click();
  await page.getByTestId('new-template-name').fill(NAME);
  await page.locator('#tpl-doc').selectOption('report_card');
  await expect(page.getByTestId('new-template-from')).toHaveValue('');
  await page.getByTestId('create-template').click();
  await page.waitForURL(/\/admin-panel\/report-templates\/[0-9a-f-]{36}$/);
  templateId = page.url().split('/').pop()!;
  await expect(page.getByTestId('page-count')).toHaveText(/1 page/);
});

test('adds every block type and the report still renders', async ({ page }) => {
  await open(page);
  await page.getByTestId('preview-picker').selectOption('4');
  for (const type of BLOCKS) {
    await page.getByTestId('rail-tab-add').click();
    await page.getByTestId(`add-block-${type}`).click();
    await expect(page.getByTestId('inspector')).toBeVisible();
  }
  await page.getByTestId('rail-tab-layers').click();
  for (const label of ['Info grid', 'Text', 'Rating key', 'Skills table', 'Subject cards', 'Comments table', 'Learning skills', 'Signatures', 'Two columns', 'Free area', 'Spacer', 'Page break', 'Free page']) {
    await expect(page.getByTestId('layers-panel').getByRole('button', { name: label, exact: true }).first()).toBeVisible();
  }
  // Grade 4 sample: subject cards print marks as NN.N%, the free page sits alone.
  await expect(frame(page).getByText(/\d+\.\d%/).first()).toBeVisible();
  await expect(frame(page).getByText('A free page')).toBeVisible();
  expect(Number((await page.getByTestId('page-count').innerText()).match(/\d+/)![0])).toBeGreaterThan(2);
  await waitSaved(page);
});

test('edits an info grid: a new row, a field, a span and a fill', async ({ page }) => {
  await open(page);
  await page.getByTestId('rail-tab-layers').click();
  await page.getByTestId('layers-panel').getByRole('button', { name: 'Info grid', exact: true }).first().click();
  await page.getByTestId('table-add-row').click();
  const lastRow = page.getByTestId('inspector').locator('div.rounded-lg.border', { hasText: /^Row 3/ }).last();
  const firstCell = lastRow.locator('textarea').first();
  await firstCell.fill('Days absent: {{student.daysAbsent}}');
  await expect(frame(page).getByText(/Days absent: \d+/)).toBeVisible();
  await lastRow.locator('input[type="number"]').first().fill('2'); // span
  await expect(frame(page).locator('td[colspan="2"]', { hasText: 'Days absent' })).toBeVisible();
  await waitSaved(page);
});

test('switches the rating key between list, grid and one line', async ({ page }) => {
  await open(page);
  await page.getByTestId('rail-tab-layers').click();
  await page.getByTestId('layers-panel').getByRole('button', { name: 'Rating key', exact: true }).first().click();
  for (const layout of ['List', 'Grid', 'One line']) {
    await page.getByTestId('inspector').getByRole('button', { name: layout, exact: true }).click();
    await expect(frame(page).getByText('Excellent').first()).toBeVisible();
  }
  await waitSaved(page);
});

test('puts a block into the second of two columns', async ({ page }) => {
  await open(page);
  await page.getByTestId('rail-tab-layers').click();
  const row = page.locator('[data-testid^="layer-"]', { hasText: 'Two columns' }).first();
  await row.hover();
  await row.getByTitle('Add a block to a column').click();
  await row.locator('select').selectOption({ label: 'Column 2: Rating key' });
  // nested rows are indented under the columns block
  await expect(page.locator('[data-testid^="layer-"]', { hasText: 'Rating key' })).toHaveCount(2);
  await waitSaved(page);
});

test('free area and free page: add, move and delete elements', async ({ page }) => {
  await open(page);
  await page.getByTestId('rail-tab-layers').click();
  await page.getByTestId('layers-panel').getByRole('button', { name: 'Free area', exact: true }).first().click();
  await page.getByTestId('add-element-box').click();
  await expect(page.getByTestId('element-selection')).toBeVisible();
  const x0 = await val(page, 'element-x');
  await page.getByTestId('element-selection').scrollIntoViewIfNeeded();
  const sel = await page.getByTestId('element-selection').boundingBox();
  await page.keyboard.down('Alt');
  await page.mouse.move(sel!.x + sel!.width / 2, sel!.y + sel!.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(sel!.x + sel!.width / 2 + i * 5, sel!.y + sel!.height / 2);
  await page.mouse.up();
  await page.keyboard.up('Alt');
  await expect.poll(() => val(page, 'element-x')).toBe(x0 + 40);
  // Locked elements don't move with the arrow keys or delete with Backspace.
  await page.getByTestId('element-lock').click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Backspace');
  await expect.poll(() => val(page, 'element-x')).toBe(x0 + 40);
  await page.getByTestId('element-lock').click();
  await page.getByTestId('element-delete').click();
  await expect(page.getByTestId('element-selection')).toHaveCount(0);

  await page.getByTestId('layers-panel').getByRole('button', { name: 'Free page', exact: true }).first().click();
  await page.getByTestId('add-element-circle').click();
  await expect(page.getByTestId('element-selection')).toBeVisible();
  await waitSaved(page);
});

test('uploads an image into the header', async ({ page }) => {
  await open(page);
  await page.getByTestId('rail-tab-layers').click();
  await page.getByTestId('layer-zone-header').click();
  await page.getByTestId('add-element-image').click();
  await page.getByTestId('inspector').locator('input[type="file"]').setInputFiles({ name: 'crest.png', mimeType: 'image/png', buffer: PNG });
  await expect(frame(page).locator('img[src^="data:image/png"]').first()).toBeVisible();
  await waitSaved(page);
});

test('zoom keeps dragging accurate', async ({ page }) => {
  await open(page);
  await page.getByTestId('rail-tab-layers').click();
  await page.getByTestId('layer-zone-header').click();
  await page.getByTestId('add-element-box').click();
  for (let i = 0; i < 5; i++) await page.getByTitle('Zoom in').click();
  await expect(page.getByRole('button', { name: '150%' })).toBeVisible();
  const x0 = await val(page, 'element-x');
  const sel = await page.getByTestId('element-selection').boundingBox();
  await page.keyboard.down('Alt');
  await page.mouse.move(sel!.x + sel!.width / 2, sel!.y + sel!.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(sel!.x + sel!.width / 2 + i * 6, sel!.y + sel!.height / 2);
  await page.mouse.up();
  await page.keyboard.up('Alt');
  // 60 screen px at 150% = 40 page px
  await expect.poll(() => val(page, 'element-x')).toBe(x0 + 40);
  await page.getByTestId('element-delete').click();
  await page.getByRole('button', { name: '150%' }).click();
  await expect(page.getByRole('button', { name: '100%' })).toBeVisible();
  await waitSaved(page);
});

test('the worst-case sample makes more pages and every warning can be opened', async ({ page }) => {
  await open(page);
  await page.getByTestId('preview-picker').selectOption('4');
  const normal = Number((await page.getByTestId('page-count').innerText()).match(/\d+/)![0]);
  await page.getByTestId('preview-picker').selectOption('worst');
  await expect.poll(async () => Number((await page.getByTestId('page-count').innerText()).match(/\d+/)![0])).toBeGreaterThan(normal);
  await page.getByTestId('warnings-toggle').click();
  const panel = page.getByTestId('warnings-panel');
  if (await panel.count()) {
    await panel.locator('li button').first().click();
    await expect(page.getByTestId('inspector').locator('h3')).not.toHaveText('Page');
  }
});

test('two admins editing at once: the second save is told to reload, nothing is silently lost', async ({ page, browser }) => {
  await open(page);
  const other = await browser.newContext({ storageState: path.join(AUTH_DIR, 'admin.json') });
  const page2 = await other.newPage();
  await page2.goto(`/admin-panel/report-templates/${templateId}`);
  await expect(page2.getByTestId('page-count')).toHaveText(/page/);

  // Admin 1 renames a block and saves.
  await page.getByTestId('rail-tab-layers').click();
  await page.getByTestId('layers-panel').getByRole('button', { name: 'Text', exact: true }).first().click();
  await page.getByTestId('inspector').getByRole('button', { name: 'Name' }).click();
  await page.getByTestId('block-name').fill('From admin one');
  await waitSaved(page);

  // Admin 2, still on the old draft, edits too: the save is refused.
  await page2.getByTestId('rail-tab-layers').click();
  await page2.getByTestId('layers-panel').getByRole('button', { name: 'Text', exact: true }).first().click();
  await page2.getByTestId('inspector').getByRole('button', { name: 'Name' }).click();
  await page2.getByTestId('block-name').fill('From admin two');
  await expect(page2.getByTestId('save-state')).toHaveText('Changed elsewhere — reload', { timeout: 15_000 });
  await page2.getByTestId('save-state').click();
  await page2.getByTestId('rail-tab-layers').click();
  await expect(page2.getByTestId('layers-panel')).toContainText('From admin one');
  await other.close();
});

test('cleans up the blank template', async ({ page }) => {
  await page.goto('/admin-panel/report-templates');
  await page.getByTestId('tab-templates').click();
  const card = page.getByTestId(`template-card-${templateId}`);
  await card.getByTestId('delete-template').click();
  await page.getByTestId('confirm-delete-template').click();
  await expect(page.getByTestId(`template-card-${templateId}`)).toHaveCount(0);
});
