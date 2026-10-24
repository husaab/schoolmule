import { describe, it, expect, vi, afterEach } from 'vitest'
import vm from 'vm'
import {
  websiteRedirect,
  WEBSITE_REDIRECT_SCRIPT,
  VIEW_WEBSITE_HREF,
  VIEW_WEBSITE_PARAM,
  TOKEN_KEY,
  USER_STORAGE_KEY,
} from './websiteVisit'
import { WEBSITE_PATHS, resolveRedirect, onboardingStep, type RouteState, type RouteUser } from './authRouting'

const memoryStorage = (initial: Record<string, string> = {}) => {
  const items = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => void items.set(k, String(v)),
    removeItem: (k: string) => void items.delete(k),
    has: (k: string) => items.has(k),
  }
}

const throwingStorage = () => ({
  getItem: () => { throw new Error('blocked') },
  setItem: () => { throw new Error('blocked') },
})

type ScriptRun = {
  path: string
  search?: string
  local?: ReturnType<typeof memoryStorage> | ReturnType<typeof throwingStorage>
  session?: ReturnType<typeof memoryStorage> | ReturnType<typeof throwingStorage>
}

// Runs the inline script the way a browser would on a fresh page load.
const runScript = ({ path, search = '', local = memoryStorage(), session = memoryStorage() }: ScriptRun) => {
  let replacedWith: string | null = null
  let hidden = false
  const sandbox: Record<string, unknown> = {
    location: { pathname: path, search, replace: (url: string) => { replacedWith = url } },
    URLSearchParams,
    localStorage: local,
    sessionStorage: session,
    document: {
      createElement: () => ({}),
      head: { appendChild: () => { hidden = true } },
    },
  }
  sandbox.window = sandbox
  vm.runInNewContext(WEBSITE_REDIRECT_SCRIPT, sandbox)
  return { replacedWith: replacedWith as string | null, hidden, flagged: Boolean(sandbox.__smWebsiteRedirect) }
}

// What useUserStore persists (zustand persist, { state, version }).
const persisted = (user: Partial<RouteUser>) => JSON.stringify({ state: { user, hasHydrated: true }, version: 0 })

const signedIn = (user: Partial<RouteUser>) =>
  memoryStorage({ [TOKEN_KEY]: 'token', [USER_STORAGE_KEY]: persisted(user) })

// Follows AuthGuard's redirects until the user settles.
const settle = (start: string, state: RouteState): string => {
  let at = start
  for (let hops = 0; hops < 5; hops++) {
    const next = resolveRedirect(at, state)
    if (next === null) return at
    at = next
  }
  throw new Error(`no settle from ${start}`)
}

const staff: RouteUser = { id: 'u1', role: 'TEACHER', isVerifiedEmail: true, isVerifiedSchool: true }

describe('websiteRedirect', () => {
  it('sends a signed-in user on any website page to their home page', () => {
    for (const path of WEBSITE_PATHS) {
      expect(websiteRedirect(path, { hasToken: true, user: staff }, false)).toBe('/dashboard')
      expect(websiteRedirect(path, { hasToken: true, user: { ...staff, role: 'PARENT' } }, false)).toBe('/parent/dashboard')
      expect(websiteRedirect(path, { hasToken: true, user: { ...staff, role: 'STUDENT' } }, false)).toBe('/student')
    }
  })

  it('sends a user still onboarding to their step', () => {
    expect(websiteRedirect('/', { hasToken: true, user: { ...staff, isVerifiedEmail: false } }, false)).toBe('/verify-email')
    expect(websiteRedirect('/', { hasToken: true, user: { ...staff, isVerifiedSchool: false } }, false)).toBe('/school-approval')
  })

  it('lets a signed-in user browse the website once they chose to', () => {
    for (const path of WEBSITE_PATHS) expect(websiteRedirect(path, { hasToken: true, user: staff }, true)).toBeNull()
  })

  it('leaves signed-out visitors, half-loaded sessions and other pages alone', () => {
    const anonymous: RouteUser = { id: null, role: null, isVerifiedEmail: false, isVerifiedSchool: false }
    expect(websiteRedirect('/', { hasToken: false, user: anonymous }, false)).toBeNull()
    expect(websiteRedirect('/', { hasToken: true, user: anonymous }, false)).toBeNull()
    for (const path of ['/privacy', '/terms', '/dashboard', '/login', '/jcc/enrolment-form']) {
      expect(websiteRedirect(path, { hasToken: true, user: staff }, false)).toBeNull()
    }
  })

  it('opens the website on a page that starts a visit', () => {
    const url = new URL(VIEW_WEBSITE_HREF, 'https://schoolmule.ca')
    expect(WEBSITE_PATHS).toContain(url.pathname)
    expect(url.searchParams.has(VIEW_WEBSITE_PARAM)).toBe(true)
  })
})

