import type { CommentsTableBlock, RatingKeyBlock, SkillsTableBlock, TableBlock, TableCellDef, TemplateDoc } from '../types';
import { jkProgressTemplate } from './jkProgress';
import { SCALES } from './scales';
import { block, cell, cornerLogo, resetIds, template, text, zone } from './kit';

const BLUE = '#9bc2e6';
const LIGHT_BLUE = '#bdd7ee';
const GREY = '#d0cece';
const FOOTER_BLUE = '#4472c4';

// Letter, as printed by schoolmule-backend templates/alHaadiProgressReportSKTemplate.js
// (CSS px; 1pt = 4/3 px): 0.81in sides, 0.75in top, 0.76in bottom, which
// Chrome rounds down to whole points (58pt, 54pt, 54pt).
const SIDE = 77.33;
const TOP = 72;
const BOTTOM = 72;
const CONTENT = 816 - 2 * SIDE;
const WIDTH = 816;
// Where Chrome prints a header/footer template: 20.7px in from the page edge.
const CHROME_EDGE = 20.7;

/**
 * The SK progress report on Al Haadi's paper layout (Letter, Mulish, solid
 * black grid): the logo in the page's corner, "Progress Report: <year>", the date box, the student
 * grid with the rotated EVALUATION KEY, one LEARNING SKILLS table (grey
 * subject bars, blue LITERACY parts, Arabic and Quran beside French), then on
 * a new page the nine "Strengths/Next Steps for Improvement" rows with the
 * signature row (the teacher's, the teacher assistant's when there is one, and
 * the principal's; saved signatures print in their boxes). A name/date running header from page 2; the school's address
 * and "Page X of Y" in every footer.
 */
