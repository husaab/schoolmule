'use client'

// Who holds a custom role (GET /admin/roles/:id/users). Shown when a role
// can't be deleted yet, and from the people count in the roles table.

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/shared/modal'
import Spinner from '@/components/Spinner'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { RoleBadge } from '@/components/adminUsers/userDisplay'
import { getAccessRoleHolders } from '@/services/accessRoleService'
import type { AccessRole, AccessRoleHolder } from '@/services/types/accessRole'
import { UsersIcon } from '@heroicons/react/24/outline'
import { holdersLabel } from '@/lib/accessRoles'

/** The list itself, loading its own data. */
export const RoleHoldersList = ({ roleId }: { roleId: string }) => {
  const [holders, setHolders] = useState<AccessRoleHolder[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAccessRoleHolders(roleId)
      .then((res) => !cancelled && setHolders(res.data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load who has this role'))
    return () => {
      cancelled = true
    }
  }, [roleId])

  if (error) return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
  if (!holders) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    )
  }
  if (holders.length === 0) return <p className="text-sm text-slate-400">Nobody has this role.</p>

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
      {holders.map((h) => (
        <li key={h.userId} className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${h.isArchived ? 'opacity-70' : ''}`}>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-800">
              {h.fullName}
              {h.isArchived && <span className="ml-1.5 text-xs font-normal text-slate-400">(archived)</span>}
            </span>
            <span className="block truncate text-xs text-slate-500">{h.email}</span>
          </span>
          <RoleBadge role={h.role} />
        </li>
      ))}
    </ul>
  )
}

interface RoleHoldersModalProps {
  isOpen: boolean
  onClose: () => void
  role: AccessRole
}

const RoleHoldersModal: React.FC<RoleHoldersModalProps> = ({ isOpen, onClose, role }) => (
  <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
    <ModalHeader title={`Who has ${role.name}`} subtitle={holdersLabel(role.userCount)} icon={UsersIcon} />
    <ModalBody>
      <RoleHoldersList roleId={role.roleId} />
      <p className="text-xs text-slate-400">
        Change someone&apos;s access role from{' '}
        <Link href="/admin-panel/users" className="text-cyan-600 hover:underline">
          Users
        </Link>
        : open them, then Edit.
      </p>
    </ModalBody>
    <ModalFooter>
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
    </ModalFooter>
  </Modal>
)

export default RoleHoldersModal
