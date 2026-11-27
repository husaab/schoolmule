// src/lib/muley/pageContext.ts
// What Muley is told about the page the person is on, and what the panel
// says about it before the server answers. Only the route and a class id are
// sent; the server checks the class with the person's own access before it
// tells the model anything (an id the person can't open is ignored).

export type PageKind = 'gradebook' | 'class' | 'class-attendance' | 'attendance' | 'students' | 'analytics' | 'reports' | 'admin' | 'dashboard' | 'other'

export type PageContext = {
  route: string
  kind: PageKind
  classId: string | null
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

// Most specific first. The class id is the first capture.
const ROUTES: { kind: PageKind; pattern: RegExp }[] = [
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

/** The page context for a pathname (query and hash are never sent). */
export function pageContextFor(pathname: string): PageContext {
  const route = (pathname || '/').split(/[?#]/)[0]
  for (const { kind, pattern } of ROUTES) {
    const match = pattern.exec(route)
    if (match) return { route, kind, classId: match[1] ? match[1].toLowerCase() : null }
  }
  return { route, kind: 'other', classId: null }
}

const KIND_LABEL: Record<PageKind, string | null> = {
  gradebook: 'Gradebook',
  class: 'Class',
  'class-attendance': 'Class attendance',
  attendance: 'Attendance',
  students: 'Students',
  analytics: 'Analytics',
  reports: 'Reports',
  admin: 'Admin Panel',
  dashboard: 'Dashboard',
  other: null,
}

/** "On this page: …" before the server has named the class, or null for a page with nothing to say. */
export const pageLabel = (context: PageContext): string | null => KIND_LABEL[context.kind]

/** A few things to ask, chosen for the page. `writes`: the school lets Muley prepare changes to save. */
export function startersFor(context: PageContext, writes = false): string[] {
  switch (context.kind) {
    case 'gradebook':
      if (!context.classId) return ['Which of my classes have missing work?', 'How do I publish grades to parents?']
      return writes
        ? ['Who has missing work in this class?', 'Enter marks for the last assessment', 'How do I leave a student out of the class average?']
        : ['Who has missing work in this class?', 'How did the class do on the last assessment?', 'How do I leave a student out of the class average?']
    case 'class':
      return ['Who is in this class?', 'Who has missing work in this class?', 'Where are this class\'s settings?']
    case 'class-attendance':
      return writes
        ? ['Mark everyone present today', 'Who is still unmarked today?', 'Who was absent today?']
        : ['Who was absent today?', 'Who is still unmarked today?', 'How do I take attendance?']
    case 'attendance':
      return ['How do I take class attendance?', 'Where is general attendance?']
    case 'admin':
      return ['Where is School Assets?', 'How do I change the school stamp?', 'Where are the report templates?']
    case 'reports':
      return ['How do I write report card comments?', 'Where are the report templates?']
    default:
      return ['What classes do I teach?', 'Where are the report templates?', 'How do I take attendance?']
  }
}