export function skProgressTemplate(): TemplateDoc {
  resetIds();
  const scale = SCALES.skProgress;

  // Page 1: no running header; the logo is in the page's corner, the title under the top margin.
  const firstHeader = zone(TOP + 61.33 + 5.33, [
    cornerLogo(WIDTH, 186.67, 58.67),
    text(
      SIDE,
      TOP,
      CONTENT,
      61.33,
      'Progress Report:  {{meta.schoolYear}}',
      { fontSize: 24, fontWeight: 800, letterSpacing: -0.27, align: 'center', verticalAlign: 'middle', lineHeight: 1.3 },
      { name: 'Title' },
    ),
  ]);
  const runningHeader = zone(TOP, [
    text(45.33, CHROME_EDGE + 11.3, 380, 16, '{{student.name}}', { fontSize: 12.67, fontWeight: 700, lineHeight: 1.255 }, { name: 'Student name' }),
    text(WIDTH - 45.33 - 300, CHROME_EDGE + 11.3, 300, 16, '{{meta.reportDate|long}}', { fontSize: 12.67, fontWeight: 700, lineHeight: 1.255, align: 'right' }, { name: 'Report date' }),
  ]);
  // Bottom-aligned 20.7px above the page edge, as Chrome prints the footer.
  const footerBottom = BOTTOM - CHROME_EDGE;
  const footer = zone(BOTTOM, [
    text(
      45.33,
      footerBottom - 37.2,
      520,
      37.2,
      '**{{school.name}}**\n{{school.address|shortaddress}}[[ | {{school.phone|phone}}]][[ | {{school.website}}]]\n[[© {{meta.schoolYear|shortyear}}, All Rights Reserved]]',
      { fontSize: 8, color: FOOTER_BLUE, lineHeight: 1.55 },
      { name: 'School address' },
    ),
    text(WIDTH - 45.33 - 160, footerBottom - 16.73, 160, 16.73, 'Page {{page.number}} of {{page.count}}', { fontSize: 13.33, fontWeight: 700, align: 'right', lineHeight: 1.255 }, { name: 'Page number' }),
  ]);

  const bold = { fontWeight: 700 as const };
  const studentGrid = block<TableBlock>({
    type: 'table',
    name: 'Student information',
    columns: [9.6, 10.3, 28.3, 29.3, 22.5],
    borderWidth: 2,
    cellPadding: 2,
    fontSize: 11.33,
    rows: [
      {
        height: 21.4,
        cells: [cell('', { colSpan: 3 }), cell('Date: {{meta.reportDate|long}}', { colSpan: 2, style: bold, padding: { top: 4, right: 4, bottom: 2.67, left: 4 } })],
      },
      {
        height: 27.9,
        cells: [
          cell('{{student.gradeLabel}} Progress Report', {
            colSpan: 5,
            background: BLUE,
            style: { fontSize: 17.33, fontWeight: 700, align: 'center' },
            padding: { top: 2.67, right: 0, bottom: 2.67, left: 0 },
          }),
        ],
      },
      {
        cells: [
          cell('Student:', { style: bold }),
          cell('{{student.name}}', { colSpan: 2, style: bold }),
          cell('OEN:  {{student.oen}}', { colSpan: 2, style: bold }),
        ],
      },
      {
        cells: [
          cell('Teacher:', { style: bold }),
          cell('{{student.homeroomTeacher}}', { colSpan: 2, style: bold }),
          cell('Days Absent:', { style: bold }),
          cell('{{student.daysAbsent}}', { style: { ...bold, align: 'center' } }),
        ],
      },
      // The Kindergarten class's co-teacher (services/kindergartenStaff.js), when there is one.
      {
        showWhen: { field: 'student.teacherAssistant', op: 'notEmpty' },
        cells: [cell('Teacher Assistant:  {{student.teacherAssistant}}', { colSpan: 5, style: bold })],
      },
    ],
  });

  const key = block<RatingKeyBlock>({
    type: 'ratingKey',
    name: 'Evaluation key',
    scaleId: scale.id,
    layout: 'vertical',
    sideLabel: 'EVALUATION\nKEY',
    sideStyle: { fontSize: 10.67, fontWeight: 700, letterSpacing: 0.53, lineHeight: 1.25 },
    codeStyle: { fontWeight: 400 },
    titleBackground: BLUE,
    sideWidth: 9.6,
    codeWidth: 10.3,
    borderWidth: 1,
    outerBorderWidth: 2,
    cellPadding: 0,
    fontSize: 14,
    marginTop: -2,
  });

  const skills = block<SkillsTableBlock>({
    type: 'skillsTable',
    name: 'Learning skills',
    title: 'LEARNING SKILLS',
    titleBar: { background: BLUE, align: 'center', fontSize: 18, fontWeight: 700, padding: 0, height: 34.67 },
    groupBar: { background: GREY, align: 'center', fontSize: 14, fontWeight: 700, uppercase: true, padding: 0, paddingX: 2.67, height: 20 },
    subgroupBar: { background: LIGHT_BLUE, align: 'left', fontSize: 14, fontWeight: 700, uppercase: true, padding: 0, paddingX: 2.67, height: 20 },
    columns: [
      { key: 'name', label: 'Skill', width: 77.5 },
      { key: 'rating', label: 'Rating', width: 22.5, align: 'center' },
    ],
    scaleId: scale.id,
    splitGroupNames: true,
    // Each subject (its bars and rows) moves to the next page whole, as on paper.
    keepGroupsTogether: true,
    sideBySide: [['Arabic and Quran', 'French']],
    pairColumns: [29.9, 8.2, 39.4, 22.5],
    rowHeight: 23.4,
    pairRowHeight: 31.67,
    pairStyle: { fontSize: 12.67 },
    borderWidth: 1,
    outerBorderWidth: 2,
    cellPadding: 3.33,
    cellPaddingX: 2,
    fontSize: 12,
    marginTop: 17.33,
  });

  // The "Strengths/Next Steps" rows end in the signature row. With a teacher
  // assistant the row holds three label + signature pairs (finer columns);
  // without one, the paper's two. One of the two tables prints.
  const sigLabel = (value: string) => cell(value, { style: { fontWeight: 700, fontSize: 10.67, verticalAlign: 'bottom' } });
  const sigImage = (asset: 'teacherSignature' | 'teacherAssistantSignature' | 'principalSignature', imageHeight = 32) => ({
    image: { kind: 'asset' as const, asset },
    imageHeight,
    style: { align: 'center' as const },
  });
  const commentsTable = (variant: { name: string; assistant: boolean; grid: number[]; footer: TableCellDef[] }) =>
    block<CommentsTableBlock>({
      type: 'commentsTable',
      name: variant.name,
      showWhen: { field: 'student.teacherAssistant', op: variant.assistant ? 'notEmpty' : 'empty' },
      source: 'comments',
      breakBefore: true,
      subjectLabel: 'Subjects',
      commentLabel: 'Strengths/Next Steps for Improvement',
      subjectWidth: 20,
      grid: variant.grid,
      subjectSpan: 1,
      headerBar: { background: GREY, align: 'center', fontSize: 14, fontWeight: 700, padding: 0, height: 64 },
      subjectStyle: { fontSize: 14 },
      subjectBackground: GREY,
      captionStyle: { fontSize: 8.67, fontWeight: 400, lineHeight: 1.35 },
      commentStyle: { fontSize: 14, lineHeight: 1.6, verticalAlign: 'top' },
      rowHeight: 53.33,
      borderWidth: 2,
      cellPadding: 2,
      cellPaddingX: 2.67,
      fontSize: 14,
      showEmptyRows: true,
      footerRow: { height: 34.67, cells: variant.footer },
    });
  const comments = commentsTable({
    name: 'Strengths and next steps',
    assistant: false,
    grid: [20, 18.1, 39.4, 22.5],
    footer: [sigLabel("Teacher's Signature:"), sigImage('teacherSignature'), sigLabel("Principal's Signature:"), sigImage('principalSignature')],
  });
  const commentsWithAssistant = commentsTable({
    name: 'Strengths and next steps (with teacher assistant)',
    assistant: true,
    grid: [20, 13.4, 20, 13.4, 19.2, 14],
    footer: [
      sigLabel("Teacher's Signature:"),
      sigImage('teacherSignature', 28),
      sigLabel("Teacher Assistant's Signature:"),
      sigImage('teacherAssistantSignature', 28),
      sigLabel("Principal's Signature:"),
      sigImage('principalSignature', 28),
    ],
  });

  return template({
    docType: 'progress_report',
    size: 'letter',
    margin: { left: SIDE, right: SIDE, top: 0, bottom: 0 },
    theme: { fontFamily: 'Mulish', fontSize: 12, color: '#000000' },
    scales: [scale],
    firstHeader,
    header: runningHeader,
    footer,
    blocks: [studentGrid, key, skills, comments, commentsWithAssistant],
  });
}

/** The JK and SK progress reports (each on its school's paper layout). */
export function kindergartenProgressTemplate(grade: 'JK' | 'SK'): TemplateDoc {
  return grade === 'JK' ? jkProgressTemplate() : skProgressTemplate();
}
