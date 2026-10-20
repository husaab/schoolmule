import { describe, it, expect } from 'vitest'
import {
  PERMISSIONS,
  TEACHER_DEFAULT,
  ROUTE_RULES,
  accessInfo,
  can,
  canAny,
  canOpenPath,
  effectiveStaffRole,
  hasTeachingBaseline,
  isAdminPanelFallback,
  isFullAdmin,
  matchRoute,
  openableLinks,
  sameAccess,
  type AccessUser,
  type Permission,
} from './permissions'
import { guardedRoutes } from '@/test/routeDiscovery'

const GUARDED_ROUTES = guardedRoutes()

// The "Office Staff" preset (spec section 7, config/permissions.js): everything
// except Finance, Analytics and other teachers' classes and gradebooks.
const OFFICE_STAFF: Permission[] = [
  'students', 'report_cards', 'attendance.daily', 'attendance.classes', 'staff_attendance', 'users',
  'messages.all', 'announcements.school', 'school_setup', 'scheduling', 'forms',
]

const legacyAdmin: AccessUser = { role: 'ADMIN' }
const legacyTeacher: AccessUser = { role: 'TEACHER' }
const fullAdmin: AccessUser = { role: 'ADMIN', isFullAdmin: true, permissions: [...PERMISSIONS], accessRole: null, teachesClasses: false }
const builtInTeacher: AccessUser = { role: 'TEACHER', isFullAdmin: false, permissions: [...TEACHER_DEFAULT], accessRole: null, teachesClasses: true }
// An ADMIN account limited by the Office Staff role, teaching nothing.
const officeStaffTestUser: AccessUser = {
  role: 'ADMIN',
  isFullAdmin: false,
  permissions: OFFICE_STAFF,
  accessRole: { id: 'role-office', name: 'Office Staff' },
  teachesClasses: false,
}
const restrictedAdmin = (permissions: string[], teachesClasses = false): AccessUser => ({
  role: 'ADMIN', isFullAdmin: false, permissions, accessRole: { id: 'role-x', name: 'Custom' }, teachesClasses,
})

describe('accessInfo', () => {
  it('reads a legacy session by role: ADMIN is a full admin, TEACHER the built-in teacher', () => {
    expect(isFullAdmin(legacyAdmin)).toBe(true)
    for (const key of PERMISSIONS) expect(can(legacyAdmin, key), key).toBe(true)
    expect(isFullAdmin(legacyTeacher)).toBe(false)
    expect([...accessInfo(legacyTeacher).permissions].sort()).toEqual([...TEACHER_DEFAULT].sort())
    expect(accessInfo(legacyTeacher).legacy).toBe(true)
  })

  it('a full admin holds every key', () => {
    for (const key of PERMISSIONS) expect(can(fullAdmin, key), key).toBe(true)
    // Even when the list it was sent is short: full admin wins.
    expect(can({ role: 'ADMIN', isFullAdmin: true, permissions: [] }, 'finance')).toBe(true)
  })

  it('an ADMIN with an explicit empty set holds nothing and is not a full admin', () => {
    const u = restrictedAdmin([])
    expect(isFullAdmin(u)).toBe(false)
    for (const key of PERMISSIONS) expect(can(u, key), key).toBe(false)
    expect(accessInfo(u).legacy).toBe(false)
  })

  it('a session with permissions but no isFullAdmin is never a full admin', () => {
    expect(isFullAdmin({ role: 'ADMIN', permissions: ['users'] })).toBe(false)
    expect(can({ role: 'ADMIN', permissions: ['users'] }, 'finance')).toBe(false)
  })

  it('parent and student views hold nothing, whatever the session carries', () => {
    for (const role of ['PARENT', 'STUDENT', 'STAFF', null]) {
      const u: AccessUser = { role, isFullAdmin: true, permissions: [...PERMISSIONS], teachesClasses: true }
      expect(isFullAdmin(u), String(role)).toBe(false)
      expect(canAny(u, PERMISSIONS), String(role)).toBe(false)
      expect(hasTeachingBaseline(u), String(role)).toBe(false)
    }
    expect(canAny(null, PERMISSIONS)).toBe(false)
  })

  it('ignores keys it does not know', () => {
    const u = restrictedAdmin(['users', 'make_coffee', 'attendance'])
    expect([...accessInfo(u).permissions]).toEqual(['users'])
  })

  it('every base-role teacher has the own-classes baseline; other staff only while they teach', () => {
    expect(hasTeachingBaseline(legacyTeacher)).toBe(true)
    expect(hasTeachingBaseline({ ...builtInTeacher, teachesClasses: false })).toBe(true)
    expect(hasTeachingBaseline(officeStaffTestUser)).toBe(false)
    expect(hasTeachingBaseline(restrictedAdmin([], true))).toBe(true)
    // Missing teachesClasses on an ADMIN reads as "teaches nothing".
    expect(hasTeachingBaseline({ role: 'ADMIN', isFullAdmin: false, permissions: [] })).toBe(false)
  })

  it('effectiveStaffRole is ADMIN only with the area key', () => {
    expect(effectiveStaffRole(officeStaffTestUser, 'messages.all')).toBe('ADMIN')
    expect(effectiveStaffRole(builtInTeacher, 'messages.all')).toBe('TEACHER')
    expect(effectiveStaffRole(restrictedAdmin([]), 'announcements.school')).toBe('TEACHER')
    expect(effectiveStaffRole(legacyAdmin, 'announcements.school')).toBe('ADMIN')
  })
})

