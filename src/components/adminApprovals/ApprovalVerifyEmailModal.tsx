'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import { markEmailVerified } from '@/services/adminApprovalService'
import { isApiError } from '@/services/apiClient'
import { ApprovalUser } from '@/services/types/adminApproval'
import { useNotificationStore } from '@/store/useNotificationStore'
import { EnvelopeOpenIcon } from '@heroicons/react/24/outline'
import { formatDate, roleLabel } from '@/components/adminUsers/userDisplay'

interface ApprovalVerifyEmailModalProps {
  isOpen: boolean
  onClose: () => void
  user: ApprovalUser
  onVerified: (user: ApprovalUser) => void
  /** 409: they verified (or were declined) since the list loaded. */
  onStale: () => void
}

const ApprovalVerifyEmailModal: React.FC<ApprovalVerifyEmailModalProps> = ({
  isOpen,
  onClose,
  user,
  onVerified,
  onStale,
}) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [verifying, setVerifying] = useState(false)

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const res = await markEmailVerified(user.userId)
      notify(`${user.fullName} is now in the pending queue`, 'success')
      onVerified(res.data)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to mark as verified', 'error')
      if (isApiError(err) && err.status === 409) {
        onStale()
        onClose()
      }
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Mark email as verified"
        subtitle="Only if you know this email really is theirs."
        icon={EnvelopeOpenIcon}
      />

      <ModalBody>
        <ConfirmBody
          tone="brand"
          consequences={{
            title: 'After marking verified:',
            items: [
              'They move to the Pending tab, as if they had clicked the link',
              'They still cannot sign in until you approve them',
              'No email is sent',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{user.fullName}</strong> signed up
          {user.createdAt ? ` on ${formatDate(user.createdAt)}` : ''} but hasn&apos;t verified their email yet.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Email', value: user.email },
            { label: 'Role', value: roleLabel(user.role) },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={verifying}>
          Cancel
        </Button>
        <Button onClick={handleVerify} loading={verifying}>
          {verifying ? 'Marking verified' : 'Mark verified'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ApprovalVerifyEmailModal
