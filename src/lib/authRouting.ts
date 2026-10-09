// src/lib/authRouting.ts
// The one place that decides where a signed-in (or signed-out) user belongs.
// AuthGuard and the login form both ask this module, so they cannot disagree,
// and everything here is pure so the whole state space is unit-tested
// (authRouting.test.ts): every redirect must land on a page that does not
// redirect again. That property is what makes redirect loops impossible.
//
// AuthGuard wraps only src/app/(user). The marketing pages, public forms and
// '/' sit outside it, so the rules below for those paths only matter when a
// (user) page links or redirects to them.
//
// Order of precedence:
//   1. No token: only public pages; everything else goes to '/'.
//   2. Onboarding (email unverified, then school approval pending): the user
//      may only be on that step's pages. Nothing else applies until it's done.
//   3. Fully onboarded: auth/onboarding pages send you home, then role and
//      owner gates.

export type RouteUser = {
  id: string | null
  role: string | null
  isVerifiedEmail: boolean
  isVerifiedSchool: boolean
  isPlatformOwner?: boolean
}

export type RouteState = {
  hasToken: boolean
  user: RouteUser
}

// Pages a signed-out visitor may open. A signed-in user on one of these is
// sent home (they are entry points, not destinations).
const AUTH_ENTRY_PATHS = ['/', '/login', '/signup', '/about', '/product', '/contact', '/demo', '/forgot-password', '/reset-password']

// The email link must work in any browser, signed in or not.
const VERIFY_EMAIL_PATHS = ['/verify-email', '/verify-email-token']
const SCHOOL_APPROVAL_PATHS = ['/school-approval']
const ONBOARDING_PATHS = [...VERIFY_EMAIL_PATHS, ...SCHOOL_APPROVAL_PATHS]

const ADMIN_ONLY_PREFIXES = ['/admin-panel', '/staff-attendance', '/finance']
const PARENT_PREFIXES = ['/parent', '/settings', '/support', '/contact-us']

// Known top-level app route segments (to distinguish from public form slugs).
// Every folder under src/app/(user) must be listed, or its two-segment pages
// look like /{school}/{form} and open up; authRouting.test.ts enforces that.
const KNOWN_APP_ROUTES = [
  'login', 'signup', 'about', 'product', 'contact', 'demo',
  'forgot-password', 'reset-password', 'dashboard', 'students', 'classes',
  'gradebook', 'attendance', 'reports', 'report-cards',
  'admin-panel', 'settings', 'support',
  'contact-us', 'verify-email', 'verify-email-token', 'school-approval',
  'staff-attendance', 'my-attendance', 'my-schedule', 'school-schedule', 'whats-new', 'parent',
  'finance', 'messages', 'observe', 'student-views', 'analytics',
  'forbidden', 'api', '_next',
]

const segmentsOf = (path: string) => path.split('/').filter(Boolean)

// Matches '/parent' and '/parent/...', not '/parentfoo'.
const underPrefix = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)

// A public registration form URL: /{schoolSlug}/{formSlug}
export const isPublicFormPath = (path: string) => {
  const segments = segmentsOf(path)
  return segments.length === 2 && !KNOWN_APP_ROUTES.includes(segments[0])
}

// Per-school signup pages are public: /signup/{schoolSlug}
export const isPublicSignupPath = (path: string) => path.startsWith('/signup/')

// Published schedule share links are public: /{schoolSlug}/schedule/{token}
export const isPublicSchedulePath = (path: string) => {
  const segments = segmentsOf(path)
  return segments.length === 3 && segments[1] === 'schedule' && !KNOWN_APP_ROUTES.includes(segments[0])
}

// Open to everyone regardless of session.
const isOpenPath = (path: string) =>
  isPublicFormPath(path) || isPublicSignupPath(path) || isPublicSchedulePath(path)

export const isParentPath = (path: string) => PARENT_PREFIXES.some((p) => underPrefix(path, p))

// The onboarding page the user must finish first, or null when done.
// Admins are created by invite and are never held for school approval.
export const onboardingStep = (user: RouteUser): string | null => {
  if (!user.isVerifiedEmail) return '/verify-email'
  if (user.role !== 'ADMIN' && !user.isVerifiedSchool) return '/school-approval'
  return null
}

const stepPaths = (step: string) => (step === '/verify-email' ? VERIFY_EMAIL_PATHS : SCHOOL_APPROVAL_PATHS)

// Where a signed-in user lands when nothing more specific applies.
export const homeFor = (user: RouteUser): string =>
  onboardingStep(user) ?? (user.role === 'PARENT' ? '/parent/dashboard' : '/dashboard')

// The redirect target for `path`, or null when the user may stay.
export const resolveRedirect = (path: string, state: RouteState): string | null => {
  if (!state.hasToken) {
    return AUTH_ENTRY_PATHS.includes(path) || path === '/verify-email-token' || isOpenPath(path) ? null : '/'
  }

  // Token but no user yet: AuthGuard is validating the session. Stay put.
  if (!state.user.id) return null

  const { user } = state
  const step = onboardingStep(user)
  if (step) return stepPaths(step).includes(path) ? null : step

  const home = homeFor(user)
  if (AUTH_ENTRY_PATHS.includes(path) || ONBOARDING_PATHS.includes(path)) return home
  if (isOpenPath(path)) return null
  if (underPrefix(path, '/observe') && user.isPlatformOwner === false) return home
  if (ADMIN_ONLY_PREFIXES.some((p) => underPrefix(path, p)) && user.role !== 'ADMIN') return home
  if (user.role === 'PARENT' && !isParentPath(path)) return home
  return null
}

// A same-origin path from ?next=, or null. Rejects '//host' and '/\host',
// which browsers treat as another origin.
export const safeNextPath = (next: string | null | undefined): string | null => {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null
  return next
}

// Where to go right after signing in: ?next= when the user may open it,
// otherwise home. The login form and AuthGuard both use this, so the two
// navigations they fire after sign-in always agree.
export const landingFor = (user: RouteUser, next?: string | null): string => {
  const home = homeFor(user)
  const target = safeNextPath(next)
  if (!target) return home
  const pathname = target.split(/[?#]/)[0]
  return resolveRedirect(pathname, { hasToken: true, user }) === null ? target : home
}

// Last line of defence: if a future rule ever fights another, AuthGuard stops
// redirecting after `max` hops inside `windowMs` instead of reloading forever.
export const createLoopDetector = ({ max = 6, windowMs = 5000 } = {}) => {
  let hops: { at: number; from: string; to: string }[] = []
  return {
    // Records a redirect; true means the loop limit was hit.
    record(from: string, to: string, at = Date.now()): boolean {
      hops = [...hops.filter((h) => at - h.at < windowMs), { at, from, to }]
      return hops.length > max
    },
    trail(): string {
      return hops.map((h) => `${h.from} -> ${h.to}`).join(', ')
    },
    reset() {
      hops = []
    },
  }
}
