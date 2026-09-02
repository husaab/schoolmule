// File: src/components/assessment/delete/AssessmentDeleteModal.tsx
'use client'

import React, { useState } from 'react'
import Modal from '../../shared/modal'
import { deleteAssessment } from '@/services/assessmentService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { AssessmentPayload } from '@/services/types/assessment'
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts,
} from '../../shared/modalKit'
import { TrashIcon } from '@heroicons/react/24/outline'

interface AssessmentDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  assessment: AssessmentPayload
  onDeleted: (id: string) => void
}

const AssessmentDeleteModal: React.FC<AssessmentDeleteModalProps> = ({
  isOpen,
  onClose,
  assessment,
  onDeleted,
}) => {
  const showNotification = useNotificationStore((state) => state.showNotification)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await deleteAssessment(assessment.assessmentId)
      if (res.status === 'success') {
        showNotification('Assessment deleted successfully', 'success')
        onDeleted(assessment.assessmentId)
        onClose()
      } else {
        showNotification('Failed to delete assessment', 'error')
      }
    } catch (err) {
      console.error('Error deleting assessment:', err)
      showNotification('Error deleting assessment', 'error')
    } finally {
      setLoading(false)
    }
  }

  const points = assessment.weightPoints || assessment.weightPercent || 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Delete assessment"
        subtitle="This cannot be undone."
        icon={TrashIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'Deleting removes it from the gradebook for good:',
            items: [
              'Every score students have on this assessment',
              ...(assessment.isParent
                ? ['Its individual assessments, and their scores too']
                : []),
              `The ${points} point${points === 1 ? '' : 's'} it carried — remaining assessments reweight to fill the gap`,
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{assessment.name}</strong> will be
          permanently deleted from this class. To leave it in place but drop it for one student,
          exclude it from that student instead.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Points', value: `${points} pts` },
            {
              label: 'Type',
              value: assessment.isParent ? 'Multiple assessment' : 'Standalone assessment',
            },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={loading}>
          {loading ? 'Deleting' : 'Delete assessment'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default AssessmentDeleteModal
