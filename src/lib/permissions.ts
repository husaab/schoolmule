// src/lib/permissions.ts
// What a staff account may open and do (RBAC). Pure, so the router
// (authRouting), the sidebar, the dashboard and the admin-panel cards all ask
// the same functions and can never disagree (permissions.test.ts). The server
// enforces every one of these again; this module only decides what the UI
// offers and where the router sends people.
//
// Model: a staff account is ADMIN or TEACHER (the base role) and may hold a
// custom access role, a named set of the keys below. Without one, ADMIN is
// the built-in full admin (every key, plus the powers no role can grant:
// roles, "View as", making admins, patch notes) and TEACHER the built-in
// teacher (TEACHER_DEFAULT). Teaching a class always opens that class,
// whatever the role. PARENT and STUDENT views hold nothing staff-side.
//
// A session persisted before roles existed (or served by an older backend)
// has none of the access fields. It is read by role until /auth/me fills them
// in: ADMIN as a full admin, TEACHER as the built-in teacher. That is safe
// because the server decides, and it keeps every bookmarked admin page open
// across the deploy.

export const PERMISSIONS = [
  'classes.all',
  'classes.manage',
  'analytics',
  'report_cards',
  'students',
  'users',
  'attendance.daily',
  'attendance.classes',
  'staff_attendance',
  'messages.all',
  'announcements.school',
  'forms',
  'scheduling',
  'school_setup',
  'finance',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const isPermission = (key: string): key is Permission => (PERMISSIONS as readonly string[]).includes(key)

/** The built-in Teacher (a TEACHER with no access role), as config/permissions.js defines it. */
export const TEACHER_DEFAULT: readonly Permission[] = ['students', 'analytics', 'report_cards', 'attendance.daily']

/** A custom access role, as the session and the Users page name it. */
export type AccessRoleRef = { id: string; name: string }

/** The slice of the session user these helpers read (the store's User and authRouting's RouteUser both fit). */
export type AccessUser = {
  /** The active view. Only ADMIN and TEACHER views hold permissions. */
  role: string | null
  /** Absent on a legacy session: see accessInfo. Never default it to []. */
  permissions?: string[]
  isFullAdmin?: boolean
  accessRole?: AccessRoleRef | null
  /** Leads or co-teaches a class this school year. Absent: read as role === 'TEACHER'. */
  teachesClasses?: boolean
}

export type AccessInfo = {
  /** An ADMIN or TEACHER view. */
  staff: boolean
  fullAdmin: boolean
  permissions: ReadonlySet<Permission>
  /**
   * Has the own-classes baseline: every base-role teacher (their Classes page
   * is where they create their own classes, so it never disappears), and any
   * other staff account that leads or co-teaches a class.
   */
  teaching: boolean
  accessRole: AccessRoleRef | null
  /** No access fields in the session: read by role until /auth/me refreshes it. */
  legacy: boolean
}

const NO_ACCESS: AccessInfo = {
  staff: false,
  fullAdmin: false,
  permissions: new Set(),
  teaching: false,
  accessRole: null,
  legacy: false,
}

const isStaffView = (role: string | null | undefined) => role === 'ADMIN' || role === 'TEACHER'

/** Everything the UI needs to know about what this user may do. */
export const accessInfo = (user: AccessUser | null | undefined): AccessInfo => {
  if (!user || !isStaffView(user.role)) return NO_ACCESS
  const legacy = user.permissions === undefined && user.isFullAdmin === undefined
  const fullAdmin = user.isFullAdmin ?? (legacy && user.role === 'ADMIN')
  const keys: readonly Permission[] = fullAdmin
    ? PERMISSIONS
    : legacy
      ? user.role === 'TEACHER'
        ? TEACHER_DEFAULT
        : []
      : (user.permissions ?? []).filter(isPermission)
  const teachesClasses = user.teachesClasses ?? user.role === 'TEACHER'
  return {
    staff: true,
    fullAdmin,
    permissions: new Set(keys),
    teaching: user.role === 'TEACHER' || teachesClasses,
    accessRole: user.accessRole ?? null,
    legacy,
  }
}

export const can = (user: AccessUser | null | undefined, key: Permission): boolean =>
  accessInfo(user).permissions.has(key)

export const canAny = (user: AccessUser | null | undefined, keys: readonly Permission[]): boolean => {
  const { permissions } = accessInfo(user)
  return keys.some((k) => permissions.has(k))
}

/** Full admins hold every key and the powers no role can grant (roles, "View as", making admins, patch notes). */
export const isFullAdmin = (user: AccessUser | null | undefined): boolean => accessInfo(user).fullAdmin

/** The own-classes baseline (see AccessInfo.teaching). */
export const hasTeachingBaseline = (user: AccessUser | null | undefined): boolean => accessInfo(user).teaching

/**
 * The role a component that branches on 'ADMIN' should be given for one
 * area: 'ADMIN' only when the user holds that area's key. Messaging and
 * announcements decide "every conversation" or "the whole school" that way.
 */
export const effectiveStaffRole = (user: AccessUser | null | undefined, key: Permission): 'ADMIN' | 'TEACHER' =>
  can(user, key) ? 'ADMIN' : 'TEACHER'

/**
 * System student views, and anyone's view, are managed by admin accounts that
 * hold `students` (the API's rule); everyone else manages the views they own.
 */
export const canManageAllStudentViews = (user: AccessUser | null | undefined): boolean =>
  user?.role === 'ADMIN' && can(user, 'students')

// ── Route rules ────────────────────────────────────────────────────────────

export type Rule =
  /** Every staff member (and whoever else authRouting lets through). */
  | { kind: 'open' }
  /** Decided by authRouting alone: sign-in, onboarding, the parent and student portals, Observe. */
  | { kind: 'portal' }
  /** Holding any of these keys opens the page; `orTeaching` also opens it to the own-classes baseline. */
  | { kind: 'permission'; anyOf: readonly Permission[]; orTeaching?: boolean }
  /** Full admins only. */
  | { kind: 'fullAdmin' }

const OPEN: Rule = { kind: 'open' }
const PORTAL: Rule = { kind: 'portal' }
const FULL_ADMIN: Rule = { kind: 'fullAdmin' }
const NEEDS = (...anyOf: Permission[]): Rule => ({ kind: 'permission', anyOf })
const TEACHING_OR = (...anyOf: Permission[]): Rule => ({ kind: 'permission', anyOf, orTeaching: true })

/** Any one of these opens the Admin Panel overview, which then lists only the cards the user can open. */
export const ADMIN_PANEL_KEYS: readonly Permission[] = ['users', 'school_setup', 'scheduling', 'forms', 'messages.all']

export type RouteRule = {
  path: string
  /** Matches the path itself only, not the pages under it. */
  exact?: boolean
  rule: Rule
}

// Every page under src/app/(user) has an entry here (a test walks the
// filesystem to make sure), so a new page is a decision, not an accident.
// The longest matching path wins. An unknown /admin-panel page falls to the
// full-admin catch-all; an unknown path elsewhere is not restricted here
// (it is a 404, or a public form, which authRouting handles).
export const ROUTE_RULES: readonly RouteRule[] = [
  // Every staff member
  { path: '/dashboard', rule: OPEN },
  { path: '/messages', rule: OPEN },
  { path: '/settings', rule: OPEN },
  { path: '/support', rule: OPEN },
  { path: '/contact-us', rule: OPEN },
  { path: '/whats-new', rule: OPEN },
  { path: '/my-attendance', rule: OPEN },
  { path: '/my-schedule', rule: OPEN },
  { path: '/school-schedule', rule: OPEN },

  // Sign-in, onboarding and the other portals: authRouting's own rules
  { path: '/login', rule: PORTAL },
  { path: '/signup', rule: PORTAL },
  { path: '/forgot-password', rule: PORTAL },
  { path: '/reset-password', rule: PORTAL },
  { path: '/verify-email', rule: PORTAL },
  { path: '/verify-email-token', rule: PORTAL },
  { path: '/school-approval', rule: PORTAL },
  { path: '/student-invite', rule: PORTAL },
  { path: '/email-login', rule: PORTAL },
  { path: '/qr', rule: PORTAL },
  { path: '/parent', rule: PORTAL },
  { path: '/student', rule: PORTAL },
  { path: '/observe', rule: PORTAL },

  // Admin Panel
  { path: '/admin-panel', exact: true, rule: NEEDS(...ADMIN_PANEL_KEYS) },
  { path: '/admin-panel', rule: FULL_ADMIN }, // any admin page not listed below: fail closed
  { path: '/admin-panel/users', rule: NEEDS('users') },
  { path: '/admin-panel/student-accounts', rule: NEEDS('users') },
  { path: '/admin-panel/approvals', rule: NEEDS('users') },
  { path: '/admin-panel/relations', rule: NEEDS('users') },
  { path: '/admin-panel/messages', rule: NEEDS('messages.all') },
  { path: '/admin-panel/forms', rule: NEEDS('forms') },
  { path: '/admin-panel/school-settings', rule: NEEDS('school_setup') },
  { path: '/admin-panel/school-calendar', rule: NEEDS('school_setup') },
  { path: '/admin-panel/school-assets', rule: NEEDS('school_setup') },
  { path: '/admin-panel/schedule-planner', rule: NEEDS('scheduling') },
  { path: '/admin-panel/agendas', rule: NEEDS('scheduling') },
  { path: '/admin-panel/school-schedule', rule: OPEN }, // old bookmark, redirects to /school-schedule
  { path: '/admin-panel/roles', rule: FULL_ADMIN },
  { path: '/admin-panel/patch-notes', rule: FULL_ADMIN },

  // School-wide areas
  { path: '/staff-attendance', rule: NEEDS('staff_attendance') },
  { path: '/finance', rule: NEEDS('finance') },
  { path: '/analytics', rule: NEEDS('analytics') },
  { path: '/students', rule: NEEDS('students') },
  { path: '/student-views', rule: NEEDS('students') },
  { path: '/attendance/general', rule: NEEDS('attendance.daily') },
  { path: '/reports', rule: NEEDS('report_cards') },
  { path: '/report-cards', rule: NEEDS('report_cards') },

  // Class pages: the API still decides class by class
  { path: '/attendance/class', rule: TEACHING_OR('attendance.classes', 'classes.all') },
  { path: '/classes', rule: TEACHING_OR('classes.all', 'classes.manage') },
  { path: '/gradebook', rule: TEACHING_OR('classes.all', 'classes.manage') },
]

const underPrefix = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)
const cleanPath = (path: string) => path.split(/[?#]/)[0].replace(/(.)\/+$/, '$1') || '/'

/** The most specific rule for a path, or null when no rule names it. */
export const matchRoute = (path: string): RouteRule | null => {
  const p = cleanPath(path)
  let best: RouteRule | null = null
  for (const r of ROUTE_RULES) {
    if (!(r.exact ? p === r.path : underPrefix(p, r.path))) continue
    if (!best || r.path.length > best.path.length || (r.path === best.path && r.exact)) best = r
  }
  return best
}

/** True when the path is only covered by the unknown-admin-page catch-all. */
export const isAdminPanelFallback = (match: RouteRule | null): boolean =>
  Boolean(match && match.path === '/admin-panel' && !match.exact)

export const ruleAllows = (rule: Rule, user: AccessUser | null | undefined): boolean => {
  if (rule.kind === 'open' || rule.kind === 'portal') return true
  const access = accessInfo(user)
  if (!access.staff) return false
  if (access.fullAdmin) return true
  if (rule.kind === 'fullAdmin') return false
  return rule.anyOf.some((k) => access.permissions.has(k)) || Boolean(rule.orTeaching && access.teaching)
}

/**
 * May this user open `path`, as far as permissions go? authRouting's other
 * rules (sign-in, onboarding, portals) still apply on top. Every link that
 * leads to a page should ask this, so it never shows for a page the router
 * would bounce.
 */
export const canOpenPath = (path: string, user: AccessUser | null | undefined): boolean => {
  const match = matchRoute(path)
  return match ? ruleAllows(match.rule, user) : true
}

/** Nav helper: the items whose page this user can open. */
export const openableLinks = <T extends { href: string }>(items: readonly T[], user: AccessUser | null | undefined): T[] =>
  items.filter((i) => canOpenPath(i.href, user))

// ── Session plumbing (sessionSync, viewSwitch) ─────────────────────────────

export type AccessFields = Pick<AccessUser, 'permissions' | 'isFullAdmin' | 'accessRole' | 'teachesClasses'>

/**
 * The access claims of a session payload, as the user store keeps them. A
 * field the server did not send stays undefined, never [] or false: a session
 * without them is read by role (see accessInfo), so an older backend keeps
 * today's access instead of locking every admin out.
 */
export const accessClaimsOf = (data: AccessFields): AccessFields => ({
  permissions: data.permissions,
  isFullAdmin: data.isFullAdmin,
  accessRole: data.accessRole,
  teachesClasses: data.teachesClasses,
})

/** True when two sessions grant the same access. Order-insensitive; a missing list differs from an empty one. */
export const sameAccess = (a: AccessFields, b: AccessFields): boolean => {
  const keys = (p?: string[]) => (p ? [...p].sort().join(',') : '\0absent')
  return (
    keys(a.permissions) === keys(b.permissions) &&
    a.isFullAdmin === b.isFullAdmin &&
    a.teachesClasses === b.teachesClasses &&
    (a.accessRole?.id ?? null) === (b.accessRole?.id ?? null) &&
    (a.accessRole?.name ?? null) === (b.accessRole?.name ?? null)
  )
}
