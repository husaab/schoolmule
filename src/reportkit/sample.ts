import { gradeLabel, gradeNumber } from './format';
import type { CommentRow, DocType, LearningSkillRow, MarkValue, ReportData, SkillGroup, SubjectRow } from './types';

/**
 * Synthetic report data for previews and tests: a student per grade band and
 * a worst case (long names, long comments, every row filled). Fictional
 * names only. Deterministic — no randomness — so renders are reproducible.
 */

export type SampleKey = 'JK' | 'SK' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | 'worst';

export const SAMPLE_OPTIONS: Array<{ key: SampleKey; label: string }> = [
  { key: 'JK', label: 'Omar Nasser · JK' },
  { key: 'SK', label: 'Sara Haddad · SK' },
  { key: '1', label: 'Yusuf Karim · Grade 1' },
  { key: '2', label: 'Lina Haddad · Grade 2' },
  { key: '4', label: 'Adam Haddad · Grade 4' },
  { key: '8', label: 'Maya Saleh · Grade 8' },
  { key: 'worst', label: 'Worst case (longest content)' },
];

const NAMES: Record<string, [string, string]> = {
  JK: ['Omar', 'Nasser'],
  SK: ['Sara', 'Haddad'],
  '1': ['Yusuf', 'Karim'],
  '2': ['Lina', 'Haddad'],
  '3': ['Noor', 'Aziz'],
  '4': ['Adam', 'Haddad'],
  '5': ['Zayd', 'Rahman'],
  '6': ['Hana', 'Yousef'],
  '7': ['Bilal', 'Khalil'],
  '8': ['Maya', 'Saleh'],
};

const pick = <T,>(list: T[], i: number): T => list[i % list.length];

const JK_DOMAINS: Array<[string, string[]]> = [
  ['Language and Communication Skills', ['Listens to and follows simple directions', 'Speaks in complete sentences', 'Shares ideas and experiences with the group', 'Asks questions to learn more']],
  ['Social Skills', ['Plays cooperatively with others', 'Takes turns and shares materials', 'Shows respect for classmates and teachers']],
  ['Emotional Development', ['Expresses feelings in appropriate ways', 'Separates from parents with ease', 'Shows confidence in trying new things']],
  ['Reading and Writing Skills', ['Recognizes own name in print', 'Identifies some letters of the alphabet', 'Holds a pencil correctly', 'Enjoys looking at books']],
  ['Colours and Shapes', ['Names basic colours', 'Identifies circles, squares and triangles']],
  ['Numbers', ['Counts to 20 by ones', 'Recognizes numerals 0 to 10', 'Sorts objects by one attribute']],
  ['Fine Motor Skills', ['Uses scissors with control', 'Completes simple puzzles', 'Builds with small blocks']],
];

/** The JK progress report's sections, as Al Haadi's paper template lists them. */
const JK_PROGRESS_DOMAINS: Array<[string, string[]]> = [
  ['Language and Communication Skills', ['Speaks clearly and fluently.', 'Responds to direct questions.', 'Follows routines.', 'Engages in conversations.', 'Expands vocabulary.', 'Expresses thoughts and ideas.']],
  ['Social Skills', ['Knows first name, last name and age.', 'Interacts well with peers.', 'Demonstrates good manners.', 'Follows classroom rules.', 'Shares well with others and takes turns.', 'Listens and responds to others.']],
  ['Emotional Development', ['Expresses emotions appropriately.', 'Demonstrates independence.', 'Shows empathy towards others.', 'Copes with frustration and disappointment.']],
  ['Reading and Writing Skills', ['Knows how to say the ABCs.', 'Recognizes the ABCs.', 'Can Print his/her first name.', 'Can print his/her last name.']],
  ['Colours and Shapes', ['Knows primary colours.', 'Knows shapes.', 'Understands sizes(big/small).']],
  ['Numbers', ['Recognizes numbers one to ten.', 'Understands empty and full.', 'Understands more or less.']],
  ['Fine Motor Skills', ['Holds and uses a pencil or crayon.', 'Holds and uses scissors.', 'Can hold and use a glue stick or a paintbrush', 'Manipulates small objects.', 'Demonstrates hand-eye coordination.']],
  ['Gross Motor Skills', ['Can bounce & kick a ball', 'Demonstrates balance and coordination.', 'Can run, jump, and climb with control.', 'Participates in physical activities and games.', 'Can swing, skip without help.', 'Can button shirt and tie shoes.', 'Follows simple movement instructions.']],
  ['Cognitive Development', ['Participates in classroom activities.', 'Demonstrates curiosity and problem-solving skills', 'Shows interest in books and reading.', 'Engages in creative play and imaginative activities.']],
  ['Arabic', ['Knows how to say the Arabic alphabet.', 'Recognizes some letters of the Arabic alphabet.', 'Can Print first & last name in Arabic.']],
  ['Islamic Studies', ['Memorizes assigned surahs.', 'Listens and engages in lessons.']],
];

