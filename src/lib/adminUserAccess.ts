// src/lib/adminUserAccess.ts
// Who may manage or preview which account on the Users page (RBAC), as the
// backend's escalation guards decide it (services/access/escalation.js).
// Pure, so the table row, the detail modal and the tests agree
// (adminUserAccess.test.ts). UI only: the API refuses the same things.

import type { SchoolUser } from '@/services/types/adminUser'

/**
 * A full admin: an ADMIN with no access role. Only full admins may edit,
 * archive, delete, resend to or preview them. An older backend that doesn't
 * send the flag yet only has full admins.
 */
export const isFullAdminAccount = (user: Pick<SchoolUser, 'role' | 'isFullAdmin' | 'accessRoleId'>): boolean =>
  user.role === 'ADMIN' && (user.isFullAdmin ?? !user.accessRoleId)

/** May the viewer change this account at all? `users` holders manage everyone except full admins. */
export const canManageUser = (user: Pick<SchoolUser, 'role' | 'isFullAdmin' | 'accessRoleId'>, viewerIsFullAdmin: boolean): boolean =>
  viewerIsFullAdmin || !isFullAdminAccount(user)

/**
 * Can the viewer "view as" this user? Full admins only (students are
 * previewed from Student accounts), and only an account that can actually
 * sign in (active, or invited and pre-approved): a teacher, a parent, or an
 * admin limited by an access role. A full admin is never previewed. Mirrors
 * the backend rule in adminUser.controller impersonateUser.
 */
export const canImpersonate = (user: SchoolUser, currentUserId: string | null, viewerIsFullAdmin: boolean): boolean =>
  viewerIsFullAdmin &&
  user.userId !== currentUserId &&
  (user.role === 'TEACHER' || user.role === 'PARENT' || (user.role === 'ADMIN' && !isFullAdminAccount(user))) &&
  !user.isArchived &&
  user.isVerified &&
  user.isVerifiedSchool

/** What a staff account may do, in words: its custom access role, or which built-in applies. */
export const accessRoleLabel = (user: Pick<SchoolUser, 'role' | 'accessRoleName'>): string =>
  user.accessRoleName ?? (user.role === 'ADMIN' ? 'Built-in Admin (everything)' : 'Built-in Teacher')
