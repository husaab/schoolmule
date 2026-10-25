#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- a Node script that loads the backend's CommonJS templates */
/**
 * Render SchoolMule's real report-card / progress-report templates with
 * SYNTHETIC data (Brightwater Academy) for marketing images.
 *
 * - Calls the backend's own HTML builders directly (no DB, no network).
 * - Prints them to PDF with the backend's own createPDFBuffer() (same
 *   Puppeteer settings production uses: A4, 40px margins, printBackground).
 * - Rasterizes page 1 with poppler's pdftoppm (~1700px wide, JPEG q82).
 *
 * Read-only on the backend repo: it only require()s files from it.
 *
 * Usage:
 *   node render.js [outDir]
 *   (default outDir = schoolmule/.worktrees/landing-revamp/public/marketing/reports)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BACKEND = '/Users/husseinsaab/Documents/GitHub/schoolmule-project/schoolmule-backend';
const OUT_DIR = process.argv[2] ||
  '/Users/husseinsaab/Documents/GitHub/schoolmule-project/schoolmule/.worktrees/landing-revamp/public/marketing/reports';
const WORK_DIR = path.join(__dirname, 'build');

const { getReportCardHTML } = require(path.join(BACKEND, 'templates/reportCardTemplate'));
const { getProgressReportHTML } = require(path.join(BACKEND, 'templates/progressReportTemplate'));
const { getAlHaadiReportCardSKHTML } = require(path.join(BACKEND, 'templates/alHaadiReportCardSKTemplate'));
const { launchPDFBrowser, createPDFBuffer } = require(path.join(BACKEND, 'utils/pdfGenerator'));

// ── Synthetic school ────────────────────────────────────────────────────────
// Plain teal "B" tile, the same mark the demo film / app screenshots use for
// Brightwater Academy. Not a real school logo.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0891b2"/></linearGradient></defs>
  <rect width="240" height="240" rx="48" fill="url(#g)"/>
  <text x="120" y="160" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="132" font-weight="700" fill="#ffffff">B</text>
</svg>`;
const LOGO_URL = 'data:image/svg+xml;base64,' + Buffer.from(LOGO_SVG).toString('base64');

const SCHOOL_INFO = {
  name: 'Brightwater Academy',
  address: '250 Brightwater Avenue, Toronto, ON',
  phone: '(416) 555-0142', // 555-01xx = reserved fictional range
  email: '',
};
// No principal signature, no school stamp (left blank on purpose).
const SCHOOL_ASSETS = { logoUrl: LOGO_URL, principalSignatureUrl: null, schoolStampUrl: null };

// ── Grade 5 report card (general Ontario-style template) ───────────────────
const GRADE5_SUBJECTS = [
  {
    subject: 'Language Arts', grade: 86.4, work_habits: 'E', behavior: 'E',
    comment: 'Adam reads with growing fluency and makes thoughtful connections between the texts we study and his own experiences. His persuasive letter about reducing classroom waste was well organized and convincing. Next step: vary his sentence beginnings and proofread for punctuation before handing in final drafts.',
  },
  {
    subject: 'Math', grade: 91.2, work_habits: 'G', behavior: 'E',
    comment: 'Adam solves multi-step problems with whole numbers and decimals accurately and explains his thinking clearly to classmates. He was a strong partner during our data management unit. Next step: show every step of his work, even when he can solve a question in his head.',
  },
  {
    subject: 'Science', grade: 88.0, work_habits: 'G', behavior: 'G',
    comment: 'Adam asks good questions during investigations and records careful observations. His model of the human respiratory system showed a solid understanding of how organs work together. Next step: write conclusions that refer back to the data he collected.',
  },
  {
    subject: 'Social Studies', grade: 82.5, work_habits: 'G', behavior: 'E',
    comment: 'Adam contributed thoughtfully to our unit on how different levels of government serve their communities, and his presentation on local recycling programs was clear and well researched. Next step: use more than one source and note where his information comes from.',
  },
  {
    subject: 'French', grade: 78.6, work_habits: 'S', behavior: 'G',
    comment: 'Adam is building his French vocabulary and participates willingly in oral activities. He can introduce himself and describe his family with confidence. Next step: practise present-tense verb endings a few minutes each evening.',
  },
  {
    subject: 'Arabic', grade: 84.3, work_habits: 'G', behavior: 'E',
    comment: 'Adam reads short passages with improving accuracy and is learning to write full sentences with correct letter joins. Next step: review new vocabulary at home for a few minutes each day.',
  },
  {
    subject: 'Islamic Studies', grade: 93.1, work_habits: 'E', behavior: 'E',
    comment: 'Adam participates respectfully in discussions and shows a strong understanding of the topics we have covered this term. He is a kind and helpful member of our class.',
  },
  {
    subject: 'Art', grade: 89.0, work_habits: 'E', behavior: 'G',
    comment: 'Adam experiments confidently with colour and texture. His landscape collage showed careful planning and real attention to detail.',
  },
  {
    subject: 'Physical Education', grade: 92.5, work_habits: 'E', behavior: 'E',
    comment: 'Adam participates with enthusiasm, shows good sportsmanship and encourages his teammates. He has made great progress with his ball-handling skills.',
  },
];

function grade5ReportCardHTML() {
  return getReportCardHTML({
    schoolInfo: SCHOOL_INFO,
    schoolAssets: SCHOOL_ASSETS,
    term: 'Term 1',
    student: {
      name: 'Adam Haddad',
      grade: '5',
      oen: '123-456-789',
      homeroomTeacher: 'Layla Saleh',
      daysOfAbsence: 2,
      school: 'Brightwater Academy',
    },
    subjects: GRADE5_SUBJECTS.map(s => ({ subject: s.subject, grade: s.grade })),
    feedbacks: GRADE5_SUBJECTS.map(s => ({
      subject: s.subject, work_habits: s.work_habits, behavior: s.behavior, comment: s.comment,
    })),
    generatedDate: '2027-02-12',
  });
}

// ── Grade 5 progress report (general template) ─────────────────────────────
// Production orders classes alphabetically (ORDER BY c.subject).
const SUBJECT_TEACHER = {
  'Language Arts': 'Layla Saleh', Math: 'Layla Saleh', 'Social Studies': 'Layla Saleh',
  Science: 'Omar Nasser', French: 'Claire Martin', Arabic: 'Huda Mansour',
  'Islamic Studies': 'Yusuf Rahimi', Art: 'Rana Aziz', 'Physical Education': 'Bilal Ahmed',
};
const PROGRESS = {
  'Language Arts': ['Meeting Common Core Standards', 'E', 'E', 'Adam is a keen reader who shares his ideas confidently in book talks. He is working on adding more detail to his written responses.'],
  Math: ['Exceeding Common Core Standards', 'G', 'E', 'Adam has a strong grasp of place value and multiplication. Showing all of his steps on multi-step problems is his next goal.'],
  Science: ['Meeting Common Core Standards', 'G', 'G', 'Adam is curious during investigations and records his observations carefully.'],
  'Social Studies': ['Meeting Common Core Standards', 'G', 'E', 'Adam participates well in discussions about community and government and asks thoughtful questions.'],
  French: ['Working towards Common Core Standards', 'S', 'G', 'Adam participates willingly in oral activities. Regular vocabulary practice at home will build his confidence.'],
  Arabic: ['Meeting Common Core Standards', 'G', 'E', 'Adam reads short passages with improving accuracy and is learning to join letters correctly.'],
  'Islamic Studies': ['Exceeding Common Core Standards', 'E', 'E', 'Adam participates respectfully and shows a strong understanding of this term\'s topics.'],
  Art: ['Meeting Common Core Standards', 'E', 'G', 'Adam experiments confidently with colour and texture and plans his work carefully.'],
  'Physical Education': ['Exceeding Common Core Standards', 'E', 'E', 'Adam participates with enthusiasm and is a supportive teammate.'],
};

function grade5ProgressReportHTML() {
  const progressData = Object.keys(PROGRESS).sort().map(subject => {
    const [coreStandards, workHabit, behavior, comment] = PROGRESS[subject];
    return { subject, teacherName: SUBJECT_TEACHER[subject], classGrade: '5', coreStandards, workHabit, behavior, comment };
  });
  return getProgressReportHTML({
    schoolInfo: SCHOOL_INFO,
    student: { name: 'Adam Haddad', grade: '5', oen: '123-456-789', homeroomTeacher: 'Layla Saleh' },
    term: 'Term 1',
    progressData,
    generatedDate: '11/20/2026', // production passes toLocaleDateString() (server locale)
    schoolAssets: SCHOOL_ASSETS,
  });
}

// ── SK report card (skill-based; E / P / DV / EM / NI / N/A scale) ──────────
// Subjects + standards are the report_card framework from
// database/sk_seed_alhaadi.sql (each school configures its own in
// sk_subjects / sk_standards). One Islamic Studies line is generalized.
// Ratings: Term 1 only — Term 2 is blank, as on a real first-term card.
const SK_FRAMEWORK = [
  ['Mathematics - Counting and Cardinality', [
    ['Counts to 100 by ones and tens', 'E'],
    ['Writes numbers from 0 – 100', 'P'],
    ['Counts groups of up to 20 objects accurately', 'E'],
    ['Compares two numbers between 1 and 10 using less than, greater than or equal to', 'P'],
    ['Represents addition and subtraction within 10 using objects', 'P'],
    ['Decomposes numbers through ten in more than one way', 'DV'],
    ['Finds the number that makes 10 when added to a given number from 1 – 9', 'DV'],
    ['Fluently adds within 10', 'P'],
    ['Fluently subtracts within 10', 'DV'],
    ['Composes and decomposes numbers from 11 – 19 into tens and ones', 'EM'],
  ], 'Sara counts confidently to 100 and loves the counting games at our math centre. She is beginning to see different ways to make 10. Next step: practise simple subtraction stories at home using small objects such as buttons or blocks.'],
  ['Mathematics - Measurement and Data', [
    ['Describes attributes of objects, such as length or weight', 'P'],
    ['Directly compares objects to see which is heavier/lighter, taller/shorter, etc.', 'E'],
    ['Classifies (sorts) objects into categories and counts the objects in each category', 'E'],
  ], 'Sara sorts and compares objects with ease and explains her sorting rule clearly to her friends.'],
  ['Mathematics - Geometry', [
    ['Describes objects using names of shapes', 'E'],
    ['Describes the relative position of shapes using terms such as above, below, in front of, behind and next to', 'P'],
    ['Identifies shapes as 2-dimensional or 3-dimensional', 'DV'],
    ['Identifies 2-dimensional shapes: rectangle, triangle, square, circle, hexagon', 'E'],
    ['Identifies 3-dimensional shapes: cube, cone, cylinder, sphere', 'P'],
  ], 'Sara names 2-D shapes confidently and enjoys finding them around the classroom. Next step: notice the difference between flat shapes and solid shapes.'],
  ['English/Language Arts - Reading Standards', [
    ['Retells familiar stories; Asks and answers questions about key details of a text', 'P'],
    ['Identifies characters, settings, and major events in a story', 'P'],
    ['Identifies front/back cover and title page of a book; Defines role of author and illustrator', 'E'],
    ['Actively engages in group reading activities with purpose and understanding', 'E'],
    ['Compare and contrasts texts on the same topic', 'DV'],
    ['Makes connections between self, text, and the world', 'P'],
  ], 'Sara is an eager listener at story time and often connects stories to her own family.'],
  ['English/Language Arts - Foundational Skills', [
    ['Tracks print from left to right, top to bottom, and page to page', 'E'],
    ['Points to words with one-to-one correspondence (voice-to-print match)', 'P'],
    ['Recognizes and names uppercase and lowercase letters', 'E'],
    ['Recognizes and produces rhyming words', 'P'],
    ['Segments words into individual sounds and blends sounds into words', 'DV'],
    ['Produces sound for each consonant and vowel', 'P'],
    ['Reads grade-level high-frequency words by sight', 'DV'],
    ['Reads grade-level texts with accuracy, purpose, and understanding', 'DV'],
  ], ''],
  ['Social Skills and Work Habits', [
    ['Shows enthusiasm for learning', 'E'],
    ['Demonstrates appropriate self-control', 'P'],
    ['Follows instructions with minimal supervision', 'P'],
    ['Displays respect and cooperation', 'E'],
  ], 'Sara is a kind friend who takes turns and helps tidy up without being asked.'],
];

function skReportCardHTML() {
  const subjects = [];
  const ratingMapTerm1 = {};
  const commentMap = {};
  SK_FRAMEWORK.forEach(([name, standards, comment], i) => {
    const subjectId = `s${i + 1}`;
    subjects.push({
      subjectId, name,
      standards: standards.map(([sName, rating], j) => {
        const standardId = `${subjectId}-${j + 1}`;
        ratingMapTerm1[standardId] = rating;
        return { standardId, name: sName };
      }),
    });
    if (comment) commentMap[subjectId] = comment;
  });

  const html = getAlHaadiReportCardSKHTML({
    schoolInfo: SCHOOL_INFO,
    // No corner logo here: the template pins it top-right over the title
    // and the "Days Absent" cell, so any opaque logo clips them.
    schoolAssets: { ...SCHOOL_ASSETS, logoUrl: null },
    student: {
      name: 'Sara Haddad', grade: 'SK', oen: '987-654-321',
      homeroomTeacher: 'Amina Farouk', teacherAssistant: 'Dalal Youssef', daysOfAbsence: 1,
    },
    term: 'Term 1',
    subjects,
    ratingMapTerm1,
    ratingMapTerm2: {},
    commentMap,
    generatedDate: '2027-02-12',
  });

  // The SK template hardcodes one school's website and principal name.
  // Swap them for synthetic placeholders so no real school/person appears.
  const swaps = [
    ['Website: www.alhaadiacademy.ca', 'Website: www.brightwater.example'],
    ['Principal: Sr. Majida', 'Principal: Ms. Nadia Karim'],
  ];
  let out = html;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`SK template changed: "${from}" not found`);
    out = out.split(from).join(to);
  }
  return out;
}

// ── Render ──────────────────────────────────────────────────────────────────
// pages: which PDF pages to export. Page 1 -> <name>.jpg, page N -> <name>-pN.jpg
const JOBS = [
  { name: 'report-card-grade5', html: grade5ReportCardHTML, pages: [1, 2] },
  { name: 'progress-report-grade5', html: grade5ProgressReportHTML, pages: [1] },
  { name: 'kindergarten-report', html: skReportCardHTML, pages: [1] },
];

const FORBIDDEN = /\bundefined\b|\bnull\b|\bNaN\b|\[object|al ?haadi|majida/;
const FORBIDDEN_CI = /al ?haadi|majida/i;

(async () => {
  fs.mkdirSync(WORK_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await launchPDFBrowser();
  try {
    for (const job of JOBS) {
      const html = job.html();
      // Check only the visible body text (CSS/comments may legitimately contain words).
      const body = html.slice(html.indexOf('<body'));
      const visible = body.replace(/<[^>]+>/g, ' ');
      const bad = visible.match(FORBIDDEN) || visible.match(FORBIDDEN_CI);
      if (bad) throw new Error(`${job.name}: visible text contains "${bad[0]}"`);

      fs.writeFileSync(path.join(WORK_DIR, `${job.name}.html`), html);
      const pdf = await createPDFBuffer(html, { browser }); // production defaults
      const pdfPath = path.join(WORK_DIR, `${job.name}.pdf`);
      fs.writeFileSync(pdfPath, pdf);

      for (const pg of job.pages) {
        const outBase = path.join(WORK_DIR, `${job.name}-p${pg}`);
        execFileSync('pdftoppm', [
          '-f', String(pg), '-l', String(pg), '-singlefile',
          '-scale-to-x', '1700', '-scale-to-y', '-1',
          '-jpeg', '-jpegopt', 'quality=82',
          pdfPath, outBase,
        ]);
        const outName = pg === 1 ? `${job.name}.jpg` : `${job.name}-p${pg}.jpg`;
        fs.copyFileSync(`${outBase}.jpg`, path.join(OUT_DIR, outName));
        console.log(`  page ${pg} -> ${path.join(OUT_DIR, outName)}`);
      }
      const pages = execFileSync('pdfinfo', [pdfPath]).toString().match(/Pages:\s+(\d+)/)?.[1];
      console.log(`${job.name}: ${pages}-page PDF (${pdfPath})`);
    }
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exit(1); });