const SK_SUBJECTS: Array<[string, string[]]> = [
  ['Mathematics', ['Counts to 100 by ones and tens', 'Correctly writes numbers from 0 to 100', 'Represents a number of objects with a written numeral', 'Demonstrates one-to-one correspondence', 'Identifies and describes shapes (squares, circles, triangles, rectangles, hexagons, cubes, cones, cylinders, and spheres)', 'Makes accurate estimates of the number of objects in a set up to 20', 'Builds and draws shapes']],
  ['Language', ['Waits and takes turns during conversations', 'Clearly communicates needs and thoughts', 'Participates in communication around a topic', 'Understands and uses question words', 'Produces and expands complete sentences in shared language activities', 'Follows multiple step instructions']],
  ['Literacy - Reading', ['Recognizes and names all upper and lowercase letters of the alphabet', 'Reads common high-frequency words by sight', 'Recognizes and produces rhyming words', 'Demonstrates phonological awareness', 'Produces the primary sounds for each consonant', 'Associates the long and short sounds for the five major vowels', 'Follows words from left to right, top to bottom, and page by page', 'Reads emergent-reader texts with purpose and understanding']],
  ['Literacy - Writing', ['Prints all upper and lowercase letters correctly', 'Capitalizes the first word in a sentence and the pronoun I', 'Recognizes and names end punctuation', 'Spells simple words phonetically', 'Writes a letter or letters for most consonant and short-vowel sounds', 'Expresses an idea using pictures', 'Independently forms sentences']],
  ['Science and Social Studies', ['Participates in class discussions', 'Asks and pursues questions through simple investigations', 'Makes accurate predictions of the outcome', 'Makes simple observations']],
  ['Approaches to Learning', ['Initiates play with peers', 'Seeks alternative approaches to problem solving', 'Demonstrates curiosity and a willingness to participate in tasks and challenges', 'Demonstrates persistence in completing tasks', 'Participates in class discussions', 'Applies prior experiences to learning', 'Demonstrates an appropriate attention span', 'Completes activities and works in a timely manner']],
  ['Islamic Studies', ['Demonstrates good moral values by caring, sharing and taking turns during daily class activities and routines', 'Demonstrates an understanding and interest in Islamic stories']],
  ['Creativity', ['Plans, works cooperatively and creates drawings, paintings, and other art projects', 'Demonstrates care and persistence when involved in art projects']],
  ['Arabic and Quran', ['Recognizes and writes Arabic Letters', 'Overall participation', 'Memorizes and Pronounces Surahs Independently']],
  ['French', ['Recognizes and writes French Letters', 'Overall participation', 'Basic vocabulary']],
];

/** The JK progress report's Teacher's Comments rows (backend templates/kindergartenProgressComments.js). */
const JK_COMMENT_ROWS: Array<[string, string, string]> = [
  ['academic_achievement', 'Academic achievement', ''],
  ['socio_emotional', 'Socio-emotional development', ''],
];

/** The SK progress report's Strengths/Next Steps rows (the same file). */
const SK_COMMENT_ROWS: Array<[string, string, string]> = [
  ['language_arts', 'Language Arts', 'Reading, Writing, Oral communication, Media Literacy'],
  ['mathematics', 'Mathematics', ''],
  ['science', 'Science', ''],
  ['social_studies', 'Social Studies', ''],
  ['quran', 'Quran', ''],
  ['arabic', 'Arabic', ''],
  ['islamic_studies', 'Islamic Studies', ''],
  ['creativity', 'Creativity', ''],
  ['french', 'French', ''],
];

