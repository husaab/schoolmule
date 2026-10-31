import { FONT_FAMILIES } from './fonts';
import type { Block, CanvasElement, Condition, TemplateDoc, Zone } from './types';

/**
 * Structural checks for a template before it is saved or published. Shared
 * by the designer and the API (the backend runs the bundled copy), so a
 * template the API accepts always renders.
 */

export const BLOCK_TYPES = [
  'table',
  'text',
  'ratingKey',
  'skillsTable',
  'subjectCards',
  'commentsTable',
  'learningSkills',
  'signatures',
  'columns',
  'canvas',
  'spacer',
  'pageBreak',
  'freePage',
] as const;

const ELEMENT_TYPES = ['text', 'image', 'shape', 'block'];
const MAX_DOC_BYTES = 4_000_000;
const MAX_IMAGE_BYTES = 600_000;
const KEY = /^[a-z][a-z0-9_]{0,39}$/;

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function checkCondition(c: unknown, where: string, errors: string[], depth = 0): void {
  if (c === null || c === undefined) return;
  if (!isObj(c) || depth > 8) {
    errors.push(`${where}: the show/hide rule is malformed.`);
    return;
  }
  const cond = c as Condition;
  if ('conditions' in cond) {
    if (!Array.isArray(cond.conditions)) errors.push(`${where}: the show/hide rule is malformed.`);
    else cond.conditions.forEach((x) => checkCondition(x, where, errors, depth + 1));
    return;
  }
  if (cond.op === 'not' && 'condition' in cond) {
    checkCondition(cond.condition, where, errors, depth + 1);
    return;
  }
  if (!('field' in cond) || typeof cond.field !== 'string' || !/^[a-zA-Z0-9_.]{1,80}$/.test(cond.field)) {
    errors.push(`${where}: a show/hide rule has no field.`);
  }
}

function checkImageUrl(url: unknown, where: string, errors: string[]): void {
  if (url === '') return; // placed but not uploaded yet: prints nothing
  if (typeof url !== 'string' || !/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/.test(url)) {
    errors.push(`${where}: images must be uploaded (PNG, JPG, GIF, WebP or SVG).`);
  } else if (url.length > (MAX_IMAGE_BYTES * 4) / 3 + 100) {
    errors.push(`${where}: an image is larger than 600 KB.`);
  }
}

function checkElement(el: unknown, where: string, ids: Set<string>, errors: string[], depth: number): void {
  if (!isObj(el)) {
    errors.push(`${where}: an element is malformed.`);
    return;
  }
  const e = el as unknown as CanvasElement;
  if (typeof e.id !== 'string' || !e.id) errors.push(`${where}: an element has no id.`);
  else if (ids.has(e.id)) errors.push(`${where}: two items share the id "${e.id}".`);
  else ids.add(e.id);
  if (!ELEMENT_TYPES.includes(e.type)) errors.push(`${where}: unknown element type "${String(e.type)}".`);
  for (const k of ['x', 'y', 'w', 'h'] as const) {
    if (typeof e[k] !== 'number' || !Number.isFinite(e[k])) errors.push(`${where}: element "${e.id}" has no ${k}.`);
  }
  checkCondition(e.showWhen, where, errors);
  if (e.type === 'image' && e.src?.kind === 'url') checkImageUrl(e.src.url, where, errors);
  if (e.type === 'block') checkBlock(e.block, `${where} › box`, ids, errors, depth + 1);
}

function checkZone(zone: unknown, name: string, ids: Set<string>, errors: string[]): void {
  if (zone === null || zone === undefined) return;
  if (!isObj(zone) || typeof (zone as unknown as Zone).height !== 'number' || !Array.isArray((zone as unknown as Zone).elements)) {
    errors.push(`The ${name} is malformed.`);
    return;
  }
  (zone as unknown as Zone).elements.forEach((el) => checkElement(el, `The ${name}`, ids, errors, 0));
}

