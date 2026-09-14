'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts,
} from '@/components/shared/modalKit'
import { deleteSchoolUser } from '@/services/adminUserService'
import { SchoolUser } from '@/services/types/adminUser'
import { useNotificationStore } from '@/store/useNotificationStore'
import { TrashIcon } from '@heroicons/react/24/outline'
import { formatDate, roleLabel } from './userDisplay'

interface UserDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  user: SchoolUser
  onDeleted: (userId: string) => void
}

const UserDeleteModal: React.FC<UserDeleteModalProps> = ({ isOpen, onClose, user, onDeleted }) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteSchoolUser(user.userId)
      notify(`${user.fullName} was deleted`, 'success')
      onDeleted(user.userId)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to delete user', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader title="Delete user" subtitle="This cannot be undone." icon={TrashIcon} tone="danger" />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'Deleting this account:',
            items: [
              'Stops them signing in to School Mule',
              'Unlinks them from any children and additional-teacher slots',
              'Removes their staff attendance history',
              'Is blocked while they still lead a class or have homeroom students. Reassign those first',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{user.fullName}</strong> will be permanently
          removed. To keep the account but block access, edit them and turn off school access instead.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Email', value: user.email },
            { label: 'Role', value: roleLabel(user.role) },
            { label: 'Joined', value: formatDate(user.createdAt) },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={deleting}>
          {deleting ? 'Deleting' : 'Delete user'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default UserDeleteModal
