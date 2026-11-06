import { describe, expect, it } from 'vitest';
import { blockFlowables, type RenderCtx } from './blocks';
import { REPORTKIT_CSS } from './css';
import { SCALES } from './defaults/scales';
import { DEFAULT_MARK_RULES } from './format';
import { sampleReportData } from './sample';
import { barCss } from './style';
import type { Block, ReportData, SubjectCardsBlock, TableBlock } from './types';

function ctxFor(data: ReportData): RenderCtx {
  const scales = [SCALES.egsnProgress];
  return {
    doc: {
      schemaVersion: 1,
      docType: data.meta.docType,
      page: { size: 'a4', margin: { top: 0, right: 40, bottom: 0, left: 40 } },
      theme: { fontFamily: 'Mulish', fontSize: 12, color: '#111', borderColor: '#000', accent: '#2c5aa0' },
      scales,
      marks: DEFAULT_MARK_RULES,
      fields: [],
      header: { height: 0, elements: [] },
      footer: { height: 0, elements: [] },
      blocks: [],
    },
    data,
    scope: { ...data, page: { number: 1, count: 1 } },
    mode: 'print',
    scales: new Map(scales.map((s) => [s.id, s])),
    warnings: [],
    contentWidth: 714,
    image: () => null,
  };
}

function html(block: Block, ctx: RenderCtx): string {
  return blockFlowables(block, ctx)
    .map((f) => (f.kind === 'atomic' ? f.html : f.kind === 'table' ? `${f.open}${f.rows.map((r) => r.html).join('')}${f.close}` : ''))
    .join('');
}

const ctx = ctxFor(sampleReportData('4', 'report_card'));
const table = (extra: Partial<TableBlock> = {}): TableBlock => ({ id: 't1', type: 'table', columns: [100], rows: [{ cells: [{ text: 'Hello' }] }], ...extra });

describe('table rules', () => {
  it('turns off the vertical lines and side outline when only row lines are wanted', () => {
    const out = html(table({ rules: 'rows' }), ctx);
    expect(out).toContain('--rk-vbw:0px');
    expect(out).toContain('--rk-ovw:0px');
  });

  it('leaves a table without rules, or with a full grid, as it was', () => {
    for (const block of [table(), table({ rules: 'grid' })]) {
      const out = html(block, ctx);
      expect(out).not.toContain('--rk-vbw');
      expect(out).not.toContain('--rk-ovw');
    }
  });

  it('has the stylesheet read those widths, falling back to the normal line width', () => {
    expect(REPORTKIT_CSS).toContain('border-left-width:var(--rk-vbw,var(--rk-bw,1px))');
    expect(REPORTKIT_CSS).toContain('border-right-width:var(--rk-vbw,var(--rk-bw,1px))');
    expect(REPORTKIT_CSS).toContain('border-left-width:var(--rk-ovw,var(--rk-obw,1px))');
    expect(REPORTKIT_CSS).toContain('border-right-width:var(--rk-ovw,var(--rk-obw,1px))');
  });
});

describe('table cell label', () => {
  it('prints a label above the cell text, in its own style', () => {
    const out = html(table({ rows: [{ cells: [{ label: 'Good', labelStyle: { fontSize: 13 }, text: 'G' }] }] }), ctx);
    expect(out).toContain('<div style="font-size:13px">Good</div>G');
  });

  it('merges fields in a label and escapes what it prints', () => {
    const out = html(table({ rows: [{ cells: [{ label: '<b>{{student.firstName}}</b>', text: 'x' }] }] }), ctx);
    expect(out).toContain('&lt;b&gt;Adam&lt;/b&gt;');
    expect(out).not.toContain('<b>Adam');
  });
});

describe('bar style', () => {
  it('sets its own font and letter spacing', () => {
    const css = barCss({ fontFamily: 'Libre Baskerville', letterSpacing: 1.5 });
    expect(css).toContain("font-family:'Libre Baskerville'");
    expect(css).toContain('letter-spacing:1.5px');
  });

  it('picks the nearest weight of its own font, not the theme font', () => {
    expect(barCss({ fontFamily: 'Libre Baskerville', fontWeight: 600 }, '', { fontFamily: 'Mulish' })).toContain('font-weight:700');
    expect(barCss({ fontWeight: 600 }, '', { fontFamily: 'Mulish' })).toContain('font-weight:600');
  });

  it('draws lines along its top and bottom', () => {
    const css = barCss({ ruleTop: { color: '#003068', width: 3 }, ruleBottom: { color: '#b8964a', width: 1 } });
    expect(css).toContain('border-top:3px solid #003068');
    expect(css).toContain('border-bottom:1px solid #b8964a');
  });

  it('never lets a line colour inject CSS', () => {
    const css = barCss({ ruleTop: { color: 'red;background:url(http://x)', width: 2 } });
    expect(css).not.toContain('url(');
    expect(css).toContain('border-top:2px solid #000');
  });

  it('adds nothing for a bar without the new options', () => {
    const css = barCss({ background: '#2c5aa0', color: '#ffffff', fontSize: 16, fontWeight: 700 }, '', { fontFamily: 'Source Serif 4' });
    expect(css).toBe('background:#2c5aa0;color:#ffffff;font-size:16px;font-weight:700;text-align:left');
  });
});

describe('subject card tiles', () => {
  const data = sampleReportData('4', 'progress_report');
  const cards = (cardStyle: SubjectCardsBlock['cardStyle']): SubjectCardsBlock => ({
    id: 'c1',
    type: 'subjectCards',
    fields: [{ key: 'workHabits', label: 'Work Habits', width: 1 }],
    rows: 'current',
    scaleId: 'egsn-progress',
    colorRatings: true,
    cardStyle,
  });
  const one = { ...data, subjects: [{ ...data.subjects[0], workHabits: 'E' }] };

  it('keeps the small rounded tile when no tile style is set', () => {
    expect(html(cards({ markLayout: 'tiles' }), ctxFor(one))).toContain('padding:5px 10px;border-radius:3px;font-weight:700');
  });

  it('takes its spacing and corners from the tile style', () => {
    const out = html(cards({ markLayout: 'tiles', tile: { padding: 6, paddingX: 12, borderRadius: 0 } }), ctxFor(one));
    expect(out).toContain('padding:6px 12px;border-radius:0px;font-weight:700');
    expect(out).toContain('background:#d4edda');
  });

  it('uses the same spacing on all sides when only padding is set', () => {
    expect(html(cards({ markLayout: 'tiles', tile: { padding: 8 } }), ctxFor(one))).toContain('padding:8px 8px;border-radius:0px');
  });
});
