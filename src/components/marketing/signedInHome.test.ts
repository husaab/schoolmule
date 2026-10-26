import { describe, expect, it } from 'vitest'
import { signedInHome } from './signedInHome'

describe('signedInHome', () => {
  it('is null when signed out', () => {
    expect(signedInHome({ id: null, role: null }, false)).toBeNull()
  })

  it('is null with a stored user but no token', () => {
    expect(signedInHome({ id: 'u1', role: 'TEACHER' }, false)).toBeNull()
  })

  it('is null with a token but no stored user', () => {
    expect(signedInHome({ id: null, role: null }, true)).toBeNull()
  })

  it('sends staff to the dashboard', () => {
    expect(signedInHome({ id: 'u1', role: 'ADMIN' }, true)).toEqual({
      href: '/dashboard',
      label: 'Back to dashboard',
      short: 'Dashboard',
    })
    expect(signedInHome({ id: 'u1', role: 'TEACHER' }, true)?.href).toBe('/dashboard')
  })

  it('sends parents to the parent dashboard', () => {
    expect(signedInHome({ id: 'u1', role: 'PARENT' }, true)).toEqual({
      href: '/parent/dashboard',
      label: 'Back to dashboard',
      short: 'Dashboard',
    })
  })

  it('sends students to their home page', () => {
    expect(signedInHome({ id: 'u1', role: 'STUDENT' }, true)).toEqual({
      href: '/student',
      label: 'Back to home',
      short: 'Home',
    })
  })
})
