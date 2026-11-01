import type { CanvasBlock, ColumnsBlock, SignaturesBlock, SubjectCardsBlock, TableBlock, TableCellDef, TemplateDoc, TextBlock } from '../types';
import { SCALES } from './scales';
import { block, cell, logo, rect, resetIds, template, text, zone } from './kit';

const BLUE = '#2c5aa0';
const PANEL = '#f8f9fa';
const LINE = '#dddddd';
const GREY_TEXT = '#666666';
/** A4 with the 18mm margins the legacy template's @page rule printed with. */
const MARGIN = 68;
const WIDTH = 794 - 2 * MARGIN;

/**
 * The grades 1–8 progress report (legacy templates/progressReportTemplate.js):
 * centred blue school header with the logo in the corner, a grey student box,
 * the E/G/S/N assessment scale, then one card per subject — work habits,
 * behaviour and overall as coloured tiles, core standards, the teacher's
 * comment — and a footer with the principal's signature and the school stamp.
 * Times New Roman → Tinos (same metrics).
 */
export function progressStandardTemplate(): TemplateDoc {
  resetIds();
  const scale = SCALES.egsnProgress;

  const header = { fontFamily: 'Tinos', align: 'center' as const, lineHeight: 1.4 };
  const firstHeader = zone(261, [
    text(MARGIN, 68, WIDTH, 34, '{{school.name}}', { ...header, fontSize: 24, fontWeight: 700, color: BLUE }, { name: 'School name' }),
    text(MARGIN, 106.6, WIDTH, 17, '{{school.address}}', { ...header, fontSize: 12, color: GREY_TEXT }, { name: 'Address' }),
    text(MARGIN, 138.4, WIDTH, 17, '[[Phone: {{school.phone}}]][[ | Email: {{school.email}}]]', { ...header, fontSize: 12, color: GREY_TEXT }, {
      name: 'Phone and email',
      showWhen: { op: 'or', conditions: [{ field: 'school.phone', op: 'notEmpty' }, { field: 'school.email', op: 'notEmpty' }] },
    }),
    text(MARGIN, 170.2, WIDTH, 28, 'STUDENT PROGRESS REPORT', { ...header, fontSize: 20, fontWeight: 700, color: BLUE }, { name: 'Title' }),
    rect(MARGIN, 228.2, WIDTH, 3, BLUE),
    logo(575, 60, 140, 90),
  ]);

  // Grey student box: two columns of "label …… value" (values right-aligned).
  const label = (t: string): TableCellDef => cell(t, { background: PANEL, style: { fontWeight: 700, color: BLUE } });
  const value = (t: string): TableCellDef => cell(t, { background: PANEL, style: { align: 'right' } });
  const blank = (): TableCellDef => cell('', { background: PANEL });
  const studentBox = block<TableBlock>({
    type: 'table',
    name: 'Student information',
    columns: [10, 130, 188, 3, 160, 158, 9],
    borderWidth: 0,
    outerBorderWidth: 1,
    borderColor: LINE,
    cellPadding: 4,
    fontSize: 16,
    lineHeight: 1.4,
    marginBottom: 25,
    rows: [
      { height: 11, cells: [cell('', { colSpan: 7, background: PANEL })] },
      { cells: [blank(), label('Student Name:'), value('{{student.name}}'), blank(), label('Term:'), value('{{meta.term}}'), blank()] },
      { cells: [blank(), label('Grade:'), value('{{student.grade}}'), blank(), label('Homeroom Teacher:'), value('{{student.homeroomTeacher}}'), blank()] },
      {
        showWhen: { field: 'student.oen', op: 'notEmpty' },
        cells: [blank(), blank(), blank(), blank(), label('OEN:'), value('{{student.oen}}'), blank()],
      },
      { height: 19, cells: [cell('', { colSpan: 7, background: PANEL })] },
    ],
  });

  // "Assessment Scale": a 2 × 2 grid of coloured letter chips.
  const chip = (code: 'E' | 'G' | 'S' | 'N'): TableCellDef => {
    const level = scale.levels.find((l) => l.code === code)!;
    return cell(code, { background: level.color, style: { fontSize: 10, fontWeight: 700, color: level.textColor, align: 'center' } });
  };
  const chipLabel = (t: string): TableCellDef => cell(t, { background: PANEL, style: { fontSize: 12 } });
  const scaleKey = block<TableBlock>({
    type: 'table',
    name: 'Assessment scale',
    columns: [16, 20, 8, 280, 10, 20, 8, 280, 16],
    borderWidth: 0,
    outerBorderWidth: 1,
    borderColor: LINE,
    cellPadding: 0,
    fontSize: 16,
    lineHeight: 1.4,
    marginBottom: 20,
    rows: [
      { height: 15, cells: [cell('', { colSpan: 9, background: PANEL })] },
      {
        height: 32.4,
        cells: [blank(), cell('Assessment Scale', { colSpan: 7, background: PANEL, style: { fontWeight: 700, color: BLUE, verticalAlign: 'top' } }), blank()],
      },
      { height: 20, cells: [blank(), chip('E'), blank(), chipLabel('Excellent'), blank(), chip('G'), blank(), chipLabel('Good'), blank()] },
      { height: 10, cells: [cell('', { colSpan: 9, background: PANEL })] },
      { height: 20, cells: [blank(), chip('S'), blank(), chipLabel('Satisfactory'), blank(), chip('N'), blank(), chipLabel('Needs Improvement'), blank()] },
      { height: 15, cells: [cell('', { colSpan: 9, background: PANEL })] },
    ],
  });

  const sectionTitle = block<CanvasBlock>({
    type: 'canvas',
    name: 'Progress by Subject',
    height: 29.4,
    marginBottom: 15,
    elements: [
      text(0, 0, WIDTH, 23, 'Progress by Subject', { fontSize: 16, fontWeight: 700, color: BLUE, lineHeight: 1.4 }),
      rect(0, 27.4, WIDTH, 2, BLUE),
    ],
  });

  const rating = { fontSize: 18, fontWeight: 700 as const };
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
    headerBar: { background: BLUE, color: '#ffffff', fontSize: 14, fontWeight: 700, padding: 10, paddingX: 15 },
    cardGap: 20,
    borderColor: LINE,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 1.4,
    cardStyle: {
      radius: 5,
      markLayout: 'tiles',
      markHead: { fontSize: 12, fontWeight: 700, color: GREY_TEXT },
      bodyPadding: 15,
      sectionRule: '#eeeeee',
      label: { fontWeight: 700, color: BLUE, lineHeight: 1.71 },
      panel: { background: PANEL, borderRadius: 3, padding: 9, accentColor: BLUE, accentWidth: 4 },
      commentPanel: { background: PANEL, borderRadius: 3, padding: 10, accentColor: BLUE, accentWidth: 4, minHeight: 60 },
      commentText: { italic: true },
      emptyRating: { background: PANEL, color: '#6c757d' },
    },
  });

  // Footer kept in one piece: rule, signature + stamp (when the school has
  // them), the date and the closing line.
  const footer = block<ColumnsBlock>({
    type: 'columns',
    name: 'Footer',
    gap: 0,
    marginTop: 40,
    columns: [
      {
        width: 100,
        blocks: [
          block<CanvasBlock>({ type: 'canvas', name: 'Footer rule', height: 1, marginBottom: 20, elements: [rect(0, 0, WIDTH, 1, LINE)] }),
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
            marginTop: 50,
            slots: [
              { label: 'Principal Signature', image: { kind: 'asset', asset: 'principalSignature' } },
              { label: '', image: { kind: 'asset', asset: 'stamp' }, showLine: false },
            ],
            imageHeight: 60,
            lineWidth: 289,
            style: { fontSize: 11, color: GREY_TEXT, lineHeight: 1.4 },
          }),
          block<TextBlock>({
            type: 'text',
            name: 'Created on',
            text: 'Created on {{meta.generatedDate|long}}',
            style: { fontSize: 12, color: GREY_TEXT, align: 'center', lineHeight: 1.4 },
          }),
          block<TextBlock>({
            type: 'text',
            name: 'Closing line',
            marginTop: 5,
            text: "This progress report provides an overview of the student's current academic and behavioral progress.",
            style: { fontSize: 12, color: GREY_TEXT, align: 'center', lineHeight: 1.4 },
          }),
        ],
      },
    ],
  });

  return template({
    docType: 'progress_report',
    size: 'a4',
    margin: { left: MARGIN, right: MARGIN, top: 0, bottom: 0 },
    theme: { fontFamily: 'Tinos', fontSize: 16, color: '#333333', borderColor: LINE, accent: BLUE },
    scales: [scale],
    firstHeader,
    header: zone(MARGIN, []),
    footer: zone(MARGIN, []),
    blocks: [studentBox, scaleKey, sectionTitle, cards, footer],
  });
}
