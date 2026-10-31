import type { CanvasBlock, ColumnsBlock, SignaturesBlock, SubjectCardsBlock, TableBlock, TableCellDef, TableRowDef, TemplateDoc, TextBlock } from '../types';
import { SCALES } from './scales';
import { block, cell, logo, rect, resetIds, template, text, zone } from './kit';

const BLUE = '#2c5aa0';
const LIGHT_BLUE = '#d6e4f0';
const LIGHTER_BLUE = '#e8f0f8';
const PANEL = '#f8f9fa';
const LINE = '#cccccc';
const TEXT = '#333333';
const GREY_TEXT = '#666666';
/** A4 with the 18mm margins the legacy template's @page rule printed with. */
const MARGIN = 68;
const WIDTH = 794 - 2 * MARGIN;

/** The Ontario achievement chart, verbatim from the legacy card. */
const ACHIEVEMENT: Array<{ level: string; text: string; rows: Array<[string, string]> }> = [
  {
    level: 'Level 4',
    text: 'The student demonstrates capabilities beyond expectations for their level. Achievement surpasses the provincial standard.',
    rows: [
      ['A+', '90-100'],
      ['A', '85-89'],
      ['A-', '80-84'],
    ],
  },
  {
    level: 'Level 3',
    text: 'The student has demonstrated the required knowledge and skills with a high degree of effectiveness. Achievement surpasses the provincial standard.',
    rows: [
      ['B+', '77-79'],
      ['B', '73-76'],
      ['B-', '70-72'],
    ],
  },
  {
    level: 'Level 2',
    text: 'The student has demonstrated the required knowledge and skills with considerable effectiveness. Achievement meets the provincial standard.',
    rows: [
      ['C+', '67-69'],
      ['C', '63-66'],
      ['C-', '60-62'],
    ],
  },
  {
    level: 'Level 1',
    text: 'The student has demonstrated the required knowledge and skills with some effectiveness. Achievement approaches the provincial standard.',
    rows: [
      ['D+', '57-59'],
      ['D', '53-56'],
      ['D-', '50-52'],
    ],
  },
];

/**
 * A legend under its shaded, centred title box ("WORK HABITS & BEHAVIOUR"),
 * grouped so the title never ends a page without its table.
 */
function legend(label: string, widthPercent: number, table: TableBlock, marginBottom: number): ColumnsBlock {
  const title = block<TableBlock>({
    type: 'table',
    name: `${label} title`,
    columns: [100],
    borderColor: LINE,
    cellPadding: 8,
    fontSize: 16,
    lineHeight: 1.4,
    rows: [{ cells: [cell(label, { background: LIGHT_BLUE, style: { fontWeight: 700, align: 'center' } })] }],
  });
  const side = (100 - widthPercent) / 2;
  return block<ColumnsBlock>({
    type: 'columns',
    name: label,
    gap: 0,
    marginBottom,
    columns: [
      {
        width: 100,
        blocks: [
          block<ColumnsBlock>({
            type: 'columns',
            name: `${label} title row`,
            gap: 0,
            marginBottom: 15,
            columns: [
              { width: side, blocks: [] },
              { width: widthPercent, blocks: [title] },
              { width: side, blocks: [] },
            ],
          }),
          table,
        ],
      },
    ],
  });
}

/**
 * The grades 1–8 report card (legacy templates/reportCardTemplate.js) and its
 * First / Second / Final Term variant (templates/alHaadiT2ReportCardTemplate.js):
 * the school name, contact line and "<TERM> REPORT CARD <year>" box, the
 * student grid, the work-habits key and the Ontario achievement chart on page
 * one, then two subject cards per page (mark, work habits, behaviour, teacher
 * comments) and the principal's signature / school stamp footer.
 * Georgia → Source Serif 4 (the closest bundled serif in width).
 */
