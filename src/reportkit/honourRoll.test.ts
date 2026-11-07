import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMPLATES, defaultTemplate } from './defaults';
import { SCALES } from './defaults/scales';
import { FONT_FAMILIES } from './fonts';
import { PAGE_SIZES } from './types';
import type { Block, CanvasElement, ColumnsBlock, ImageElement, SubjectCardsBlock, TemplateDoc } from './types';

/** The Honour Roll look on the grades 1–8 report card and progress report. */

const STANDARD = defaultTemplate('report-card-standard')!;
const TERMS = defaultTemplate('report-card-t1t2final')!;
const PROGRESS = defaultTemplate('progress-standard')!;
const CARDS = [STANDARD, TERMS];
const ALL = [STANDARD, TERMS, PROGRESS];

const json = (d: TemplateDoc) => JSON.stringify(d);

function allBlocks(blocks: Block[]): Block[] {
  return blocks.flatMap((b) => (b.type === 'columns' ? [b, ...allBlocks((b as ColumnsBlock).columns.flatMap((c) => c.blocks))] : [b]));
}
const subjectCards = (d: TemplateDoc) => allBlocks(d.blocks).find((b) => b.type === 'subjectCards') as SubjectCardsBlock;
const zoneElements = (d: TemplateDoc): CanvasElement[] => [...(d.firstHeader?.elements ?? []), ...d.header.elements, ...d.footer.elements, ...(d.firstFooter?.elements ?? [])];

/** Every value of a key anywhere in a document. */
function valuesOf(node: unknown, key: string, out: unknown[] = []): unknown[] {
  if (Array.isArray(node)) node.forEach((n) => valuesOf(n, key, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === key) out.push(v);
      valuesOf(v, key, out);
    }
  }
  return out;
}

