'use client'

// Shared presentation for the admin Users page: how a role and an account
// status look, wherever a user shows up (table row, detail modal, confirmations).

import React from 'react'
import { SchoolRole, SchoolUser } from '@/services/types/adminUser'
import Avatar from '@/components/avatar/Avatar'

export const ROLE_OPTIONS: { value: SchoolRole; label: string; description: string }[] = [
  { value: 'TEACHER', label: 'Teacher', description: 'Classes, gradebook, attendance and reports' },
  { value: 'PARENT', label: 'Parent', description: 'Parent portal for their linked children' },
  { value: 'ADMIN', label: 'Admin', description: 'Everything, unless an access role limits it' },
]

const roleStyles: Record<string, string> = {
  ADMIN: 'bg-amber-50 text-amber-700 ring-amber-200/60',
  TEACHER: 'bg-purple-50 text-purple-700 ring-purple-200/60',
  PARENT: 'bg-cyan-50 text-cyan-700 ring-cyan-200/60',
}

// Student logins are managed on Admin Panel → Student accounts, never added
// here, so STUDENT is a label only (the "view as" bar), not a role option.
export const roleLabel = (role: string) =>
  ROLE_OPTIONS.find((r) => r.value === role)?.label ?? (role === 'STUDENT' ? 'Student' : role)

export const RoleBadge = ({ role, title }: { role: string; title?: string | null }) => (
  <span
    className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
      roleStyles[role] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
    }`}
    title={title ? 'Parents can message this account' : undefined}
  >
    {roleLabel(role)}
    {title && <span className="ml-1 font-normal opacity-80">· {title}</span>}
  </span>
)

export type UserStatus = 'active' | 'invited' | 'awaiting' | 'unverified' | 'archived'

export const statusOf = (user: SchoolUser): UserStatus => {
  if (user.isArchived) return 'archived'
  if (user.invitePending) return 'invited'
  if (user.isVerifiedSchool) return 'active'
  return user.isVerified ? 'awaiting' : 'unverified'
}

// Who may manage or preview which account (pure, tested in lib/adminUserAccess).
export { accessRoleLabel, canImpersonate, canManageUser, isFullAdminAccount } from '@/lib/adminUserAccess'

export const STATUS_META: Record<UserStatus, { label: string; dot: string; text: string }> = {
  active: { label: 'Active', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  invited: { label: 'Invite pending', dot: 'bg-sky-500', text: 'text-sky-700' },
  awaiting: { label: 'No school access', dot: 'bg-amber-500', text: 'text-amber-700' },
  unverified: { label: 'Email unverified', dot: 'bg-slate-400', text: 'text-slate-500' },
  archived: { label: 'Archived', dot: 'bg-slate-300', text: 'text-slate-400' },
}

export const StatusBadge = ({ user }: { user: SchoolUser }) => {
  const meta = STATUS_META[statusOf(user)]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  )
}

/** A user's photo, else their picked avatar (the neutral one until they pick). */
export const UserAvatar = ({
  user,
  size = 'sm',
}: {
  user: Pick<SchoolUser, 'firstName' | 'lastName' | 'email'> & Pick<Partial<SchoolUser>, 'avatar' | 'photoUrl'>
  size?: 'sm' | 'lg'
}) => (
  <Avatar
    name={`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email}
    avatar={user.avatar}
    photoUrl={user.photoUrl}
    size={size === 'lg' ? 56 : 36}
    className={size === 'lg' ? 'shadow-sm' : ''}
  />
)

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
