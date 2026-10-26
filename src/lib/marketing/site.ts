// One place for the facts the marketing pages repeat: links, the film's
// chapters, and the claims the founder has approved. The research behind
// every choice is in docs/research/landing-revamp (README.md and plan.md).

export const SITE_URL = 'https://schoolmule.ca'
export const CONTACT_EMAIL = 'info@schoolmule.ca'
export const CALENDLY_URL = 'https://calendly.com/husseinsaab14/30min'
// The Calendly event itself is 15 minutes (its link says 30min); outreach emails say 15 too.
export const DEMO_MINUTES = 15
export const FOUNDER = {
  name: 'Hussein Saab',
  firstName: 'Hussein',
  // A square crop of the founder's headshot, for the founder note. Set to null
  // to show initials.
  photo: '/marketing/founder.jpg' as string | null,
}

// The only usage claim the founder has approved (2026-10-25). No counts, no
// school names, no quotes until a school agrees to be named.
export const USAGE_CLAIM = 'In daily use at Ontario schools'

// The four views and their colours (the film's role tones).
export type ViewKey = 'leaders' | 'teachers' | 'parents' | 'students'

export const VIEW_COLOURS: Record<ViewKey, { dot: string; text: string; wash: string; ring: string }> = {
  leaders: { dot: 'bg-leaders', text: 'text-leaders', wash: 'bg-[#eef5f8]', ring: 'ring-leaders/25' },
  teachers: { dot: 'bg-teachers', text: 'text-teachers-ink', wash: 'bg-[#ecf8fb]', ring: 'ring-teachers/30' },
  parents: { dot: 'bg-parents', text: 'text-parents-ink', wash: 'bg-[#fff6ea]', ring: 'ring-parents/30' },
  students: { dot: 'bg-students', text: 'text-students-ink', wash: 'bg-[#f1f1ff]', ring: 'ring-students/25' },
}

// The film (remotion/src/demo), 1:41. Loops under public/videos/chapters are
// silent cuts of it; the full film with sound plays only when asked for.
export const FILM = {
  src1080: '/videos/schoolmule-demo-1080p.mp4',
  src720: '/videos/schoolmule-demo-720p.mp4',
  poster: '/videos/schoolmule-demo-poster.jpg',
  length: '1:41',
  seconds: 101,
  uploadDate: '2026-10-24',
}

export interface Chapter {
  key: 'teachers' | 'students' | 'parents' | 'reply' | 'phones' | 'office'
  label: string
  start: number
  end: number
  /** Silent loop and its first frame, for chapters a page plays on its own. */
  loop?: string
  poster?: string
}

export type PlayableChapter = Chapter & { loop: string; poster: string }

export const CHAPTERS: Chapter[] = [
  { key: 'teachers', label: 'Teachers', start: 15, end: 38, loop: '/videos/chapters/teacher.mp4', poster: '/videos/chapters/teacher.jpg' },
  { key: 'students', label: 'Students', start: 38, end: 54, loop: '/videos/chapters/student.mp4', poster: '/videos/chapters/student.jpg' },
  { key: 'parents', label: 'Parents', start: 54, end: 69, loop: '/videos/chapters/parent.mp4', poster: '/videos/chapters/parent.jpg' },
  { key: 'reply', label: 'The reply', start: 69, end: 77 },
  { key: 'phones', label: 'On phones', start: 77, end: 81 },
  { key: 'office', label: 'The office', start: 81, end: 88, loop: '/videos/chapters/office.mp4', poster: '/videos/chapters/office.jpg' },
]

export const chapter = (key: 'teachers' | 'students' | 'parents' | 'office') => CHAPTERS.find((c) => c.key === key) as PlayableChapter

export const HERO_LOOP = { src: '/videos/chapters/hero.mp4', srcSmall: '/videos/chapters/hero-sm.mp4', poster: FILM.poster }

export const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

// Navigation. Overview first in every list (founder's rule).
export const PRODUCT_LINKS = [
  { href: '/product', label: 'Overview', blurb: 'Everything SchoolMule does' },
  { href: '/for/school-leaders', label: 'School leaders', blurb: 'Principals, owners and office staff', view: 'leaders' as ViewKey },
  { href: '/for/teachers', label: 'Teachers', blurb: 'Attendance, grades and families', view: 'teachers' as ViewKey },
  { href: '/for/parents', label: 'Parents', blurb: 'Grades, messages and the week', view: 'parents' as ViewKey },
  { href: '/for/students', label: 'Students', blurb: 'Classwork, quizzes and feedback', view: 'students' as ViewKey },
]

export const SCHOOL_LINKS = [{ href: '/for/islamic-schools', label: 'Islamic schools' }]

export const MARKETING_PAGES = [
  '/',
  '/product',
  '/for/school-leaders',
  '/for/teachers',
  '/for/parents',
  '/for/students',
  '/for/islamic-schools',
  '/about',
  '/demo',
  '/contact',
] as const