function luminance(hex: string): number {
  const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('same content as before', () => {
  it('keeps the Ontario achievement chart word for word', () => {
    const chart = [
      'The student demonstrates capabilities beyond expectations for their level. Achievement surpasses the provincial standard.',
      'The student has demonstrated the required knowledge and skills with a high degree of effectiveness. Achievement surpasses the provincial standard.',
      'The student has demonstrated the required knowledge and skills with considerable effectiveness. Achievement meets the provincial standard.',
      'The student has demonstrated the required knowledge and skills with some effectiveness. Achievement approaches the provincial standard.',
    ];
    const rows = [
      ['A+', '90-100'], ['A', '85-89'], ['A-', '80-84'],
      ['B+', '77-79'], ['B', '73-76'], ['B-', '70-72'],
      ['C+', '67-69'], ['C', '63-66'], ['C-', '60-62'],
      ['D+', '57-59'], ['D', '53-56'], ['D-', '50-52'],
    ];
    for (const doc of CARDS) {
      const texts = valuesOf(doc, 'text');
      chart.forEach((t) => expect(texts).toContain(t));
      rows.flat().forEach((t) => expect(texts).toContain(t));
      ['Level 4', 'Level 3', 'Level 2', 'Level 1', 'Letter', 'Percent', 'Level', 'Description'].forEach((t) => expect(texts).toContain(t));
    }
  });

  it('keeps every label of the report card', () => {
    const labels = ['{{school.name}}', '{{school.address}}[[ | {{school.phone}}]][[ | {{school.email}}]]', 'Name of Student:', '{{student.name}}', 'OEN:', '{{student.oen}}', 'N/A', 'Days of Absence:', '{{student.daysAbsent}}', 'Grade:', '{{student.grade}}', 'Homeroom Teacher:', '{{student.homeroomTeacher}}', 'WORK HABITS & BEHAVIOUR', 'Needs Improvement', 'Satisfactory', 'Good', 'Excellent', 'ACHIEVEMENT OF THE CURRICULUM EXPECTATIONS', 'Academic Achievement', 'Teacher Comments', 'No comments provided', "Principal's Signature", 'School Stamp', 'Created on {{meta.generatedDate}}'];
    for (const doc of CARDS) labels.forEach((t) => expect(json(doc), t).toContain(JSON.stringify(t).slice(1, -1)));
    expect(json(STANDARD)).toContain('{{meta.termLabel}} REPORT CARD {{meta.schoolYear}}');
    expect(json(TERMS)).toContain('FINAL TERM REPORT CARD {{meta.schoolYear}}');
  });

  it('keeps every label of the progress report', () => {
    const labels = ['{{school.name}}', '{{school.address}}', '[[Phone: {{school.phone}}]][[ | Email: {{school.email}}]]', 'STUDENT PROGRESS REPORT', 'Student Name:', 'Term:', '{{meta.term}}', 'Grade:', 'Homeroom Teacher:', 'OEN:', 'Assessment Scale', 'Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Progress by Subject', 'Core Standards Progress:', 'Teacher Comments:', 'Not Assessed', 'Principal Signature', 'Created on {{meta.generatedDate|long}}'];
    labels.forEach((t) => expect(json(PROGRESS), t).toContain(t));
    expect(json(PROGRESS)).toContain("This progress report provides an overview of the student's current academic and behavioral progress.");
    expect(subjectCards(PROGRESS).fields.map((f) => f.label)).toEqual(['Work Habits', 'Behavior', 'Overall']);
  });

  it('keeps the sections in the same order', () => {
    const order = (d: TemplateDoc) => d.blocks.map((b) => b.name);
    for (const doc of CARDS) expect(order(doc)).toEqual(['Student information', 'WORK HABITS & BEHAVIOUR', 'ACHIEVEMENT OF THE CURRICULUM EXPECTATIONS', 'Academic Achievement', 'Subjects', 'Footer']);
    expect(order(PROGRESS)).toEqual(['Student information', 'Assessment Scale', 'Progress by Subject', 'Subjects', 'Footer']);
  });

  it('keeps the paper size and the two subjects per page', () => {
    ALL.forEach((d) => expect(d.page.size).toBe('a4'));
    CARDS.forEach((d) => expect(subjectCards(d).perPage).toBe(2));
    expect(subjectCards(STANDARD).rows).toBe('current');
    expect(subjectCards(TERMS).rows).toBe('terms');
  });
});

describe('the Honour Roll look', () => {
  it('sets headings in Libre Baskerville over Source Serif text, both bundled as static files', () => {
    for (const doc of ALL) {
      expect(doc.theme.fontFamily).toBe('Source Serif 4');
      expect(subjectCards(doc).headerBar?.fontFamily).toBe('Libre Baskerville');
      for (const family of [...valuesOf(doc, 'fontFamily')]) expect(FONT_FAMILIES.map((f) => f.id)).toContain(family);
    }
  });

  it('prints subject headers as a tint between two lines, not a solid dark bar', () => {
    for (const doc of ALL) {
      const bar = subjectCards(doc).headerBar!;
      expect(luminance(bar.background!)).toBeGreaterThan(0.8);
      expect(bar.ruleTop?.width).toBeGreaterThan(0);
      expect(bar.ruleBottom?.width).toBeGreaterThan(0);
    }
  });

  it('keeps dark colour to thin rules: no filled area on the page is dark', () => {
    for (const doc of ALL) {
      for (const el of zoneElements(doc)) {
        if (el.type === 'shape' && el.fill && luminance(el.fill) < 0.5) expect(el.h, el.name).toBeLessThanOrEqual(3);
      }
      for (const bg of valuesOf(doc, 'background')) expect(luminance(bg as string)).toBeGreaterThan(0.6);
    }
  });

  it('gives all text at least 4.5:1 contrast on white', () => {
    for (const doc of ALL) {
      // A scale's `color` is a tile fill and a rule's `color` is a line, so neither carries text.
      const textOnly = JSON.parse(JSON.stringify({ ...doc, scales: [] }, (key, value) => (key === 'ruleTop' || key === 'ruleBottom' ? undefined : value)));
      const colors = [...valuesOf(textOnly, 'color'), ...valuesOf(doc, 'textColor')];
      expect(colors.length).toBeGreaterThan(10);
      for (const color of colors) expect(contrast(color as string, '#ffffff'), String(color)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('gives each rating letter at least 4.5:1 contrast on its own tint', () => {
    for (const doc of ALL) {
      const scale = doc.scales.find((s) => s.id === subjectCards(doc).scaleId)!;
      expect(scale.levels.map((l) => l.code)).toEqual(['E', 'G', 'S', 'N']);
      for (const l of scale.levels) expect(contrast(l.textColor!, l.color!), l.code).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('colours the ratings, which keep their letters', () => {
    ALL.forEach((d) => expect(subjectCards(d).colorRatings).toBe(true));
  });

  it('starts subjects on a new page so the two-per-page pairs never shift', () => {
    for (const doc of CARDS) expect(doc.blocks.find((b) => b.name === 'Academic Achievement')?.breakBefore).toBe(true);
  });

  it('gives a long name room: the name column is wider than the OEN column', () => {
    for (const doc of CARDS) {
      const grid = doc.blocks.find((b) => b.name === 'Student information');
      if (grid?.type !== 'table') throw new Error('expected a table');
      expect(grid.rules).toBe('rows');
      expect(grid.columns[1]).toBeGreaterThan(grid.columns[3]);
    }
  });

  it("gives a teacher's name room on the progress report", () => {
    const grid = PROGRESS.blocks.find((b) => b.name === 'Student information');
    if (grid?.type !== 'table') throw new Error('expected a table');
    const total = grid.columns.reduce((a, b) => a + b, 0);
    expect(grid.columns[3] / total).toBeGreaterThan(0.22);
  });

  it('marks pages after the first with the same rules, and nothing else', () => {
    for (const doc of ALL) {
      expect(doc.header.elements.length).toBeGreaterThan(0);
      expect(doc.header.elements.every((e) => e.type === 'shape')).toBe(true);
    }
  });

  it("leaves the kindergarten scales' colours alone", () => {
    expect(SCALES.egsn.levels.map((l) => l.color)).toEqual(['#d4edda', '#d1ecf1', '#fff3cd', '#f8d7da']);
    expect(SCALES.egsnProgress.levels.map((l) => l.color)).toEqual(['#d4edda', '#cce7ff', '#fff3cd', '#f8d7da']);
  });
});

describe('the school logo', () => {
  const isLogo = (e: CanvasElement): e is ImageElement => e.type === 'image' && e.src.kind === 'asset' && e.src.asset === 'logo';
  const firstPage = (d: TemplateDoc) => d.firstHeader?.elements ?? d.header.elements;
  const logoOf = (d: TemplateDoc) => firstPage(d).find(isLogo) as ImageElement;
  const named = (d: TemplateDoc, name: string) => firstPage(d).find((e) => e.name === name) as CanvasElement;

  it.each(DEFAULT_TEMPLATES.map((t) => [t.key, t.build()] as const))('%s prints it in the very corner of the page', (_key, doc) => {
    const width = PAGE_SIZES[doc.page.size].width;
    const logos = zoneElements(doc).filter(isLogo);
    expect(logos.length).toBeGreaterThan(0);
    for (const l of logos) {
      expect(width - (l.x + l.w)).toBeCloseTo(20, 5);
      expect(l.y).toBe(20);
      expect(l.align).toBe('right');
    }
  });

  const HONOUR_ROLL = [
    ['report-card-standard', STANDARD],
    ['report-card-t1t2final', TERMS],
    ['progress-standard', PROGRESS],
  ] as const;

  it.each(HONOUR_ROLL)('%s: pages after the first have no logo', (_key, doc) => {
    expect(doc.header.elements.filter(isLogo)).toEqual([]);
  });

  it.each(HONOUR_ROLL)('%s: the school name sits well below the logo, not beside it', (_key, doc) => {
    const logo = logoOf(doc);
    expect(named(doc, 'School name').y).toBeGreaterThanOrEqual(logo.y + logo.h + 20);
  });

  it('leaves the school name, contact lines and title band where they were', () => {
    const where = (d: TemplateDoc, name: string) => {
      const { x, y, w, h } = named(d, name);
      return { x, y, w, h };
    };
    for (const doc of [STANDARD, TERMS]) {
      expect(where(doc, 'School name')).toEqual({ x: 68, y: 120, w: 658, h: 34 });
      expect(where(doc, 'Contact line')).toEqual({ x: 68, y: 155, w: 658, h: 16 });
      expect(named(doc, 'Title').y).toBe(184.75);
    }
    expect(where(PROGRESS, 'School name')).toEqual({ x: 68, y: 108, w: 658, h: 32 });
    expect(where(PROGRESS, 'Address')).toEqual({ x: 68, y: 141, w: 658, h: 16 });
    expect(where(PROGRESS, 'Phone and email')).toEqual({ x: 68, y: 157, w: 658, h: 16 });
    expect(named(PROGRESS, 'Title').y).toBe(185.75);
    for (const doc of ALL) expect(doc.firstHeader?.height).toBe(246);
  });

  it.each(['report-card-jk', 'report-card-sk'])('%s: the title starts clearly below the logo', (key) => {
    const doc = defaultTemplate(key)!;
    const logo = logoOf(doc);
    expect(named(doc, 'Title').y).toBeGreaterThanOrEqual(logo.y + logo.h + 12);
  });

  it('centres the SK progress title on the page now the logo has left its row', () => {
    const title = named(defaultTemplate('progress-sk')!, 'Title');
    expect(title.x + title.w / 2).toBeCloseTo(816 / 2, 1);
  });
});
