import type { CommentsTableBlock, RatingKeyBlock, SkillsTableBlock, TableBlock, TemplateDoc } from '../types';
import { SCALES } from './scales';
import { block, cell, logo, resetIds, schoolFooter, template, text, zone } from './kit';

const BLUE = '#9bc2e6';
const LIGHT_BLUE = '#bdd7ee';
const GREY = '#d0cece';

/**
 * The kindergarten progress report on the school's paper layout (Letter,
 * Mulish, solid black grid): logo + "Progress Report: <year>", a date box,
 * the student grid with a rotated EVALUATION KEY, LEARNING SKILLS flowing
 * across pages (Literacy → Reading/Writing bars; Arabic and Quran beside
 * French), then the comments table with the signature row.
 */
export function kindergartenProgressTemplate(grade: 'JK' | 'SK'): TemplateDoc {
  resetIds();
  const scale = grade === 'JK' ? SCALES.jkProgress : SCALES.skProgress;

  const firstHeader = zone(132, [
    logo(56, 34, 230, 76),
    text(330, 52, 430, 44, 'Progress Report:  {{meta.schoolYear}}', { fontSize: 27, fontWeight: 400, color: '#333333', align: 'right' }, { name: 'Title' }),
  ]);
  const runningHeader = zone(74, [
    text(56, 36, 380, 20, '{{student.name}}', { fontSize: 12.5, fontWeight: 700 }, { name: 'Student name' }),
    text(436, 36, 324, 20, '{{meta.reportDate|long}}', { fontSize: 12.5, fontWeight: 700, align: 'right' }, { name: 'Report date' }),
  ]);

  const dateBox = block<TableBlock>({
    type: 'table',
    name: 'Date box',
    width: 52,
    align: 'right',
    columns: [100],
    borderWidth: 1.5,
    cellPadding: 3,
    fontSize: 11,
    rows: [{ cells: [cell('Date: {{meta.reportDate|long}}', { style: { fontWeight: 700 } })] }],
  });

  const studentGrid = block<TableBlock>({
    type: 'table',
    name: 'Student information',
    columns: [10, 10, 28, 29, 23],
    borderWidth: 1.5,
    cellPadding: 3,
    fontSize: 11,
    marginBottom: 0,
    rows: [
      {
        cells: [
          cell('{{student.gradeLabel}} Progress Report', {
            colSpan: 5,
            background: BLUE,
            style: { fontSize: 16, fontWeight: 700, align: 'center' },
          }),
        ],
      },
      {
        cells: [
          cell('Student:', { style: { fontWeight: 700 } }),
          cell('{{student.name}}', { colSpan: 2, style: { fontWeight: 700 } }),
          cell('OEN:  {{student.oen}}', { colSpan: 2, style: { fontWeight: 700 } }),
        ],
      },
      {
        cells: [
          cell('Teacher:', { style: { fontWeight: 700 } }),
          cell('{{student.homeroomTeacher}}', { colSpan: 2, style: { fontWeight: 700 } }),
          cell('Days Absent:', { style: { fontWeight: 700 } }),
          cell('{{student.daysAbsent}}', { style: { fontWeight: 700, align: 'center' } }),
        ],
      },
    ],
  });

  const key = block<RatingKeyBlock>({
    type: 'ratingKey',
    name: 'Evaluation key',
    scaleId: scale.id,
    layout: 'vertical',
    sideLabel: 'EVALUATION KEY',
    titleBackground: BLUE,
    sideWidth: 10,
    codeWidth: 10,
    borderWidth: 1.5,
    cellPadding: 1,
    fontSize: 11.5,
    marginTop: -1.5,
    marginBottom: 22,
  });

  const skills = block<SkillsTableBlock>({
    type: 'skillsTable',
    name: 'Learning skills',
    title: 'LEARNING SKILLS',
    titleBar: { background: BLUE, align: 'center', fontSize: 18, fontWeight: 700 },
    groupBar: { background: GREY, align: 'center', fontSize: 12.5, fontWeight: 700, uppercase: true },
    subgroupBar: { background: LIGHT_BLUE, align: 'left', fontSize: 12.5, fontWeight: 700, uppercase: true },
    columns: [
      { key: 'name', label: 'Skill', width: 77 },
      { key: 'rating', label: 'Rating', width: 23, align: 'center' },
    ],
    scaleId: scale.id,
    splitGroupNames: true,
    sideBySide: [['Arabic and Quran', 'French']],
    borderWidth: 1.5,
    cellPadding: 5,
    fontSize: 10.5,
  });

  const comments = block<CommentsTableBlock>({
    type: 'commentsTable',
    name: 'Comments',
    source: 'comments',
    subjectLabel: 'Subjects',
    commentLabel: 'Strengths/Next Steps for Improvement',
    subjectWidth: 20,
    grid: [20, 18, 39, 23],
    subjectSpan: 1,
    headerBar: { background: GREY, align: 'center', fontSize: 12.5, fontWeight: 700 },
    subjectStyle: { fontSize: 12.5 },
    borderWidth: 1.5,
    cellPadding: 4,
    fontSize: 12.5,
    showEmptyRows: true,
    footerRow: {
      cells: [
        cell("Teacher's Signature:", { style: { fontWeight: 700, fontSize: 10.5 } }),
        { image: { kind: 'asset', asset: 'teacherSignature' }, imageHeight: 30, style: { align: 'center' } },
        cell("Principal's Signature:", { style: { fontWeight: 700, fontSize: 10.5 } }),
        { image: { kind: 'asset', asset: 'principalSignature' }, imageHeight: 30, style: { align: 'center' } },
      ],
    },
  });

  return template({
    docType: 'progress_report',
    size: 'letter',
    margin: { left: 56, right: 56, top: 0, bottom: 4 },
    theme: { fontFamily: 'Mulish', fontSize: 12 },
    scales: [scale],
    firstHeader,
    header: runningHeader,
    footer: schoolFooter(),
    blocks: [dateBox, studentGrid, key, skills, comments],
  });
}
