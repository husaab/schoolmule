import { describe, it, expect } from 'vitest'
import { accessRoleLabel, canImpersonate, canManageUser, isFullAdminAccount } from './adminUserAccess'
import type { SchoolUser } from '@/services/types/adminUser'

const account = (over: Partial<SchoolUser>): SchoolUser => ({
  userId: 'u-target',
  username: 'test.user',
  fullName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  email: 'test.user@example.test',
  school: 'TEST',
  role: 'TEACHER',
  staffTitle: null,
  accessRoleId: null,
  accessRoleName: null,
  isFullAdmin: false,
  isVerified: true,
  isVerifiedSchool: true,
  isArchived: false,
  archivedAt: null,
  declinedAt: null,
  invitePending: false,
  createdAt: '2026-10-01T00:00:00.000Z',
  lastModifiedAt: '2026-10-01T00:00:00.000Z',
  ...over,
})

const fullAdmin = account({ userId: 'u-admin', role: 'ADMIN', isFullAdmin: true })
const officeStaff = account({ userId: 'u-office', role: 'ADMIN', isFullAdmin: false, accessRoleId: 'r1', accessRoleName: 'Office Staff' })
const teacher = account({ userId: 'u-teacher' })
const parent = account({ userId: 'u-parent', role: 'PARENT' })

describe('isFullAdminAccount', () => {
  it('is an ADMIN without an access role', () => {
    expect(isFullAdminAccount(fullAdmin)).toBe(true)
    expect(isFullAdminAccount(officeStaff)).toBe(false)
    expect(isFullAdminAccount(teacher)).toBe(false)
  })

  it('reads an ADMIN from an older backend (no flag) by its access role', () => {
    expect(isFullAdminAccount({ role: 'ADMIN' })).toBe(true)
    expect(isFullAdminAccount({ role: 'ADMIN', accessRoleId: 'r1' })).toBe(false)
  })
})

describe('canManageUser', () => {
  it('lets a users holder manage everyone but full admins', () => {
    expect(canManageUser(fullAdmin, false)).toBe(false)
    expect(canManageUser(officeStaff, false)).toBe(true)
    expect(canManageUser(teacher, false)).toBe(true)
    expect(canManageUser(parent, false)).toBe(true)
  })

  it('lets a full admin manage anyone', () => {
    expect(canManageUser(fullAdmin, true)).toBe(true)
  })
})

describe('canImpersonate', () => {
  it('is for full admins only: a users holder previews nobody here (students live on Student accounts)', () => {
    for (const target of [teacher, parent, officeStaff]) expect(canImpersonate(target, 'u-viewer', false)).toBe(false)
  })

  it('lets a full admin preview teachers, parents and restricted admins, never a full admin or themself', () => {
    expect(canImpersonate(teacher, 'u-viewer', true)).toBe(true)
    expect(canImpersonate(parent, 'u-viewer', true)).toBe(true)
    expect(canImpersonate(officeStaff, 'u-viewer', true)).toBe(true)
    expect(canImpersonate(fullAdmin, 'u-viewer', true)).toBe(false)
    expect(canImpersonate(teacher, 'u-teacher', true)).toBe(false)
  })

  it('only previews accounts that can sign in', () => {
    expect(canImpersonate({ ...teacher, isArchived: true }, 'u-viewer', true)).toBe(false)
    expect(canImpersonate({ ...teacher, isVerified: false }, 'u-viewer', true)).toBe(false)
    expect(canImpersonate({ ...teacher, isVerifiedSchool: false }, 'u-viewer', true)).toBe(false)
  })
})

describe('accessRoleLabel', () => {
  it('names the custom role, or the built-in that applies', () => {
    expect(accessRoleLabel(officeStaff)).toBe('Office Staff')
    expect(accessRoleLabel(fullAdmin)).toBe('Built-in Admin (everything)')
    expect(accessRoleLabel(teacher)).toBe('Built-in Teacher')
  })
})
