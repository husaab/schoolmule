// src/components/studentPortal/studentNav.ts
// The student portal's main navigation, shared by the desktop sidebar and the
// phone tab bar. Home is first, then To-do; Messages arrives with the student inbox.

import type { ComponentType, SVGProps } from 'react'
import { ChartBarIcon, ClipboardDocumentCheckIcon, HomeIcon } from '@heroicons/react/24/outline'

export type StudentBadgeKey = 'todo' | 'messages'

export interface StudentNavItem {
  href: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** A count from useStudentBadges() shown beside the label. */
  badgeKey?: StudentBadgeKey
}

export const STUDENT_NAV: StudentNavItem[] = [
  { href: '/student', label: 'Home', icon: HomeIcon },
  { href: '/student/todo', label: 'To-do', icon: ClipboardDocumentCheckIcon, badgeKey: 'todo' },
  { href: '/student/grades', label: 'Grades', icon: ChartBarIcon },
]

/** Home matches only itself; every other item also owns its sub-pages. */
export const isStudentNavActive = (href: string, pathname: string): boolean =>
  href === '/student' ? pathname === '/student' : pathname === href || pathname.startsWith(`${href}/`)

/** A class in the sidebar's "My classes" list. */
export interface StudentClassLink {
  href: string
  label: string
  iconUrl: string
}
