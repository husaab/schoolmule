// File: src/components/classes/student/unenroll/ClassUnenrollAllStudentsModal.tsx
'use client'

import React, { useState } from 'react'
import Modal from '../../../../shared/modal' // adjust path if needed
import { useNotificationStore } from '@/store/useNotificationStore'
import { bulkUnenrollStudentsFromClass } from '@/services/classService' 

interface ClassUnenrollAllStudentsModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  /**
   * Called after a successful unenroll-all:
   * Parent should clear its enrolledStudents array.
   */
  onUnenrolledAll: () => void
}

const ClassUnenrollAllStudentsModal: React.FC<ClassUnenrollAllStudentsModalProps> = ({
  isOpen,
  onClose,
  classId,
  onUnenrolledAll,
}) => {
  const showNotification = useNotificationStore((state) => state.showNotification)
  const [loading, setLoading] = useState(false)

  const handleUnenrollAll = async () => {
    setLoading(true)
    try {
      const res = await bulkUnenrollStudentsFromClass(classId)
      console.log(res)
      if (res.status === 'success') {
        showNotification('All students have been unenrolled.', 'success')
        onUnenrolledAll()
        onClose()
      } else {
        showNotification(res.message || 'Failed to unenroll all students', 'error')
      }
    } catch (err) {
      console.error('Error unenrolling all students:', err)
      showNotification('Error unenrolling students', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-xl mb-4 text-black">Confirm Unenroll All</h2>
      <p className="text-black">
        Are you sure you want to unenroll <strong>all students</strong> from this class?
        This action cannot be undone.
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
          onClick={handleUnenrollAll}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition cursor-pointer"
        >
          {loading ? 'Unenrolling…' : 'Unenroll All'}
        </button>
      </div>
    </Modal>
  )
}

export default ClassUnenrollAllStudentsModal
