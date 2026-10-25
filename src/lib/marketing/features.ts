import type { Feature } from '@/components/marketing/FeatureRows'

// Feature write-ups for the homepage and /product. Each one is shipped and
// worded to match the code (docs/research/landing-revamp/notes/feature-verification.md).

export const OPERATIONS: Feature[] = [
  {
    title: 'Timetables',
    summary: 'Built from your rules, or by hand.',
    detail: [
      'Tell the planner your teachers, rooms, courses and rules, and it builds a timetable with no clashes.',
      'Prefer to place classes yourself? Drag them into place, and SchoolMule warns you about conflicts.',
    ],
    src: '/marketing/screens/admin-schedule.jpg',
    url: 'schoolmule.ca/school-schedule',
    alt: 'The whole-school timetable for the demo school',
    who: 'For the office',
  },
  {
    title: 'Staff hours',
    summary: 'Check-ins and hours for each pay period.',
    detail: [
      'Staff check in each day, and you see their hours for every pay period, with Ontario statutory holidays counted.',
      'A Google Sheet of staff hours can stay up to date by itself, one tab per pay day.',
    ],
    src: '/marketing/screens/admin-staff.jpg',
    url: 'schoolmule.ca/staff-attendance',
    alt: 'Staff attendance for a pay period, with hours per staff member',
    who: 'For the office',
  },
  {
    title: 'Approvals and staff roles',
    summary: 'Who gets in, and what each person can do.',
    detail: [
      'Families, teachers and students ask for an account on your school’s sign-up page, and you approve them in one place.',
      'Make roles such as Office Staff by choosing what each one can see and do.',
    ],
    src: '/marketing/screens/admin-approvals.jpg',
    url: 'schoolmule.ca/admin-panel/approvals',
    alt: 'Account requests waiting for approval',
    who: 'For the office',
  },
  {
    title: 'Every conversation',
    summary: 'All family messages, and which need a reply.',
    detail: [
      'See every conversation between families and staff, filtered by class, teacher or status.',
      'If a parent’s message goes unanswered, SchoolMule can remind the teacher, and then let the office know.',
    ],
    src: '/marketing/screens/admin-messages.jpg',
    url: 'schoolmule.ca/admin-panel/messages',
    alt: 'All conversations between families and staff, with replies needed marked',
    who: 'For the office',
  },
  {
    title: 'School calendar',
    summary: 'Closures, PA days and events in one place.',
    detail: [
      'Put closures, PA days and events on one calendar that families can see.',
      'Mark which days staff are paid, off or working, and staff hours follow.',
    ],
    src: '/marketing/screens/admin-calendar.jpg',
    url: 'schoolmule.ca/admin-panel/calendar',
    alt: 'The school calendar for October',
    who: 'For the office',
  },
  {
    title: 'People',
    summary: 'Every account, and a read-only view as anyone.',
    detail: [
      'Every staff member, family and student in one list. Archive people without losing their history.',
      'Open SchoolMule as a teacher or a parent sees it, read-only, to help them or check what they see.',
    ],
    src: '/marketing/screens/admin-users.jpg',
    url: 'schoolmule.ca/admin-panel/users',
    alt: 'The list of people at the demo school',
    who: 'For the office',
  },
]

export const CLASSROOM: Feature[] = [
  {
    title: 'Gradebook',
    summary: 'Weighted categories that add themselves up.',
    detail: [
      'Set up categories and weights once. Missing work counts as zero, excused work never counts, and a blank isn’t graded yet.',
      'Scores save as teachers type, totals update straight away, and any gradebook exports to Excel.',
    ],
    src: '/marketing/screens/teacher-gradebook.jpg',
    url: 'schoolmule.ca/classes/grade-5-math',
    alt: 'The Grade 5 Math gradebook',
    who: 'For teachers',
  },
  {
    title: 'Publish & Notify',
    summary: 'Grades go out when the teacher is ready.',
    detail: [
      'Grades stay private until a teacher publishes them, and families only ever see published work.',
      'Each family gets one email listing what is new, with a link to ask the teacher about it.',
    ],
    src: '/marketing/screens/teacher-published.jpg',
    url: 'schoolmule.ca/classes/grade-5-math',
    alt: 'Quiz 3 published, with emails going to 12 families',
    who: 'For teachers',
  },
  {
    title: 'Attendance',
    summary: 'Daily and by class, in a few taps.',
    detail: [
      'Mark everyone present, then change the few who are late or away.',
      'Take attendance for the day or for each class. Families see their child’s attendance in their portal.',
    ],
    src: '/marketing/screens/teacher-attendance.jpg',
    url: 'schoolmule.ca/attendance',
    alt: 'Grade 5 attendance with present, late and absent marked',
    who: 'For teachers',
  },
  {
    title: 'Classwork and quizzes',
    summary: 'Assignments, quizzes and turned-in work.',
    detail: [
      'Post assignments and materials, collect work, and give quizzes. Multiple-choice answers are marked automatically, and teachers review written ones.',
      'The student portal is part of SchoolMule, and your school turns it on when it is ready.',
    ],
    src: '/marketing/screens/student-quiz.jpg',
    url: 'schoolmule.ca/student',
    alt: 'A science quiz question about simple machines',
    who: 'For teachers and students',
  },
  {
    title: 'Feedback on work',
    summary: 'A comment with every grade.',
    detail: [
      'Teachers can add written feedback to anything they grade, and students and parents see it with the grade.',
      'Students can reply about the work in a private conversation with the teacher.',
    ],
    src: '/marketing/screens/student-feedback.jpg',
    url: 'schoolmule.ca/student',
    alt: 'A graded science lab with the teacher’s feedback',
    who: 'For students and parents',
  },
]

