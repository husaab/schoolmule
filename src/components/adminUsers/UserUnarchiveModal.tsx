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
import { unarchiveSchoolUser } from '@/services/adminUserService'
import { SchoolUser } from '@/services/types/adminUser'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import { formatDate, roleLabel } from './userDisplay'

interface UserUnarchiveModalProps {
  isOpen: boolean
  onClose: () => void
  user: SchoolUser
  onRestored: (user: SchoolUser) => void
}

const UserUnarchiveModal: React.FC<UserUnarchiveModalProps> = ({ isOpen, onClose, user, onRestored }) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [restoring, setRestoring] = useState(false)

  const handleRestore = async () => {
    setRestoring(true)
    try {
      const res = await unarchiveSchoolUser(user.userId)
      notify(`${user.fullName} was restored`, 'success')
      onRestored(res.data)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to restore user', 'error')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Restore user"
        subtitle="Back to an active account."
        icon={ArrowUturnLeftIcon}
        tone="brand"
      />

      <ModalBody>
        <ConfirmBody
          tone="brand"
          consequences={{
            title: 'After restoring:',
            items: [
              'They can sign in again with their existing password',
              'They reappear in staff attendance, pay periods and teacher pickers',
              'School access is granted automatically',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{user.fullName}</strong> will be moved out of
          the archive.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Email', value: user.email },
            { label: 'Role', value: roleLabel(user.role) },
            { label: 'Archived', value: formatDate(user.archivedAt) },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={restoring}>
          Cancel
        </Button>
        <Button onClick={handleRestore} loading={restoring}>
          {restoring ? 'Restoring' : 'Restore user'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default UserUnarchiveModal