const SUBJECTS_PRIMARY = ['Language', 'Mathematics', 'Science and Technology', 'Social Studies', 'Arabic', 'Islamic Studies', 'Quran', 'French', 'Physical Education', 'The Arts'];
const SUBJECTS_JUNIOR = ['English', 'Mathematics', 'Science and Technology', 'Social Studies', 'Arabic', 'Islamic Studies', 'Quran', 'French', 'Physical Education', 'Visual Arts', 'Computer Studies'];
const TEACHERS = ['Ms. Layla Saleh', 'Mr. Karim Aziz', 'Ms. Huda Nasser', 'Mr. Tariq Rahman', 'Ms. Dalal Youssef'];
const MARKS = [92.4, 86.75, 78.2, 81.5, 73.9, 88.1, 67.45, 95.0, 84.3, 'I' as const, 59.8, 90.2];
const EGSN = ['E', 'G', 'G', 'S', 'E', 'G', 'N', 'G'];

const LEARNING_SKILLS: Array<[string, string[]]> = [
  ['Responsibility', ['Fulfils responsibilities and commitments within the learning environment', 'Completes and submits class work, homework, and assignments according to agreed-upon timelines']],
  ['Organization', ['Devises and follows a plan and process for completing work and tasks', 'Establishes priorities and manages time to complete tasks and achieve goals']],
  ['Independent Work', ['Independently monitors, assesses, and revises plans to complete tasks and meet goals', 'Uses class time appropriately to complete tasks']],
  ['Initiative', ['Looks for and acts on new ideas and opportunities for learning', 'Demonstrates curiosity and interest in learning']],
  ['Collaboration', ['Accepts various roles and an equitable share of work in a group', 'Responds positively to the ideas, opinions, values, and traditions of others']],
  ['Self-Regulation', ['Sets own individual goals and monitors progress towards achieving them', 'Seeks clarification or assistance when needed']],
];

function comment(first: string, subject: string, i: number, long = false): string {
  const base = [
    `${first} shows enthusiasm in ${subject} and participates thoughtfully in class activities.`,
    `${first} is making steady progress in ${subject} and is encouraged to keep practising at home.`,
    `${first} works carefully in ${subject} and asks good questions when something is unclear.`,
  ][i % 3];
  if (!long) return base;
  return `${base} ${first} has grown in confidence this term, contributes ideas to group discussions and helps classmates when they need support. To continue improving, ${first} is encouraged to read every evening, review new vocabulary, and share what was learned with family members. **Next step:** practise explaining thinking out loud, step by step, to build fluency and independence. We are proud of the effort shown and look forward to even more growth next term.`;
}

function skills(groups: Array<[string, string[]]>, scale: string[], prefix: string, long: boolean): SkillGroup[] {
  let n = 0;
  return groups.map(([name, items], gi) => ({
    id: `${prefix}g${gi}`,
    name,
    comment: long || gi % 3 === 0 ? `Strengths and next steps for ${name.toLowerCase()} are shared with the family at conferences.` : '',
    items: (long ? [...items, ...items.map((t) => `${t} (extended expectation)`)] : items).map((t, ii) => {
      const r = pick(scale, n++ * 7 + 3);
      return { id: `${prefix}g${gi}i${ii}`, name: t, description: '', rating: r, t1: pick(scale, n * 5 + 1), t2: r };
    }),
  }));
}

