// File: src/components/classes/student/unenroll/ClassUnenrollStudentModal.tsx
'use client'

import React, { useState } from 'react'
import Modal from '../../../shared/modal' // adjust the path if needed
import { useNotificationStore } from '@/store/useNotificationStore'
import { unenrollStudentFromClass } from '@/services/classService'
import { StudentPayload } from '@/services/types/student'

interface ClassUnenrollStudentModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  student: StudentPayload
  onUnenrolled: (studentId: string) => void
}

const ClassUnenrollStudentModal: React.FC<ClassUnenrollStudentModalProps> = ({
  isOpen,
  onClose,
  classId,
  student,
  onUnenrolled,
}) => {
  const showNotification = useNotificationStore((state) => state.showNotification)
  const [loading, setLoading] = useState(false)

  const handleUnenroll = async () => {
    setLoading(true)
    try {
      const res = await unenrollStudentFromClass(classId, student.studentId)
      if (res.status === 'success') {
        showNotification(`${student.name} has been removed`, 'success')
        onUnenrolled(student.studentId) // parent will remove from its array
        onClose()
      } else {
        showNotification(res.message || 'Failed to remove student', 'error')
      }
    } catch (err) {
      console.error('Error unenrolling student:', err)
      showNotification('Error removing student', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-xl mb-4 text-black">Confirm Removal</h2>
      <p className="text-black">
        Are you sure you want to unenroll <strong>{student.name}</strong> (Grade{' '}
        {student.grade}) from this class?
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
          onClick={handleUnenroll}
          disabled={loading}
          className="px-4 py-2 bg-cyan-700 text-white rounded-md hover:bg-cyan-800 transition cursor-pointer"
        >
          {loading ? 'Removing...' : 'Unenroll'}
        </button>
      </div>
    </Modal>
  )
}

export default ClassUnenrollStudentModal
