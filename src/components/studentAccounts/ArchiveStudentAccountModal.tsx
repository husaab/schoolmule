// src/components/studentAccounts/ArchiveStudentAccountModal.tsx
// Archive a student login (it stops working, records stay) or restore it.
'use client'

import { useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import { archiveStudentAccount, unarchiveStudentAccount } from '@/services/studentAccountService'
import type { StudentAccountRow } from '@/services/types/studentAccount'
import { useNotificationStore } from '@/store/useNotificationStore'
import { STATUS_LABELS, gradeLabel } from '@/lib/studentAccounts'
import { ArchiveBoxArrowDownIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'

interface Props {
  isOpen: boolean
  onClose: () => void
  row: StudentAccountRow
  mode: 'archive' | 'unarchive'
  onSaved: (row: StudentAccountRow) => void
}

export default function ArchiveStudentAccountModal({ isOpen, onClose, row, mode, onSaved }: Props) {
  const notify = useNotificationStore((s) => s.showNotification)
  const [saving, setSaving] = useState(false)
  const email = row.account?.email ?? row.studentEmail ?? ''
  const archiving = mode === 'archive'

  const handleConfirm = async () => {
    setSaving(true)
    try {
      const res = archiving ? await archiveStudentAccount(row.studentId) : await unarchiveStudentAccount(row.studentId)
      notify(archiving ? `${row.name}'s account was archived` : `${row.name}'s account was restored`, 'success')
      onSaved(res.data)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} style="w-full max-w-md">
      <ModalHeader
        title={archiving ? 'Archive account' : 'Restore account'}
        subtitle={archiving ? 'You can restore it at any time.' : `${row.name} can sign in again.`}
        icon={archiving ? ArchiveBoxArrowDownIcon : ArrowUturnLeftIcon}
        tone={archiving ? 'warning' : 'success'}
      />
      <ModalBody>
        {archiving ? (
          <ConfirmBody
            tone="warning"
            consequences={{
              title: 'While archived:',
              items: [
                `${row.name} can no longer sign in`,
                'Invite and password links already sent stop working',
                'The QR card stops working (print a new one after restoring)',
                'Grades, work and messages are all kept',
              ],
            }}
          >
            The account <strong className="font-semibold text-slate-900">{email}</strong> will be archived. Nothing is
            deleted.
          </ConfirmBody>
        ) : (
          <ConfirmBody
            tone="success"
            consequences={{
              title: 'After restoring:',
              items: [
                `${row.name} signs in with the same email and password`,
                'The old QR card stays void: print a new card if one is needed',
              ],
            }}
          >
            Restore the account <strong className="font-semibold text-slate-900">{email}</strong>?
          </ConfirmBody>
        )}
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
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant={archiving ? 'warning' : 'success'} onClick={handleConfirm} loading={saving}>
          {archiving ? 'Archive account' : 'Restore account'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
