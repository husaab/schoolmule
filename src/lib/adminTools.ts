// src/lib/adminTools.ts
// Every tool on the admin panel page, in groups (adminTools.test.ts).
//
// The first three groups are the sidebar's Admin Panel dropdown
// (lib/adminPanelNav), read by href, so a tool's name on this page is always
// the name in the sidebar. The page adds the admin tools that live elsewhere
// in the sidebar (Forms, Tuition) or nowhere (Patch Notes). Every tool is
// filtered by the route rules (lib/permissions), the same ones the sidebar
// and the router read, so a row can never lead to a page that bounces.
//
// Pure and icon-free (icons are keys each platform resolves, the same
// pictures as the sidebar's), so the app copies this file unchanged.

import { ADMIN_PANEL_GROUPS } from '@/lib/adminPanelNav'
import { canOpenPath, type AccessUser } from '@/lib/permissions'

export const ADMIN_TOOL_ICONS = [
  'users',
  'lock',
  'key',
  'shield',
  'family',
  'chat',
  'cog',
  'calendar',
  'photo',
  'document',
  'table',
  'clock',
  'book',
  'forms',
  'finance',
  'sparkles',
] as const
export type AdminToolIcon = (typeof ADMIN_TOOL_ICONS)[number]

export type AdminToolGroupKey = 'people' | 'setup' | 'planning' | 'formsFinance' | 'product'

/** The group's hue: it marks which group a tool is in, never whether something is wrong. */
export type AdminToolTone = 'cyan' | 'violet' | 'indigo' | 'teal' | 'slate'

export type AdminTool = {
  href: string
  label: string
  group: AdminToolGroupKey
  /** What the tool is for, in a line. Shown when there is no live status. */
  description: string
  /** Other words people search with: older names, synonyms. */
  keywords: readonly string[]
  icon: AdminToolIcon
}

export type AdminToolGroup = {
  key: AdminToolGroupKey
  label: string
  tone: AdminToolTone
  tools: AdminTool[]
}

type ToolMeta = Pick<AdminTool, 'description' | 'keywords' | 'icon'>

// Keyed by href. Every item of the sidebar's dropdown needs an entry (the test checks).
const META: Record<string, ToolMeta> = {
  '/admin-panel/users': {
    description: 'Everyone at your school. Add, edit or archive accounts and set roles.',
    keywords: ['manage users', 'accounts', 'staff', 'teachers', 'parents', 'invite', 'archive'],
    icon: 'users',
  },
  '/admin-panel/roles': {
    description: 'Custom staff roles and what each one can see and do.',
    keywords: ['roles & permissions', 'permissions', 'access'],
    icon: 'lock',
  },
  '/admin-panel/student-accounts': {
    description: 'Invite students, record consent and print QR sign-in cards.',
    keywords: ['student logins', 'invites', 'qr cards', 'consent', 'classroom'],
    icon: 'key',
  },
  '/admin-panel/approvals': {
    description: 'New signups waiting to be let in, and student account requests.',
    keywords: ['manage user approvals', 'approve', 'signups', 'pending', 'registrations'],
    icon: 'shield',
  },
  '/admin-panel/relations': {
    description: 'Which parents are linked to which students.',
    keywords: ['parent-student relations', 'guardians', 'families', 'links'],
    icon: 'family',
  },
  '/admin-panel/messages': {
    description: 'Every conversation between families and staff, to read and reply to.',
    keywords: ['conversations', 'inbox', 'replies', 'parents'],
    icon: 'chat',
  },
  '/admin-panel/school-settings': {
    description: 'School years, terms and their dates.',
    keywords: ['terms', 'school year', 'academic year', 'new year', 'rollover'],
    icon: 'cog',
  },
  '/admin-panel/school-calendar': {
    description: 'Holidays, PA days and school events.',
    keywords: ['holidays', 'pa days', 'events', 'closures'],
    icon: 'calendar',
  },
  '/admin-panel/school-assets': {
    description: 'Logo, principal’s signature and school stamp for printed documents.',
    keywords: ['logo', 'signature', 'stamp', 'branding'],
    icon: 'photo',
  },
  '/admin-panel/report-templates': {
    description: 'Design report cards and progress reports, and pick which prints for each grade.',
    keywords: ['report cards', 'progress reports', 'designer', 'layout'],
    icon: 'document',
  },
  '/admin-panel/schedule-planner': {
    description: 'Build and publish weekly timetables from teacher availability.',
    keywords: ['timetable', 'bell times', 'scheduling', 'generate'],
    icon: 'table',
  },
  '/school-schedule': {
    description: 'The published whole-school timetable.',
    keywords: ['timetable', 'who is where'],
    icon: 'calendar',
  },
  '/admin-panel/agendas': {
    description: 'Compose and print the yearly student agenda book.',
    keywords: ['agenda book', 'planner book', 'print'],
    icon: 'book',
  },
  '/admin-panel/parent-teacher-meetings': {
    description: 'Set the days and hours, open booking, and see each teacher’s day.',
    keywords: ['ptm', 'interviews', 'conferences', 'bookings'],
    icon: 'clock',
  },
}

