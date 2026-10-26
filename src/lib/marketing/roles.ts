import type { ViewKey } from './site'

// The four role pages (/for/<slug>). Every job listed is shipped and checked
// against the code (docs/research/landing-revamp/notes/feature-verification.md).

export interface RoleJob {
  title: string
  text: string
  src: string
  alt: string
  url?: string
  /** Phone screenshots go in a phone frame. */
  phone?: boolean
}

export interface RolePageData {
  slug: string
  view: ViewKey
  name: string
  pill: string
  title: { plain: string; accent: string }
  lead: string
  metaTitle: string
  metaDescription: string
  chapter: 'teachers' | 'students' | 'parents' | 'office'
  jobs: RoleJob[]
  also?: string
  /** Parents and students often arrive from their school: offer the way in first. */
  existingUsers?: boolean
  faq: { q: string; a: string }[]
  closer?: { heading: string; sub: string }
}

// The same Quiz 3 moment, from each view.
export const SAME_MOMENT: Record<ViewKey, { label: string; text: string; src: string; href: string }> = {
  leaders: {
    label: 'School leaders',
    text: 'See every family conversation, and which still need a reply.',
    src: '/marketing/screens/admin-messages.jpg',
    href: '/for/school-leaders',
  },
  teachers: {
    label: 'Teachers',
    text: 'Ms. Saleh publishes Quiz 3, and each family is emailed.',
    src: '/marketing/screens/teacher-published.jpg',
    href: '/for/teachers',
  },
  parents: {
    label: 'Parents',
    text: 'Amal sees Quiz 3 and asks the teacher about it.',
    src: '/marketing/screens/parent-ask.jpg',
    href: '/for/parents',
  },
  students: {
    label: 'Students',
    text: 'Adam sees 19 out of 20, with feedback.',
    src: '/marketing/screens/student-home.jpg',
    href: '/for/students',
  },
}