export const COMMUNICATION: Feature[] = [
  {
    title: 'Parent and teacher messages',
    summary: 'Private conversations, with the grade attached.',
    detail: [
      'Families and teachers write to each other privately. A question about a grade arrives with the assessment pinned to it.',
      'Attach photos, PDFs or documents. Several messages in a row arrive as one email.',
    ],
    src: '/marketing/screens/teacher-reply.jpg',
    url: 'schoolmule.ca/messages',
    alt: "A parent's question about Quiz 3 with the quiz pinned",
    who: 'For teachers and parents',
  },
  {
    title: 'Ask the teacher',
    summary: 'Questions straight from the grade.',
    detail: [
      'Parents can ask about any published grade from the grade itself, so the teacher knows exactly what the question is about.',
      'The grade email has the same link, one tap from the inbox.',
    ],
    src: '/marketing/screens/parent-ask.jpg',
    url: 'schoolmule.ca/parent/grades',
    alt: 'A message to the teacher about Quiz 3 being written',
    who: 'For parents',
  },
  {
    title: 'Announcements',
    summary: 'To a class, a grade or the whole school.',
    detail: [
      'Post to a class, a grade, the whole school or a chosen list of families, by email and in the portal.',
      'See who has read it, and ask families to confirm with “Got it” when it matters.',
    ],
    src: '/marketing/screens/parent-dashboard.jpg',
    url: 'schoolmule.ca/parent/dashboard',
    alt: 'Announcements on the parent overview',
    who: 'For teachers and the office',
  },
  {
    title: 'The week, for parents',
    summary: 'A short summary of each child’s week.',
    detail: [
      'Parents see a few lines on how their child’s week went, written by AI from published grades, attendance and teacher feedback.',
      'It is labelled as written by AI, and asks parents to check details with the teacher.',
    ],
    src: '/marketing/screens/parent-summary.jpg',
    url: 'schoolmule.ca/parent/dashboard',
    alt: "Adam's average, attendance, latest feedback and an AI-written summary of his week",
    who: 'For parents',
    width: 1450,
    height: 906,
  },
  {
    title: 'Reply reminders',
    summary: 'No parent message left unanswered.',
    detail: [
      'If a parent’s message goes unanswered, SchoolMule reminds the teacher, and then lets the office know.',
      'Your school chooses whether to turn reminders on.',
    ],
    src: '/marketing/screens/admin-messages.jpg',
    url: 'schoolmule.ca/admin-panel/messages',
    alt: 'All conversations, with those needing a reply marked',
    who: 'For the office',
  },
]

export const REPORTING: Feature[] = [
  {
    title: 'Report cards',
    summary: 'A whole class at once, as PDFs.',
    detail: [
      'Grades 1 to 8 report cards with marks, work habits, behaviour and teacher comments, printed with your logo.',
      'Make one or a whole class, and email them to families.',
    ],
    src: '/marketing/reports/report-card-grade5-p2.jpg',
    url: '',
    alt: 'A Grade 5 report card page with Language Arts and Math',
    who: 'For the office and teachers',
    document: true,
  },
  {
    title: 'JK and SK report cards',
    summary: 'Skills, not percentages.',
    detail: [
      'Kindergarten progress reports and report cards rate skills by area, each with a comment.',
      'Your school sets the skills it reports on.',
    ],
    src: '/marketing/reports/kindergarten-report.jpg',
    url: '',
    alt: 'A Senior Kindergarten report card rating math skills',
    who: 'For kindergarten teachers',
    document: true,
  },
  {
    title: 'Report card comments',
    summary: 'A first draft from AI, if you want one.',
    detail: [
      'Teachers write comments in the gradebook, next to each student’s marks.',
      'AI can draft a first version from the student’s grades and the teacher’s ratings, to edit before anything is printed.',
    ],
    src: '/marketing/screens/admin-report-cards.jpg',
    url: 'schoolmule.ca/report-cards',
    alt: 'Report cards for a class, ready to generate',
    who: 'For teachers',
  },
]
