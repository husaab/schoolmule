import { describe, expect, it } from 'vitest'
import { emailLoginPlan, emailLoginSubject, readEmailLoginToken } from './emailLogin'

// A token shaped like the server's: header.payload.signature, payload { sub }.
const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const token = (sub: string) => `${b64url('{"alg":"HS256"}')}.${b64url(JSON.stringify({ typ: 'email-login', sub }))}.c2lnbmF0dXJl`

describe('readEmailLoginToken', () => {
  it('reads a three-part token from the fragment', () => {
    const t = token('u1')
    expect(readEmailLoginToken(`#${t}`)).toBe(t)
  })

  it('ignores an empty, malformed or extra-text fragment', () => {
    expect(readEmailLoginToken('')).toBeNull()
    expect(readEmailLoginToken('#abc')).toBeNull()
    expect(readEmailLoginToken('#a.b')).toBeNull()
    expect(readEmailLoginToken('#a.b.c&next=/x')).toBeNull()
  })
})

describe('emailLoginSubject', () => {
  it('reads the account the token names, or null for junk', () => {
    expect(emailLoginSubject(token('11111111-1111-4111-8111-111111111111'))).toBe('11111111-1111-4111-8111-111111111111')
    expect(emailLoginSubject('a.b.c')).toBeNull()
  })
})

describe('emailLoginPlan', () => {
  it('signs in when signed out, or signed in as another parent', () => {
    expect(emailLoginPlan({ hasToken: false, userId: null, role: null }, 'u1')).toBe('signIn')
    expect(emailLoginPlan({ hasToken: true, userId: 'u2', role: 'PARENT' }, 'u1')).toBe('signIn')
  })

  it('goes straight on when already that parent', () => {
    expect(emailLoginPlan({ hasToken: true, userId: 'u1', role: 'PARENT' }, 'u1')).toBe('forward')
  })

  it("never swaps a staff member's or a student's session", () => {
    expect(emailLoginPlan({ hasToken: true, userId: 't1', role: 'TEACHER' }, 'u1')).toBe('forward')
    expect(emailLoginPlan({ hasToken: true, userId: 'a1', role: 'ADMIN' }, 'u1')).toBe('forward')
    expect(emailLoginPlan({ hasToken: true, userId: 's1', role: 'STUDENT' }, 'u1')).toBe('forward')
    expect(emailLoginPlan({ hasToken: true, userId: null, role: null }, 'u1')).toBe('forward')
  })
})
