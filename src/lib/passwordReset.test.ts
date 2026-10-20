import { describe, it, expect } from 'vitest'
import { ApiError } from '@/services/apiClient'
import { minPasswordLength, passwordRuleFrom, resetFailure } from './passwordReset'

const apiError = (status: number, message: string, code: string | null = null) => new ApiError(message, { status, code })

describe('passwordRuleFrom', () => {
  it('reads the student rule and treats anything else as standard', () => {
    expect(passwordRuleFrom('student')).toBe('student')
    expect(passwordRuleFrom('standard')).toBe('standard')
    // A backend that predates the field sends nothing.
    expect(passwordRuleFrom(undefined)).toBe('standard')
  })

  it('matches the server minimums', () => {
    expect(minPasswordLength('student')).toBe(8)
    expect(minPasswordLength('standard')).toBe(6)
  })
})

describe('resetFailure', () => {
  it('a dead link, by code or by the older message', () => {
    expect(resetFailure(apiError(400, 'Invalid or expired token.', 'RESET_LINK_INVALID'))).toEqual({ kind: 'dead_link' })
    expect(resetFailure(apiError(400, 'Invalid or expired token.'))).toEqual({ kind: 'dead_link' })
  })

  it('a Google-only school blocks the password form', () => {
    const msg = 'Your school uses Google to sign in. Tap Continue with Google.'
    expect(resetFailure(apiError(403, msg, 'PASSWORD_SIGN_IN_OFF'))).toEqual({ kind: 'blocked', message: msg })
  })

  it("keeps the server's words for a refusal the person can act on", () => {
    expect(resetFailure(apiError(400, "Don't use your name in your password.", 'PASSWORD_WEAK')))
      .toEqual({ kind: 'message', message: "Don't use your name in your password." })
    expect(resetFailure(apiError(429, 'Too many login attempts. Please try again later.')))
      .toEqual({ kind: 'message', message: 'Too many login attempts. Please try again later.' })
  })

  it('a crash or a dropped connection is unknown', () => {
    expect(resetFailure(apiError(500, 'Internal server error'))).toEqual({ kind: 'unknown' })
    expect(resetFailure(new TypeError('Failed to fetch'))).toEqual({ kind: 'unknown' })
  })
})
