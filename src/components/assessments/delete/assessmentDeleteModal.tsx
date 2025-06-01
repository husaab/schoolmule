// File: src/components/assessment/delete/AssessmentDeleteModal.tsx
'use client'

import React from 'react'
import Modal from '../../shared/modal'
import { deleteAssessment } from '@/services/assessmentService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { AssessmentPayload } from '@/services/types/assessment'

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

  const handleDelete = async () => {
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
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-lg font-semibold mb-4 text-black">Delete Assessment</h2>
      <p className="text-black mb-6">
        Are you sure you want to delete <strong>{assessment.name}</strong> (Weight: {assessment.weightPercent}%)?
      </p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
        >
          Delete
        </button>
      </div>
    </Modal>
  )
}

export default AssessmentDeleteModal
