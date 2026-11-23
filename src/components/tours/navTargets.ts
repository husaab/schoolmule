// src/components/tours/navTargets.ts
// The tour names of the main navigation links (data-tour), so the shared
// welcome tours can point at "nav.classes" without knowing each portal's URL.
export const NAV_TOUR_TARGETS: Readonly<Record<string, string>> = {
  '/dashboard': 'nav.home',
  '/classes': 'nav.classes',
  '/messages': 'nav.messages',
  '/my-meetings': 'nav.myMeetings',
  '/parent/dashboard': 'nav.home',
  '/parent/meetings': 'nav.meetings',
  '/parent/classes': 'nav.classes',
  '/parent/messages': 'nav.messages',
  '/parent/grades': 'nav.grades',
  '/student': 'nav.home',
  '/student/todo': 'nav.todo',
  '/student/grades': 'nav.grades',
  '/student/messages': 'nav.messages',
}

export const navTourTarget = (href: string): string | undefined => NAV_TOUR_TARGETS[href]
