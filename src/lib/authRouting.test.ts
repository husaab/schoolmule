import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  resolveRedirect,
  homeFor,
  landingFor,
  safeNextPath,
  signInDetourFor,
  createLoopDetector,
  type RouteState,
  type RouteUser,
} from './authRouting'

// Every page in the app, discovered from the filesystem so a route added
// later is covered without touching this file. Route groups like (user) are
// dropped and dynamic segments get a placeholder.
const appDir = path.resolve(__dirname, '../app')
const discoverRoutes = (dir: string, segments: string[] = []): string[] => {
  const routes: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const name = entry.name
      if (name.startsWith('_') || name.startsWith('@')) continue
      const next = /^\(.*\)$/.test(name) ? segments : [...segments, name.replace(/^\[+\.*(.*?)\]+$/, 'x-$1')]
      routes.push(...discoverRoutes(path.join(dir, name), next))
    } else if (/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      routes.push(`/${segments.join('/')}`)
    }
  }
  return routes
}
const APP_ROUTES = [...new Set(discoverRoutes(appDir))]
// The pages AuthGuard actually wraps (src/app/(user)/layout.tsx).
const GUARDED_ROUTES = [...new Set(discoverRoutes(path.join(appDir, '(user)')))]

// Guarded pages a signed-out visitor may still open.
// /qr is the QR sign-in card's link: it must open signed out (and from any session).
const isSignedOutPage = (p: string) =>
  ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email-token', '/qr'].includes(p) || p.startsWith('/signup/')

// Follows redirects until the user settles; throws on a loop.
const settle = (start: string, state: RouteState): string => {
  let at = start
  for (let hops = 0; hops < 5; hops++) {
    const next = resolveRedirect(at.split('?')[0], state)
    if (next === null) return at
    at = next
  }
  throw new Error(`no settle from ${start}`)
}

// Shapes the filesystem can't express on its own.
const EXTRA_PATHS = [
  '/jcc/enrolment-form', '/jcc/schedule/abc123', '/signup/jcc', '/parentfoo', '/does-not-exist',
  '/student/todo', '/studentfoo', '/qr',
]
const PATHS = [...new Set([...APP_ROUTES, ...EXTRA_PATHS])]

const ROLES = ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'STAFF', null]
const BOOLS = [true, false]
const OWNER = [true, false, undefined]

const users: RouteUser[] = []
for (const role of ROLES)
  for (const isVerifiedEmail of BOOLS)
    for (const isVerifiedSchool of BOOLS)
      for (const isPlatformOwner of OWNER)
        users.push({ id: 'u1', role, isVerifiedEmail, isVerifiedSchool, isPlatformOwner })

const anonymous: RouteUser = { id: null, role: null, isVerifiedEmail: false, isVerifiedSchool: false }

const states: RouteState[] = [
  { hasToken: false, user: anonymous },
  { hasToken: true, user: anonymous },
  ...users.flatMap((user) => [
    { hasToken: true, user },
    // Persisted user whose token is gone: AuthGuard clears the user, but the
    // first render still sees both.
    { hasToken: false, user },
  ]),
]

const signedInState = (user: RouteUser): RouteState => ({ hasToken: true, user })

const describeState = (s: RouteState) =>
  `token=${s.hasToken} id=${s.user.id} role=${s.user.role} email=${s.user.isVerifiedEmail} school=${s.user.isVerifiedSchool} owner=${s.user.isPlatformOwner}`

describe('route discovery', () => {
  it('finds the app routes', () => {
    for (const p of ['/login', '/dashboard', '/verify-email', '/verify-email-token', '/school-approval', '/parent/dashboard']) {
      expect(APP_ROUTES).toContain(p)
    }
  })
})

