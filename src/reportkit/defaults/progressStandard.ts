import type { CanvasBlock, ColumnsBlock, SignaturesBlock, SubjectCardsBlock, TableBlock, TableCellDef, TemplateDoc, TextBlock, TextStyle } from '../types';
import { HONOUR, MARGIN, WIDTH, honourHeading, honourKept, honourPageTop, honourSubjectBar, honourTitleBand } from './honourRoll';
import { SCALES } from './scales';
import { block, cell, cornerLogo, rect, resetIds, template, text, zone } from './kit';

/**
 * The grades 1–8 progress report in the Honour Roll look (see honourRoll.ts):
 * the logo in the page's corner, the centred school name, the title band, the student grid, the
 * school's assessment legend (the E/G/S/N scale, learning skills & work habits,
 * student behaviour & Islamic conduct), then one card per subject (work
 * habits and behaviour as tiles, core standards, the teacher's comment) and a footer
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

  // The school's own legend (Al Haadi sent it, 2026-11-16): the E/G/S/N scale,
  // what each learning skill and work habit means, and what behaviour and
  // Islamic conduct cover. The letters wear the colours the subject cards use.
  const levelOf = (code: string) => scale.levels.find((l) => l.code === code)!;
  const scaleKey = block<TableBlock>({
    type: 'table',
    name: 'Assessment scale key',
    columns: [1, 1, 1, 1],
    borderWidth: 1,
    outerBorderWidth: 1,
    borderColor: HONOUR.GOLD_SOFT,
    cellPadding: 5,
    fontSize: 13,
    lineHeight: 1.3,
    rows: [
      { cells: ['E', 'G', 'S', 'N'].map((code) => cell(code, { background: levelOf(code).color, style: { fontFamily: HONOUR.HEADING_FONT, fontSize: 13, fontWeight: 700, color: levelOf(code).textColor, align: 'center' } })) },
      { cells: ['E', 'G', 'S', 'N'].map((code) => cell(levelOf(code).label, { background: HONOUR.GOLD_TINT, style: { fontSize: 13, align: 'center' } })) },
    ],
  });

  // "Learning Skill | Key Expectations": a navy header row, then the rows on
  // alternating white and gold tint.
  const expectations = (name: string, head: string, rows: Array<[string, string]>) =>
    block<TableBlock>({
      type: 'table',
      name,
      columns: [196, 462],
      borderWidth: 1,
      outerBorderWidth: 1,
      borderColor: HONOUR.GOLD_SOFT,
      cellPadding: 5,
      cellPaddingX: 10,
      fontSize: 13,
      lineHeight: 1.35,
      rows: [
        { cells: [head, 'Key Expectations'].map((t) => cell(t, { background: HONOUR.NAVY, style: { fontFamily: HONOUR.HEADING_FONT, fontSize: 12.5, fontWeight: 700, color: '#ffffff' } })) },
        ...rows.map(([term, expects], i) => {
          const background = i % 2 === 1 ? HONOUR.GOLD_TINT : undefined;
          return {
            cells: [
              cell(term, { background, style: { fontFamily: HONOUR.HEADING_FONT, fontSize: 12.5, fontWeight: 700, color: HONOUR.NAVY } }),
              cell(expects, { background, style: { fontSize: 13, color: HONOUR.INK } }),
            ],
          };
        }),
      ],
    });
  const learningSkills = expectations('Learning skills table', 'Learning Skill', [
    ['Responsibility', 'Completes tasks, meets deadlines, and takes responsibility for actions.'],
    ['Independent Work', 'Works independently and follows instructions.'],
    ['Organization', 'Manages time, materials, and priorities.'],
    ['Collaboration', 'Respects others, cooperates, and resolves conflicts positively.'],
    ['Initiative', 'Shows curiosity, takes initiative, and embraces challenges.'],
    ['Self-Regulation', 'Sets goals, reflects, seeks help, and perseveres.'],
  ]);
  const behaviour = expectations('Behaviour table', 'Behaviour Category', [
    ['Respect & Kindness', 'Speaks politely, shows kindness, and respects teachers and peers.'],
    ['Honesty & Integrity', 'Tells the truth, acts fairly, and takes responsibility for mistakes.'],
    ['Self-Discipline', 'Follows school rules, controls emotions, and makes positive choices.'],
    ['Islamic Manners (Akhlaq)', 'Demonstrates humility, patience, forgiveness, and good manners.'],
    ['Respect for Others', 'Respects personal boundaries, differences, and others’ belongings.'],
    ['Positive Conduct', 'Uses appropriate language, avoids disruptions, and promotes a peaceful environment.'],
  ]);

  const rating: TextStyle = { fontFamily: HONOUR.HEADING_FONT, fontSize: 16, fontWeight: 700 };
  const cards = block<SubjectCardsBlock>({
    type: 'subjectCards',
    name: 'Subjects',
    // No "Overall" tile: it only averaged the two ratings beside it, and the
    // school asked for it to go (2026-11-16).
    fields: [
      { key: 'workHabits', label: 'Work Habits', width: 1, style: rating },
      { key: 'behaviour', label: 'Behavior', width: 1, style: rating },
    ],
    rows: 'current',
    showTeacher: true,
    showCoreStandards: true,
    coreStandardsLabel: 'Core Standards Progress:',
    goalsLabel: 'Expectations/Goals:',
    // The school's subject headings (Report templates → Subject headings).
    sectionBar: {
      color: HONOUR.NAVY,
      fontFamily: HONOUR.HEADING_FONT,
      fontSize: 16,
      fontWeight: 700,
      padding: 5,
      paddingX: 0,
      ruleBottom: { color: HONOUR.GOLD, width: 2 },
    },
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
      honourKept('Assessment Legend', honourHeading('ASSESSMENT LEGEND', 180, 12.5, 6), scaleKey, 16),
      honourKept('Learning Skills & Work Habits', honourHeading('LEARNING SKILLS & WORK HABITS', 290, 12.5, 6), learningSkills, 16),
      honourKept('Student Behaviour & Islamic Conduct', honourHeading('STUDENT BEHAVIOUR & ISLAMIC CONDUCT', 350, 12.5, 6), behaviour, 22),
      // Kept with the first card: never left alone at the foot of page 1.
      honourHeading('Progress by Subject', 190, 15, 8, { keepWithNext: true }),
      cards,
      footer,
    ],
  });
}
