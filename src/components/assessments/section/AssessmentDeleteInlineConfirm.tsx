// File: src/components/assessments/section/AssessmentDeleteInlineConfirm.tsx
'use client'

import React, { useState } from 'react'
import { deleteAssessment } from '@/services/assessmentService'
import type { AssessmentPayload } from '@/services/types/assessment'
import { useNotificationStore } from '@/store/useNotificationStore'
import Spinner from '@/components/Spinner'

interface AssessmentDeleteInlineConfirmProps {
  assessment: AssessmentPayload
  onDeleted: (deletedId: string) => void
  onCancel: () => void
}

/** Inline red confirm bar replacing the old delete modal. */
const AssessmentDeleteInlineConfirm: React.FC<AssessmentDeleteInlineConfirmProps> = ({
  assessment,
  onDeleted,
  onCancel,
}) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [deleting, setDeleting] = useState(false)

  const pts = assessment.weightPoints || assessment.weightPercent || 0

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      const res = await deleteAssessment(assessment.assessmentId)
      if (res.status === 'success') {
        showNotification('Assessment deleted', 'success')
        onDeleted(assessment.assessmentId)
      } else {
        showNotification(res.message || 'Failed to delete assessment', 'error')
        setDeleting(false)
      }
    } catch (err) {
      console.error('Error deleting assessment:', err)
      showNotification('Error deleting assessment', 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
      <p className="text-sm text-red-700">
        Delete <strong>{assessment.name}</strong> ({pts} pts)
        {assessment.isParent ? ' and all its individual assessments' : ''}? This also deletes
        all student scores for it.
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer text-sm font-medium disabled:opacity-50"
        >
          {deleting && <Spinner size="sm" />}
          Delete
        </button>
      </div>
    </div>
  )
}

export default AssessmentDeleteInlineConfirm
