// File: src/components/assessment/edit/AssessmentEditModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { updateAssessment } from '@/services/assessmentService'
import { AssessmentPayload } from '@/services/types/assessment'
import { useNotificationStore } from '@/store/useNotificationStore'

interface AssessmentEditModalProps {
  isOpen: boolean
  onClose: () => void
  assessment: AssessmentPayload
  onUpdate: (updated: AssessmentPayload) => void
}

const AssessmentEditModal: React.FC<AssessmentEditModalProps> = ({
  isOpen,
  onClose,
  assessment,
  onUpdate,
}) => {
  const [name, setName] = useState('')
  const [weight, setWeight] = useState<string>('') // store as string so it doesn’t default to 0
  const showNotification = useNotificationStore((s) => s.showNotification)

  // Whenever the modal opens, prefill the fields from `assessment`
  useEffect(() => {
    if (isOpen) {
      setName(assessment.name)
      setWeight(String(assessment.weightPercent))
    }
  }, [isOpen, assessment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const parsedWeight = Number(weight)

    if (!trimmedName || weight === '' || isNaN(parsedWeight)) {
      showNotification('Name and weight% are required', 'error')
      return
    }
    if (parsedWeight < 0 || parsedWeight > 100) {
      showNotification('Weight must be between 0 and 100', 'error')
      return
    }

    try {
      const payload = {
        name:          trimmedName,
        weightPercent: parsedWeight,
      }
      const res = await updateAssessment(assessment.assessmentId, payload)

      if (res.status === 'success') {
        // Build a fresh AssessmentPayload from the API response:
        // ← Push the new object back up to the parent
        onUpdate(res.data)

        showNotification('Assessment updated successfully', 'success')
        onClose()
      } else {
        showNotification(res.message || 'Failed to update assessment', 'error')
      }
    } catch (err) {
      console.error('Error updating assessment:', err)
      showNotification('Error updating assessment', 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <h2 className="text-xl mb-4 text-black">Edit Assessment</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="block text-sm">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Weight Percentage</label>
          <input
            type="number"
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min={0}
            max={100}
            step={0.01}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AssessmentEditModal