describe('WEBSITE_REDIRECT_SCRIPT', () => {
  const ROLES = ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'STAFF', null]
  const BOOLS = [true, false]
  const PATHS = [...WEBSITE_PATHS, '/privacy', '/terms', '/dashboard', '/login', '/parent/dashboard']

  it('ends every user state where websiteRedirect does', () => {
    for (const role of ROLES)
      for (const isVerifiedEmail of BOOLS)
        for (const isVerifiedSchool of BOOLS)
          for (const hasToken of BOOLS)
            for (const path of PATHS) {
              const user: RouteUser = { id: 'u1', role, isVerifiedEmail, isVerifiedSchool }
              const state = { hasToken, user }
              const local = memoryStorage({ [USER_STORAGE_KEY]: persisted(user), ...(hasToken ? { [TOKEN_KEY]: 'token' } : {}) })
              const expected = websiteRedirect(path, state, false)
              const { replacedWith, hidden, flagged } = runScript({ path, local })
              const label = `${role} email=${isVerifiedEmail} school=${isVerifiedSchool} token=${hasToken} ${path}`

              if (expected === null) {
                expect(replacedWith, label).toBeNull()
                expect(hidden || flagged, label).toBe(false)
              } else {
                // Straight home in one hop; only an onboarding step is left to AuthGuard.
                if (onboardingStep(user) === null) expect(replacedWith, label).toBe(expected)
                else expect(settle(replacedWith!, state), label).toBe(expected)
                expect(hidden && flagged, label).toBe(true)
              }
            }
  })

  it('stays put for a session with no user yet or unreadable user data', () => {
    expect(runScript({ path: '/', local: memoryStorage({ [TOKEN_KEY]: 't' }) }).replacedWith).toBeNull()
    expect(runScript({ path: '/', local: memoryStorage({ [TOKEN_KEY]: 't', [USER_STORAGE_KEY]: persisted({ id: null }) }) }).replacedWith).toBeNull()
    expect(runScript({ path: '/', local: memoryStorage({ [TOKEN_KEY]: 't', [USER_STORAGE_KEY]: '{not json' }) }).replacedWith).toBeNull()
  })

  it('starts a visit from ?website and keeps it for the rest of the tab', () => {
    const session = memoryStorage()
    expect(runScript({ path: '/', search: `?${VIEW_WEBSITE_PARAM}=1`, local: signedIn(staff), session }).replacedWith).toBeNull()
    // A refresh, or a fresh load of another website page, in the same tab.
    expect(runScript({ path: '/about', local: signedIn(staff), session }).replacedWith).toBeNull()
    // A new tab has its own sessionStorage, so arriving there redirects again.
    expect(runScript({ path: '/about', local: signedIn(staff) }).replacedWith).toBe('/dashboard')
  })

  it('treats blocked storage as "stay", but still honours ?website', () => {
    expect(runScript({ path: '/', local: throwingStorage() }).replacedWith).toBeNull()
    expect(runScript({ path: '/', local: signedIn(staff), session: throwingStorage() }).replacedWith).toBe('/dashboard')
    expect(runScript({ path: '/', search: `?${VIEW_WEBSITE_PARAM}`, local: signedIn(staff), session: throwingStorage() }).replacedWith).toBeNull()
  })
})

describe('session storage keys', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('reads the user where useUserStore persists it', async () => {
    const storage = memoryStorage()
    vi.stubGlobal('localStorage', storage)
    const { useUserStore } = await import('@/store/useUserStore')
    useUserStore.getState().setUser({ ...staff, username: null, email: null, school: null, activeTerm: null })
    expect(JSON.parse(storage.getItem(USER_STORAGE_KEY)!).state.user).toMatchObject({ id: 'u1', role: 'TEACHER' })
  })

  it('reads the token where authService keeps it', async () => {
    const storage = memoryStorage()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('window', { localStorage: storage })
    const { setToken } = await import('@/services/authService')
    setToken('abc')
    expect(storage.getItem(TOKEN_KEY)).toBe('abc')
  })
})