function checkBlock(b: unknown, where: string, ids: Set<string>, errors: string[], depth: number): void {
  if (!isObj(b)) {
    errors.push(`${where}: a block is malformed.`);
    return;
  }
  if (depth > 4) {
    errors.push(`${where}: blocks are nested too deeply.`);
    return;
  }
  const block = b as unknown as Block;
  const label = `${where} › ${block.name || block.type || 'block'}`;
  if (typeof block.id !== 'string' || !block.id) errors.push(`${label}: missing id.`);
  else if (ids.has(block.id)) errors.push(`${label}: two items share the id "${block.id}".`);
  else ids.add(block.id);
  if (!(BLOCK_TYPES as readonly string[]).includes(block.type)) {
    errors.push(`${label}: unknown block type "${String(block.type)}".`);
    return;
  }
  checkCondition(block.showWhen, label, errors);
  switch (block.type) {
    case 'table':
      if (!Array.isArray(block.columns) || block.columns.length === 0) errors.push(`${label}: a table needs at least one column.`);
      if (!Array.isArray(block.rows)) errors.push(`${label}: the table has no rows.`);
      else
        block.rows.forEach((r) => {
          checkCondition(r?.showWhen, label, errors);
          (r?.cells ?? []).forEach((c) => {
            if (c?.image?.kind === 'url') checkImageUrl(c.image.url, label, errors);
          });
        });
      break;
    case 'skillsTable':
    case 'subjectCards':
      if (!Array.isArray((block as { columns?: unknown; fields?: unknown }).columns ?? (block as { fields?: unknown }).fields)) {
        errors.push(`${label}: no columns.`);
      }
      break;
    case 'columns':
      if (!Array.isArray(block.columns)) errors.push(`${label}: no columns.`);
      else block.columns.forEach((c) => (c?.blocks ?? []).forEach((child) => checkBlock(child, label, ids, errors, depth + 1)));
      break;
    case 'canvas':
    case 'freePage':
      if (!Array.isArray(block.elements)) errors.push(`${label}: no elements.`);
      else block.elements.forEach((el) => checkElement(el, label, ids, errors, depth));
      break;
    default:
      break;
  }
}

/** Every problem with a template, in words an admin can act on. */
export function validateTemplate(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObj(input)) return { ok: false, errors: ['The template is empty.'] };
  const doc = input as unknown as TemplateDoc;

  try {
    if (JSON.stringify(doc).length > MAX_DOC_BYTES) errors.push('The template is too large (over 4 MB). Use smaller images.');
  } catch {
    errors.push('The template could not be read.');
  }
  if (doc.schemaVersion !== 1) errors.push('Unsupported template version.');
  if (doc.docType !== 'report_card' && doc.docType !== 'progress_report') errors.push('Pick a document type.');
  if (!isObj(doc.page) || (doc.page.size !== 'letter' && doc.page.size !== 'a4')) errors.push('Pick a page size.');
  if (!isObj(doc.theme)) errors.push('The theme is missing.');
  else if (doc.theme.fontFamily && !FONT_FAMILIES.some((f) => f.id === doc.theme.fontFamily)) {
    errors.push(`The font "${doc.theme.fontFamily}" isn't available.`);
  }
  if (!isObj(doc.marks) || !Array.isArray(doc.marks.rules)) errors.push('The mark display rules are missing.');
  if (!Array.isArray(doc.scales)) errors.push('The rating scales are missing.');
  else {
    const seen = new Set<string>();
    doc.scales.forEach((s) => {
      if (!s?.id || seen.has(s.id)) errors.push(`Rating scale "${s?.name ?? '?'}" needs a unique id.`);
      seen.add(s?.id);
      if (!Array.isArray(s?.levels) || s.levels.length === 0) errors.push(`Rating scale "${s?.name ?? '?'}" has no levels.`);
    });
  }
  if (!Array.isArray(doc.fields)) errors.push('The extra fields are missing.');
  else {
    const keys = new Set<string>();
    doc.fields.forEach((f) => {
      if (!f || !KEY.test(String(f.key))) errors.push(`Extra field "${f?.label ?? '?'}" needs a key of lowercase letters, numbers and _.`);
      else if (keys.has(f.key)) errors.push(`Two extra fields use the key "${f.key}".`);
      keys.add(f?.key);
      if (!f?.label) errors.push('Every extra field needs a label.');
      if (f?.type === 'select' && (!Array.isArray(f.options) || f.options.length === 0)) errors.push(`"${f.label}" needs at least one choice.`);
    });
  }

  const ids = new Set<string>();
  checkZone(doc.header, 'header', ids, errors);
  checkZone(doc.footer, 'footer', ids, errors);
  checkZone(doc.firstHeader, 'first-page header', ids, errors);
  checkZone(doc.firstFooter, 'first-page footer', ids, errors);
  if (!Array.isArray(doc.blocks)) errors.push('The template has no body.');
  else doc.blocks.forEach((b) => checkBlock(b, 'Body', ids, errors, 0));

  return { ok: errors.length === 0, errors: [...new Set(errors)].slice(0, 50) };
}
