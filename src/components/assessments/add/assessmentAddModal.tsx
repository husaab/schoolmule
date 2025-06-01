// File: src/components/assessments/add/AssessmentAddModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { createAssessment } from '@/services/assessmentService'
import { AssessmentPayload } from '@/services/types/assessment'
import { useNotificationStore } from '@/store/useNotificationStore'

interface AssessmentAddModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  onAdd: (newAssessment: AssessmentPayload) => void
}

const AssessmentAddModal: React.FC<AssessmentAddModalProps> = ({
  isOpen,
  onClose,
  classId,
  onAdd,
}) => {
  const [name, setName] = useState('')
  // Keep weight as a string so that when the user clears it, it doesn’t immediately default to zero
  const [weight, setWeight] = useState<string>('')

  const showNotification = useNotificationStore((state) => state.showNotification)

  // Reset form fields whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setWeight('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const parsedWeight = Number(weight)

    if (!trimmedName || weight === '' || isNaN(parsedWeight)) {
      showNotification('Name and weight% are required', 'error')
      return
    }

    // Ensure weight is between 0 and 100
    if (parsedWeight < 0 || parsedWeight > 100) {
      showNotification('Weight must be between 0 and 100', 'error')
      return
    }

    try {
      // Build payload; backend expects: { classId, name, weightPercent }
      const payload = {
        classId,
        name: trimmedName,
        weightPercent: parsedWeight,
      }

      const res = await createAssessment(payload)

      if (res.status === 'success') {
        // The API should return the created row in res.data
        onAdd(res.data)
        showNotification('Assessment added successfully', 'success')
        onClose()
      } else {
        showNotification(res.message || 'Failed to add assessment', 'error')
      }
    } catch (err) {
      console.error('Error creating assessment:', err)
      showNotification('Error creating assessment', 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <h2 className="text-xl mb-4 text-black">Add Assessment</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {/* Name field */}
        <div>
          <label className="block text-sm">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g. Midterm Exam"
          />
        </div>

        {/* Weight percentage field */}
        <div>
          <label className="block text-sm">Weight Percentage</label>
          <input
            type="number"
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g. 25"
            min={0}
            max={100}
            step={0.01}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer hover:bg-red-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded-md cursor-pointer hover:bg-cyan-700"
          >
            Add Assessment
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AssessmentAddModal