describe('matchRoute', () => {
  it('matches the overview exactly and everything else by the longest prefix', () => {
    expect(matchRoute('/admin-panel')?.exact).toBe(true)
    expect(matchRoute('/admin-panel/forms/submissions/x-slug')?.path).toBe('/admin-panel/forms')
    expect(matchRoute('/admin-panel/school-settings/new-year')?.path).toBe('/admin-panel/school-settings')
    expect(matchRoute('/attendance/class/x-classId')?.path).toBe('/attendance/class')
    expect(matchRoute('/students/x-studentId')?.path).toBe('/students')
  })

  it('does not confuse siblings that share a prefix', () => {
    expect(matchRoute('/student-views')?.path).toBe('/student-views')
    expect(matchRoute('/students')?.path).toBe('/students')
    expect(matchRoute('/student/todo')?.path).toBe('/student')
    expect(matchRoute('/reports')?.path).toBe('/reports')
    expect(matchRoute('/report-cards/view')?.path).toBe('/report-cards')
  })

  it('ignores the query, the hash and a trailing slash', () => {
    expect(matchRoute('/admin-panel/?x=1')?.exact).toBe(true)
    expect(matchRoute('/finance/tuition#family')?.path).toBe('/finance')
  })

  it('sends an unknown admin page to the full-admin catch-all and leaves other unknown paths alone', () => {
    expect(isAdminPanelFallback(matchRoute('/admin-panel/zzz-future'))).toBe(true)
    expect(canOpenPath('/admin-panel/zzz-future', officeStaffTestUser)).toBe(false)
    expect(canOpenPath('/admin-panel/zzz-future', fullAdmin)).toBe(true)
    expect(matchRoute('/does-not-exist')).toBeNull()
    expect(canOpenPath('/does-not-exist', restrictedAdmin([]))).toBe(true)
  })
})

describe('every page is a deliberate decision', () => {
  it('every page under src/app/(user) has a rule', () => {
    expect(GUARDED_ROUTES.filter((p) => matchRoute(p) === null)).toEqual([])
  })

  it('no admin page relies on the unknown-page catch-all', () => {
    // A failure here means a new /admin-panel page needs its own ROUTE_RULES entry.
    expect(GUARDED_ROUTES.filter((p) => isAdminPanelFallback(matchRoute(p)))).toEqual([])
  })

  it('every rule names a page that exists (no typos)', () => {
    const dead = ROUTE_RULES.filter(
      (r) => !GUARDED_ROUTES.some((p) => (r.exact ? p === r.path : p === r.path || p.startsWith(`${r.path}/`))),
    ).map((r) => r.path)
    expect(dead).toEqual([])
  })

  it('both homes are open to everyone, so routing home can never loop', () => {
    for (const home of ['/dashboard', '/parent/dashboard', '/student']) {
      for (const u of [legacyAdmin, legacyTeacher, fullAdmin, builtInTeacher, officeStaffTestUser, restrictedAdmin([]), { role: 'PARENT' }]) {
        expect(canOpenPath(home, u), home).toBe(true)
      }
    }
  })
})

