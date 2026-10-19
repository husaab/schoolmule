import { describe, it, expect } from 'vitest'
import { inviteOutcomeCopy, readInviteToken, rememberedInviteToken, studentPasswordProblem } from './studentInvite'

const SECRET = 'a'.repeat(21) + '_' + 'B'.repeat(20) + '-'

describe('readInviteToken', () => {
  it('reads exactly one secret from the fragment', () => {
    expect(SECRET).toHaveLength(43)
    expect(readInviteToken(`#${SECRET}`)).toBe(SECRET)
  })
  it('refuses anything else', () => {
    expect(readInviteToken('')).toBeNull()
    expect(readInviteToken(SECRET)).toBeNull()
    expect(readInviteToken(`#${SECRET.slice(1)}`)).toBeNull()
    expect(readInviteToken(`#${SECRET}x`)).toBeNull()
    expect(readInviteToken('#preview')).toBeNull()
  })
})

describe('inviteOutcomeCopy', () => {
  it('has the spec words for every dead link', () => {
    expect(inviteOutcomeCopy('expired')).toEqual({
      title: 'This invite has expired.', body: 'Ask your teacher or the school office to send a new one.',
    })
    expect(inviteOutcomeCopy('used')).toEqual({
      title: 'This invite was already used.', body: 'Sign in instead.', action: { label: 'Sign in', href: '/login' },
    })
    expect(inviteOutcomeCopy('replaced')).toEqual({
      title: 'This link was replaced by a newer one.', body: 'Check your email for the latest invite.',
    })
    expect(inviteOutcomeCopy('cancelled')).toEqual({
      title: 'This invite was cancelled.', body: 'Ask your school office if you need a new one.',
    })
    expect(inviteOutcomeCopy('not_found')).toEqual({
      title: "This link doesn't work.", body: 'Check you opened the whole link from your email.',
    })
  })
  it('explains a set-up account that cannot sign in yet, and Google refusals', () => {
    expect(inviteOutcomeCopy('not_open')).toEqual({
      title: "You're set up.", body: "Your school hasn't opened SchoolMule to students yet. You'll be able to sign in once it does.",
    })
    expect(inviteOutcomeCopy('google_blocked')).toEqual({
      title: "Google didn't let you sign in.", body: 'If it says your school blocked it, tell your teacher.',
    })
  })
})

describe('studentPasswordProblem (same rules as the server)', () => {
  const ctx = { email: 'amal.haddad@students.example.org', firstName: 'Amal', lastName: 'Haddad', schoolName: 'Al Haadi Academy' }
  it.each([
    ['short1', 'Use at least 8 characters.'],
    ['amal.haddad', "Don't use your email address."],
    ['amal.haddad2026', "Don't use your email address."],
    ['amalhaddad1', "Don't use your name in your password."],
    ['Haddad-family', "Don't use your name in your password."],
    ['password', 'Choose something harder to guess.'],
    ['12345678', 'Choose something harder to guess.'],
    ['alhaadiacademy1', 'Choose something harder to guess.'],
  ])('refuses %p', (pw, message) => {
    expect(studentPasswordProblem(pw, ctx)).toBe(message)
  })
  it('accepts a passphrase', () => {
    expect(studentPasswordProblem('cedar-river', ctx)).toBeNull()
    expect(studentPasswordProblem('maple lake 42', ctx)).toBeNull()
  })
})

describe('rememberedInviteToken (a reload keeps the link)', () => {
  it('takes the fragment first and remembers it for the tab; a reload with no fragment uses the remembered one', () => {
    const store = new Map<string, string>()
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) }
    expect(rememberedInviteToken(`#${SECRET}`, storage)).toBe(SECRET)
    expect(rememberedInviteToken('', storage)).toBe(SECRET)
    const other = 'c'.repeat(43)
    expect(rememberedInviteToken(`#${other}`, storage)).toBe(other)
  })
  it('works without storage (private mode)', () => {
    const broken = { getItem: () => { throw new Error('no') }, setItem: () => { throw new Error('no') } }
    expect(rememberedInviteToken(`#${SECRET}`, broken)).toBe(SECRET)
    expect(rememberedInviteToken('', broken)).toBeNull()
  })
})
