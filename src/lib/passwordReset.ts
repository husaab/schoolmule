// The reset-password page's reading of the server: which password rule a link
// carries, and what a refused request means for the page.
import { isApiError } from '@/services/apiClient'

/** Students choose a password under the invite's stricter rule (server: passwordProblem). */
export type PasswordRule = 'student' | 'standard'

export const passwordRuleFrom = (raw: unknown): PasswordRule => (raw === 'student' ? 'student' : 'standard')

export const minPasswordLength = (rule: PasswordRule): number => (rule === 'student' ? 8 : 6)

/**
 * - dead_link: unknown, expired or already used; the page offers a new link
 * - blocked: the school signs students in with Google only
 * - message: a refusal the person can act on (a weak password, too many tries)
 * - unknown: a crash or no connection; worth another try
 */
export type ResetFailure =
  | { kind: 'dead_link' }
  | { kind: 'blocked'; message: string }
  | { kind: 'message'; message: string }
  | { kind: 'unknown' }

// The message fallback covers a backend deployed without RESET_LINK_INVALID;
// remove it once that backend is live.
const isDeadLink = (status: number, code: string | null, message: string) =>
  code === 'RESET_LINK_INVALID' || (status === 400 && !code && /invalid or expired token/i.test(message))

export const resetFailure = (err: unknown): ResetFailure => {
  if (!isApiError(err)) return { kind: 'unknown' }
  if (isDeadLink(err.status, err.code, err.message)) return { kind: 'dead_link' }
  if (err.code === 'PASSWORD_SIGN_IN_OFF') return { kind: 'blocked', message: err.message }
  if (err.status < 500 && err.message) return { kind: 'message', message: err.message }
  return { kind: 'unknown' }
}
