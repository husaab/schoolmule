// File: src/components/classes/delete/classDeleteModal.tsx
'use client'

import React, { useState } from 'react'
import Modal from '../../shared/modal'
import { useNotificationStore } from '@/store/useNotificationStore'
import { deleteClass } from '@/services/classService'
import { ClassPayload } from '@/services/types/class'
import { getGradeDisplayName } from '@/lib/schoolUtils'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '../../shared/modalKit'
import { TrashIcon } from '@heroicons/react/24/outline'

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
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Delete class"
        subtitle="This cannot be undone."
        icon={TrashIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'Deleting this class also removes:',
            items: [
              'Its assessments and every student score on them',
              'Attendance taken for this class',
              'The enrolment of every student in it',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{classData.subject}</strong> will be
          permanently removed. Students themselves are not affected — only their place in this class.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Grade', value: classData.grade ? getGradeDisplayName(classData.grade) : '—' },
            { label: 'Teacher', value: classData.teacherName || 'Unassigned' },
            { label: 'Term', value: classData.termName || 'Not assigned' },
            { label: 'Subject', value: classData.subject },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={loading}>
          {loading ? 'Deleting' : 'Delete class'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ClassDeleteModal