export function reportCardStandardTemplate(variant: 'standard' | 't1t2final' = 'standard'): TemplateDoc {
  resetIds();
  const terms = variant === 't1t2final';
  const scale = SCALES.egsn;

  const firstHeader = zone(243, [
    text(MARGIN, 68, WIDTH, 40, '{{school.name}}', { fontSize: 28, fontWeight: 700, uppercase: true, letterSpacing: 1, color: TEXT, align: 'center', lineHeight: 1.4 }, { name: 'School name' }),
    text(MARGIN, 112.2, WIDTH, 16, '{{school.address}}[[ | {{school.phone}}]][[ | {{school.email}}]]', { fontSize: 11, color: GREY_TEXT, align: 'center', lineHeight: 1.4 }, { name: 'Contact line' }),
    text(
      181,
      152.6,
      432,
      47,
      terms ? 'FINAL TERM REPORT CARD {{meta.schoolYear}}' : '{{meta.termLabel}} REPORT CARD {{meta.schoolYear}}',
      { fontSize: 18, fontWeight: 700, color: TEXT, align: 'center', verticalAlign: 'middle', lineHeight: 1.4 },
      { name: 'Title', box: { background: LIGHT_BLUE, borderColor: LINE, borderWidth: 1 }, overflow: 'shrink' },
    ),
    rect(MARGIN, 214.8, WIDTH, 3, BLUE),
    logo(626, 68, 100, 110),
  ]);

  // Student grid: two "label  value" columns inside a light border.
  const label = (t: string): TableCellDef => cell(t, { style: { fontWeight: 700 } });
  const nameRow = (oen: string, showWhen: TableRowDef['showWhen']): TableRowDef => ({
    showWhen,
    cells: [cell(''), label('Name of Student:'), cell('{{student.name}}'), cell(''), label('OEN:'), cell(oen), cell('')],
  });
  const studentGrid = block<TableBlock>({
    type: 'table',
    name: 'Student information',
    columns: [13, 166, 122, 40, 166, 138, 13],
    borderWidth: 0,
    outerBorderWidth: 1,
    borderColor: LINE,
    cellPadding: 5,
    fontSize: 14.67,
    lineHeight: 1.4,
    verticalAlign: 'top',
    marginBottom: 20,
    rows: [
      { height: 10, cells: [cell('', { colSpan: 7 })] },
      nameRow('{{student.oen}}', { field: 'student.oen', op: 'notEmpty' }),
      nameRow('N/A', { field: 'student.oen', op: 'empty' }),
      { cells: [cell(''), label('Days of Absence:'), cell('{{student.daysAbsent}}'), cell(''), label('Grade:'), cell('{{student.grade}}'), cell('')] },
      { cells: [cell(''), label('Homeroom Teacher:'), cell('{{student.homeroomTeacher}}', { colSpan: 4 }), cell('')] },
      { height: 10, cells: [cell('', { colSpan: 7 })] },
    ],
  });

  const center = { align: 'center' as const };
  const workHabitsKey = block<TableBlock>({
    type: 'table',
    name: 'Work habits key',
    columns: [38.3, 25.1, 15.3, 21.3],
    borderColor: LINE,
    cellPadding: 10,
    fontSize: 14.67,
    lineHeight: 1.4,
    rows: [
      { cells: ['Needs Improvement', 'Satisfactory', 'Good', 'Excellent'].map((t) => cell(t, { style: center })) },
      { cells: ['N', 'S', 'G', 'E'].map((t) => cell(t, { style: { ...center, fontWeight: 700, fontSize: 18.67 } })) },
    ],
  });

  const achievementChart = block<TableBlock>({
    type: 'table',
    name: 'Achievement chart',
    columns: [10.3, 11.9, 10.7, 67.1],
    borderColor: LINE,
    cellPadding: 6,
    fontSize: 13.33,
    lineHeight: 1.4,
    rows: [
      {
        height: 35,
        cells: ['Letter', 'Percent', 'Level', 'Description'].map((t) => cell(t, { background: PANEL, style: { ...center, fontWeight: 700 } })),
      },
      ...ACHIEVEMENT.flatMap((band) =>
        band.rows.map(([letter, percent], i) => ({
          cells: [
            cell(letter, { style: center }),
            cell(percent, { style: center }),
            ...(i === 0
              ? [
                  cell(band.level, { rowSpan: 3, background: LIGHTER_BLUE, style: { ...center, fontWeight: 700 } }),
                  cell(band.text, { rowSpan: 3, style: { fontSize: 12, lineHeight: 1.3 } }),
                ]
              : []),
          ],
        })),
      ),
    ],
  });

  const sectionTitle = block<CanvasBlock>({
    type: 'canvas',
    name: 'Academic Achievement',
    height: 33.1,
    marginBottom: 15,
    elements: [
      text(0, 0, WIDTH, 27, 'Academic Achievement', { fontSize: 18.67, fontWeight: 700, color: BLUE, lineHeight: 1.4 }),
      rect(0, 31.1, WIDTH, 2, BLUE),
    ],
  });

  const habit = { fontSize: 16 };
  const cards = block<SubjectCardsBlock>({
    type: 'subjectCards',
    name: 'Subjects',
    fields: [
      { key: 'mark', label: 'Grade', width: 1, style: { fontSize: terms ? 17.33 : 18.67, fontWeight: 700, color: BLUE } },
      { key: 'workHabits', label: 'Work Habits', width: 1, style: habit },
      { key: 'behaviour', label: 'Behaviour', width: 1, style: habit },
    ],
    rows: terms ? 'terms' : 'current',
    showComment: true,
    commentLabel: 'Teacher Comments',
    emptyCommentText: 'No comments provided',
    emptyRatingText: '-',
    perPage: 2,
    cardGap: 50,
    groupPadding: 30,
    scaleId: scale.id,
    colorRatings: false,
    headerBar: { background: BLUE, color: '#ffffff', fontSize: 16, fontWeight: 700, padding: 10, paddingX: 15 },
    borderColor: LINE,
    borderWidth: 1,
    cellPadding: terms ? 8 : 11,
    fontSize: 13.33,
    lineHeight: 1.4,
    color: TEXT,
    cardStyle: {
      radius: 5,
      markHead: { background: PANEL, fontSize: 13.33, fontWeight: 700, align: 'center' },
      ...(terms ? { termCell: { background: PANEL, fontSize: 13.33, fontWeight: 700, align: 'center' as const }, finalRowBackground: LIGHTER_BLUE } : {}),
      bodyPadding: 0,
      sectionRule: LINE,
      labelBar: { background: PANEL, fontSize: 13.33, fontWeight: 700, padding: 8, paddingX: 15 },
      panel: { padding: 12, accentColor: BLUE, accentWidth: 4, minHeight: 50 },
      commentText: { fontSize: 13.33, lineHeight: 1.5 },
    },
  });

  const footer = block<ColumnsBlock>({
    type: 'columns',
    name: 'Footer',
    gap: 0,
    marginTop: 50,
    columns: [
      {
        width: 100,
        blocks: [
          block<CanvasBlock>({ type: 'canvas', name: 'Footer rule', height: 1, marginBottom: 15, elements: [rect(0, 0, WIDTH, 1, LINE)] }),
          block<SignaturesBlock>({
            type: 'signatures',
            name: 'Signature and stamp',
            showWhen: {
              op: 'or',
              conditions: [
                { field: 'assets.principalSignature', op: 'notEmpty' },
                { field: 'assets.stamp', op: 'notEmpty' },
              ],
            },
            marginTop: 15,
            marginBottom: 15,
            slots: [
              { label: "Principal's Signature", image: { kind: 'asset', asset: 'principalSignature' } },
              { label: 'School Stamp', image: { kind: 'asset', asset: 'stamp' } },
            ],
            imageHeight: 55,
            lineWidth: 150,
            style: { fontSize: 12, color: GREY_TEXT, lineHeight: 1.4 },
          }),
          block<TextBlock>({
            type: 'text',
            name: 'Created on',
            marginTop: 15,
            text: 'Created on {{meta.generatedDate}}',
            style: { fontSize: 12, color: '#888888', align: 'center', lineHeight: 1.4 },
          }),
        ],
      },
    ],
  });

  return template({
    docType: 'report_card',
    size: 'a4',
    margin: { left: MARGIN, right: MARGIN, top: 0, bottom: 0 },
    theme: { fontFamily: 'Source Serif 4', fontSize: 14.67, color: TEXT, borderColor: LINE, accent: BLUE },
    scales: [scale],
    firstHeader,
    header: zone(MARGIN, []),
    footer: zone(MARGIN, []),
    blocks: [
      studentGrid,
      legend('WORK HABITS & BEHAVIOUR', 45.6, workHabitsKey, 20),
      legend('ACHIEVEMENT OF THE CURRICULUM EXPECTATIONS', 77.8, achievementChart, 25),
      sectionTitle,
      cards,
      footer,
    ],
  });
}
