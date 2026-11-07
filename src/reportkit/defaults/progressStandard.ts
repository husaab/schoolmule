import type { CanvasBlock, ColumnsBlock, SignaturesBlock, SubjectCardsBlock, TableBlock, TableCellDef, TemplateDoc, TextBlock, TextStyle } from '../types';
import { HONOUR, MARGIN, WIDTH, honourHeading, honourKept, honourPageTop, honourSubjectBar, honourTitleBand } from './honourRoll';
import { SCALES } from './scales';
import { block, cell, cornerLogo, rect, resetIds, template, text, zone } from './kit';

/**
 * The grades 1–8 progress report in the Honour Roll look (see honourRoll.ts):
 * the logo in the page's corner, the centred school name, the title band, the student grid, the
 * E/G/S/N assessment scale, then one card per subject (work habits, behaviour
 * and overall as tiles, core standards, the teacher's comment) and a footer
 * with the principal's signature and the school stamp.
 */
export function progressStandardTemplate(): TemplateDoc {
  resetIds();
  const scale = SCALES.honourRoll;

  const center = { align: 'center' as const, lineHeight: 1.4 };
  const firstHeader = zone(246, [
    cornerLogo(794, 190, 64),
    text(MARGIN, 108, WIDTH, 32, '{{school.name}}', { fontFamily: HONOUR.HEADING_FONT, fontSize: 22, fontWeight: 700, color: HONOUR.NAVY, align: 'center', lineHeight: 1.3 }, { name: 'School name', overflow: 'shrink' }),
    text(MARGIN, 141, WIDTH, 16, '{{school.address}}', { ...center, fontSize: 11.5, color: HONOUR.GREY }, { name: 'Address' }),
    text(MARGIN, 157, WIDTH, 16, '[[Phone: {{school.phone}}]][[ | Email: {{school.email}}]]', { ...center, fontSize: 11.5, color: HONOUR.GREY }, {
      name: 'Phone and email',
      showWhen: { op: 'or', conditions: [{ field: 'school.phone', op: 'notEmpty' }, { field: 'school.email', op: 'notEmpty' }] },
    }),
    ...honourTitleBand(181, 31, 'STUDENT PROGRESS REPORT'),
  ]);

  // Student grid: label / value pairs between gold row lines, the name first read.
  const label = (t: string): TableCellDef => cell(t, { style: { fontWeight: 600, color: HONOUR.NAVY } });
  const studentBox = block<TableBlock>({
    type: 'table',
    name: 'Student information',
    columns: [122, 222, 164, 150],
    rules: 'rows',
    borderWidth: 1,
    outerBorderWidth: 1,
    borderColor: HONOUR.GOLD_SOFT,
    cellPadding: 5.5,
    fontSize: 14.67,
    lineHeight: 1.35,
    verticalAlign: 'top',
    marginBottom: 18,
    rows: [
      { cells: [label('Student Name:'), cell('{{student.name}}', { style: { fontFamily: HONOUR.HEADING_FONT, fontSize: 14, fontWeight: 700, color: HONOUR.NAVY } }), label('Term:'), cell('{{meta.term}}')] },
      { cells: [label('Grade:'), cell('{{student.grade}}'), label('Homeroom Teacher:'), cell('{{student.homeroomTeacher}}')] },
      {
        showWhen: { field: 'student.oen', op: 'notEmpty' },
        cells: [cell(''), cell(''), label('OEN:'), cell('{{student.oen}}')],
      },
    ],
  });

  // "Assessment Scale": each rating in the colours its subject cards use.
  const chip = (code: 'E' | 'G' | 'S' | 'N'): TableCellDef[] => {
    const level = scale.levels.find((l) => l.code === code)!;
    return [
      cell(code, { background: level.color, style: { fontFamily: HONOUR.HEADING_FONT, fontSize: 13, fontWeight: 700, color: level.textColor, align: 'center' } }),
      cell(level.label, { style: { fontSize: 13 } }),
    ];
  };
  const scaleKey = block<TableBlock>({
    type: 'table',
    name: 'Assessment scale key',
    columns: [30, 118, 30, 88, 30, 124, 30, 208],
    borderWidth: 0,
    outerBorderWidth: 1,
    borderColor: HONOUR.GOLD_SOFT,
    cellPadding: 7,
    fontSize: 13,
    lineHeight: 1.3,
    rows: [{ cells: [...chip('E'), ...chip('G'), ...chip('S'), ...chip('N')] }],
  });

  const rating: TextStyle = { fontFamily: HONOUR.HEADING_FONT, fontSize: 16, fontWeight: 700 };
  const cards = block<SubjectCardsBlock>({
    type: 'subjectCards',
    name: 'Subjects',
    fields: [
      { key: 'workHabits', label: 'Work Habits', width: 1, style: rating },
      { key: 'behaviour', label: 'Behavior', width: 1, style: rating },
      { key: 'overall', label: 'Overall', width: 1, style: rating },
    ],
    rows: 'current',
    showTeacher: true,
    showCoreStandards: true,
    coreStandardsLabel: 'Core Standards Progress:',
    showComment: true,
    commentLabel: 'Teacher Comments:',
    hideEmptyComment: true,
    emptyRatingText: 'Not Assessed',
    scaleId: scale.id,
    colorRatings: true,
    headerBar: honourSubjectBar(13.5),
    cardGap: 20,
    borderColor: HONOUR.GOLD_SOFT,
    borderWidth: 1,
    fontSize: 14.5,
    lineHeight: 1.4,
    color: HONOUR.INK,
    cardStyle: {
      markLayout: 'tiles',
      tile: { padding: 6, paddingX: 10 },
      markHead: { fontSize: 12, fontWeight: 600, color: HONOUR.NAVY },
      bodyPadding: 15,
      sectionRule: HONOUR.GOLD_SOFT,
      label: { fontSize: 13.5, fontWeight: 700, color: HONOUR.NAVY, lineHeight: 1.71 },
      panel: { padding: 9, accentColor: HONOUR.GOLD, accentWidth: 3 },
      commentPanel: { padding: 10, accentColor: HONOUR.GOLD, accentWidth: 3, minHeight: 60 },
      commentText: { italic: true, lineHeight: 1.45 },
      emptyRating: { background: HONOUR.GOLD_TINT, color: HONOUR.GREY },
    },
  });

  // Footer kept in one piece: rule, signature + stamp (when the school has
  // them), the date and the closing line.
  const footer = block<ColumnsBlock>({
    type: 'columns',
    name: 'Footer',
    gap: 0,
    marginTop: 34,
    columns: [
      {
        width: 100,
        blocks: [
          block<CanvasBlock>({ type: 'canvas', name: 'Footer rule', height: 1, marginBottom: 20, elements: [rect(0, 0, WIDTH, 1, HONOUR.GOLD_SOFT)] }),
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
            marginTop: 40,
            slots: [
              { label: 'Principal Signature', image: { kind: 'asset', asset: 'principalSignature' } },
              { label: '', image: { kind: 'asset', asset: 'stamp' }, showLine: false },
            ],
            imageHeight: 60,
            lineWidth: 289,
            style: { fontSize: 11, color: HONOUR.GREY, lineHeight: 1.4 },
          }),
          block<TextBlock>({
            type: 'text',
            name: 'Created on',
            text: 'Created on {{meta.generatedDate|long}}',
            style: { fontSize: 12, color: HONOUR.GREY, align: 'center', lineHeight: 1.4 },
          }),
          block<TextBlock>({
            type: 'text',
            name: 'Closing line',
            marginTop: 5,
            text: "This progress report provides an overview of the student's current academic and behavioral progress.",
            style: { fontSize: 12, color: HONOUR.GREY, align: 'center', lineHeight: 1.4 },
          }),
        ],
      },
    ],
  });

  return template({
    docType: 'progress_report',
    size: 'a4',
    margin: { left: MARGIN, right: MARGIN, top: 0, bottom: 0 },
    theme: { fontFamily: HONOUR.TEXT_FONT, fontSize: 14.67, color: HONOUR.INK, borderColor: HONOUR.GOLD_SOFT, accent: HONOUR.NAVY },
    scales: [scale],
    firstHeader,
    header: honourPageTop(),
    footer: zone(MARGIN, []),
    blocks: [
      studentBox,
      honourKept('Assessment Scale', honourHeading('Assessment Scale', 170, 12.5, 8), scaleKey, 22),
      honourHeading('Progress by Subject', 190, 15, 8),
      cards,
      footer,
    ],
  });
}
