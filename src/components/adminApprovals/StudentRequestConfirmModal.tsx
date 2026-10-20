'use client'

// Decline, restore or delete a student's account request. None of them
// emails the student (the address was typed by someone not yet trusted).

import { FC, useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import { formatDate } from '@/components/adminUsers/userDisplay'
import { gradeLabel } from '@/lib/studentAccounts'
import { declineStudentRequest, deleteStudentRequest, restoreStudentRequest } from '@/services/studentRequestService'
import type { StudentRequest } from '@/services/types/studentRequest'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ArchiveBoxXMarkIcon, ArrowUturnLeftIcon, TrashIcon } from '@heroicons/react/24/outline'

export type RequestAction = 'decline' | 'restore' | 'delete'

interface Props {
  action: RequestAction
  request: StudentRequest
  onClose: () => void
  /** The request as it is now, or null once deleted. */
  onDone: (request: StudentRequest | null) => void
  /** Called when the request changed elsewhere (a 409/404): reload the list. */
  onStale: () => void
}

const COPY = {
  decline: {
    title: 'Decline request',
    subtitle: 'Moves it to Declined. You can restore it later.',
    icon: ArchiveBoxXMarkIcon,
    tone: 'warning' as const,
    button: 'Decline',
    variant: 'warning' as const,
    done: 'Request declined',
    items: [
      'No account is made and no email is sent',
      'If they ask again with this address, nothing new reaches you',
      'Restore puts it back in the queue',
    ],
  },
  restore: {
    title: 'Restore request',
    subtitle: 'Puts it back in the queue to review.',
    icon: ArrowUturnLeftIcon,
    tone: 'brand' as const,
    button: 'Restore',
    variant: 'primary' as const,
    done: 'Request restored',
    items: ['It waits in Pending again; nothing is sent until you approve it'],
  },
  delete: {
    title: 'Delete request',
    subtitle: 'Removes it for good.',
    icon: TrashIcon,
    tone: 'danger' as const,
    button: 'Delete',
    variant: 'danger' as const,
    done: 'Request deleted',
    items: ['It disappears from Declined', 'The student can ask again with this address'],
  },
}

const StudentRequestConfirmModal: FC<Props> = ({ action, request, onClose, onDone, onStale }) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [busy, setBusy] = useState(false)
  const copy = COPY[action]

  const run = async () => {
    setBusy(true)
    try {
      if (action === 'delete') {
        await deleteStudentRequest(request.requestId)
        onDone(null)
      } else {
        const res = action === 'decline'
          ? await declineStudentRequest(request.requestId)
          : await restoreStudentRequest(request.requestId)
        onDone({ ...res.data.request, suggestion: request.suggestion })
      }
      notify(copy.done, 'success')
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : `Couldn't ${action} the request`, 'error')
      onStale()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen onClose={busy ? () => {} : onClose} style="w-full max-w-md">
      <ModalHeader title={copy.title} subtitle={copy.subtitle} icon={copy.icon} tone={copy.tone} />
      <ModalBody>
        <ConfirmBody tone={copy.tone} consequences={{ title: 'What happens:', items: copy.items }}>
          <strong className="font-semibold text-slate-900">{request.name}</strong> asked for a student account.
        </ConfirmBody>
        <RecordFacts
          facts={[
            { label: 'Email', value: request.email },
            { label: 'Typed grade', value: gradeLabel(request.grade) },
            { label: 'Asked', value: formatDate(request.createdAt) },
          ]}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant={copy.variant} onClick={() => void run()} loading={busy}>
          {copy.button}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default StudentRequestConfirmModal