function subjects(first: string, list: string[], long: boolean): SubjectRow[] {
  return list.map((name, i) => {
    const mark = MARKS[i % MARKS.length] as MarkValue;
    const t1 = MARKS[(i + 3) % MARKS.length] as MarkValue;
    const wh = pick(EGSN, i);
    const bh = pick(EGSN, i + 2);
    return {
      id: `s${i}`,
      name: long && i === 0 ? `${name} — Reading, Writing, Oral Communication and Media Literacy` : name,
      teacher: pick(TEACHERS, i),
      mark,
      workHabits: wh,
      behaviour: bh,
      coreStandards: i % 2 === 0 ? 'Meeting expectations' : 'Approaching expectations',
      comment: comment(first, name.toLowerCase(), i, long),
      terms: {
        t1: { mark: t1, workHabits: pick(EGSN, i + 1), behaviour: pick(EGSN, i + 3), comment: '' },
        t2: { mark, workHabits: wh, behaviour: bh, comment: comment(first, name.toLowerCase(), i, long) },
        final: { mark: typeof mark === 'number' && typeof t1 === 'number' ? (mark + t1) / 2 : mark === 'I' ? 'I' : null, workHabits: '', behaviour: '', comment: '' },
      },
    };
  });
}

export function sampleReportData(key: SampleKey, docType: DocType = 'progress_report'): ReportData {
  const worst = key === 'worst';
  const grade = worst ? 'SK' : key;
  const [first, last] = worst ? ['Muhammad-Abdulrahman', 'Al-Khatib Abou-Haidar'] : NAMES[grade];
  const kinder = grade === 'JK' || grade === 'SK';

  let skillGroups: SkillGroup[] = [];
  if (grade === 'JK') {
    skillGroups =
      docType === 'report_card' ? skills(JK_DOMAINS, ['DV', 'BG', 'DV', 'NI'], 'jk', worst) : skills(JK_PROGRESS_DOMAINS, ['D', 'B', 'D', 'I', 'D', 'N'], 'jk', worst);
  }
  if (grade === 'SK') skillGroups = skills(SK_SUBJECTS, docType === 'report_card' ? ['E', 'P', 'DV', 'P', 'EM'] : ['G', 'S', 'G', 'NI', 'G', 'E'], 'sk', worst);

  // The progress reports' comment rows, every row present (as the backend sends them).
  const commentRows = !kinder || docType !== 'progress_report' ? [] : grade === 'JK' ? JK_COMMENT_ROWS : SK_COMMENT_ROWS;
  const comments: CommentRow[] = commentRows.map(([k, label, caption], i) => ({ key: k, label, caption, text: comment(first, label.toLowerCase(), i, worst || i < 2) }));

  const learningSkills: LearningSkillRow[] = LEARNING_SKILLS.map(([name, descriptors], i) => ({
    name,
    descriptors,
    rating: pick(EGSN, i),
    t1: pick(EGSN, i + 1),
    t2: pick(EGSN, i),
  }));

  const n = gradeNumber(grade);
  return {
    dataVersion: 1,
    meta: {
      docType,
      term: 'Term 1',
      termNumber: 1,
      termLabel: 'FIRST TERM',
      schoolYear: '2026 - 2027',
      reportDate: '2026-11-13',
      generatedDate: '2026-11-13',
    },
    school: {
      code: 'PLAYGROUND',
      name: 'Playground Academy',
      address: '123 Example Road, Toronto, ON M1M 1M1',
      phone: '416-555-0100',
      email: 'office@playground.test',
      website: 'www.playground.test',
      principal: 'Ms. Amal Haddad',
      board: 'Private',
    },
    assets: { logo: null, principalSignature: null, stamp: null, teacherSignature: null },
    student: {
      id: `sample-${key}`,
      name: `${first} ${last}`,
      firstName: first,
      lastName: last,
      oen: '123-456-789',
      grade,
      gradeLabel: gradeLabel(grade),
      gradeNumber: n,
      homeroomTeacher: kinder ? (grade === 'JK' ? 'Ms. Mona Aziz' : 'Ms. Rana Khalil') : pick(TEACHERS, n),
      teacherAssistant: kinder ? 'Ms. Rima Khatib' : '',
      daysAbsent: worst ? 27 : 4,
    },
    subjects: kinder ? [] : subjects(first, n <= 3 ? SUBJECTS_PRIMARY : SUBJECTS_JUNIOR, worst),
    skills: skillGroups,
    comments,
    learningSkills: grade === 'JK' || worst ? learningSkills : n >= 1 ? learningSkills : [],
    extra: {},
  };
}
