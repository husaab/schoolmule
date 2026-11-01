import type { CanvasBlock, SkillGroupStyle, SkillsTableBlock, TableBlock, TemplateDoc } from '../types';
import { SCALES } from './scales';
import { block, cell, id, logo, resetIds, template, text, zone } from './kit';

const PINK = '#f4cccc';
const GREEN = '#b6d7a8';
const NAVY = '#17407a';

// A4, as printed by schoolmule-backend templates/alHaadiProgressReportJKTemplate.js
// (CSS px; 1pt = 4/3 px): 0.5in sides, 0.86in top, 1.11in bottom, which
// Chrome rounds down to whole points (36pt, 61pt, 79pt).
const SIDE = 48;
const TOP = 81.33;
const BOTTOM = 105.33;
const WIDTH = 794;
const CONTENT = WIDTH - 2 * SIDE;
// Where Chrome prints a header/footer template: 20.7px in from the page edge.
const CHROME_EDGE = 20.7;

const icon = (name: string) => ({ kind: 'builtin' as const, name });

/** Each section's colour and icon on the paper template (unknown sections cycle FALLBACK_COLORS). */
export const JK_SECTION_STYLES: SkillGroupStyle[] = [
  { match: 'Language and Communication Skills', background: '#c9daf8', icon: icon('language.png') },
  { match: 'Social Skills', background: '#d9ead3' },
  { match: 'Emotional Development', background: '#e6b8af', icon: icon('emotional.png') },
  { match: 'Reading and Writing Skills', background: '#fce5cd', icon: icon('reading-writing.png') },
  { match: 'Colours and Shapes', background: '#ead1dc', icon: icon('colours-shapes.png') },
  { match: 'Colors and Shapes', background: '#ead1dc', icon: icon('colours-shapes.png') },
  { match: 'Numbers', background: '#cfe2f3', icon: icon('numbers.png') },
  { match: 'Fine Motor Skills', background: '#d9d2e9', icon: icon('fine-motor.png') },
  { match: 'Gross Motor Skills', background: '#d0e0e3', icon: icon('gross-motor.png') },
  { match: 'Cognitive Development', background: '#fce5cd', icon: icon('cognitive.png') },
  { match: 'Arabic', background: '#e6b8af', icon: icon('arabic.png'), iconHeight: 24 },
  { match: 'Islamic Studies', background: '#d9ead3', icon: icon('islamic-studies.png') },
];
const FALLBACK_COLORS = ['#c9daf8', '#d9ead3', '#fce5cd', '#ead1dc', '#cfe2f3', '#d9d2e9'];

/**
 * The JK progress report on Al Haadi's paper layout (A4, Mulish, black-ruled
 * tables): the yellow banner, the pink student grid, the green "Learning
 * Skills" key, one coloured table per skill section with its icon, then on a
 * new page the Teacher's Comments (academic achievement, socio-emotional
 * development), the signatures, the date and the school stamp. The logo sits
 * top right and the school's address in the footer of every page.
 */
