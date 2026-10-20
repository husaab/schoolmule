// One-tap sign-in from a parent email's button (the backend's
// utils/emailLoginLink): /email-login?next=<path>#<token>. The token rides in
// the fragment, so it never reaches a server log; the page reads it once and
// drops it from the address bar. Pure rules only; the page is
// app/(user)/email-login. Unit-tested (emailLogin.test.ts).

export const EMAIL_LOGIN_PATH = '/email-login'

/** The token from the link's fragment (a JWT: three base64url parts), or null. */
export const readEmailLoginToken = (hash: string): string | null => {
  const m = /^#([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(hash.trim())
  return m ? m[1] : null
}

/**
 * The account the token names (its `sub`, read without checking the
 * signature), or null. Only compared with the session already open here; the
 * server checks the token itself.
 */
export const emailLoginSubject = (token: string): string | null => {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '=')))
    return typeof json.sub === 'string' ? json.sub : null
  } catch {
    return null
  }
}

export interface OpenSession {
  hasToken: boolean
  userId: string | null
  /** The database role (baseRole), so a teacher in parent view counts as staff. */
  role: string | null
}

/**
 * Sign in with the link, or keep the session already open and go on to the
 * page. Signed out, or signed in as another parent (a shared family device):
 * sign in as the link's parent. Already that parent: go on. Staff or a
 * student: keep their session, so a forwarded email never swaps a teacher's
 * or an admin's session for a parent's.
 */
export const emailLoginPlan = (open: OpenSession, linkUserId: string | null): 'signIn' | 'forward' => {
  if (!open.hasToken) return 'signIn'
  if (open.userId && open.userId === linkUserId) return 'forward'
  return open.role === 'PARENT' ? 'signIn' : 'forward'
}