describe('canOpenPath', () => {
  it('a full admin (or a legacy admin) opens every page', () => {
    for (const p of [...GUARDED_ROUTES, '/admin-panel/roles']) {
      expect(canOpenPath(p, fullAdmin), p).toBe(true)
      expect(canOpenPath(p, legacyAdmin), p).toBe(true)
    }
  })

  it('roles and patch notes stay with full admins, whatever the role holds', () => {
    const everything = restrictedAdmin([...PERMISSIONS], true)
    expect(canOpenPath('/admin-panel/roles', everything)).toBe(false)
    expect(canOpenPath('/admin-panel/patch-notes', everything)).toBe(false)
    expect(canOpenPath('/admin-panel/users', everything)).toBe(true)
  })

  it('the built-in teacher keeps exactly what teachers have today', () => {
    for (const p of ['/classes', '/classes/x-classId/edit', '/gradebook/x-classId', '/students', '/student-views/new', '/analytics', '/attendance/general', '/attendance/class/x-classId', '/reports/student-summary', '/report-cards/generate', '/messages', '/school-schedule', '/my-attendance']) {
      expect(canOpenPath(p, builtInTeacher), p).toBe(true)
      expect(canOpenPath(p, legacyTeacher), p).toBe(true)
    }
    for (const p of ['/admin-panel', '/admin-panel/users', '/admin-panel/forms', '/staff-attendance', '/finance/tuition', '/admin-panel/roles']) {
      expect(canOpenPath(p, builtInTeacher), p).toBe(false)
      expect(canOpenPath(p, legacyTeacher), p).toBe(false)
    }
  })

  it('a teacher with a custom role gets its keys on top of their classes', () => {
    const teacherPlusFinance: AccessUser = { role: 'TEACHER', isFullAdmin: false, permissions: ['finance'], accessRole: { id: 'r', name: 'Bursar' }, teachesClasses: true }
    expect(canOpenPath('/finance/tuition', teacherPlusFinance)).toBe(true)
    expect(canOpenPath('/classes', teacherPlusFinance)).toBe(true)
    // The role replaces the built-in set: no analytics unless the role grants it.
    expect(canOpenPath('/analytics', teacherPlusFinance)).toBe(false)
    expect(canOpenPath('/students', teacherPlusFinance)).toBe(false)
  })

  it('a restricted admin who co-teaches keeps their classes (D2)', () => {
    const coTeacher = restrictedAdmin(['users'], true)
    expect(canOpenPath('/classes', coTeacher)).toBe(true)
    expect(canOpenPath('/attendance/class', coTeacher)).toBe(true)
    expect(canOpenPath('/classes', restrictedAdmin(['users'], false))).toBe(false)
  })

  it('class pages open for classes.all, classes.manage, or class attendance for the attendance list', () => {
    expect(canOpenPath('/classes', restrictedAdmin(['classes.all']))).toBe(true)
    expect(canOpenPath('/gradebook', restrictedAdmin(['classes.manage']))).toBe(true)
    expect(canOpenPath('/attendance/class', restrictedAdmin(['attendance.classes']))).toBe(true)
    expect(canOpenPath('/attendance/class', restrictedAdmin(['classes.all']))).toBe(true)
    expect(canOpenPath('/attendance/class', restrictedAdmin(['classes.manage']))).toBe(false)
    expect(canOpenPath('/classes', restrictedAdmin(['attendance.classes']))).toBe(false)
  })

  it('any admin-panel key opens the overview', () => {
    for (const key of ['users', 'school_setup', 'scheduling', 'forms', 'messages.all'] as Permission[]) {
      expect(canOpenPath('/admin-panel', restrictedAdmin([key])), key).toBe(true)
    }
    for (const key of ['finance', 'staff_attendance', 'students', 'analytics'] as Permission[]) {
      expect(canOpenPath('/admin-panel', restrictedAdmin([key])), key).toBe(false)
    }
  })

  it('the old school-schedule bookmark stays open to all staff (it redirects)', () => {
    expect(canOpenPath('/admin-panel/school-schedule', builtInTeacher)).toBe(true)
    expect(canOpenPath('/admin-panel/school-schedule', restrictedAdmin([]))).toBe(true)
  })

  it('a parent view opens no staff page', () => {
    const parent: AccessUser = { role: 'PARENT', isFullAdmin: false, permissions: [] }
    for (const p of ['/admin-panel', '/students', '/classes', '/analytics', '/finance/tuition', '/attendance/general']) {
      expect(canOpenPath(p, parent), p).toBe(false)
    }
  })

  it('openableLinks keeps only what the user can open', () => {
    const links = [{ href: '/students' }, { href: '/finance/tuition' }, { href: '/dashboard' }]
    expect(openableLinks(links, officeStaffTestUser).map((l) => l.href)).toEqual(['/students', '/dashboard'])
  })
})