export function jkProgressTemplate(): TemplateDoc {
  resetIds();
  const scale = SCALES.jkProgress;

  const header = zone(TOP, [logo(WIDTH - 33.33 - 146.67, CHROME_EDGE + 11.4, 146.67, 45.33, { align: 'right' })]);
  // Bottom-aligned 20.7px above the page edge, as Chrome prints the footer.
  const footerTop = BOTTOM - CHROME_EDGE - 54.4;
  const footer = zone(BOTTOM, [
    text(
      49.33,
      footerTop,
      560,
      54.4,
      '{{school.name}}\n{{school.address|shortaddress}}[[ | {{school.phone|phone}}]][[ | {{school.website}}]]\n[[{{meta.schoolYear|fullyear}} All Rights Reserved]]',
      { fontSize: 10.67, fontWeight: 700, color: NAVY, lineHeight: 1.7 },
      { name: 'School address' },
    ),
    text(WIDTH - 68 - 60, footerTop, 60, 18.13, '{{page.number}}', { fontSize: 10.67, fontWeight: 700, color: NAVY, lineHeight: 1.7, align: 'right' }, { name: 'Page number' }),
  ]);

  const banner = block<CanvasBlock>({
    type: 'canvas',
    name: 'Banner',
    height: 176,
    elements: [
      {
        id: id('img'),
        name: 'Banner',
        type: 'image',
        x: 0,
        y: 0,
        w: CONTENT,
        h: 176,
        src: { kind: 'builtin', name: 'jk-banner.jpg' },
        fit: 'fill',
        box: { borderWidth: 1, borderColor: '#000000' },
      },
    ],
  });

  const center600 = { fontWeight: 600 as const, align: 'center' as const };
  const pink = (value: string, extra: Parameters<typeof cell>[1] = {}) =>
    cell(value, { background: PINK, style: center600, padding: { top: 8, right: 5.33, bottom: 8, left: 5.33 }, ...extra });
  const studentGrid = block<TableBlock>({
    type: 'table',
    name: 'Student information',
    columns: [43.4, 21.3, 35.3],
    borderWidth: 1,
    cellPadding: 8,
    fontSize: 13.33,
    lineHeight: 1.45,
    verticalAlign: 'top',
    marginTop: 24,
    rows: [
      {
        height: 53.33,
        cells: [
          pink('Name of Student:\n{{student.name}}'),
          pink('Teacher: {{student.homeroomTeacher}}[[\nTeacher Assistant: {{student.teacherAssistant}}]]', { colSpan: 2 }),
        ],
      },
      {
        height: 72,
        cells: [pink('Days of absence\n{{student.daysAbsent}}'), pink('School\n{{school.name}}'), pink('OEN:\n{{student.oen}}')],
      },
    ],
  });

  const legend = block<TableBlock>({
    type: 'table',
    name: 'Learning skills key',
    columns: [11, 89],
    borderWidth: 1,
    cellPadding: 4,
    verticalAlign: 'top',
    marginTop: 32,
    rows: [
      {
        cells: [
          cell('Learning Skills', { background: GREEN, style: { fontWeight: 600, fontSize: 13.33, lineHeight: 1.35 } }),
          cell(
            [
              '**D - Developing:** Children can apply the skill or concept correctly.',
              '**B - Beginning:** Children show some understanding. Reminders, hints, or support may be needed.',
              '**I - Improvement needed:** Children are experiencing difficulty with the concept or skill. Assistance at home is needed.',
              '**N - Not Assessed:** Not assessed at this time',
            ].join('\n'),
            { background: GREEN, style: { fontSize: 12.67, lineHeight: 1.51 } },
          ),
        ],
      },
    ],
  });

  const sections = block<SkillsTableBlock>({
    type: 'skillsTable',
    name: 'Skill sections',
    columns: [
      { key: 'name', label: 'Skill', width: 79 },
      { key: 'rating', label: 'Rating', width: 21, align: 'center', style: { fontWeight: 600 } },
    ],
    groupBar: { background: '#c9daf8', align: 'left', fontSize: 14.67, fontWeight: 700, padding: 0, paddingX: 6.67, height: 42.67 },
    groupBarColumns: true,
    groupStyles: JK_SECTION_STYLES.map((s) => ({ ...s, iconHeight: s.iconHeight ?? 29.33 })),
    fallbackGroupColors: FALLBACK_COLORS,
    groupGap: 38.67,
    keepGroupsTogether: true,
    rowHeight: 33.33,
    scaleId: scale.id,
    borderWidth: 1,
    cellPadding: 4.67,
    fontSize: 14,
    marginTop: 37.33,
  });

  // One bordered box, at least 430pt tall (the space below the last comment):
  // the heading, then each comment row's label (underlined) over its text.
  const pad = (top: number, bottom: number) => ({ top, right: 6.67, bottom, left: 6.67 });
  const commentBox = block<TableBlock>({
    type: 'table',
    name: "Teacher's comments",
    breakBefore: true,
    columns: [100],
    borderWidth: 0,
    outerBorderWidth: 1,
    verticalAlign: 'top',
    minHeight: 573.33,
    rows: [
      { cells: [cell("Teacher's Comments:", { style: { fontWeight: 700, fontSize: 13.33 }, padding: pad(9.4, 16) })] },
      { cells: [cell('{{comments.0.label}}:', { style: { fontSize: 13.33, underline: true }, padding: pad(0, 16) })] },
      { cells: [cell('{{comments.0.text}}', { style: { fontSize: 16, lineHeight: 1.45 }, padding: pad(0, 18.67) })] },
      { cells: [cell('{{comments.1.label}}:', { style: { fontSize: 13.33, underline: true }, padding: pad(0, 16) })] },
      { cells: [cell('{{comments.1.text}}', { style: { fontSize: 16, lineHeight: 1.45 }, padding: pad(0, 37.33) })] },
    ],
  });

  // Two rows of "label + signature" pairs, then the stamp. Legacy cells are
  // flex rows: a 120 × 45px signature box 16px after its label.
  const label = (value: string) => cell(value, { style: { fontWeight: 700, fontSize: 14 }, padding: { top: 0, right: 0, bottom: 0, left: 0 } });
  const blank = () => label('');
  const signoff = block<TableBlock>({
    type: 'table',
    name: 'Signatures and stamp',
    columns: [22.45, 17.19, 10.36, 50],
    borderWidth: 0,
    outerBorderWidth: 0,
    cellPadding: 0,
    marginTop: 29.33,
    rows: [
      {
        height: 53.33,
        showWhen: { field: 'student.teacherAssistant', op: 'notEmpty' },
        cells: [label("Teacher's Signature:"), blank(), blank(), label("Teacher Assistant's Signature:")],
      },
      {
        height: 53.33,
        showWhen: { field: 'student.teacherAssistant', op: 'empty' },
        cells: [label("Teacher's Signature:"), blank(), blank(), blank()],
      },
      {
        height: 53.33,
        cells: [
          label("Principal's Signature:"),
          { image: { kind: 'asset', asset: 'principalSignature' }, imageHeight: 45.33, style: { align: 'center' }, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
          blank(),
          label('Date: {{meta.reportDate|long|upper}}'),
        ],
      },
      {
        showWhen: { field: 'assets.stamp', op: 'notEmpty' },
        cells: [{ image: { kind: 'asset', asset: 'stamp' }, imageHeight: 128, colSpan: 4, style: { align: 'center' }, padding: { top: 10.67, right: 0, bottom: 0, left: 0 } }],
      },
    ],
  });

  return template({
    docType: 'progress_report',
    size: 'a4',
    margin: { left: SIDE, right: SIDE, top: 0, bottom: 0 },
    theme: { fontFamily: 'Mulish', fontSize: 14, color: '#000000' },
    scales: [scale],
    header,
    footer,
    blocks: [banner, studentGrid, legend, sections, commentBox, signoff],
  });
}
