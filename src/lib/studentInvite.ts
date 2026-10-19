// src/lib/studentInvite.ts
// Pure rules behind the student invite page (/student-invite#<secret>): the
// secret from the link's fragment, the words for each way a link can be dead,
// and the student password rule (the same as the server's passwordProblem in
// services/classroom/studentInvites.js). Unit-tested (studentInvite.test.ts).

/** The invite secret from `window.location.hash`, or null: exactly 43 base64url characters. */
export const readInviteToken = (hash: string): string | null => {
  const m = /^#([A-Za-z0-9_-]{43})$/.exec(hash.trim())
  return m ? m[1] : null
}

export type InviteOutcome =
  | 'expired' | 'used' | 'replaced' | 'cancelled' | 'not_found'
  | 'not_open' | 'google_wrong_account' | 'google_wrong_domain' | 'google_blocked'

export interface OutcomeCopy {
  title: string
  body: string
  action?: { label: string; href: string }
}

const COPY: Record<InviteOutcome, OutcomeCopy> = {
  expired: { title: 'This invite has expired.', body: 'Ask your teacher or the school office to send a new one.' },
  used: { title: 'This invite was already used.', body: 'Sign in instead.', action: { label: 'Sign in', href: '/login' } },
  replaced: { title: 'This link was replaced by a newer one.', body: 'Check your email for the latest invite.' },
  cancelled: { title: 'This invite was cancelled.', body: 'Ask your school office if you need a new one.' },
  not_found: { title: "This link doesn't work.", body: 'Check you opened the whole link from your email.' },
  not_open: {
    title: "You're set up.",
    body: "Your school hasn't opened SchoolMule to students yet. You'll be able to sign in once it does.",
  },
  google_wrong_account: { title: "That's a different Google account.", body: '' },
  google_wrong_domain: { title: 'Use your school Google account.', body: '' },
  google_blocked: {
    title: "Google didn't let you sign in.",
    body: "Google didn't let you sign in. If it says your school blocked it, tell your teacher.",
  },
}

/** The page's words for an outcome (a dead link, a set-up-but-not-open account, a Google refusal). */
export const inviteOutcomeCopy = (outcome: InviteOutcome): OutcomeCopy => COPY[outcome]

// ---------------------------------------------------------------------------
// The student password rule (mirrors the server; the server has the last word).

const PASSWORD_MIN = 8
const COMMON = new Set(['password', 'password1', '12345678', '123456789', '1234567890', 'qwertyui', 'qwerty123', '11111111', 'abcdefgh', 'iloveyou'])

const normalize = (raw: string) =>
  raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export interface PasswordContext {
  email: string
  firstName: string
  lastName: string
  schoolName: string
}

/** Why a student's chosen password won't do, or null. */
export const studentPasswordProblem = (password: string, { email, firstName, lastName, schoolName }: PasswordContext): string | null => {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`
  const lower = password.toLowerCase()
  const address = email.toLowerCase()
  const local = address.split('@')[0]
  if (lower === address || (local.length >= 4 && lower.includes(local))) return "Don't use your email address."
  const squashed = normalize(password).replace(/\s+/g, '')
  const names = [firstName, lastName].flatMap((n) => normalize(n).split(' ')).filter((t) => t.length >= 3)
  if (names.some((n) => squashed.includes(n))) return "Don't use your name in your password."
  const school = normalize(schoolName).replace(/\s+/g, '')
  if (COMMON.has(lower) || (school.length >= 4 && squashed.includes(school))) return 'Choose something harder to guess.'
  return null
}
