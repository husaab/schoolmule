'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { deleteStaff } from '@/services/staffService'
import { StaffPayload } from '@/services/types/staff'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts
} from '@/components/shared/modalKit'
import { TrashIcon } from '@heroicons/react/24/outline'

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
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Delete staff member"
        subtitle="This cannot be undone."
        icon={TrashIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'Deleting removes this directory entry:',
            items: [
              'Their email, phone, and contact hours',
              'Their teaching assignments and homeroom listing',
              'The card parents and teachers see in the staff directory'
            ]
          }}
        >
          <strong className="font-semibold text-slate-900">{staff.fullName}</strong> will be
          permanently removed from the staff directory. Their School Mule login and any classes
          they are attached to are untouched.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Role', value: staff.staffRole },
            {
              label: 'Homeroom',
              value: staff.homeroomGrade ? `Grade ${staff.homeroomGrade}` : 'Not assigned'
            },
            { label: 'Email', value: staff.email || 'Not provided' }
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={deleting}>
          {deleting ? 'Deleting' : 'Delete staff member'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default StaffDeleteModal