const NAV_GROUP_KEYS: Record<string, { key: AdminToolGroupKey; tone: AdminToolTone }> = {
  People: { key: 'people', tone: 'cyan' },
  'School setup': { key: 'setup', tone: 'violet' },
  Planning: { key: 'planning', tone: 'indigo' },
}

const navGroups: AdminToolGroup[] = ADMIN_PANEL_GROUPS.map((group) => {
  const { key, tone } = NAV_GROUP_KEYS[group.label] ?? { key: 'people', tone: 'cyan' }
  return {
    key,
    label: group.label,
    tone,
    tools: group.items.map((item) => ({
      href: item.href,
      label: item.label,
      group: key,
      ...(META[item.href] ?? { description: '', keywords: [], icon: 'cog' }),
    })),
  }
})

const pageOnlyGroups: AdminToolGroup[] = [
  {
    key: 'formsFinance',
    label: 'Forms & finance',
    tone: 'teal',
    tools: [
      {
        href: '/admin-panel/forms',
        label: 'Forms',
        group: 'formsFinance',
        description: 'Forms for families to fill in, and what they sent back.',
        keywords: ['registration', 'submissions', 'surveys', 'statuses'],
        icon: 'forms',
      },
      {
        href: '/finance/tuition',
        label: 'Tuition',
        group: 'formsFinance',
        description: 'Each family’s tuition by month, from QuickBooks.',
        keywords: ['finance', 'quickbooks', 'qbo', 'payments', 'invoices', 'overdue'],
        icon: 'finance',
      },
    ],
  },
  {
    key: 'product',
    label: 'Product',
    tone: 'slate',
    tools: [
      {
        href: '/admin-panel/patch-notes',
        label: 'Patch Notes',
        group: 'product',
        description: 'Product updates shown to everyone in What’s new.',
        keywords: ['whats new', 'updates', 'release notes', 'changelog'],
        icon: 'sparkles',
      },
    ],
  },
]

export const ADMIN_TOOL_GROUPS: readonly AdminToolGroup[] = [...navGroups, ...pageOnlyGroups]

/** Hrefs of the sidebar items with no META entry: must stay empty (the test checks). */
export const toolsMissingMeta = (): string[] =>
  ADMIN_PANEL_GROUPS.flatMap((g) => g.items.map((i) => i.href)).filter((href) => !META[href])

/** The groups and tools this user can open, with empty groups dropped. */
export const adminToolsFor = (user: AccessUser | null | undefined): AdminToolGroup[] =>
  ADMIN_TOOL_GROUPS.map((g) => ({ ...g, tools: g.tools.filter((t) => canOpenPath(t.href, user)) })).filter(
    (g) => g.tools.length > 0,
  )

// ---------------------------------------------------------------------------
// Search

const wordsOf = (text: string): string[] => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

/** How well one typed word matches a tool: its name first, then other names, then what it does. */
const tokenScore = (tool: AdminTool, token: string): number => {
  const name = tool.label.toLowerCase()
  if (name.startsWith(token)) return 100
  if (wordsOf(tool.label).some((w) => w.startsWith(token))) return 80
  if (name.includes(token)) return 60
  const keywords = tool.keywords.map((k) => k.toLowerCase())
  if (keywords.some((k) => k.startsWith(token) || wordsOf(k).some((w) => w.startsWith(token)))) return 40
  if (keywords.some((k) => k.includes(token))) return 30
  if (wordsOf(tool.description).some((w) => w.startsWith(token))) return 20
  return 0
}

/** 0 when any typed word misses: every word has to match somewhere. */
export const toolScore = (tool: AdminTool, query: string): number => {
  const tokens = wordsOf(query)
  if (tokens.length === 0) return 0
  let total = 0
  for (const token of tokens) {
    const score = tokenScore(tool, token)
    if (score === 0) return 0
    total += score
  }
  return total
}

/**
 * The tools matching a search, best first (ties keep the page's order), so
 * the first result is the one Enter opens. An empty search matches nothing:
 * the page shows its groups instead.
 */
export const searchTools = (groups: readonly AdminToolGroup[], query: string): AdminTool[] => {
  const ranked = groups
    .flatMap((g) => g.tools)
    .map((tool, order) => ({ tool, order, score: toolScore(tool, query) }))
    .filter((r) => r.score > 0)
  ranked.sort((a, b) => b.score - a.score || a.order - b.order)
  return ranked.map((r) => r.tool)
}

/** The group a tool belongs to, for its name and hue in search results. */
export const groupOf = (groups: readonly AdminToolGroup[], tool: AdminTool): AdminToolGroup | undefined =>
  groups.find((g) => g.key === tool.group)
