'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import { declineSignup } from '@/services/adminApprovalService'
import { ApprovalUser } from '@/services/types/adminApproval'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ArchiveBoxXMarkIcon } from '@heroicons/react/24/outline'
import { formatDate, roleLabel } from '@/components/adminUsers/userDisplay'

interface ApprovalDeclineModalProps {
  isOpen: boolean
  onClose: () => void
  user: ApprovalUser
  onDeclined: (user: ApprovalUser) => void
}

const ApprovalDeclineModal: React.FC<ApprovalDeclineModalProps> = ({ isOpen, onClose, user, onDeclined }) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [sendEmail, setSendEmail] = useState(true)
  const [declining, setDeclining] = useState(false)

  useEffect(() => {
    if (isOpen) setSendEmail(true)
  }, [isOpen])

  const handleDecline = async () => {
    setDeclining(true)
    try {
      const res = await declineSignup(user.userId, sendEmail)
      const ok = res.data.emailSent || !sendEmail
      notify(res.message ?? (ok ? 'Declined' : 'Declined, but the email could not be sent'), ok ? 'success' : 'error')
      onDeclined(res.data.user)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to decline', 'error')
    } finally {
      setDeclining(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Decline signup"
        subtitle="Moves them to Declined. You can restore them later."
        icon={ArchiveBoxXMarkIcon}
        tone="warning"
      />

      <ModalBody>
        <ConfirmBody
          tone="warning"
          consequences={{
            title: 'After declining:',
            items: [
              "They can't sign in and are no longer waiting in your queue",
              'Nothing is deleted; the account sits under Declined',
              'Restore puts them back in the queue without granting access',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{user.fullName}</strong> asked to join as a{' '}
          {roleLabel(user.role).toLowerCase()}.
        </ConfirmBody>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 px-3.5 py-3">
          <span>
            <span className="block text-sm font-medium text-slate-900">Let them know by email</span>
            <span className="block text-xs text-slate-500">
              {sendEmail
                ? 'A short note that the registration wasn’t approved, pointing them to the school office.'
                : 'Decline quietly. They’ll see "waiting for approval" until they give up.'}
            </span>
          </span>
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="h-5 w-5 flex-shrink-0 accent-cyan-600"
          />
        </label>

        <RecordFacts
          facts={[
            { label: 'Email', value: user.email },
            { label: 'Signed up', value: formatDate(user.createdAt) },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={declining}>
          Cancel
        </Button>
        <Button variant="warning" onClick={handleDecline} loading={declining}>
          {declining ? 'Declining' : sendEmail ? 'Decline and email' : 'Decline'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ApprovalDeclineModal
