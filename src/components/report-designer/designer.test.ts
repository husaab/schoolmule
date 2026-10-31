import { describe, expect, it } from 'vitest';
import { kindergartenProgressTemplate } from '@/reportkit/defaults/kindergartenProgress';
import { blankTemplate, createBlock, createElement } from '@/reportkit/factory';
import { validateTemplate } from '@/reportkit/validate';
import type { BlockType, TextBlock } from '@/reportkit/types';
import {
  duplicateBlock,
  duplicateElement,
  findBlock,
  findElement,
  insertBlock,
  insertElement,
  moveBlock,
  moveBlockTo,
  outline,
  removeBlock,
  removeElement,
  renameFieldKey,
  restackElement,
  setFirstPageZone,
  updateBlock,
  updateElement,
} from './docOps';
import { guidesFor, resizeBox, snapBox } from './geometry';

describe('docOps', () => {
  const doc = kindergartenProgressTemplate('SK');

  it('never mutates its input', () => {
    const before = JSON.stringify(doc);
    removeBlock(doc, doc.blocks[0].id);
    updateElement(doc, doc.header.elements[0].id, { x: 999 });
    expect(JSON.stringify(doc)).toBe(before);
  });

  it('inserts, moves, duplicates and removes blocks', () => {
    const b = createBlock('text', doc);
    let d = insertBlock(doc, b, doc.blocks[0].id);
    expect(d.blocks[1].id).toBe(b.id);
    d = moveBlock(d, b.id, -1);
    expect(d.blocks[0].id).toBe(b.id);
    d = moveBlockTo(d, b.id, 3);
    expect(d.blocks[3].id).toBe(b.id);
    const dup = duplicateBlock(d, b.id);
    expect(dup.newId).not.toBe(b.id);
    expect(findBlock(dup.doc, dup.newId!)).not.toBeNull();
    d = removeBlock(dup.doc, b.id);
    expect(findBlock(d, b.id)).toBeNull();
    expect(validateTemplate(d).errors).toEqual([]);
  });

  it('updates a block in place, by patch or function', () => {
    const id = doc.blocks[3].id;
    const d = updateBlock(doc, id, { name: 'Renamed', marginTop: 4 });
    expect(findBlock(d, id)!.block).toMatchObject({ name: 'Renamed', marginTop: 4, type: 'skillsTable' });
    const d2 = updateBlock(d, id, (b) => ({ ...b, keepTogether: true }));
    expect(findBlock(d2, id)!.block.keepTogether).toBe(true);
  });

  it('finds blocks nested in columns', () => {
    const cols = createBlock('columns', doc);
    const d = insertBlock(doc, cols);
    const inner = cols.type === 'columns' ? cols.columns[1].blocks[0] : null;
    expect(findBlock(d, inner!.id)).not.toBeNull();
    expect(outline(d).some((o) => o.depth === 1)).toBe(true);
  });

  it('adds, duplicates, restacks and removes canvas elements', () => {
    const el = createElement('shape', 'rect');
    let d = insertElement(doc, { kind: 'zone', zone: 'header' }, el);
    expect(findElement(d, el.id)!.container).toEqual({ kind: 'zone', zone: 'header' });
    const dup = duplicateElement(d, el.id);
    const copy = findElement(dup.doc, dup.newId!)!.element;
    expect(copy.x).toBe(el.x + 12);
    d = restackElement(dup.doc, el.id, 1);
    expect(findElement(d, el.id)!.element.z).toBeGreaterThan(copy.z ?? 0);
    d = removeElement(d, el.id);
    expect(findElement(d, el.id)).toBeNull();
  });

  it('gives page 1 its own header and takes it away', () => {
    const blank = blankTemplate('report_card');
    const on = setFirstPageZone(blank, 'firstHeader', true);
    expect(on.firstHeader!.elements).toHaveLength(blank.header.elements.length);
    expect(on.firstHeader!.elements[0].id).not.toBe(blank.header.elements[0].id);
    expect(setFirstPageZone(on, 'firstHeader', false).firstHeader).toBeNull();
  });

  it('renames an extra field everywhere it is printed or tested', () => {
    let d = blankTemplate('report_card');
    const text = createBlock('text', d) as TextBlock;
    d = insertBlock(d, { ...text, text: 'Next year: {{extra.field_1}} / {{ extra.field_1 |upper}} / {{extra.field_10}}', showWhen: { field: 'extra.field_1', op: 'notEmpty' } } as TextBlock);
    const out = renameFieldKey(d, 'field_1', 'placement');
    const b = findBlock(out, text.id)!.block as TextBlock;
    expect(b.text).toBe('Next year: {{extra.placement}} / {{extra.placement |upper}} / {{extra.field_10}}');
    expect(b.showWhen).toEqual({ field: 'extra.placement', op: 'notEmpty' });
  });

  it('every palette block makes a valid template', () => {
    const types: BlockType[] = ['table', 'text', 'ratingKey', 'skillsTable', 'subjectCards', 'commentsTable', 'learningSkills', 'signatures', 'columns', 'canvas', 'spacer', 'pageBreak', 'freePage'];
    let d = blankTemplate('progress_report');
    for (const t of types) d = insertBlock(d, createBlock(t, d));
    expect(validateTemplate(d).errors).toEqual([]);
  });
});

describe('geometry', () => {
  it('resizes from each handle and keeps a minimum size', () => {
    const b = { x: 10, y: 10, w: 100, h: 50 };
    expect(resizeBox(b, 'se', 20, 10)).toEqual({ x: 10, y: 10, w: 120, h: 60 });
    expect(resizeBox(b, 'nw', 20, 10)).toEqual({ x: 30, y: 20, w: 80, h: 40 });
    expect(resizeBox(b, 'w', 200, 0).w).toBe(6);
  });

  it('keeps the aspect ratio on corners with shift', () => {
    const r = resizeBox({ x: 0, y: 0, w: 100, h: 50 }, 'se', 100, 0, true);
    expect(r.w / r.h).toBeCloseTo(2);
  });

  it('snaps a moving box to the page centre and other boxes', () => {
    const guides = guidesFor({ w: 800, h: 100 }, [{ x: 500, y: 10, w: 100, h: 20 }]);
    const centred = snapBox({ x: 347, y: 40, w: 100, h: 20 }, guides, 6);
    expect(centred.box.x).toBe(350);
    expect(centred.lines.x).toEqual([400]);
    const aligned = snapBox({ x: 497, y: 80, w: 50, h: 10 }, guides, 6);
    expect(aligned.box.x).toBe(500);
  });

  it('snaps only the dragged edge while resizing', () => {
    const guides = guidesFor({ w: 800, h: 100 }, []);
    const r = snapBox({ x: 100, y: 10, w: 297, h: 20 }, guides, 6, 'e');
    expect(r.box).toMatchObject({ x: 100, w: 300 });
  });
});
