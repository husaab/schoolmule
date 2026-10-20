'use client'

// Shared presentation for access roles, wherever one shows up: the Roles
// page's table and modals, and the access-role chip beside a user's role on
// the Users page.

import React from 'react'
import { KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import type { PermissionMeta } from '@/services/types/accessRole'
import { permissionLabels } from '@/lib/accessRoles'

/** Built-in roles are fixed in code; custom ones belong to the school. */
export const RoleKindBadge = ({ builtIn }: { builtIn: boolean }) =>
  builtIn ? (
    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
      <LockClosedIcon className="h-3 w-3" />
      Built-in
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200/60">
      <KeyIcon className="h-3 w-3" />
      Custom
    </span>
  )

/** The custom access role a staff account holds, beside its role badge. Nothing for the built-ins. */
export const AccessRoleChip = ({ name }: { name: string | null | undefined }) =>
  name ? (
    <span
      className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200/60"
      title="Access role: what this account can see and do"
    >
      <KeyIcon className="h-3 w-3" />
      {name}
    </span>
  ) : null

/** The first few permissions by name, then "+N more". */
export const PermissionChips = ({
  keys,
  catalog,
  max = 3,
}: {
  keys: string[]
  catalog: PermissionMeta[]
  max?: number
}) => {
  if (keys.length === 0) return <span className="text-xs text-slate-400">Nothing beyond their own classes</span>
  const labels = permissionLabels(catalog, keys)
  return (
    <div className="flex flex-wrap items-center gap-1">
      {labels.slice(0, max).map((label) => (
        <span key={label} className="rounded-md bg-cyan-50 px-1.5 py-0.5 text-xs text-cyan-700">
          {label}
        </span>
      ))}
      {labels.length > max && <span className="text-xs text-slate-400">+{labels.length - max} more</span>}
    </div>
  )
}
