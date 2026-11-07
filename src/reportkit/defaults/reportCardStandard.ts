import type { CanvasBlock, ColumnsBlock, SignaturesBlock, SubjectCardsBlock, TableBlock, TableCellDef, TableRowDef, TemplateDoc, TextBlock, TextStyle } from '../types';
import { HONOUR, MARGIN, WIDTH, honourHeading, honourKept, honourPageTop, honourSubjectBar, honourTitleBand } from './honourRoll';
import { SCALES } from './scales';
import { block, cell, cornerLogo, rect, resetIds, template, text, zone } from './kit';

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

const WORK_HABITS: Array<[string, string]> = [
  ['Needs Improvement', 'N'],
  ['Satisfactory', 'S'],
  ['Good', 'G'],
  ['Excellent', 'E'],
];

/**
 * The grades 1–8 report card and its First / Second / Final Term variant, in
 * the Honour Roll look (see honourRoll.ts): the school name, contact line and
 * "<TERM> REPORT CARD <year>" band, the student grid, the work-habits key and
 * the Ontario achievement chart on page one, then two subject cards per page
 * (mark, work habits, behaviour, teacher comments) and the principal's
 * signature / school stamp footer.
 *
 * Subjects always start on page two, so page one's length can't shift the
 * two-per-page pairs.
 */
