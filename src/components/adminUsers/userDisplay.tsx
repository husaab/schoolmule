'use client'

// Shared presentation for the admin Users page: how a role and an account
// status look, wherever a user shows up (table row, detail modal, confirmations).

import React from 'react'
import { SchoolRole, SchoolUser } from '@/services/types/adminUser'

export const ROLE_OPTIONS: { value: SchoolRole; label: string; description: string }[] = [
  { value: 'TEACHER', label: 'Teacher', description: 'Classes, gradebook, attendance and reports' },
  { value: 'PARENT', label: 'Parent', description: 'Parent portal for their linked children' },
  { value: 'ADMIN', label: 'Admin', description: 'Everything, including this page' },
]

const roleStyles: Record<string, string> = {
  ADMIN: 'bg-amber-50 text-amber-700 ring-amber-200/60',
  TEACHER: 'bg-purple-50 text-purple-700 ring-purple-200/60',
  PARENT: 'bg-cyan-50 text-cyan-700 ring-cyan-200/60',
}

export const roleLabel = (role: string) =>
  ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role

export const RoleBadge = ({ role }: { role: string }) => (
  <span
    className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
      roleStyles[role] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
    }`}
  >
    {roleLabel(role)}
  </span>
)

export type UserStatus = 'active' | 'invited' | 'awaiting' | 'unverified'

export const statusOf = (user: SchoolUser): UserStatus => {
  if (user.invitePending) return 'invited'
  if (user.isVerifiedSchool) return 'active'
  return user.isVerified ? 'awaiting' : 'unverified'
}

export const STATUS_META: Record<UserStatus, { label: string; dot: string; text: string }> = {
  active: { label: 'Active', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  invited: { label: 'Invite pending', dot: 'bg-sky-500', text: 'text-sky-700' },
  awaiting: { label: 'No school access', dot: 'bg-amber-500', text: 'text-amber-700' },
  unverified: { label: 'Email unverified', dot: 'bg-slate-400', text: 'text-slate-500' },
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

export const initialsOf = (user: Pick<SchoolUser, 'firstName' | 'lastName' | 'email'>) =>
  `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() ||
  user.email[0]?.toUpperCase() ||
  '?'

export const UserAvatar = ({
  user,
  size = 'sm',
}: {
  user: Pick<SchoolUser, 'firstName' | 'lastName' | 'email'>
  size?: 'sm' | 'lg'
}) => (
  <div
    className={`flex flex-shrink-0 items-center justify-center font-semibold tracking-wide ${
      size === 'lg'
        ? 'h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-lg text-white shadow-sm'
        : 'h-9 w-9 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 text-xs text-cyan-700'
    }`}
  >
    {initialsOf(user)}
  </div>
)

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
