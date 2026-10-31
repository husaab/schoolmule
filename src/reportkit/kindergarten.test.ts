import { describe, expect, it } from 'vitest';
import { blockFlowables, type RenderCtx } from './blocks';
import { DEFAULT_TEMPLATES, defaultTemplate } from './defaults';
import { JK_SECTION_STYLES } from './defaults/jkProgress';
import { SCALES } from './defaults/scales';
import { DEFAULT_MARK_RULES } from './format';
import { BUILTIN_IMAGES, builtinImagesIn, isBuiltinImage } from './images';
import { mergeText } from './merge';
import { defaultResolveImage } from './render';
import { sampleReportData } from './sample';
import { planPages } from './splitPlan';
import type { Block, CommentsTableBlock, RatingKeyBlock, ReportData, SkillsTableBlock, TableBlock, TemplateDoc } from './types';
import { validateTemplate } from './validate';

/** Images resolve to "img:<name>" / the asset key, so tests can see which one printed. */
function ctxFor(data: ReportData, doc: Partial<TemplateDoc> = {}): RenderCtx {
  const scales = [SCALES.jkProgress, SCALES.skProgress];
  return {
    doc: {
      schemaVersion: 1,
      docType: data.meta.docType,
      page: { size: 'a4', margin: { top: 0, right: 48, bottom: 0, left: 48 } },
      theme: { fontFamily: 'Mulish', fontSize: 14, color: '#000', borderColor: '#000', accent: '#2c5aa0' },
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
    contentWidth: 698,
    image: (src) => (!src ? null : src.kind === 'builtin' ? `img:${src.name}` : src.kind === 'asset' ? `asset:${src.asset}` : src.url),
  };
}

function tableRows(block: Block, ctx: RenderCtx) {
  const [flow] = blockFlowables(block, ctx);
  if (!flow || flow.kind !== 'table') throw new Error('expected a table');
  return flow.rows;
}

const jkData = () => sampleReportData('JK', 'progress_report');

describe('skills table group styles', () => {
  const base: SkillsTableBlock = {
    id: 's1',
    type: 'skillsTable',
    columns: [
      { key: 'name', label: 'Skill', width: 79 },
      { key: 'rating', label: 'Rating', width: 21 },
    ],
    groupBar: { background: '#eeeeee' },
  };

  it('colours a matching group (case-insensitive, trailing ":" ignored) and prints its icon', () => {
    const data = jkData();
    data.skills = [{ ...data.skills[0], name: 'LANGUAGE AND COMMUNICATION SKILLS:' }, data.skills[1]];
    const rows = tableRows({ ...base, groupStyles: [{ match: 'Language and Communication Skills', background: '#c9daf8', color: '#123456', icon: { kind: 'builtin', name: 'language.png' }, iconHeight: 22 }] }, ctxFor(data));
    const bars = rows.filter((r) => r.html.includes('rk-bar'));
    expect(bars[0].html).toContain('background:#c9daf8');
    expect(bars[0].html).toContain('color:#123456');
    expect(bars[0].html).toContain('src="img:language.png"');
    expect(bars[0].html).toContain('height:22px');
    // No match: the group bar's own colour, no icon.
    expect(bars[1].html).toContain('background:#eeeeee');
    expect(bars[1].html).not.toContain('<img');
  });

  it('cycles the fallback colours by the group position for unmatched groups', () => {
    const rows = tableRows({ ...base, groupStyles: [{ match: 'Social Skills', background: '#d9ead3' }], fallbackGroupColors: ['#111111', '#222222', 'javascript:x'] }, ctxFor(jkData()));
    const bars = rows.filter((r) => r.html.includes('rk-bar')).map((r) => /background:(#[0-9a-f]+)/.exec(r.html)?.[1]);
    // Groups 0, 2, 4…: the fallbacks in turn by index (unsafe colours dropped); group 1 matched.
    expect(bars.slice(0, 4)).toEqual(['#111111', '#d9ead3', '#111111', '#222222']);
  });

  it('can keep the column lines in a group bar', () => {
    const rows = tableRows({ ...base, groupBarColumns: true }, ctxFor(jkData()));
    const bar = rows.find((r) => r.html.includes('rk-bar'))!.html;
    expect(bar).toMatch(/^<tr><td class="rk-bar" colspan="1"[^>]*>Language and Communication Skills<\/td><td class="rk-bar"[^>]*><\/td><\/tr>$/);
  });

  it('puts a droppable gap before every group but the first', () => {
    const rows = tableRows({ ...base, groupGap: 30, keepGroupsTogether: true, rowHeight: 33 }, ctxFor(jkData()));
    expect(rows[0].html).not.toContain('rk-gap');
    const gaps = rows.filter((r) => r.html.includes('rk-gap'));
    expect(gaps).toHaveLength(jkData().skills.length - 1);
    expect(gaps.every((g) => g.dropAtTop && g.keepWithNext && g.html.includes('height:30px'))).toBe(true);
    expect(rows.find((r) => r.html.includes('Speaks clearly'))!.html).toContain('<tr style="height:33px">');
  });

  it('lays side-by-side groups out on the given columns with their own row height and text size', () => {
    const data = sampleReportData('SK', 'progress_report');
    const rows = tableRows(
      { ...base, sideBySide: [['Arabic and Quran', 'French']], pairColumns: [29.9, 8.2, 39.4, 22.5], pairRowHeight: 31, pairStyle: { fontSize: 12.67 } },
      ctxFor(data),
    );
    const [flow] = blockFlowables({ ...base, sideBySide: [['Arabic and Quran', 'French']], pairColumns: [29.9, 8.2, 39.4, 22.5] }, ctxFor(data));
    expect(flow.kind === 'table' && flow.open).toContain('<col style="width:29.900%">');
    const pairRow = rows.find((r) => r.html.includes('Recognizes and writes Arabic Letters'))!.html;
    expect(pairRow).toContain('<tr style="height:31px">');
    expect(pairRow).toContain('font-size:12.67px');
  });
});

describe('comments table look', () => {
  it('shades the subject cells and styles the caption and comment', () => {
    const block: CommentsTableBlock = {
      id: 'c1',
      type: 'commentsTable',
      source: 'comments',
      subjectLabel: 'Subjects',
      commentLabel: 'Comments',
      subjectWidth: 20,
      subjectBackground: '#d0cece',
      captionStyle: { fontSize: 8.67 },
      commentStyle: { fontSize: 14, lineHeight: 1.6, verticalAlign: 'top' },
      rowHeight: 53.33,
      showEmptyRows: true,
    };
    const rows = tableRows(block, ctxFor(sampleReportData('SK', 'progress_report')));
    expect(rows).toHaveLength(9);
    expect(rows[0].html).toContain('<tr style="height:53.33px">');
    expect(rows[0].html).toContain('background:#d0cece');
    expect(rows[0].html).toContain('<span class="rk-caption" style="font-size:8.67px">Reading, Writing, Oral communication, Media Literacy</span>');
    expect(rows[0].html).toMatch(/<td colspan="1" style="font-size:14px;line-height:1.6;vertical-align:top">|<td style="font-size:14px;line-height:1.6;vertical-align:top">/);
  });
});

describe('table and rating key options', () => {
  it('gives a cell its own padding and lets the last row fill a minimum height', () => {
    const block: TableBlock = {
      id: 't1',
      type: 'table',
      columns: [100],
      minHeight: 400,
      rows: [{ cells: [{ text: 'A', padding: { top: 10, right: 6, bottom: 16, left: 6 } }] }, { height: 20, cells: [{ text: 'B' }] }],
    };
    const [flow] = blockFlowables(block, ctxFor(jkData()));
    const html = flow.kind === 'atomic' ? flow.html : '';
    expect(html).toContain('height:400px');
    expect(html).toContain('padding:10px 6px 16px 6px');
    expect(html).toContain('<tr style="height:100%"><td');
  });

  it('prints a multi-line side label, centred, and regular-weight codes', () => {
    const block: RatingKeyBlock = { id: 'k1', type: 'ratingKey', scaleId: 'sk-progress', layout: 'vertical', sideLabel: 'EVALUATION\nKEY', sideStyle: { fontSize: 10.67 }, codeStyle: { fontWeight: 400 } };
    const [flow] = blockFlowables(block, ctxFor(sampleReportData('SK', 'progress_report')));
    const html = flow.kind === 'atomic' ? flow.html : '';
    expect(html).toContain('<span>EVALUATION<br>KEY</span>');
    expect(html).toMatch(/rk-vertical[^>]*font-size:10.67px;text-align:center/);
    expect(html).toContain('font-weight:400">E</td>');
  });
});

describe('built-in images', () => {
  it('serves known names from /report-assets and nothing else', () => {
    const data = jkData();
    expect(defaultResolveImage({ kind: 'builtin', name: 'jk-banner.jpg' }, data)).toBe('/report-assets/jk-banner.jpg');
    expect(defaultResolveImage({ kind: 'builtin', name: '../secret.png' }, data)).toBeNull();
    expect(isBuiltinImage('language.png')).toBe(true);
    expect(BUILTIN_IMAGES.every((b) => /^[a-z0-9-]+\.(png|jpg)$/.test(b.name))).toBe(true);
  });

  it('lists the built-in images a template uses', () => {
    const doc = defaultTemplate('progress-jk')!;
    expect(builtinImagesIn(doc).sort()).toEqual(
      ['arabic.png', 'cognitive.png', 'colours-shapes.png', 'emotional.png', 'fine-motor.png', 'gross-motor.png', 'islamic-studies.png', 'jk-banner.jpg', 'language.png', 'numbers.png', 'reading-writing.png'].sort(),
    );
    expect(builtinImagesIn(defaultTemplate('progress-sk'))).toEqual([]);
  });

  it('rejects unknown built-in names wherever an image goes', () => {
    const doc = defaultTemplate('progress-jk')!;
    doc.header.elements.push({ id: 'img99', type: 'image', x: 0, y: 0, w: 10, h: 10, src: { kind: 'builtin', name: 'nope.png' } });
    const sections = doc.blocks.find((b) => b.type === 'skillsTable') as SkillsTableBlock;
    sections.groupStyles = [...(sections.groupStyles ?? []), { match: 'X', icon: { kind: 'builtin', name: 'also-nope.png' } }];
    const errors = validateTemplate(doc).errors.join(' ');
    expect(errors).toMatch(/unknown built-in image "nope.png"/);
    expect(errors).toMatch(/unknown built-in image "also-nope.png"/);
  });
});

describe('merge filters for school details', () => {
  const scope = { meta: { schoolYear: '2026 - 2027', reportDate: '2026-11-13' }, school: { phone: '(416) 555-0100', address: '1 Main St, Toronto, ON M1M 1M1' } };
  it('chains filters left to right', () => {
    expect(mergeText('{{meta.reportDate|long|upper}}', scope)).toBe('NOVEMBER 13, 2026');
  });
  it('prints years, phones and addresses as the paper templates do', () => {
    expect(mergeText('{{meta.schoolYear|fullyear}} / {{meta.schoolYear|shortyear}}', scope)).toBe('2026-2027 / 2026-27');
    expect(mergeText('{{school.phone|phone}}', scope)).toBe('416-555-0100');
    expect(mergeText('{{school.address|shortaddress}}', scope)).toBe('1 Main St, Toronto, M1M 1M1');
    expect(mergeText('{{x|shortyear}}|{{x|phone}}', { x: 'Fall' })).toBe('Fall|Fall');
  });
});

describe('spacer rows', () => {
  it('never start a page', () => {
    const rows = [
      { height: 50 },
      { height: 40, keepWithNext: true, dropAtTop: true },
      { height: 30, keepWithNext: true },
      { height: 30 },
    ];
    const plan = planPages([{ kind: 'table', head: 0, chrome: 0, rows }], () => 100);
    // The gap + group (100) doesn't fit after the first row: the group moves, its gap is left out.
    expect(plan.pages.map((p) => p.fragments.map((f) => f.rows))).toEqual([[[0, 1]], [[2, 4]]]);
  });
});

describe('JK and SK progress defaults', () => {
  it('copy the paper templates: page size, blocks and the comment rows', () => {
    const jk = DEFAULT_TEMPLATES.find((d) => d.key === 'progress-jk')!.build();
    expect(jk.page.size).toBe('a4');
    expect(jk.blocks.map((b) => b.type)).toEqual(['canvas', 'table', 'table', 'skillsTable', 'table', 'table']);
    const json = JSON.stringify(jk);
    expect(json).toContain('{{comments.0.label}}');
    expect(json).toContain('{{comments.1.text}}');
    expect(json).toContain('Date: {{meta.reportDate|long|upper}}');
    expect(JK_SECTION_STYLES.find((s) => s.match === 'Arabic')).toMatchObject({ background: '#e6b8af', iconHeight: 24 });

    const sk = DEFAULT_TEMPLATES.find((d) => d.key === 'progress-sk')!.build();
    expect(sk.page.size).toBe('letter');
    expect(sk.firstHeader).toBeTruthy();
    const comments = sk.blocks.find((b) => b.type === 'commentsTable') as CommentsTableBlock;
    expect(comments).toMatchObject({ source: 'comments', breakBefore: true, commentLabel: 'Strengths/Next Steps for Improvement' });
    for (const doc of [jk, sk]) expect(JSON.stringify(doc)).not.toMatch(/Haadi|alhaadiacademy/i);
  });

  it('sample data carries each grade’s comment rows', () => {
    expect(sampleReportData('JK', 'progress_report').comments.map((c) => c.label)).toEqual(['Academic achievement', 'Socio-emotional development']);
    expect(sampleReportData('SK', 'progress_report').comments).toHaveLength(9);
    expect(sampleReportData('SK', 'report_card').comments).toEqual([]);
    expect(sampleReportData('JK', 'progress_report').skills.map((g) => g.name)).toContain('Gross Motor Skills');
  });
});
