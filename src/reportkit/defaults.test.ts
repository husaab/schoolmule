import { describe, expect, it } from 'vitest';
import { blockFlowables, type RenderCtx } from './blocks';
import { DEFAULT_TEMPLATES } from './defaults';
import { SCALES } from './defaults/scales';
import { DEFAULT_MARK_RULES } from './format';
import { mergeText } from './merge';
import { sampleReportData } from './sample';
import type { Block, ReportData, SkillsTableBlock, SubjectCardsBlock, TemplateDoc } from './types';

/** The default a grade gets with nothing assigned: the first match in the list. */
function automaticDefault(docType: string, grade: string): string | undefined {
  return DEFAULT_TEMPLATES.find((d) => d.docType === docType && d.grades.includes(grade))?.key;
}

function ctxFor(data: ReportData, doc: Partial<TemplateDoc> = {}): RenderCtx {
  const scales = [SCALES.egsnProgress, SCALES.skCard];
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
      ...doc,
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

describe('built-in defaults', () => {
  it('picks the standard cards automatically and the First/Second/Final card only by assignment', () => {
    expect(automaticDefault('report_card', '4')).toBe('report-card-standard');
    expect(automaticDefault('report_card', '1')).toBe('report-card-standard');
    expect(automaticDefault('report_card', 'JK')).toBe('report-card-jk');
    expect(automaticDefault('report_card', 'SK')).toBe('report-card-sk');
    expect(automaticDefault('progress_report', '8')).toBe('progress-standard');
    expect(automaticDefault('progress_report', 'JK')).toBe('progress-jk');
    const keys = DEFAULT_TEMPLATES.map((d) => d.key);
    expect(keys.indexOf('report-card-t1t2final')).toBeGreaterThan(keys.indexOf('report-card-standard'));
  });

  it('keeps legacy one-school text out of the kindergarten cards', () => {
    for (const key of ['report-card-jk', 'report-card-sk']) {
      const json = JSON.stringify(DEFAULT_TEMPLATES.find((d) => d.key === key)!.build());
      expect(json).not.toMatch(/Majida|alhaadiacademy|Board: Private|First Term Report/);
      expect(json).toContain('{{school.principal}}');
      expect(json).toContain('teacherSignature');
      expect(json).toContain('{{page.number}}');
    }
  });
});

describe('merge filter "title"', () => {
  it('title-cases a label', () => {
    expect(mergeText('{{meta.termLabel|title}}', { meta: { termLabel: 'FIRST TERM' } })).toBe('First Term');
    expect(mergeText('{{x|title}}', { x: 'self-regulation and (BASIC) skills' })).toBe('Self-Regulation And (Basic) Skills');
  });
});

describe('subject card options', () => {
  const base: SubjectCardsBlock = {
    id: 'b1',
    type: 'subjectCards',
    fields: [
      { key: 'workHabits', label: 'Work Habits', width: 1 },
      { key: 'overall', label: 'Overall', width: 1 },
    ],
    rows: 'current',
    showComment: true,
    scaleId: 'egsn-progress',
    colorRatings: true,
  };

  it('prints emptyRatingText for blank ratings and can hide an empty comment', () => {
    const data = sampleReportData('4', 'progress_report');
    data.subjects = [{ ...data.subjects[0], workHabits: '', behaviour: '', comment: '' }];
    const ctx = ctxFor(data);
    const plain = html(base, ctx);
    expect(plain).toContain('<strong></strong>');
    expect(plain).toContain('rk-card-label');
    const styled = html({ ...base, emptyRatingText: 'Not Assessed', hideEmptyComment: true }, ctx);
    expect(styled.match(/Not Assessed/g)).toHaveLength(2);
    expect(styled).not.toContain('rk-card-label');
    expect(ctx.warnings).toEqual([]);
  });

  it('lays tiles out without a table and colours them from the scale', () => {
    const data = sampleReportData('4', 'progress_report');
    data.subjects = [{ ...data.subjects[0], workHabits: 'E', behaviour: 'G' }];
    const out = html({ ...base, cardStyle: { markLayout: 'tiles' } }, ctxFor(data));
    expect(out).not.toContain('<table');
    expect(out).toContain('background:#d4edda');
  });

  it('pads each perPage group and spaces cards only inside a group', () => {
    const data = sampleReportData('4', 'report_card');
    const flows = blockFlowables({ ...base, perPage: 2, cardGap: 50, groupPadding: 30 }, ctxFor(data));
    expect(flows[0].kind === 'atomic' && flows[0].html.startsWith('<div style="padding-top:30px;margin-bottom:50px">')).toBe(true);
    expect(flows[1].kind === 'atomic' && flows[1].html.startsWith('<div style="margin-bottom:0px">')).toBe(true);
    expect(flows[2].kind === 'atomic' && flows[2].breakBefore).toBe(true);
  });
});

describe('skills table options', () => {
  it('separates groups with a gap row and keeps each group together', () => {
    const data = sampleReportData('SK', 'report_card');
    const block: SkillsTableBlock = {
      id: 's1',
      type: 'skillsTable',
      groupAsColumnHeader: true,
      columns: [
        { key: 'name', label: '{{group}}', width: 70 },
        { key: 't1', label: 'Term 1', width: 30, headerAlign: 'center', style: { fontWeight: 700 } },
      ],
      showGroupComments: true,
      groupGap: 18,
      keepGroupsTogether: true,
    };
    const [flow] = blockFlowables(block, ctxFor(data));
    if (flow.kind !== 'table') throw new Error('expected a table');
    const gaps = flow.rows.filter((r) => r.html.includes('rk-gap'));
    expect(gaps).toHaveLength(data.skills.length - 1);
    // A gap goes before every group but the first, travels with its group and
    // is dropped at the top of a page; a page may only end after a group.
    expect(flow.rows[0].html).not.toContain('rk-gap');
    expect(gaps.every((r) => r.keepWithNext && r.dropAtTop)).toBe(true);
    flow.rows.forEach((r, i) => {
      const endsGroup = i === flow.rows.length - 1 || flow.rows[i + 1].html.includes('rk-gap');
      expect(r.keepWithNext).toBe(!endsGroup);
    });
    expect(flow.rows[0].html).toContain('text-align:center');
  });
});
