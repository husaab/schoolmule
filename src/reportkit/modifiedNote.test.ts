import { describe, expect, it } from 'vitest';
import { blockFlowables, type RenderCtx } from './blocks';
import { SCALES } from './defaults/scales';
import { DEFAULT_MARK_RULES, modifiedNoteText } from './format';
import { sampleReportData, type SampleKey } from './sample';
import type { ReportData, SubjectCardsBlock, SubjectRow, TemplateDoc } from './types';

const LABEL = 'Earlier grade level skills';

function ctxFor(data: ReportData): RenderCtx {
  const doc: TemplateDoc = {
    schemaVersion: 1,
    docType: data.meta.docType,
    page: { size: 'a4', margin: { top: 0, right: 40, bottom: 0, left: 40 } },
    theme: { fontFamily: 'Mulish', fontSize: 12, color: '#111', borderColor: '#000', accent: '#2c5aa0' },
    scales: [SCALES.egsnProgress],
    marks: DEFAULT_MARK_RULES,
    fields: [],
    header: { height: 0, elements: [] },
    footer: { height: 0, elements: [] },
    blocks: [],
  } as unknown as TemplateDoc;
  return {
    doc,
    data,
    scope: { ...data, page: { number: 1, count: 1 } },
    mode: 'print',
    scales: new Map([[SCALES.egsnProgress.id, SCALES.egsnProgress]]),
    warnings: [],
    contentWidth: 714,
    image: () => null,
  } as unknown as RenderCtx;
}

const cards = (rows: SubjectCardsBlock['rows'], cardStyle?: SubjectCardsBlock['cardStyle']): SubjectCardsBlock => ({
  id: 'c1',
  type: 'subjectCards',
  fields: [
    { key: 'mark', label: 'Grade', width: 1 },
    { key: 'workHabits', label: 'Work Habits', width: 1 },
  ],
  rows,
  showComment: true,
  scaleId: 'egsn-progress',
  colorRatings: true,
  cardStyle,
});

function render(block: SubjectCardsBlock, change: Partial<SubjectRow>, grade: SampleKey = '4'): string {
  const data = sampleReportData(grade, 'report_card');
  data.subjects = [{ ...data.subjects[0], mark: 86.75, workHabits: 'G', ...change }];
  return blockFlowables(block, ctxFor(data))
    .map((f) => (f.kind === 'atomic' ? f.html : f.kind === 'table' ? `${f.open}${f.rows.map((r) => r.html).join('')}${f.close}` : ''))
    .join('');
}

describe('modifiedNoteText', () => {
  it('stops at the sentence with no labels', () => {
    expect(modifiedNoteText([])).toBe('* Includes modified assessments');
  });

  it('prints one or two labels, ignoring case and spacing when it removes repeats', () => {
    expect(modifiedNoteText(['A'])).toBe('* Includes modified assessments: A');
    expect(modifiedNoteText(['A', ' a ', 'B'])).toBe('* Includes modified assessments: A; B');
  });

  it('stops at the sentence with more than two labels', () => {
    expect(modifiedNoteText(['A', 'B', 'C'])).toBe('* Includes modified assessments');
  });
});

describe('a subject card with a modified mark', () => {
  it('stars the mark and prints the line', () => {
    const out = render(cards('current'), { modified: true, modifiedLabels: [LABEL] });
    expect(out).toContain('86.8%*');
    expect(out).toContain(`* Includes modified assessments: ${LABEL}`);
  });

  it('never stars work habits', () => {
    const out = render(cards('current'), { modified: true, modifiedLabels: [] });
    expect(out).not.toContain('G*');
  });

  it('prints the line before the teacher comments', () => {
    const out = render(cards('current'), { modified: true, modifiedLabels: [LABEL], comment: 'Steady progress.' });
    expect(out.indexOf('Includes modified assessments')).toBeLessThan(out.indexOf('Steady progress.'));
  });

  it('stars a below-standard mark too', () => {
    expect(render(cards('current'), { mark: 40, modified: true, modifiedLabels: [] })).toContain('R*');
  });

  it('never stars a mark with no evidence', () => {
    const out = render(cards('current'), { mark: 'I', modified: true, modifiedLabels: [] });
    expect(out).not.toContain('I*');
  });

  it('stars a letter grade', () => {
    expect(render(cards('current'), { mark: 86.75, modified: true, modifiedLabels: [LABEL] }, '2')).toMatch(/>A\*</);
  });

  it('prints a hostile label as text', () => {
    const out = render(cards('current'), { modified: true, modifiedLabels: ['<b>Grade 3</b>'] });
    expect(out).not.toContain('<b>Grade 3');
    expect(out).toContain('&lt;b&gt;Grade 3&lt;/b&gt;');
  });

  it('stars the tile layout too', () => {
    const out = render(cards('current', { markLayout: 'tiles' }), { modified: true, modifiedLabels: [LABEL] });
    expect(out).toContain('86.8%*');
    expect(out).toContain('Includes modified assessments');
  });

  it('changes nothing without the flag', () => {
    const plain = render(cards('current'), {});
    expect(plain).not.toContain('*');
    expect(plain).not.toContain('modified');
    expect(plain).toBe(render(cards('current'), { modified: false, modifiedLabels: [] }));
  });

  describe('on the First / Second / Final card', () => {
    const terms = (t1: boolean, t2: boolean): Partial<SubjectRow> => ({
      modified: t2,
      modifiedLabels: t2 ? [LABEL] : [],
      terms: {
        t1: { mark: 73.9, workHabits: 'G', behaviour: 'E', comment: '', modified: t1, modifiedLabels: t1 ? [LABEL] : [] },
        t2: { mark: 86.75, workHabits: 'G', behaviour: 'S', comment: '', modified: t2, modifiedLabels: t2 ? [LABEL] : [] },
        final: { mark: 80.3, workHabits: '', behaviour: '', comment: '', modified: t1 || t2 },
      },
    });

    it('stars only the affected term and the final', () => {
      const out = render(cards('terms'), terms(true, false));
      expect(out).toContain('73.9%*');
      expect(out).toContain('80.3%*');
      expect(out).not.toContain('86.8%*');
      expect(out).toContain(`* Includes modified assessments: ${LABEL}`);
    });

    it('prints the labels of both terms once', () => {
      const out = render(cards('terms'), terms(true, true));
      expect(out.match(/Includes modified assessments/g)).toHaveLength(1);
      expect(out).toContain(`* Includes modified assessments: ${LABEL}`);
      expect(out).not.toContain(`${LABEL}; ${LABEL}`);
    });

    it('changes nothing with neither term flagged', () => {
      const out = render(cards('terms'), terms(false, false));
      expect(out).not.toContain('*');
      expect(out).not.toContain('modified');
    });
  });
});
