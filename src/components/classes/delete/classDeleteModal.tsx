// File: src/components/class/delete/ClassDeleteModal.tsx
'use client'

import React, { useState } from 'react'
import Modal from '../../shared/modal' // adjust the path if needed
import { useNotificationStore } from '@/store/useNotificationStore'
import { deleteClass } from '@/services/classService'
import { ClassPayload } from '@/services/types/class'

interface ClassDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  classData: ClassPayload
  onDeleted: (id: string) => void
}

const ClassDeleteModal: React.FC<ClassDeleteModalProps> = ({
  isOpen,
  onClose,
  classData,
  onDeleted,
}) => {
  const showNotification = useNotificationStore((state) => state.showNotification)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await deleteClass(classData.classId)
      if (res.status === 'success') {
        showNotification('Class deleted successfully', 'success')
        onDeleted(classData.classId)
        onClose()
      } else {
        showNotification(res.message || 'Failed to delete class', 'error')
      }
    } catch (err) {
      console.error('Error deleting class:', err)
      showNotification('Error deleting class', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-xl mb-4 text-black">Confirm Delete</h2>
      <p className="text-black">
        Are you sure you want to delete the class &ldquo;
        <span className="font-semibold">{classData.subject}</span>&rdquo; (Grade{' '}
        {classData.grade})?
      </p>
      <div className="flex justify-end space-x-4 pt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition cursor-pointer"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}

export default ClassDeleteModal