export function reportCardStandardTemplate(variant: 'standard' | 't1t2final' = 'standard'): TemplateDoc {
  resetIds();
  const terms = variant === 't1t2final';
  const scale = SCALES.honourRoll;

  const firstHeader = zone(246, [
    cornerLogo(794, 190, 64),
    text(MARGIN, 120, WIDTH, 34, '{{school.name}}', { fontFamily: HONOUR.HEADING_FONT, fontSize: 24, fontWeight: 700, uppercase: true, letterSpacing: 2, color: HONOUR.NAVY, align: 'center', lineHeight: 1.3 }, { name: 'School name', overflow: 'shrink' }),
    text(MARGIN, 155, WIDTH, 16, '{{school.address}}[[ | {{school.phone}}]][[ | {{school.email}}]]', { fontSize: 11, color: HONOUR.GREY, align: 'center', lineHeight: 1.4 }, { name: 'Contact line' }),
    ...honourTitleBand(180, 33, terms ? 'FINAL TERM REPORT CARD {{meta.schoolYear}}' : '{{meta.termLabel}} REPORT CARD {{meta.schoolYear}}'),
  ]);

  // Student grid: label / value pairs between gold row lines, the name first read.
  const label = (t: string): TableCellDef => cell(t, { style: { fontWeight: 600, color: HONOUR.NAVY } });
  const nameRow = (oen: string, showWhen: TableRowDef['showWhen']): TableRowDef => ({
    showWhen,
    cells: [label('Name of Student:'), cell('{{student.name}}', { style: { fontFamily: HONOUR.HEADING_FONT, fontSize: 14, fontWeight: 700, color: HONOUR.NAVY } }), label('OEN:'), cell(oen)],
  });
  const studentGrid = block<TableBlock>({
    type: 'table',
    name: 'Student information',
    columns: [172, 252, 80, 154],
    rules: 'rows',
    borderWidth: 1,
    outerBorderWidth: 1,
    borderColor: HONOUR.GOLD_SOFT,
    cellPadding: 7.5,
    fontSize: 14.67,
    lineHeight: 1.35,
    verticalAlign: 'top',
    marginBottom: 22,
    rows: [
      nameRow('{{student.oen}}', { field: 'student.oen', op: 'notEmpty' }),
      nameRow('N/A', { field: 'student.oen', op: 'empty' }),
      { cells: [label('Days of Absence:'), cell('{{student.daysAbsent}}'), label('Grade:'), cell('{{student.grade}}')] },
      { cells: [label('Homeroom Teacher:'), cell('{{student.homeroomTeacher}}', { colSpan: 3 })] },
    ],
  });

  // Each rating in the colours its subject cards use, so a family learns them here.
  const workHabitsKey = block<TableBlock>({
    type: 'table',
    name: 'Work habits key',
    columns: [25, 25, 25, 25],
    borderColor: HONOUR.GOLD_SOFT,
    cellPadding: 9,
    fontSize: 13.33,
    lineHeight: 1.35,
    rows: [
      {
        cells: WORK_HABITS.map(([t, code]) => {
          const level = scale.levels.find((l) => l.code === code)!;
          return cell(code, {
            label: t,
            labelStyle: { fontFamily: HONOUR.TEXT_FONT, fontSize: 13.33, fontWeight: 400, color: HONOUR.INK },
            background: level.color,
            style: { fontFamily: HONOUR.HEADING_FONT, fontSize: 19, fontWeight: 700, color: level.textColor, align: 'center', lineHeight: 1.5 },
          });
        }),
      },
    ],
  });

  const center = { align: 'center' as const };
  const achievementChart = block<TableBlock>({
    type: 'table',
    name: 'Achievement chart',
    columns: [9.5, 11.5, 12, 67],
    borderColor: HONOUR.GOLD_SOFT,
    cellPadding: 5.6,
    fontSize: 13.33,
    lineHeight: 1.35,
    rows: [
      {
        height: 31,
        cells: ['Letter', 'Percent', 'Level', 'Description'].map((t) => cell(t, { background: HONOUR.GOLD_TINT, style: { ...center, fontWeight: 700, color: HONOUR.NAVY } })),
      },
      ...ACHIEVEMENT.flatMap((band, b) =>
        band.rows.map(([letter, percent], i) => ({
          cells: [
            cell(letter, { style: { ...center, fontWeight: 700, color: HONOUR.NAVY } }),
            cell(percent, { style: center }),
            ...(i === 0
              ? [
                  cell(band.level, { rowSpan: 3, background: HONOUR.LEVEL_TINTS[b], style: { ...center, fontFamily: HONOUR.HEADING_FONT, fontSize: 12.5, fontWeight: 700, color: HONOUR.NAVY } }),
                  cell(band.text, { rowSpan: 3, style: { fontSize: 12, lineHeight: 1.3 } }),
                ]
              : []),
          ],
        })),
      ),
    ],
  });

  const heading = (size: number): TextStyle => ({ fontFamily: HONOUR.HEADING_FONT, fontSize: size, fontWeight: 700 });
  const cards = block<SubjectCardsBlock>({
    type: 'subjectCards',
    name: 'Subjects',
    fields: [
      { key: 'mark', label: 'Grade', width: 1, style: { ...heading(terms ? 15 : 19), color: HONOUR.NAVY } },
      { key: 'workHabits', label: 'Work Habits', width: 1, style: heading(15) },
      { key: 'behaviour', label: 'Behaviour', width: 1, style: heading(15) },
    ],
    rows: terms ? 'terms' : 'current',
    showComment: true,
    commentLabel: 'Teacher Comments',
    emptyCommentText: 'No comments provided',
    emptyRatingText: '-',
    perPage: 2,
    cardGap: 44,
    groupPadding: 22,
    scaleId: scale.id,
    colorRatings: true,
    headerBar: honourSubjectBar(14.5),
    borderColor: HONOUR.GOLD_SOFT,
    borderWidth: 1,
    cellPadding: terms ? 7 : 9,
    fontSize: 13.33,
    lineHeight: 1.4,
    color: HONOUR.INK,
    cardStyle: {
      markHead: { fontSize: 12.5, fontWeight: 600, color: HONOUR.NAVY, align: 'center' },
      ...(terms ? { termCell: { fontSize: 12.5, fontWeight: 600, color: HONOUR.NAVY, align: 'center' as const }, finalRowBackground: HONOUR.GOLD_TINT } : {}),
      bodyPadding: 0,
      sectionRule: HONOUR.GOLD_SOFT,
      labelBar: { fontSize: 12.5, fontWeight: 700, color: HONOUR.NAVY, padding: 8, paddingX: 15 },
      // Tall enough to balance a page of short comments. The three-row term card
      // needs less: two cards and the footer must still share the last page.
      panel: { padding: 12, accentColor: HONOUR.GOLD, accentWidth: 3, minHeight: terms ? 100 : 170 },
      commentText: { fontSize: 13.33, lineHeight: 1.5 },
    },
  });

  const footer = block<ColumnsBlock>({
    type: 'columns',
    name: 'Footer',
    gap: 0,
    marginTop: 44,
    columns: [
      {
        width: 100,
        blocks: [
          block<CanvasBlock>({ type: 'canvas', name: 'Footer rule', height: 1, marginBottom: 15, elements: [rect(0, 0, WIDTH, 1, HONOUR.GOLD_SOFT)] }),
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
            style: { fontSize: 12, color: HONOUR.GREY, lineHeight: 1.4 },
          }),
          block<TextBlock>({
            type: 'text',
            name: 'Created on',
            marginTop: 15,
            text: 'Created on {{meta.generatedDate}}',
            style: { fontSize: 12, color: HONOUR.GREY, align: 'center', lineHeight: 1.4 },
          }),
        ],
      },
    ],
  });

  return template({
    docType: 'report_card',
    size: 'a4',
    margin: { left: MARGIN, right: MARGIN, top: 0, bottom: 0 },
    theme: { fontFamily: HONOUR.TEXT_FONT, fontSize: 14.67, color: HONOUR.INK, borderColor: HONOUR.GOLD_SOFT, accent: HONOUR.NAVY },
    scales: [scale],
    firstHeader,
    header: honourPageTop(),
    footer: zone(MARGIN, []),
    blocks: [
      studentGrid,
      honourKept('WORK HABITS & BEHAVIOUR', honourHeading('WORK HABITS & BEHAVIOUR', 250), workHabitsKey, 22),
      honourKept('ACHIEVEMENT OF THE CURRICULUM EXPECTATIONS', honourHeading('ACHIEVEMENT OF THE CURRICULUM EXPECTATIONS', 440), achievementChart, 0),
      honourHeading('Academic Achievement', 250, 18, 4, { breakBefore: true }),
      cards,
      footer,
    ],
  });
}
