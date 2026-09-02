// File: src/components/classes/student/unenroll/ClassUnenrollStudentModal.tsx
'use client'

import React, { useState } from 'react'
import Modal from '../../../shared/modal' // adjust the path if needed
import { useNotificationStore } from '@/store/useNotificationStore'
import { unenrollStudentFromClass } from '@/services/classService'
import { StudentPayload } from '@/services/types/student'
import { getGradeDisplayName } from '@/lib/schoolUtils'
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts,
} from '../../../shared/modalKit'
import { UserMinusIcon } from '@heroicons/react/24/outline'

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
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Remove student from class"
        subtitle="They stay in the school and in their other classes."
        icon={UserMinusIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody tone="danger">
          <strong className="font-semibold text-slate-900">{student.name}</strong> comes off this
          class roster, gradebook, and attendance list. Existing scores and attendance records are
          kept, so enrolling them again brings the work back.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Student', value: student.name },
            {
              label: 'Grade',
              value: student.grade ? getGradeDisplayName(student.grade) : 'Not assigned',
            },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleUnenroll} loading={loading}>
          {loading ? 'Removing' : 'Remove student'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ClassUnenrollStudentModal
