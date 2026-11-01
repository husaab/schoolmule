import type { Block, LearningSkillsBlock, SignaturesBlock, SkillsTableBlock, SpacerBlock, TableBlock, TableRowDef, TemplateDoc, TextBlock } from '../types';
import { SCALES } from './scales';
import { block, cell, logo, resetIds, template, text, zone } from './kit';

const BLUE = '#2c5aa0';
const DARK = '#333333';
const LIGHT_LINE = '#cccccc';
const COMMENT_BG = '#fafafa';
/** A4 with the 15mm margins the legacy template's @page rule printed with. */
const MARGIN = 57;
const WIDTH = 794 - 2 * MARGIN;

/**
 * The kindergarten report cards (legacy templates/alHaadiReportCardJKTemplate.js
 * and alHaadiReportCardSKTemplate.js): a blue title, the student and school
 * tables, then one table per JK domain (Learning Goals | domain | Term 1 |
 * Term 2, with the domain comment) or SK subject (standards | Term 1 | Term 2,
 * with "Strengths / Next Steps for Improvement"), the JK Learning Skills page,
 * signatures and a page-number footer. Georgia → Source Serif 4.
 *
 * Fixed on the way over: the school's website, principal and board are merge
 * fields (they were hard-coded for one school), the term comes from the data,
 * the teacher's signature slot shows the teacher's signature (it showed the
 * principal's), and the "N | Page" guess is a real "Page X of Y".
 */
