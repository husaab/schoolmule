'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/shared/modal'
import { updateTuitionPlan } from '@/services/tuitionPlanService'
import { TuitionPlanPayload, TuitionPlanRequest } from '@/services/types/tuitionPlan'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

interface EditTuitionPlanModalProps {
  isOpen: boolean
  onClose: () => void
  plan: TuitionPlanPayload
  onUpdated: () => void
}

const EditTuitionPlanModal: React.FC<EditTuitionPlanModalProps> = ({
  isOpen,
  onClose,
  plan,
  onUpdated
}) => {
  const user = useUserStore(state => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)

  const [formData, setFormData] = useState<TuitionPlanRequest>({
    school: user.school || '',
    grade: '',
    amount: 0,
    frequency: '',
    effectiveFrom: '',
    effectiveTo: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Initialize form data when plan changes
  useEffect(() => {
    if (plan && isOpen) {
      setFormData({
        school: user.school || '',
        grade: plan.grade || '',
        amount: plan.amount || 0,
        frequency: plan.frequency || '',
        effectiveFrom: plan.effectiveFrom ? plan.effectiveFrom.split('T')[0] : '',
        effectiveTo: plan.effectiveTo ? plan.effectiveTo.split('T')[0] : ''
      })
    }
  }, [plan, isOpen, user.school])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.grade || !formData.amount || !formData.frequency || !formData.effectiveFrom) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload: Partial<TuitionPlanRequest> & { school: string } = {
        ...formData,
        effectiveTo: formData.effectiveTo || undefined
      }

      const response = await updateTuitionPlan(plan.planId, payload)
      if (response.status === 'success') {
        showNotification('Tuition plan updated successfully', 'success')
        onUpdated()
        onClose()
      } else {
        showNotification(response.message || 'Failed to update tuition plan', 'error')
      }
    } catch (error) {
      console.error('Error updating tuition plan:', error)
      showNotification('Error updating tuition plan', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl font-semibold text-black mb-4">Edit Tuition Plan</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="block text-sm font-medium mb-1">
            Grade <span className="text-red-500">*</span>
          </label>
          <select
            name="grade"
            value={formData.grade}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Grade</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(grade => (
              <option key={grade} value={grade.toString()}>{grade}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              name="amount"
              value={formData.amount || ''}
              onChange={handleInputChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full border rounded px-8 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Frequency <span className="text-red-500">*</span>
          </label>
          <select
            name="frequency"
            value={formData.frequency}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Frequency</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Semester">Semester</option>
            <option value="Annual">Annual</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Effective From <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="effectiveFrom"
            value={formData.effectiveFrom}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Effective To (Optional)
          </label>
          <input
            type="date"
            name="effectiveTo"
            value={formData.effectiveTo}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty if plan has no end date</p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Plan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EditTuitionPlanModal