describe('guarded pages stay protected', () => {
  it('every guarded page sends a signed-out visitor away, except the sign-in pages', () => {
    const open = GUARDED_ROUTES.filter(
      (p) => !isSignedOutPage(p) && resolveRedirect(p, { hasToken: false, user: anonymous }) === null,
    )
    // A page here usually means its folder is missing from KNOWN_APP_ROUTES.
    expect(open).toEqual([])
  })

  it('a parent is kept out of every guarded staff page', () => {
    // Sign-up pages stay open to everyone, as before.
    const p = { id: 'p1', role: 'PARENT', isVerifiedEmail: true, isVerifiedSchool: true }
    const leaks = GUARDED_ROUTES.filter(
      (r) =>
        !r.startsWith('/signup/') &&
        r !== '/qr' &&
        !['/parent', '/settings', '/support', '/contact-us'].some((pre) => r === pre || r.startsWith(`${pre}/`)) &&
        resolveRedirect(r, { hasToken: true, user: p }) === null,
    )
    expect(leaks).toEqual([])
  })

  it('a student is kept out of every guarded page except the student portal and /qr', () => {
    const s = { id: 's1', role: 'STUDENT', isVerifiedEmail: true, isVerifiedSchool: true }
    const leaks = GUARDED_ROUTES.filter(
      (r) =>
        !r.startsWith('/signup/') &&
        r !== '/qr' &&
        !(r === '/student' || r.startsWith('/student/')) &&
        resolveRedirect(r, { hasToken: true, user: s }) === null,
    )
    expect(leaks).toEqual([])
  })

  it('staff and parents never open a student page', () => {
    for (const role of ['ADMIN', 'TEACHER', 'PARENT']) {
      const u = { id: 'x1', role, isVerifiedEmail: true, isVerifiedSchool: true }
      const open = GUARDED_ROUTES.filter(
        (r) => (r === '/student' || r.startsWith('/student/')) && resolveRedirect(r, { hasToken: true, user: u }) === null,
      )
      expect(open, role).toEqual([])
    }
  })
})

// STUDENT users live in /student and nowhere else; the QR card link (/qr)
// works signed out and from any session, because classroom devices are shared.
describe('student routing', () => {
  const student: RouteUser = { id: 's1', role: 'STUDENT', isVerifiedEmail: true, isVerifiedSchool: true }
  const teacher: RouteUser = { id: 't1', role: 'TEACHER', isVerifiedEmail: true, isVerifiedSchool: true }
  const parentUser: RouteUser = { id: 'p1', role: 'PARENT', isVerifiedEmail: true, isVerifiedSchool: true }

  it('a student lands on /student', () => {
    expect(homeFor(student)).toBe('/student')
    expect(resolveRedirect('/student', signedInState(student))).toBeNull()
  })

  it('a student on a staff, parent or admin page goes to /student', () => {
    expect(resolveRedirect('/dashboard', signedInState(student))).toBe('/student')
    expect(resolveRedirect('/parent/classes', signedInState(student))).toBe('/student')
    expect(resolveRedirect('/admin-panel', signedInState(student))).toBe('/student')
    expect(resolveRedirect('/login', signedInState(student))).toBe('/student')
  })

  it('a student may open any student page', () => {
    expect(resolveRedirect('/student/todo', signedInState(student))).toBeNull()
    expect(resolveRedirect('/student/classes/abc', signedInState(student))).toBeNull()
  })

  it('/studentfoo is not a student page', () => {
    expect(resolveRedirect('/studentfoo', signedInState(student))).toBe('/student')
  })

  it('staff and parents are sent home from student pages', () => {
    expect(resolveRedirect('/student', signedInState(teacher))).toBe('/dashboard')
    expect(resolveRedirect('/student/grades', signedInState(parentUser))).toBe('/parent/dashboard')
  })

  it('the QR sign-in page opens signed out and from any session', () => {
    expect(resolveRedirect('/qr', { hasToken: false, user: anonymous })).toBeNull()
    expect(resolveRedirect('/qr', signedInState(teacher))).toBeNull()
    expect(resolveRedirect('/qr', signedInState(parentUser))).toBeNull()
    expect(resolveRedirect('/qr', signedInState(student))).toBeNull()
  })

  it('landing after sign-in keeps a student inside the portal', () => {
    expect(landingFor(student, '/student/grades')).toBe('/student/grades')
    expect(landingFor(student, '/classes')).toBe('/student')
    expect(landingFor(student)).toBe('/student')
  })
})