export function kindergartenReportCardTemplate(grade: 'JK' | 'SK'): TemplateDoc {
  resetIds();
  const jk = grade === 'JK';
  const scale = jk ? SCALES.jkCard : SCALES.skCard;

  const firstHeader = zone(125, [
    text(
      MARGIN,
      MARGIN,
      WIDTH,
      30,
      `${jk ? 'Kindergarten' : 'Senior Kindergarten'} Report Card:\u00a0 {{meta.schoolYear}}`,
      { fontSize: 22, fontWeight: 700, color: BLUE, align: 'center', lineHeight: 1.35 },
      { name: 'Title', overflow: 'shrink' },
    ),
    logo(794 - MARGIN - 90, MARGIN, 90, 60),
  ]);
  const pageFooter = zone(MARGIN, [
    text(MARGIN, 16, WIDTH, 16, 'Page {{page.number}} of {{page.count}}', { fontSize: 10.67, color: '#999999', align: 'center' }, { name: 'Page number' }),
  ]);

  const bold = { fontWeight: 700 as const };
  const infoRow = (cells: TableRowDef['cells'], showWhen?: TableRowDef['showWhen']): TableRowDef => ({ cells, showWhen });
  const studentTable = block<TableBlock>({
    type: 'table',
    name: 'Student information',
    columns: [45.5, 30, 24.5],
    borderColor: DARK,
    cellPadding: 5,
    fontSize: 12.67,
    lineHeight: 1.35,
    marginBottom: 8,
    rows: [
      infoRow([
        cell('{{student.gradeLabel}} {{meta.termLabel|title}} Report Card {{meta.schoolYear}}', {
          colSpan: 3,
          background: BLUE,
          style: { fontWeight: 700, fontSize: 13.33, color: '#ffffff', align: 'center' },
        }),
      ]),
      infoRow([cell('Name of Student: {{student.name}}', { style: bold }), cell('OEN: {{student.oen}}'), cell('Days Absent: {{student.daysAbsent}}')], {
        field: 'student.oen',
        op: 'notEmpty',
      }),
      infoRow([cell('Name of Student: {{student.name}}', { style: bold }), cell('OEN: N/A'), cell('Days Absent: {{student.daysAbsent}}')], {
        field: 'student.oen',
        op: 'empty',
      }),
      infoRow([cell('Grade: {{student.gradeLabel}}', { style: bold }), cell('Teacher: {{student.homeroomTeacher}} & {{student.teacherAssistant}}', { colSpan: 2 })], {
        field: 'student.teacherAssistant',
        op: 'notEmpty',
      }),
      infoRow([cell('Grade: {{student.gradeLabel}}', { style: bold }), cell('Teacher: {{student.homeroomTeacher}}', { colSpan: 2 })], {
        field: 'student.teacherAssistant',
        op: 'empty',
      }),
      infoRow([cell('[[Board: {{school.board}}]]', { style: bold }), cell('School: {{school.name}}', { colSpan: 2 })]),
    ],
  });

  const schoolTable = block<TableBlock>({
    type: 'table',
    name: 'School details',
    columns: [40, 60],
    borderColor: DARK,
    cellPadding: 5,
    fontSize: 12,
    lineHeight: 1.35,
    marginBottom: 12,
    rows: [
      { cells: [cell('**{{school.name}}**\n{{school.address}}', { rowSpan: 2 }), cell('Website: {{school.website}}')] },
      { cells: [cell('[[Principal: {{school.principal}}\u00a0\u00a0\u00a0\u00a0 ]]Telephone: {{school.phone}}')] },
    ],
  });

  // SK prints its rating scale under the school details.
  const skScale = block<TableBlock>({
    type: 'table',
    name: 'Rating scale',
    columns: [100],
    borderColor: DARK,
    cellPadding: 6,
    fontSize: 12,
    lineHeight: 1.35,
    marginBottom: 18,
    rows: [
      { cells: [cell('Rating Scale', { background: BLUE, style: { fontWeight: 700, fontSize: 13.33, color: '#ffffff' } })] },
      {
        cells: [
          // No-break spaces (and a word joiner after the hyphen) keep each "code - label" together.
          cell(
            scale.levels.map((l) => `**${l.code}**\u00a0-\u2060\u00a0${l.label.replace(/ /g, '\u00a0')}`).join('\u2003\u2003'),
            { style: { lineHeight: 1.6 } },
          ),
        ],
      },
    ],
  });

  const ratingCell = { fontSize: 13.33 };
  const groups = block<SkillsTableBlock>({
    type: 'skillsTable',
    name: jk ? 'Domains' : 'Subjects',
    groupAsColumnHeader: true,
    columns: jk
      ? [
          { key: 'name', label: 'Learning Goals', width: 22, style: { fontWeight: 700, fontSize: 12 } },
          { key: 'description', label: '{{group}}', width: 48, style: { fontSize: 12 } },
          { key: 't1', label: 'Term 1', width: 15, align: 'center', headerAlign: 'center', style: ratingCell },
          { key: 't2', label: 'Term 2', width: 15, align: 'center', headerAlign: 'center', style: ratingCell },
        ]
      : [
          { key: 'name', label: '{{group}}', width: 70, style: { fontSize: 12 } },
          { key: 't1', label: 'Term 1', width: 15, align: 'center', headerAlign: 'center', style: ratingCell },
          { key: 't2', label: 'Term 2', width: 15, align: 'center', headerAlign: 'center', style: ratingCell },
        ],
    headerBar: { background: BLUE, color: '#ffffff', fontSize: 12.67, fontWeight: 700 },
    scaleId: scale.id,
    showGroupComments: true,
    ...(jk
      ? {}
      : {
          groupCommentLabel: 'Strengths / Next Steps for Improvement:',
          groupCommentLabelStyle: { fontWeight: 700 as const, fontSize: 12.67, color: BLUE, lineHeight: 1.6 },
        }),
    groupCommentBar: { background: COMMENT_BG, fontSize: 12, fontWeight: 400, padding: 8, paddingX: 10 },
    groupGap: 18,
    keepGroupsTogether: true,
    borderColor: LIGHT_LINE,
    cellPadding: 5,
    fontSize: 12.67,
    lineHeight: 1.35,
    verticalAlign: 'top',
    marginBottom: 18,
  });

  const learningSkills: Block[] = jk
    ? [
        block<SpacerBlock>({ type: 'spacer', name: 'Learning skills page', height: 20, breakBefore: true }),
        block<TextBlock>({
          type: 'text',
          name: 'Learning skills title',
          text: 'LEARNING SKILLS',
          marginBottom: 10,
          style: { fontSize: 21.33, fontWeight: 700, underline: true, align: 'center', lineHeight: 1.35 },
        }),
        block<LearningSkillsBlock>({
          type: 'learningSkills',
          name: 'Learning skills',
          headerLabel: 'Learning Skills',
          headerLabelWidth: 16,
          legend: 'E – Excellent\u00a0\u00a0 G – Good\u00a0\u00a0 S – Satisfactory\u00a0\u00a0 N – Needs Improvement',
          titleBar: { background: '#e0e0e0', fontSize: 12, fontWeight: 400, align: 'center' },
          nameBar: { background: '#e0e0e0', fontSize: 12.67, fontWeight: 700, padding: 3, paddingX: 8 },
          ratingStyle: { fontSize: 16 },
          showDescriptors: true,
          termColumns: ['t1', 't2'],
          termLabels: { t1: 'Term 1', t2: 'Term 2' },
          scaleId: SCALES.egsn.id,
          borderColor: LIGHT_LINE,
          cellPadding: 6,
          fontSize: 12,
          lineHeight: 1.3,
        }),
      ]
    : [];

  const signatures = block<SignaturesBlock>({
    type: 'signatures',
    name: 'Signatures',
    marginTop: 40,
    keepTogether: true,
    slots: [
      { label: "Teacher's Signature:", image: { kind: 'asset', asset: 'teacherSignature' } },
      { label: "Principal's Signature:", image: { kind: 'asset', asset: 'principalSignature' } },
      { label: '**Date: {{meta.reportDate}}**', showLine: false },
    ],
    imageHeight: 45,
    lineWidth: 140,
    style: { fontSize: 11.33, color: '#666666', lineHeight: 1.35 },
  });

  return template({
    docType: 'report_card',
    size: 'a4',
    margin: { left: MARGIN, right: MARGIN, top: 0, bottom: 0 },
    theme: { fontFamily: 'Source Serif 4', fontSize: 13.33, color: DARK, borderColor: DARK, accent: BLUE },
    scales: jk ? [scale, SCALES.egsn] : [scale],
    firstHeader,
    header: zone(MARGIN, []),
    footer: pageFooter,
    blocks: [studentTable, schoolTable, ...(jk ? [] : [skScale]), groups, ...learningSkills, signatures],
  });
}
