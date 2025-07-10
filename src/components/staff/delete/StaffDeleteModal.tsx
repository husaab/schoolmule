'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { deleteStaff } from '@/services/staffService'
import { StaffPayload } from '@/services/types/staff'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface StaffDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  staff: StaffPayload
  onDeleted: () => void
}

const StaffDeleteModal: React.FC<StaffDeleteModalProps> = ({
  isOpen,
  onClose,
  staff,
  onDeleted
}) => {
  const user = useUserStore(state => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await deleteStaff(staff.staffId, user.school!)
      if (response.status === 'success') {
        showNotification('Staff member deleted successfully', 'success')
        onDeleted()
        onClose()
      } else {
        showNotification(response.message || 'Failed to delete staff member', 'error')
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      showNotification('Error deleting staff member', 'error')
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
        
        <h2 className="text-lg font-medium text-gray-900 mb-2">Delete Staff Member</h2>
        
        <p className="text-sm text-gray-500 mb-4">
          Are you sure you want to delete <strong>{staff.fullName}</strong>? 
          This action cannot be undone.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
          <div className="text-sm text-gray-700 space-y-1">
            <div><strong>Name:</strong> {staff.fullName}</div>
            <div><strong>Role:</strong> {staff.staffRole}</div>
            {staff.email && <div><strong>Email:</strong> {staff.email}</div>}
            {staff.homeroomGrade && <div><strong>Homeroom:</strong> Grade {staff.homeroomGrade}</div>}
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
            {deleting ? 'Deleting...' : 'Delete Staff Member'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default StaffDeleteModal