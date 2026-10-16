import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SchoolYear } from './types/schoolYear'

// startSession is what every fresh sign-in (password, Google, signup) runs,
// so the three can never store a session differently.

const setToken = vi.fn()
const setUser = vi.fn()
const setYears = vi.fn()
const selectYear = vi.fn()

vi.mock('./authService', () => ({
  getToken: () => null,
  setToken: (...args: unknown[]) => setToken(...args),
  removeToken: vi.fn(),
}))
vi.mock('@/store/useUserStore', () => ({ useUserStore: { getState: () => ({ setUser }) } }))
vi.mock('@/store/useSchoolYearStore', () => ({ useSchoolYearStore: { getState: () => ({ setYears, selectYear }) } }))
vi.mock('@/store/useSelectedChildStore', () => ({ useSelectedChildStore: { getState: () => ({}) } }))
vi.mock('@/store/useImpersonationStore', () => ({ useImpersonationStore: { getState: () => ({}) } }))

const { startSession } = await import('./sessionSync')

const year: SchoolYear = { schoolYearId: 'year-1', school: 'TEST', label: '2026-2027', startDate: '2026-09-01', endDate: '2027-06-30', isActive: true }

const signIn = {
  userId: 'user-1',
  username: 'Demo Parent',
  fullName: 'Demo Parent',
  email: 'parent.demo@example.test',
  school: 'TEST',
  role: 'TEACHER',
  baseRole: 'TEACHER',
  roles: ['TEACHER', 'PARENT'],
  isVerified: true,
  isVerifiedSchool: false,
  isPlatformOwner: false,
  createdAt: '2026-10-15T00:00:00.000Z',
  lastModifiedAt: '2026-10-15T00:00:00.000Z',
  activeTerm: 'Term 1',
  token: 'session-token',
  activeSchoolYear: { schoolYearId: 'year-1', label: '2026-2027' },
  schoolYears: [year],
}

describe('startSession', () => {
  beforeEach(() => {
    setToken.mockReset()
    setUser.mockReset()
    setYears.mockReset()
    selectYear.mockReset()
  })

  it('stores the token, the user and the school years, and returns the user for routing', () => {
    const user = startSession(signIn)

    expect(setToken).toHaveBeenCalledWith('session-token')
    expect(user).toEqual({
      id: 'user-1',
      username: 'Demo Parent',
      email: 'parent.demo@example.test',
      school: 'TEST',
      role: 'TEACHER',
      baseRole: 'TEACHER',
      roles: ['TEACHER', 'PARENT'],
      isVerifiedEmail: true,
      isVerifiedSchool: false,
      activeTerm: 'Term 1',
      isPlatformOwner: false,
    })
    expect(setUser).toHaveBeenCalledWith(user)
    expect(setYears).toHaveBeenCalledWith([year])
    expect(selectYear).toHaveBeenCalledWith('year-1')
  })

  it('fills the view fields a signup response leaves out and stores "no term" as null', () => {
    const user = startSession({
      ...signIn,
      role: 'PARENT',
      baseRole: undefined,
      roles: undefined,
      activeTerm: false as unknown as string,
      activeSchoolYear: null,
      schoolYears: undefined,
    })

    expect(user).toMatchObject({ role: 'PARENT', baseRole: 'PARENT', roles: ['PARENT'], activeTerm: null })
    expect(setYears).toHaveBeenCalledWith([])
    expect(selectYear).toHaveBeenCalledWith(null)
  })
})