// A staff member who is also a parent carries roles [TEACHER|ADMIN, PARENT]
// and flips `role` between them. Routing follows the active view only; the
// base role and the list of views must never open or close a door.
describe('dual-role users route by their active view', () => {
  const staff = { id: 'd1', isVerifiedEmail: true, isVerifiedSchool: true }
  const teacherInParentView: RouteUser = { ...staff, role: 'PARENT', baseRole: 'TEACHER', roles: ['TEACHER', 'PARENT'] }
  const adminInParentView: RouteUser = { ...staff, role: 'PARENT', baseRole: 'ADMIN', roles: ['ADMIN', 'PARENT'] }
  const teacherInStaffView: RouteUser = { ...staff, role: 'TEACHER', baseRole: 'TEACHER', roles: ['TEACHER', 'PARENT'] }
  const plainParent: RouteUser = { ...staff, role: 'PARENT' }
  const plainTeacher: RouteUser = { ...staff, role: 'TEACHER' }

  it('a teacher in parent view is confined exactly like a parent', () => {
    for (const p of PATHS) {
      expect(resolveRedirect(p, { hasToken: true, user: teacherInParentView })).toBe(resolveRedirect(p, { hasToken: true, user: plainParent }))
    }
    expect(homeFor(teacherInParentView)).toBe('/parent/dashboard')
  })

  it('an admin in parent view loses the admin pages until they switch back', () => {
    expect(resolveRedirect('/admin-panel/users', { hasToken: true, user: adminInParentView })).toBe('/parent/dashboard')
    expect(resolveRedirect('/finance', { hasToken: true, user: adminInParentView })).toBe('/parent/dashboard')
    expect(resolveRedirect('/parent/grades', { hasToken: true, user: adminInParentView })).toBeNull()
  })

  it('a teacher in staff view routes exactly like a plain teacher', () => {
    for (const p of PATHS) {
      expect(resolveRedirect(p, { hasToken: true, user: teacherInStaffView })).toBe(resolveRedirect(p, { hasToken: true, user: plainTeacher }))
    }
    expect(homeFor(teacherInStaffView)).toBe('/dashboard')
  })

  it('landing after sign-in honours ?next= within the active view only', () => {
    expect(landingFor(teacherInParentView, '/gradebook')).toBe('/parent/dashboard')
    expect(landingFor(teacherInParentView, '/parent/grades')).toBe('/parent/grades')
    expect(landingFor(teacherInStaffView, '/gradebook')).toBe('/gradebook')
  })
})

// Redirects pages make on their own, outside AuthGuard. Each landing must
// settle without leading back to the page that sent the user there.
const PAGE_REDIRECTS: { from: string; to: string; signedIn: boolean; roles: (string | null)[] }[] = [
  { from: '/my-schedule', to: '/school-schedule', signedIn: true, roles: ['ADMIN'] },
  { from: '/admin-panel/schedule-planner', to: '/dashboard', signedIn: true, roles: ['TEACHER', 'PARENT', 'STAFF', null] },
  { from: '/does-not-exist', to: '/dashboard', signedIn: true, roles: ROLES },
  { from: '/does-not-exist', to: '/', signedIn: false, roles: [null] },
  { from: '/verify-email-token', to: '/login', signedIn: true, roles: ROLES },
  { from: '/verify-email-token', to: '/login', signedIn: false, roles: [null] },
  { from: '/reset-password', to: '/login?next=%2Fdashboard', signedIn: false, roles: [null] },
  { from: '/signup/x-schoolSlug', to: '/signup/x-schoolSlug/parent', signedIn: false, roles: [null] },
  // Logout and delete-account: token removed, then a push to /login or /signup.
  { from: '/verify-email', to: '/login', signedIn: false, roles: [null] },
  { from: '/school-approval', to: '/signup', signedIn: false, roles: [null] },
  // A QR card sign-in lands the student in the portal; a refused card offers /login.
  { from: '/qr', to: '/student', signedIn: true, roles: ['STUDENT'] },
  { from: '/qr', to: '/login', signedIn: false, roles: [null] },
]

describe('page-level redirects', () => {
  it('every page-level redirect settles without bouncing back', () => {
    const failures: string[] = []
    for (const r of PAGE_REDIRECTS) {
      const candidates = r.signedIn ? users.filter((u) => r.roles.includes(u.role)) : [anonymous]
      for (const user of candidates) {
        const state = { hasToken: r.signedIn, user }
        let landed: string
        try {
          landed = settle(r.to, state)
        } catch (e) {
          failures.push(`${describeState(state)}: ${r.from} -> ${r.to}: ${(e as Error).message}`)
          continue
        }
        if (landed === r.from && resolveRedirect(r.from, state) === null) {
          failures.push(`${describeState(state)}: ${r.from} -> ${r.to} -> back to ${landed}`)
        }
      }
    }
    expect(failures).toEqual([])
  })
})

