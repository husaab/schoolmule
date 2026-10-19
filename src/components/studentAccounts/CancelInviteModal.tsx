// src/components/studentAccounts/CancelInviteModal.tsx
// Cancel a student's open invite: the link already sent stops working. A
// login never used is removed with it, so the student is Not invited again
// and can be invited at a corrected address; a login that already signs in
// (a QR card) keeps working.
'use client'

import { useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { cancelStudentInvite } from '@/services/studentAccountService'
import type { StudentAccountRow } from '@/services/types/studentAccount'
import { useNotificationStore } from '@/store/useNotificationStore'
import { cancelKeepsLogin } from '@/lib/studentAccounts'
import { XCircleIcon } from '@heroicons/react/24/outline'

interface Props {
  isOpen: boolean
  onClose: () => void
  row: StudentAccountRow
  onSaved: (row: StudentAccountRow) => void
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name

export default function CancelInviteModal({ isOpen, onClose, row, onSaved }: Props) {
  const notify = useNotificationStore((s) => s.showNotification)
  const [saving, setSaving] = useState(false)
  const first = firstName(row.name)
  const email = row.account?.email ?? row.studentEmail ?? ''
  // A login that already works (signed in, or a live QR card) stays; otherwise it goes with the invite.
  const keepsLogin = cancelKeepsLogin(row)

  const cancel = async () => {
    setSaving(true)
    try {
      const res = await cancelStudentInvite(row.studentId)
      notify(`${first}'s invite was cancelled`, 'success')
      onSaved(res.data)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : "The invite couldn't be cancelled", 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} style="w-full max-w-md">
      <ModalHeader title={`Cancel ${first}'s invite?`} subtitle={row.name} icon={XCircleIcon} tone="warning" />
      <ModalBody>
        <ConfirmBody tone="warning">
          The link sent to <strong className="font-semibold text-slate-900">{email}</strong> stops working.{' '}
          {keepsLogin
            ? `${first}'s login stays and keeps working.`
            : `${first} goes back to Not invited, and you can invite again later.`}
        </ConfirmBody>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Keep invite
        </Button>
        <Button variant="danger" onClick={() => void cancel()} loading={saving}>
          Cancel invite
        </Button>
      </ModalFooter>
    </Modal>
  )
}
