// src/lib/adminPanelNav.ts
// The sidebar's Admin Panel dropdown: its groups, and what of it a user gets
// (adminPanelNav.test.ts). Every item is filtered by the route rules
// (lib/permissions), so a link can never lead to a page the router bounces;
// a group with nothing left loses its heading, and the dropdown exists only
// when at least one gated tool in it opens for the user. Overview is pinned
// first by the sidebar whenever the user can open it.

import type React from 'react'
import {
  BookOpenIcon,
  CalendarDaysIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CogIcon,
  KeyIcon,
  LockClosedIcon,
  PhotoIcon,
  ShieldCheckIcon,
  TableCellsIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { canOpenPath, type AccessUser } from '@/lib/permissions'

export type PanelLink = {
  href: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  exact?: boolean
  /** Open to all staff: listed in the dropdown when it exists, never the reason it exists. */
  everyone?: boolean
}

export type PanelGroup = { label: string; items: PanelLink[] }

export const ADMIN_PANEL_OVERVIEW = '/admin-panel'

export const ADMIN_PANEL_GROUPS: readonly PanelGroup[] = [
  {
    label: 'People',
    items: [
      { href: '/admin-panel/users', label: 'Users', icon: UsersIcon },
      { href: '/admin-panel/roles', label: 'Roles', icon: LockClosedIcon },
      { href: '/admin-panel/student-accounts', label: 'Student accounts', icon: KeyIcon },
      { href: '/admin-panel/approvals', label: 'User Approvals', icon: ShieldCheckIcon },
      { href: '/admin-panel/relations', label: 'Parent Relations', icon: UserGroupIcon },
      { href: '/admin-panel/messages', label: 'All Messages', icon: ChatBubbleOvalLeftEllipsisIcon },
    ],
  },
  {
    label: 'School setup',
    items: [
      { href: '/admin-panel/school-settings', label: 'School Settings', icon: CogIcon },
      { href: '/admin-panel/school-calendar', label: 'School Calendar', icon: CalendarDaysIcon },
      { href: '/admin-panel/school-assets', label: 'School Assets', icon: PhotoIcon },
    ],
  },
  {
    label: 'Planning',
    items: [
      { href: '/admin-panel/schedule-planner', label: 'Schedule Planner', icon: TableCellsIcon },
      { href: '/school-schedule', label: 'School Schedule', icon: CalendarDaysIcon, exact: true, everyone: true },
      { href: '/admin-panel/agendas', label: 'Agenda Editor', icon: BookOpenIcon },
    ],
  },
]

export type AdminPanelNav = {
  /** Whether the dropdown exists at all. */
  show: boolean
  /** Overview, pinned first. */
  overview: boolean
  groups: PanelGroup[]
}

export const adminPanelNavFor = (user: AccessUser | null | undefined): AdminPanelNav => {
  const groups = ADMIN_PANEL_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => canOpenPath(i.href, user)) })).filter(
    (g) => g.items.length > 0,
  )
  return {
    show: groups.some((g) => g.items.some((i) => !i.everyone)),
    overview: canOpenPath(ADMIN_PANEL_OVERVIEW, user),
    groups,
  }
}