describe('resolveRedirect invariants (every state x every page)', () => {
  it('every redirect lands on a page that does not redirect again (no loops, no ping-pong)', () => {
    const failures: string[] = []
    for (const state of states) {
      for (const p of PATHS) {
        const target = resolveRedirect(p, state)
        if (target === null) continue
        const again = resolveRedirect(target, state)
        if (again !== null) failures.push(`${describeState(state)}: ${p} -> ${target} -> ${again}`)
      }
    }
    expect(failures).toEqual([])
  })

  it('never redirects to the page the user is already on', () => {
    for (const state of states) {
      for (const p of PATHS) expect(resolveRedirect(p, state), `${describeState(state)} at ${p}`).not.toBe(p)
    }
  })

  it('only redirects to pages that exist', () => {
    for (const state of states) {
      for (const p of PATHS) {
        const target = resolveRedirect(p, state)
        if (target !== null) expect(APP_ROUTES, `${describeState(state)}: ${p} -> ${target}`).toContain(target)
      }
    }
  })

  it("a signed-in user's home is always a page they may stay on", () => {
    for (const user of users) {
      const home = homeFor(user)
      expect(APP_ROUTES).toContain(home)
      expect(resolveRedirect(home, { hasToken: true, user }), describeState({ hasToken: true, user })).toBeNull()
    }
  })

  it('every page a signed-in user lands on after sign-in is one they may stay on', () => {
    for (const user of users) {
      for (const next of [null, ...PATHS]) {
        const target = landingFor(user, next)
        expect(resolveRedirect(target.split('?')[0], { hasToken: true, user }), `${describeState({ hasToken: true, user })} next=${next}`).toBeNull()
      }
    }
  })
})

const parent = (over: Partial<RouteUser> = {}): RouteUser => ({
  id: 'p1', role: 'PARENT', isVerifiedEmail: true, isVerifiedSchool: true, ...over,
})
const signedIn = (user: RouteUser): RouteState => ({ hasToken: true, user })

describe('regressions', () => {
  it('unverified parent can stay on /verify-email (the zafsheen loop)', () => {
    const s = signedIn(parent({ isVerifiedEmail: false, isVerifiedSchool: false }))
    expect(resolveRedirect('/verify-email', s)).toBeNull()
    expect(resolveRedirect('/verify-email-token', s)).toBeNull()
    expect(resolveRedirect('/parent/dashboard', s)).toBe('/verify-email')
    expect(resolveRedirect('/dashboard', s)).toBe('/verify-email')
  })

  it('parent awaiting school approval can stay on /school-approval', () => {
    const s = signedIn(parent({ isVerifiedSchool: false }))
    expect(resolveRedirect('/school-approval', s)).toBeNull()
    expect(resolveRedirect('/parent/dashboard', s)).toBe('/school-approval')
    expect(resolveRedirect('/verify-email', s)).toBe('/school-approval')
  })

  it('the email link works without a session (opened on another device)', () => {
    expect(resolveRedirect('/verify-email-token', { hasToken: false, user: anonymous })).toBeNull()
  })

  it('fully onboarded users are moved off onboarding pages', () => {
    expect(resolveRedirect('/verify-email', signedIn(parent()))).toBe('/parent/dashboard')
    expect(resolveRedirect('/school-approval', signedIn(parent()))).toBe('/parent/dashboard')
  })

  it('parents go straight home, without a /dashboard hop', () => {
    expect(resolveRedirect('/login', signedIn(parent()))).toBe('/parent/dashboard')
    expect(resolveRedirect('/dashboard', signedIn(parent()))).toBe('/parent/dashboard')
    expect(resolveRedirect('/whats-new', signedIn(parent()))).toBe('/parent/dashboard')
  })

  it('admins are never held for school approval, at login or in the guard', () => {
    const admin: RouteUser = { id: 'a1', role: 'ADMIN', isVerifiedEmail: true, isVerifiedSchool: false }
    expect(homeFor(admin)).toBe('/dashboard')
    expect(landingFor(admin)).toBe('/dashboard')
    expect(resolveRedirect('/dashboard', signedIn(admin))).toBeNull()
  })

  it('waits while the session is being validated', () => {
    expect(resolveRedirect('/dashboard', { hasToken: true, user: anonymous })).toBeNull()
  })
})