export const ROLE_PAGES: RolePageData[] = [
  {
    slug: 'school-leaders',
    view: 'leaders',
    name: 'School leaders',
    pill: 'For principals, owners and office staff',
    title: { plain: 'See the whole school, ', accent: 'without chasing it.' },
    lead: 'Report cards, timetables, staff hours, approvals and every family conversation, in one place your whole office shares.',
    metaTitle: 'School Administration Software for Independent Schools',
    metaDescription:
      'Report cards for a whole class at once, timetables built from your rules, staff hours by pay period, approvals, staff roles and every family conversation. Built for Ontario independent schools.',
    chapter: 'office',
    jobs: [
      {
        title: 'Report cards for a whole class at once',
        text: 'Teachers write their comments in the gradebook. You check them, make every report card in a class as a PDF with your logo, and email them to families.',
        src: '/marketing/screens/admin-report-cards.jpg',
        alt: 'Report cards for a class, ready to generate',
        url: 'schoolmule.ca/report-cards',
      },
      {
        title: 'Timetables from your rules, or by hand',
        text: 'Tell the planner your teachers, rooms, courses and rules, and it builds a timetable with no clashes. Or drag classes into place yourself, with conflicts flagged.',
        src: '/marketing/screens/admin-schedule.jpg',
        alt: 'The whole-school timetable',
        url: 'schoolmule.ca/school-schedule',
      },
      {
        title: 'Staff hours for every pay period',
        text: 'Staff check in each day. You see hours for each pay period with Ontario statutory holidays counted, and a Google Sheet of hours can stay up to date by itself.',
        src: '/marketing/screens/admin-staff.jpg',
        alt: 'Staff hours for a pay period',
        url: 'schoolmule.ca/staff-attendance',
      },
      {
        title: 'Every family conversation in one inbox',
        text: 'See every conversation between families and staff, and which ones still need a reply. If a parent’s message goes unanswered, SchoolMule can remind the teacher, then tell the office.',
        src: '/marketing/screens/admin-messages.jpg',
        alt: 'All conversations between families and staff',
        url: 'schoolmule.ca/admin-panel/messages',
      },
      {
        title: 'Approvals, staff roles and a view as anyone',
        text: 'Approve families, teachers and students who ask to join. Make roles such as Office Staff from a list of permissions. Open SchoolMule as any teacher or parent sees it, read-only.',
        src: '/marketing/screens/admin-approvals.jpg',
        alt: 'Account requests waiting for approval',
        url: 'schoolmule.ca/admin-panel/approvals',
      },
    ],
    also:
      'Also for the office: analytics from the whole school down to one student, with a list of students to check in on; online forms and registration that become student records; tuition read from QuickBooks Online; a school calendar families can see; and a guided start to each new school year.',
    faq: [
      {
        q: 'Can I see what a teacher or parent sees?',
        a: 'Yes. Open SchoolMule as any teacher or parent, read-only, to help them or check what they see.',
      },
      {
        q: 'Can office staff have limited access?',
        a: 'Yes. Make a role, such as Office Staff, by choosing what it can see and do, and give it to the people who need it.',
      },
      {
        q: 'Does SchoolMule handle tuition?',
        a: 'SchoolMule shows each family’s tuition, invoiced, paid and outstanding, read from QuickBooks Online. Invoices and payments stay in QuickBooks.',
      },
      {
        q: 'How do families and staff get accounts?',
        a: 'You can invite people by email, or they can ask to join on your school’s sign-up page and you approve them.',
      },
    ],
  },
  {
    slug: 'teachers',
    view: 'teachers',
    name: 'Teachers',
    pill: 'For teachers',
    title: { plain: 'Attendance and grades in minutes. ', accent: 'Families told in one click.' },
    lead: 'Your day, your classes and your families in one place. Enter a grade once, and students and parents see it when you publish.',
    metaTitle: 'Gradebook, Attendance and Report Card Software for Teachers',
    metaDescription:
      'A gradebook that saves as you type, attendance in seconds, Publish & Notify emails to families, and parent questions that arrive with the assessment attached.',
    chapter: 'teachers',
    jobs: [
      {
        title: 'Your day at a glance',
        text: 'Today’s classes, your students, class averages, missing work and the latest announcements, the moment you sign in.',
        src: '/marketing/screens/teacher-dashboard.jpg',
        alt: "A teacher's dashboard with the day's timetable and class summaries",
        url: 'schoolmule.ca/dashboard',
      },
      {
        title: 'Attendance in seconds',
        text: 'Mark everyone present, change the few who are late or away, and save.',
        src: '/marketing/screens/teacher-attendance.jpg',
        alt: 'Grade 5 attendance with present, late and absent marked',
        url: 'schoolmule.ca/attendance',
      },
      {
        title: 'A gradebook that adds itself up',
        text: 'Weighted categories, Missing that counts as zero and Excused that never counts. It saves as you type and exports to Excel.',
        src: '/marketing/screens/teacher-gradebook.jpg',
        alt: 'The Grade 5 Math gradebook with projects, homework, quizzes and unit tests',
        url: 'schoolmule.ca/classes/grade-5-math',
      },
      {
        title: 'Publish & Notify',
        text: 'Grades stay private until you publish them. Then each family gets one email listing what is new, with a link to ask you about it.',
        src: '/marketing/screens/teacher-published.jpg',
        alt: 'Quiz 3 published, with emails going to 12 families',
        url: 'schoolmule.ca/classes/grade-5-math',
      },
      {
        title: 'Questions that arrive with their context',
        text: 'When a parent asks about a grade, the assessment is pinned to the conversation, with the score and the class average.',
        src: '/marketing/screens/teacher-reply.jpg',
        alt: "A parent's question about Quiz 3, with the quiz pinned to the conversation",
        url: 'schoolmule.ca/messages',
      },
    ],
    also:
      'Also for teachers: report card comments with a first draft from AI if you want one, announcements to your class, and classwork and quizzes when your school turns on the student portal.',
    faq: [
      {
        q: 'Do I have to publish every grade?',
        a: 'No. Grades stay private until you publish them. Students and parents see only published work, and their averages count only what is published.',
      },
      {
        q: 'What happens when a parent messages me?',
        a: 'You get an email, and the message lands in your Messages with the assessment pinned if they asked about one. If it goes unanswered, SchoolMule can remind you.',
      },
      {
        q: 'Can I use it on my phone?',
        a: 'Yes. SchoolMule works in your phone’s browser.',
      },
      {
        q: 'Will it write report card comments for me?',
        a: 'It can draft a first version from the student’s grades and your ratings. You edit it before anything is printed.',
      },
    ],
  },
  {
    slug: 'parents',
    view: 'parents',
    name: 'Parents',
    pill: 'For parents and guardians',
    title: { plain: 'Know how your child is doing, ', accent: 'without calling the office.' },
    lead: 'Grades with the teacher’s feedback, a short summary of the week, and a direct line to the teacher, from any phone.',
    metaTitle: 'Parent Portal for Independent Schools',
    metaDescription:
      'Parents see their child’s grades with the teacher’s feedback, a short summary of the week and the school calendar, and can ask the teacher about a specific grade. No app to install.',
    chapter: 'parents',
    existingUsers: true,
    jobs: [
      {
        title: 'The week, in a few lines',
        text: 'A short summary of how your child’s week went, written by AI from published grades, attendance and teacher feedback, and labelled that way.',
        src: '/marketing/screens/parent-summary.jpg',
        alt: "Adam's overall average, attendance, latest teacher feedback and an AI-written summary of his week",
      },
      {
        title: 'Grades with the teacher’s feedback',
        text: 'Every published mark by class, with the class average and anything marked missing.',
        src: '/marketing/screens/parent-grades.jpg',
        alt: "The parent's grades page, class by class",
        url: 'schoolmule.ca/parent/grades',
      },
      {
        title: 'Ask the teacher about a specific grade',
        text: 'Write to the teacher from the grade itself, so your question arrives with the quiz attached.',
        src: '/marketing/screens/parent-ask.jpg',
        alt: 'A message to the teacher about Quiz 3 being written from the grades page',
        url: 'schoolmule.ca/parent/grades',
      },
      {
        title: 'Every child, on any phone',
        text: 'Announcements, the school calendar, attendance and report cards for each of your children. No app to install: emails sign you in with one tap.',
        src: '/marketing/screens/parent-phone.jpg',
        alt: 'The parent overview on a phone, with a switch between children',
        phone: true,
      },
    ],
    faq: [
      {
        q: 'Do I need to download an app?',
        a: 'No. SchoolMule works in any browser. When something new is published you get an email, and the link in it signs you in with one tap.',
      },
      {
        q: 'How do I get an account?',
        a: 'Your school invites you by email, or you can ask to join on your school’s sign-up page.',
      },
      {
        q: 'Who can see my child’s information?',
        a: 'Only staff at your school, and only what their role allows. You see only your own children.',
      },
      {
        q: 'Who writes the weekly summary?',
        a: 'It is written by AI from your child’s published grades, attendance and teacher feedback, and labelled as AI. Check anything important with the teacher.',
      },
    ],
    closer: {
      heading: 'Want SchoolMule at your child’s school?',
      sub: 'Send this page to your principal, or book a demo together.',
    },
  },
  {
    slug: 'students',
    view: 'students',
    name: 'Students',
    pill: 'For students',
    title: { plain: 'Your work, your feedback, ', accent: 'what’s due.' },
    lead: 'When a school turns on the student portal, students see their classes, turn in work, take quizzes and read their teachers’ feedback, on a computer or a phone.',
    metaTitle: 'Student Portal for Classwork, Quizzes and Feedback',
    metaDescription:
      'Students see what is due, turn in work, take quizzes and read feedback on every graded item. Parents see the same classes, read-only.',
    chapter: 'students',
    existingUsers: true,
    jobs: [
      {
        title: 'What’s due and what’s new',
        text: 'Missing work at the top, what is due this week, and new grades as soon as they are published.',
        src: '/marketing/screens/student-home.jpg',
        alt: "Adam's home page with work due soon and new grades",
        url: 'schoolmule.ca/student',
      },
      {
        title: 'Feedback on every graded item',
        text: 'The grade, the teacher’s comment and a private conversation about the work, all in one place.',
        src: '/marketing/screens/student-feedback.jpg',
        alt: 'A graded science lab with the teacher’s feedback and messages',
        url: 'schoolmule.ca/student',
      },
      {
        title: 'Quizzes, built in',
        text: 'Multiple-choice questions are marked automatically, and teachers review written answers.',
        src: '/marketing/screens/student-quiz.jpg',
        alt: 'A science quiz question about simple machines',
        url: 'schoolmule.ca/student',
      },
      {
        title: 'On a phone too',
        text: 'Everything works in a phone’s browser. Students sign in with Google, and young students can use a printed QR card.',
        src: '/marketing/screens/student-phone.jpg',
        alt: "Adam's student home on a phone",
        phone: true,
      },
    ],
    faq: [
      {
        q: 'From what grade can students sign in?',
        a: 'Your school decides. Younger students can sign in with a printed QR card.',
      },
      {
        q: 'Can parents see their child’s classwork?',
        a: 'Yes. Parents see the same classes, read-only.',
      },
      {
        q: 'Can students message their teachers?',
        a: 'Yes, about an assignment or in general, and teachers see it with the rest of their messages.',
      },
    ],
    closer: {
      heading: 'Want SchoolMule at your school?',
      sub: 'Ask your principal to book a demo.',
    },
  },
]

export const rolePage = (slug: string) => ROLE_PAGES.find((r) => r.slug === slug)