// Spec section 7, confirmed with the user 2026-10-20. Every page in the app
// is either one she gets or one she doesn't; nothing is left to chance.
describe('Office Staff test user (spec section 7)', () => {
  const GETS = [
    '/dashboard', '/students', '/student-views', '/attendance/general', '/attendance/class',
    '/reports', '/report-cards', '/staff-attendance', '/my-attendance', '/my-schedule', '/school-schedule',
    '/messages', '/admin-panel/messages', '/admin-panel/users', '/admin-panel/student-accounts',
    '/admin-panel/approvals', '/admin-panel/relations', '/admin-panel/forms', '/admin-panel/school-settings',
    '/admin-panel/school-calendar', '/admin-panel/school-assets', '/admin-panel/schedule-planner',
    '/admin-panel/agendas', '/whats-new', '/settings', '/support', '/contact-us', '/qr',
    // The old bookmark redirects to /school-schedule.
    '/admin-panel/school-schedule',
  ]
  const DOESNT_GET = ['/classes', '/gradebook', '/analytics', '/finance', '/admin-panel/patch-notes', '/admin-panel/roles']
  // Decided by authRouting, not by her role (sign-in, onboarding, other portals, Observe).
  const PORTALS = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/verify-email-token', '/school-approval', '/student-invite', '/parent', '/student', '/observe']
  const under = (p: string, list: string[]) => list.some((x) => p === x || p.startsWith(`${x}/`))

  it('opens every page she gets', () => {
    const pages = [...GUARDED_ROUTES.filter((p) => under(p, GETS)), '/admin-panel']
    expect(pages.filter((p) => !canOpenPath(p, officeStaffTestUser))).toEqual([])
  })

  it("opens none of the pages she doesn't get", () => {
    const pages = [...GUARDED_ROUTES.filter((p) => under(p, DOESNT_GET)), '/admin-panel/roles']
    expect(pages.length).toBeGreaterThan(10)
    expect(pages.filter((p) => canOpenPath(p, officeStaffTestUser))).toEqual([])
  })

  it('every page in the app is on one of the two lists (or belongs to another portal)', () => {
    const unlisted = GUARDED_ROUTES.filter((p) => p !== '/admin-panel' && !under(p, [...GETS, ...DOESNT_GET, ...PORTALS]))
    expect(unlisted).toEqual([])
  })

  it('keeps students, report cards and attendance, but no grades parts (no analytics)', () => {
    expect(can(officeStaffTestUser, 'students')).toBe(true)
    expect(can(officeStaffTestUser, 'report_cards')).toBe(true)
    expect(can(officeStaffTestUser, 'analytics')).toBe(false)
    expect(can(officeStaffTestUser, 'classes.all')).toBe(false)
    expect(can(officeStaffTestUser, 'finance')).toBe(false)
    expect(isFullAdmin(officeStaffTestUser)).toBe(false)
  })
})

describe('sameAccess', () => {
  it('ignores the order of the keys', () => {
    expect(sameAccess({ permissions: ['users', 'forms'] }, { permissions: ['forms', 'users'] })).toBe(true)
  })

  it('a missing list differs from an empty one (the first refresh after deploy is a change)', () => {
    expect(sameAccess({}, { permissions: [] })).toBe(false)
    expect(sameAccess({}, {})).toBe(true)
  })

  it('notices a full-admin flip, a renamed or swapped role, and teaching changes', () => {
    const base = { permissions: ['users'], isFullAdmin: false, accessRole: { id: 'a', name: 'Office' }, teachesClasses: false }
    expect(sameAccess(base, { ...base })).toBe(true)
    expect(sameAccess(base, { ...base, isFullAdmin: true })).toBe(false)
    expect(sameAccess(base, { ...base, accessRole: { id: 'a', name: 'Front office' } })).toBe(false)
    expect(sameAccess(base, { ...base, accessRole: { id: 'b', name: 'Office' } })).toBe(false)
    expect(sameAccess(base, { ...base, teachesClasses: true })).toBe(false)
  })

  it('treats a null and a missing access role the same', () => {
    expect(sameAccess({ permissions: [], accessRole: null }, { permissions: [] })).toBe(true)
  })
})
