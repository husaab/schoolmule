import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMPLATES } from './defaults';
import type { Block, SubjectCardsBlock, TableBlock, TemplateDoc } from './types';
import { validateTemplate } from './validate';

/** A valid document holding one block, so each test checks a single complaint. */
function docWith(block: Block): TemplateDoc {
  const base = DEFAULT_TEMPLATES.find((d) => d.key === 'report-card-standard')!.build();
  return { ...base, blocks: [block], header: { height: 0, elements: [] }, footer: { height: 0, elements: [] }, firstHeader: null, firstFooter: null };
}
const table = (extra: Partial<TableBlock> = {}): TableBlock => ({ id: 't1', name: 'Grid', type: 'table', columns: [100], rows: [{ cells: [{ text: 'x' }] }], ...extra });
const cards = (extra: Partial<SubjectCardsBlock> = {}): SubjectCardsBlock => ({ id: 'c1', name: 'Cards', type: 'subjectCards', fields: [{ key: 'mark', label: 'Grade', width: 1 }], rows: 'current', ...extra });

const errorsFor = (block: Block) => validateTemplate(docWith(block)).errors;

describe('validateTemplate: style options', () => {
  it('accepts every built-in template', () => {
    for (const d of DEFAULT_TEMPLATES) {
      expect(validateTemplate(d.build()), d.key).toEqual({ ok: true, errors: [] });
    }
  });

  it('accepts the table rules it knows and refuses any other', () => {
    expect(errorsFor(table({ rules: 'rows' }))).toEqual([]);
    expect(errorsFor(table({ rules: 'grid' }))).toEqual([]);
    expect(errorsFor(table({ rules: 'dotted' as never })).join()).toMatch(/Grid: .*lines/);
    expect(errorsFor(cards({ rules: 'dotted' as never })).join()).toMatch(/Cards: .*lines/);
  });

  it('refuses a bar font that is not bundled', () => {
    expect(errorsFor(cards({ headerBar: { fontFamily: 'Comic Sans' } })).join()).toMatch(/font "Comic Sans"/);
    expect(errorsFor(cards({ headerBar: { fontFamily: 'Libre Baskerville' } }))).toEqual([]);
  });

  it('refuses a bar line with a bad colour or width', () => {
    expect(errorsFor(cards({ headerBar: { ruleTop: { color: 'url(x)', width: 2 } } })).join()).toMatch(/isn't a colour/);
    expect(errorsFor(cards({ headerBar: { ruleBottom: { color: '#000000', width: -1 } } })).join()).toMatch(/width/);
    expect(errorsFor(cards({ headerBar: { ruleTop: { color: '#003068', width: 3 } } }))).toEqual([]);
  });

  it('checks every bar on a card, not only the header', () => {
    expect(errorsFor(cards({ cardStyle: { labelBar: { fontFamily: 'Nope' } } })).join()).toMatch(/font "Nope"/);
    expect(errorsFor(cards({ cardStyle: { markHead: { ruleTop: { color: 'bad(' } } } })).join()).toMatch(/isn't a colour/);
  });

  it('refuses a tile with spacing that is not a sensible number', () => {
    expect(errorsFor(cards({ cardStyle: { tile: { padding: 'lots' as never } } })).join()).toMatch(/tile/i);
    expect(errorsFor(cards({ cardStyle: { tile: { borderRadius: -2 } } })).join()).toMatch(/tile/i);
    expect(errorsFor(cards({ cardStyle: { tile: { padding: 6, paddingX: 10, borderRadius: 0 } } }))).toEqual([]);
  });

  it('refuses a cell label that is not text, or in a font that is not bundled', () => {
    expect(errorsFor(table({ rows: [{ cells: [{ label: 5 as never }] }] })).join()).toMatch(/label/);
    expect(errorsFor(table({ rows: [{ cells: [{ label: 'Good', labelStyle: { fontFamily: 'Nope' } }] }] })).join()).toMatch(/font "Nope"/);
    expect(errorsFor(table({ rows: [{ cells: [{ label: 'Good', labelStyle: { fontFamily: 'Source Serif 4' } }] }] }))).toEqual([]);
  });

  it('checks the cells of a comments table footer row too', () => {
    const block: Block = { id: 'k1', name: 'Comments', type: 'commentsTable', source: 'comments', subjectLabel: 'S', commentLabel: 'C', subjectWidth: 20, footerRow: { cells: [{ label: 5 as never }] } };
    expect(errorsFor(block).join()).toMatch(/label/);
  });

  it('finds a bad option inside a columns block', () => {
    const block: Block = { id: 'col', type: 'columns', gap: 0, columns: [{ width: 100, blocks: [table({ rules: 'dotted' as never })] }] };
    expect(errorsFor(block).join()).toMatch(/lines/);
  });
});
