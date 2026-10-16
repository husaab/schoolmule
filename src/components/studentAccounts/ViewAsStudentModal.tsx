// src/components/studentAccounts/ViewAsStudentModal.tsx
// Admin "View as" for a student login: a read-only preview of the student
// portal, through the same impersonation flow as staff and parents.
'use client'

import { useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import { impersonateSchoolUser } from '@/services/adminUserService'
import { startImpersonation } from '@/services/impersonation'
import { getToken } from '@/services/authService'
import type { StudentAccountRow } from '@/services/types/studentAccount'
import { useNotificationStore } from '@/store/useNotificationStore'
import { STATUS_LABELS, gradeLabel } from '@/lib/studentAccounts'
import { EyeIcon } from '@heroicons/react/24/outline'

interface Props {
  isOpen: boolean
  onClose: () => void
  row: StudentAccountRow
}

export default function ViewAsStudentModal({ isOpen, onClose, row }: Props) {
  const notify = useNotificationStore((s) => s.showNotification)
  const [starting, setStarting] = useState(false)
  const firstName = row.name.trim().split(/\s+/)[0] || row.name

  const handleStart = async () => {
    const adminToken = getToken()
    if (!adminToken || !row.account) {
      notify('Your session has ended. Please sign in again.', 'error')
      return
    }
    setStarting(true)
    try {
      const res = await impersonateSchoolUser(row.account.userId)
      // A full page load follows; keep the spinner on until it happens.
      startImpersonation(adminToken, res.data)
    } catch (err) {
      setStarting(false)
      notify(err instanceof Error ? err.message : 'Failed to start preview', 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={starting ? () => {} : onClose} style="w-full max-w-md">
      <ModalHeader
        title={`View as ${firstName}`}
        subtitle={`See the student portal exactly the way ${row.name} does.`}
        icon={EyeIcon}
        tone="violet"
      />
      <ModalBody>
        <ConfirmBody
          tone="violet"
          consequences={{
            title: 'While previewing:',
            items: [
              `You see ${row.name}'s pages and data, nothing hidden or changed`,
              'Everything is read-only: saving, submitting and deleting are turned off',
              'A bar at the bottom of the screen shows who you are viewing as',
              'Click Exit preview on that bar to come back here, or the preview ends on its own after 2 hours',
            ],
          }}
        >
          You&apos;ll be switched to <strong className="font-semibold text-slate-900">{row.name}</strong>&apos;s view of
          SchoolMule. {row.name} won&apos;t be notified.
        </ConfirmBody>
        {row.status === 'invited' && (
          <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-sky-900">
            {row.name} hasn&apos;t set a password yet, so this is a preview of the portal after the invite is accepted.
          </div>
        )}
        <RecordFacts
          facts={[
            { label: 'Email', value: row.account?.email ?? '' },
            { label: 'Grade', value: gradeLabel(row.grade) },
            { label: 'Status', value: STATUS_LABELS[row.status] },
          ]}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={starting}>
          Cancel
        </Button>
        <Button variant="violet" onClick={handleStart} loading={starting}>
          <EyeIcon className="h-4 w-4" />
          {starting ? 'Switching' : 'Start preview'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
