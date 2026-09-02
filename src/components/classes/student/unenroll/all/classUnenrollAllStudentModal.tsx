// File: src/components/classes/student/unenroll/ClassUnenrollAllStudentsModal.tsx
'use client'

import React, { useState } from 'react'
import Modal from '../../../../shared/modal' // adjust path if needed
import { useNotificationStore } from '@/store/useNotificationStore'
import { bulkUnenrollStudentsFromClass } from '@/services/classService' 
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '../../../../shared/modalKit'
import { UserMinusIcon } from '@heroicons/react/24/outline'

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
      await bulkUnenrollStudentsFromClass(classId)
        showNotification('All students have been unenrolled.', 'success')
        onUnenrolledAll()
        onClose()
    } catch (err) {
      console.error('Error unenrolling all students:', err)
      showNotification('Error unenrolling students', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Unenroll every student"
        subtitle="This clears the whole roster in one go."
        icon={UserMinusIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'Emptying the roster affects this class only:',
            items: [
              'Every student comes off this class roster, gradebook, and attendance list',
              'The class stops counting toward their report cards until they are enrolled again',
              'Scores and attendance already recorded are kept, so re-enrolling a student brings their work back',
              'There is no undo — rebuilding the roster means enrolling students again',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">All students</strong> will be unenrolled
          from this class. Students, their grades in other classes, and their school records are not
          touched.
        </ConfirmBody>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleUnenrollAll} loading={loading}>
          {loading ? 'Unenrolling' : 'Unenroll every student'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ClassUnenrollAllStudentsModal
