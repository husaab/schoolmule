'use client'

// Deleting a custom role. The server refuses (409 ROLE_IN_USE) while anyone
// still holds it, because a deleted role must never silently change what
// someone can do; the modal then lists who holds it, so the admin knows whom
// to move first.

import React, { useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import { deleteAccessRole } from '@/services/accessRoleService'
import { isApiError } from '@/services/apiClient'
import type { AccessRole } from '@/services/types/accessRole'
import { useNotificationStore } from '@/store/useNotificationStore'
import { holdersLabel, permissionCountLabel } from '@/lib/accessRoles'
import { TrashIcon } from '@heroicons/react/24/outline'
import { RoleHoldersList } from './RoleHolders'

interface RoleDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  role: AccessRole
  onDeleted: (roleId: string) => void
  /** The server says people still hold it (the counts were stale): reload the list. */
  onBlocked: () => void
}

const RoleDeleteModal: React.FC<RoleDeleteModalProps> = ({ isOpen, onClose, role, onDeleted, onBlocked }) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [deleting, setDeleting] = useState(false)
  // The list we have may be stale; the server has the last word.
  const [blocked, setBlocked] = useState(role.userCount > 0)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteAccessRole(role.roleId)
      notify(`${role.name} was deleted`, 'success')
      onDeleted(role.roleId)
      onClose()
    } catch (err) {
      if (isApiError(err) && (err.code === 'ROLE_IN_USE' || err.status === 409)) {
        setBlocked(true)
        onBlocked()
      } else {
        notify(err instanceof Error ? err.message : 'Failed to delete role', 'error')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title={blocked ? `${role.name} is still in use` : 'Delete role'}
        subtitle={blocked ? 'Move these people to another role first.' : 'This cannot be undone.'}
        icon={TrashIcon}
        tone={blocked ? 'warning' : 'danger'}
      />

      <ModalBody>
        {blocked ? (
          <>
            <ConfirmBody tone="warning">
              Nobody&apos;s access changes behind their back, so a role can only be deleted once nobody holds it. On{' '}
              <Link href="/admin-panel/users" className="font-medium text-cyan-600 hover:underline">
                Users
              </Link>
              , give each of them another access role (or the built-in Admin or Teacher), then delete it.
            </ConfirmBody>
            <RoleHoldersList roleId={role.roleId} />
          </>
        ) : (
          <>
            <ConfirmBody
              tone="danger"
              consequences={{
                title: 'Deleting this role:',
                items: ['Removes it from the roles list and the access-role picker', 'Nobody holds it, so no one loses access'],
              }}
            >
              <strong className="font-semibold text-slate-900">{role.name}</strong> will be permanently removed.
            </ConfirmBody>
            <RecordFacts
              facts={[
                { label: 'Held by', value: holdersLabel(role.userCount) },
                { label: 'Grants', value: permissionCountLabel(role.permissions.length) },
              ]}
            />
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={deleting}>
          {blocked ? 'Close' : 'Cancel'}
        </Button>
        {!blocked && (
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            {deleting ? 'Deleting' : 'Delete role'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}

export default RoleDeleteModal
