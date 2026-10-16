// src/components/studentAccounts/DeleteStudentAccountModal.tsx
// Delete a student login for good (invited or archived only: an active login
// is archived first). The student's record, grades and work stay.
'use client'

import { useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import { deleteStudentAccount } from '@/services/studentAccountService'
import type { StudentAccountRow } from '@/services/types/studentAccount'
import { useNotificationStore } from '@/store/useNotificationStore'
import { STATUS_LABELS, gradeLabel } from '@/lib/studentAccounts'
import { TrashIcon } from '@heroicons/react/24/outline'

interface Props {
  isOpen: boolean
  onClose: () => void
  row: StudentAccountRow
  onDeleted: () => void
}

export default function DeleteStudentAccountModal({ isOpen, onClose, row, onDeleted }: Props) {
  const notify = useNotificationStore((s) => s.showNotification)
  const [deleting, setDeleting] = useState(false)
  const email = row.account?.email ?? ''

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteStudentAccount(row.studentId)
      notify(`${row.name}'s account was deleted`, 'success')
      onDeleted()
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : "The account couldn't be deleted", 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={deleting ? () => {} : onClose} style="w-full max-w-md">
      <ModalHeader title="Delete account" subtitle="This can't be undone." icon={TrashIcon} tone="danger" />
      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'What happens:',
            items: [
              'The login, its consent record and its links to every school year are deleted',
              `${row.name}'s student record, grades and work stay`,
              `To give ${row.name} a login again, send a new invite (consent is confirmed again)`,
            ],
          }}
        >
          Delete the account <strong className="font-semibold text-slate-900">{email}</strong> for {row.name}?
        </ConfirmBody>
        <RecordFacts
          facts={[
            { label: 'Student', value: row.name },
            { label: 'Grade', value: gradeLabel(row.grade) },
            { label: 'Email', value: email },
            { label: 'Status', value: STATUS_LABELS[row.status] },
          ]}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={deleting}>
          Delete account
        </Button>
      </ModalFooter>
    </Modal>
  )
}
