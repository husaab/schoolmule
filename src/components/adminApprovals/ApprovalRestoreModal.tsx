'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import { restoreSignup } from '@/services/adminApprovalService'
import { ApprovalUser } from '@/services/types/adminApproval'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import { formatDate, roleLabel } from '@/components/adminUsers/userDisplay'

interface ApprovalRestoreModalProps {
  isOpen: boolean
  onClose: () => void
  user: ApprovalUser
  onRestored: (user: ApprovalUser) => void
}

const ApprovalRestoreModal: React.FC<ApprovalRestoreModalProps> = ({ isOpen, onClose, user, onRestored }) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [restoring, setRestoring] = useState(false)

  const handleRestore = async () => {
    setRestoring(true)
    try {
      const res = await restoreSignup(user.userId)
      notify(`${user.fullName} is back in the pending queue`, 'success')
      onRestored(res.data.user)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to restore', 'error')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader title="Restore to pending" subtitle="Take another look at this signup." icon={ArrowUturnLeftIcon} />

      <ModalBody>
        <ConfirmBody
          tone="brand"
          consequences={{
            title: 'After restoring:',
            items: [
              'They move back to the Pending tab',
              'They still cannot sign in until you approve them',
              'No email is sent',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{user.fullName}</strong> was declined
          {user.declinedAt ? ` on ${formatDate(user.declinedAt)}` : ''}.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Email', value: user.email },
            { label: 'Role', value: roleLabel(user.role) },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={restoring}>
          Cancel
        </Button>
        <Button onClick={handleRestore} loading={restoring}>
          {restoring ? 'Restoring' : 'Restore'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ApprovalRestoreModal
