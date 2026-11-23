// Progress reports: a goals-and-comment subject (Salaat) prints its goals and
// the comment with no ratings, and the school's subject headings print where a
// subject's section changes, kept with the card under them.
import { describe, expect, it } from 'vitest';
import { blockFlowables, type Flowable, type RenderCtx } from './blocks';
import { progressStandardTemplate } from './defaults/progressStandard';
import { SCALES } from './defaults/scales';
import { DEFAULT_MARK_RULES } from './format';
import { sampleReportData } from './sample';
import type { Block, ReportData, SubjectCardsBlock, SubjectRow, TemplateDoc } from './types';

const GOALS = 'Salah is a special gift and an opportunity to connect with Allah.';
const COMMENT = 'Is making very good progress in learning Salah.';

function ctxFor(data: ReportData): RenderCtx {
  const doc = {
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

const allBlocks = (blocks: Block[]): Block[] => blocks.flatMap((b) => (b.type === 'columns' ? [b, ...b.columns.flatMap((c) => allBlocks(c.blocks))] : [b]));
/** The grades 1-8 progress report's own subject cards block. */
const progressCards = (): SubjectCardsBlock =>
  allBlocks(progressStandardTemplate().blocks).find((b) => b.type === 'subjectCards') as SubjectCardsBlock;

const row = (name: string, change: Partial<SubjectRow> = {}): SubjectRow => ({
  id: name,
  name,
  teacher: 'Teacher',
  mark: null,
  workHabits: 'G',
  behaviour: 'E',
  coreStandards: 'Meeting Common Core Standards',
  comment: `${name} comment.`,
  terms: {},
  ...change,
});

function flows(subjects: SubjectRow[], block: SubjectCardsBlock = progressCards()): Flowable[] {
  const data = sampleReportData('4', 'progress_report');
  data.subjects = subjects;
  return blockFlowables(block, ctxFor(data));
}
const html = (f: Flowable) => (f.kind === 'atomic' ? f.html : '');

describe('a goals-and-comment subject', () => {
  const salaat = row('Salaat', { teacher: 'Supervisor', commentsOnly: true, goals: GOALS, comment: COMMENT, workHabits: '', behaviour: '', coreStandards: '' });

  it('prints its goals and the comment, labelled, and nothing else', () => {
    const card = html(flows([salaat])[0]);
    expect(card).toContain('Salaat – Supervisor');
    expect(card).toContain('Expectations/Goals:');
    expect(card).toContain(GOALS);
    expect(card).toContain('Teacher Comments:');
    expect(card).toContain(COMMENT);
    expect(card.indexOf(GOALS)).toBeLessThan(card.indexOf(COMMENT));
    for (const gone of ['Work Habits', 'Behavior', 'Core Standards', 'Not Assessed']) expect(card).not.toContain(gone);
  });

  it('prints the goals alone while the comment is empty, and the comment alone with no goals', () => {
    const noComment = html(flows([{ ...salaat, comment: '' }])[0]);
    expect(noComment).toContain(GOALS);
    expect(noComment).not.toContain('Teacher Comments:');
    const noGoals = html(flows([{ ...salaat, goals: '' }])[0]);
    expect(noGoals).not.toContain('Expectations/Goals:');
    expect(noGoals).toContain(COMMENT);
  });

  it('leaves an ordinary subject as it was', () => {
    const card = html(flows([row('Math')])[0]);
    expect(card).toContain('Work Habits');
    expect(card).toContain('Core Standards Progress:');
    expect(card).not.toContain('Expectations/Goals');
  });
});

describe('subject headings', () => {
  it('prints no headings when no subject has a section', () => {
    const out = flows([row('Arabic'), row('Math')]);
    expect(out).toHaveLength(2);
    expect(out.map(html).join('')).not.toContain('rk-section-head');
  });

  it('prints a heading where the section changes, kept with the card under it', () => {
    const out = flows([
      row('English Language Arts', { section: 'Language & Literacy' }),
      row('Science', { section: 'Science & Technology' }),
      row('Computer Studies', { section: 'Science & Technology' }),
      row('Salaat', { section: 'Religious Studies', commentsOnly: true, goals: GOALS }),
    ]);
    const kinds = out.map((f) => (html(f).includes('rk-section-head') ? 'H' : 'C'));
    expect(kinds).toEqual(['H', 'C', 'H', 'C', 'C', 'H', 'C']);
    const headings = out.filter((f) => html(f).includes('rk-section-head'));
    expect(headings.map((f) => (f.kind === 'atomic' ? f.keepWithNext : null))).toEqual([true, true, true]);
    expect(html(headings[0])).toContain('Language &amp; Literacy');
    expect(html(headings[0])).toContain('Libre Baskerville');
  });

  it('moves a page break due before a card onto its heading', () => {
    const block = { ...progressCards(), perPage: 1 };
    const out = flows([row('Science', { section: 'Science & Technology' }), row('Arabic', { section: 'Languages' })], block);
    expect(out.map((f) => (f.kind === 'atomic' ? f.breakBefore : null))).toEqual([false, false, true, false]);
  });
});
