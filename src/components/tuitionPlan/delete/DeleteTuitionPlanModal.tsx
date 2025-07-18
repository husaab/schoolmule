'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { deleteTuitionPlan } from '@/services/tuitionPlanService'
import { TuitionPlanPayload } from '@/services/types/tuitionPlan'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface DeleteTuitionPlanModalProps {
  isOpen: boolean
  onClose: () => void
  plan: TuitionPlanPayload
  onDeleted: () => void
}

const DeleteTuitionPlanModal: React.FC<DeleteTuitionPlanModalProps> = ({
  isOpen,
  onClose,
  plan,
  onDeleted
}) => {
  const user = useUserStore(state => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await deleteTuitionPlan(plan.planId, user.school)
      if (response.status === 'success') {
        showNotification('Tuition plan deleted successfully', 'success')
        onDeleted()
        onClose()
      } else {
        showNotification(response.message || 'Failed to delete tuition plan', 'error')
      }
    } catch (error) {
      console.error('Error deleting tuition plan:', error)
      showNotification('Error deleting tuition plan', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
        </div>
        
        <h2 className="text-lg font-medium text-gray-900 mb-2">Delete Tuition Plan</h2>
        
        <p className="text-sm text-gray-500 mb-4">
          Are you sure you want to delete this tuition plan? This action cannot be undone.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
          <div className="text-sm text-gray-700 space-y-1">
            <div><strong>Grade:</strong> {plan.grade}</div>
            <div><strong>Amount:</strong> ${plan.amount.toLocaleString()}</div>
            <div><strong>Frequency:</strong> {plan.frequency}</div>
            <div>
              <strong>Effective Period:</strong> {' '}
              {new Date(plan.effectiveFrom).toLocaleDateString()}
              {plan.effectiveTo && (
                <> - {new Date(plan.effectiveTo).toLocaleDateString()}</>
              )}
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <strong>Warning:</strong> Deleting this plan may affect existing invoices and billing records.
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 cursor-pointer"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Plan'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteTuitionPlanModal