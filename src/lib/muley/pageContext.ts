// src/lib/muley/pageContext.ts
// What Muley is told about the page the person is on, and what the panel
// says about it before the server answers. Only the route and a class id are
// sent; the server checks the class with the person's own access before it
// tells the model anything (an id the person can't open is ignored).

export type PageKind =
  | 'report-comments' | 'gradebook' | 'class' | 'class-attendance' | 'attendance' | 'students' | 'analytics' | 'reports' | 'admin' | 'dashboard'
  | 'parent-grades' | 'parent-attendance' | 'parent-meetings' | 'parent-calendar' | 'parent-classes' | 'parent'
  | 'other'

export type PageContext = {
  route: string
  kind: PageKind
  classId: string | null
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

// Most specific first. The class id is the first capture.
const ROUTES: { kind: PageKind; pattern: RegExp }[] = [
  // The parent portal: no class id is ever sent from it.
  { kind: 'parent-grades', pattern: /^\/parent\/(?:grades|feedback|report-cards)(?:\/|$)/ },
  { kind: 'parent-attendance', pattern: /^\/parent\/attendance(?:\/|$)/ },
  { kind: 'parent-meetings', pattern: /^\/parent\/meetings(?:\/|$)/ },
  { kind: 'parent-calendar', pattern: /^\/parent\/calendar(?:\/|$)/ },
  { kind: 'parent-classes', pattern: /^\/parent\/classes(?:\/|$)/ },
  { kind: 'parent', pattern: /^\/parent(?:\/|$)/ },
  { kind: 'report-comments', pattern: new RegExp(`^/gradebook/(${UUID})/feedback(?:/|$)`, 'i') },
  { kind: 'gradebook', pattern: new RegExp(`^/gradebook/(?:jk/|sk/)?(${UUID})(?:/|$)`, 'i') },
  { kind: 'class-attendance', pattern: new RegExp(`^/attendance/class/(${UUID})(?:/|$)`, 'i') },
  { kind: 'class', pattern: new RegExp(`^/classes/(${UUID})(?:/|$)`, 'i') },
  { kind: 'attendance', pattern: /^\/attendance(?:\/|$)/ },
  { kind: 'gradebook', pattern: /^\/gradebook(?:\/|$)/ },
  { kind: 'students', pattern: /^\/students(?:\/|$)/ },
  { kind: 'analytics', pattern: /^\/analytics(?:\/|$)/ },
  { kind: 'reports', pattern: /^\/(?:reports|report-cards)(?:\/|$)/ },
  { kind: 'admin', pattern: /^\/admin-panel(?:\/|$)/ },
  { kind: 'dashboard', pattern: /^\/dashboard(?:\/|$)/ },
]

/**
 * The page context for a pathname, and the query when there is one: a class
 * page's Grades tab is the gradebook, and its Report card comments sub-tab
 * the comments page (?tab=grades&sub=report-comments). Only the route and
 * the class id are ever sent; the query never is.
 */
export function pageContextFor(pathname: string, search = ''): PageContext {
  const route = (pathname || '/').split(/[?#]/)[0]
  for (const { kind, pattern } of ROUTES) {
    const match = pattern.exec(route)
    if (!match) continue
    const classId = match[1] && !kind.startsWith('parent') ? match[1].toLowerCase() : null
    if (kind === 'class' && search) {
      const query = new URLSearchParams(search)
      if (query.get('tab') === 'grades') return { route, kind: query.get('sub') === 'report-comments' ? 'report-comments' : 'gradebook', classId }
    }
    return { route, kind, classId }
  }
  return { route, kind: 'other', classId: null }
}

const KIND_LABEL: Record<PageKind, string | null> = {
  'report-comments': 'Report card comments',
  gradebook: 'Gradebook',
  class: 'Class',
  'class-attendance': 'Class attendance',
  attendance: 'Attendance',
  students: 'Students',
  analytics: 'Analytics',
  reports: 'Reports',
  admin: 'Admin Panel',
  dashboard: 'Dashboard',
  'parent-grades': 'Grades',
  'parent-attendance': 'Attendance',
  'parent-meetings': 'Meetings',
  'parent-calendar': 'Calendar',
  'parent-classes': 'Classes',
  parent: 'Parent portal',
  other: null,
}

/** "On this page: …" before the server has named the class, or null for a page with nothing to say. */
export const pageLabel = (context: PageContext): string | null => KIND_LABEL[context.kind]

/** A few things to ask, chosen for the page. `writes`: the school lets Muley prepare changes to save. */
export function startersFor(context: PageContext, writes = false): string[] {
  switch (context.kind) {
    case 'parent-grades':
      return ['How is my child doing this term?', 'Is any work missing?', 'Where are the report cards?']
    case 'parent-attendance':
      return ['Was my child absent this week?', 'How many days were missed this month?']
    case 'parent-meetings':
      return ['When are my meetings?', 'How do I book a meeting?']
    case 'parent-calendar':
      return ['When is the next day off?', 'Is there school next Friday?']
    case 'parent-classes':
      return ['What is due this week?', 'Is any work missing?']
    case 'parent':
      return ['How is my child doing?', 'What is due this week?', 'When is the next day off?']
    case 'report-comments':
      return writes
        ? ['Write comments for the students who have none', 'Which comments are under the word limit?', 'Make the comments shorter']
        : ['Which comments are still missing?', 'How do I use a comment bank?']
    case 'gradebook':
      if (!context.classId) return ['Which of my classes have missing work?', 'How do I publish grades to parents?']
      return writes
        ? ['How is this class doing this term?', 'Enter marks for the last assessment', 'How do I leave a student out of the class average?']
        : ['How is this class doing this term?', 'Who has missing work in this class?', 'How do I leave a student out of the class average?']
    case 'class':
      return writes
        ? ['Who is in this class?', 'Who has missing work in this class?', 'Leave a student out of the class average']
        : ['Who is in this class?', 'Who has missing work in this class?', 'Where are this class\'s settings?']
    case 'class-attendance':
      return writes
        ? ['Mark everyone present today', 'Who was absent this week?', 'Who is still unmarked today?']
        : ['Who was absent this week?', 'Who is still unmarked today?', 'How do I take attendance?']
    case 'attendance':
      return ['Who was absent this week?', 'How do I take class attendance?', 'Where is general attendance?']
    case 'analytics':
      return ['Who needs attention this term?', 'How are my classes doing this term?', 'How do I compare two terms?']
    case 'admin':
      return ['Where is School Assets?', 'How do I change the school stamp?', 'Where are the report templates?']
    case 'reports':
      return ['How do I write report card comments?', 'Where are the report templates?']
    default:
      return ['What classes do I teach?', 'Where are the report templates?', 'How do I take attendance?']
  }
}
