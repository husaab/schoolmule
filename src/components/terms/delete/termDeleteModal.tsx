// File: src/components/terms/delete/termDeleteModal.tsx
'use client'

import React, { useState } from 'react'
import Modal from '../../shared/modal'
import { useNotificationStore } from '@/store/useNotificationStore'
import { deleteTerm, formatTermDateRange } from '@/services/termService'
import type { TermPayload } from '@/services/types/term'
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts,
} from '../../shared/modalKit'
import { TrashIcon } from '@heroicons/react/24/outline'

interface TermDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onDeleted: (termId: string) => void
  term: TermPayload
}

const TermDeleteModal: React.FC<TermDeleteModalProps> = ({
  isOpen,
  onClose,
  onDeleted,
  term,
}) => {
  const showNotification = useNotificationStore((state) => state.showNotification)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await deleteTerm(term.termId)
      if (res.status === 'success') {
        showNotification('Term deleted successfully', 'success')
        onDeleted(term.termId)
        onClose()
      } else {
        showNotification(res.message || 'Failed to delete term', 'error')
      }
    } catch (err) {
      console.error('Error deleting term:', err)
      showNotification('Error deleting term', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Delete term"
        subtitle="This cannot be undone."
        icon={TrashIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'What deleting this term does:',
            items: [
              'Classes stay where they are — nothing is moved to another term',
              'Gradebooks, report cards, and analytics can no longer be filtered by it',
              ...(term.isActive
                ? ['No other term is activated in its place — pick a new active term afterwards']
                : []),
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{term.name}</strong> ({term.academicYear})
          will be permanently removed from your school&rsquo;s term list.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Academic year', value: term.academicYear },
            { label: 'Dates', value: formatTermDateRange(term) },
            { label: 'Status', value: term.isActive ? 'Active term' : 'Not active' },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={loading}>
          {loading ? 'Deleting' : 'Delete term'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default TermDeleteModal