describe('landingFor / safeNextPath', () => {
  const teacher: RouteUser = { id: 't1', role: 'TEACHER', isVerifiedEmail: true, isVerifiedSchool: true }

  it('honours a next path the user may open', () => {
    expect(landingFor(teacher, '/gradebook?class=1')).toBe('/gradebook?class=1')
  })

  it('falls back to home when next is not allowed for the user', () => {
    expect(landingFor(teacher, '/admin-panel/users')).toBe('/dashboard')
    expect(landingFor(parent(), '/dashboard')).toBe('/parent/dashboard')
    expect(landingFor(parent({ isVerifiedEmail: false }), '/parent/dashboard')).toBe('/verify-email')
  })

  it('rejects other-origin paths', () => {
    expect(safeNextPath('//evil.com')).toBeNull()
    expect(safeNextPath('/\\evil.com')).toBeNull()
    expect(safeNextPath('https://evil.com')).toBeNull()
    expect(safeNextPath('/ok')).toBe('/ok')
  })

  // Browsers strip tabs and newlines before parsing, so each of these is
  // '//evil.com' by the time the router sees it.
  it.each(['/\t/evil.com', '/\n/evil.com', '/\r/evil.com', '/\t\\evil.com', '/\u0000/evil.com'])(
    'rejects %j, which browsers read as another origin',
    (next) => {
      expect(safeNextPath(next)).toBeNull()
      expect(landingFor(teacher, next)).toBe('/dashboard')
    },
  )

  it('keeps an encoded tab as a harmless same-site path', () => {
    // '%09' only becomes a tab if decoded twice; as written it is a path segment.
    expect(new URL(safeNextPath('/%09/evil.com')!, 'https://app.example').origin).toBe('https://app.example')
  })

  it('rejects a path that normalises to another origin', () => {
    expect(safeNextPath('/..//evil.com')).toBeNull()
    expect(safeNextPath('/a/..//evil.com')).toBeNull()
  })

  it('every next it accepts stays on this site', () => {
    const tries = ['/a', '/a?b=1#c', '/./a', '/..//evil.com', '/a/../../b', '/%2F%2Fevil.com']
    for (const next of tries) {
      const safe = safeNextPath(next)
      if (safe) {
        expect(safe.startsWith('//')).toBe(false)
        expect(new URL(safe, 'https://app.example').origin).toBe('https://app.example')
      }
    }
  })
})

describe('an email\'s ?set= link opened signed out', () => {
  const signedOut: RouteState = { hasToken: false, user: { id: null, role: null, isVerifiedEmail: false, isVerifiedSchool: false } }

  it('goes to sign-in carrying the choice, which sign-in then applies', () => {
    const detour = signInDetourFor('/parent/notifications', '?set=daily')
    expect(detour).toBe('/login?next=%2Fparent%2Fnotifications%3Fset%3Ddaily')
    expect(signInDetourFor('/parent/notifications', '?set=off')).toBe('/login?next=%2Fparent%2Fnotifications%3Fset%3Doff')
    // The detour lands on a page a signed-out visitor may open (no loop), and the next it carries is honoured by sign-in.
    expect(resolveRedirect('/login', signedOut)).toBeNull()
    const next = new URL(detour!, 'https://app.example').searchParams.get('next')
    expect(landingFor(parent(), next)).toBe('/parent/notifications?set=daily')
  })

  it('carries only the choice, not other parts of the address', () => {
    expect(signInDetourFor('/parent/notifications', '?set=daily&utm=x&next=//evil.com')).toBe(
      '/login?next=%2Fparent%2Fnotifications%3Fset%3Ddaily',
    )
  })

  it('ignores a value it does not know, a missing value, and every other page', () => {
    expect(signInDetourFor('/parent/notifications', '?set=weekly')).toBeNull()
    expect(signInDetourFor('/parent/notifications', '')).toBeNull()
    expect(signInDetourFor('/parent/dashboard', '?set=daily')).toBeNull()
    expect(signInDetourFor('/dashboard', '?set=off')).toBeNull()
  })

  it('never takes a student to the page after sign-in', () => {
    const student: RouteUser = { id: 's1', role: 'STUDENT', isVerifiedEmail: true, isVerifiedSchool: true }
    expect(landingFor(student, '/parent/notifications?set=daily')).toBe('/student')
  })

  it('leaves every other guarded page going to the front page when signed out', () => {
    expect(resolveRedirect('/parent/notifications', signedOut)).toBe('/')
    expect(resolveRedirect('/dashboard', signedOut)).toBe('/')
  })
})

describe('createLoopDetector', () => {
  it('trips after more than max hops inside the window', () => {
    const d = createLoopDetector({ max: 3, windowMs: 1000 })
    expect(d.record('/a', '/b', 0)).toBe(false)
    expect(d.record('/b', '/a', 10)).toBe(false)
    expect(d.record('/a', '/b', 20)).toBe(false)
    expect(d.record('/b', '/a', 30)).toBe(true)
    expect(d.trail()).toContain('/a -> /b')
  })

  it('forgets hops older than the window', () => {
    const d = createLoopDetector({ max: 2, windowMs: 100 })
    d.record('/a', '/b', 0)
    d.record('/b', '/a', 50)
    expect(d.record('/a', '/b', 200)).toBe(false)
  })
})
