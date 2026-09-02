'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { createStaff } from '@/services/staffService'
import { StaffRequest } from '@/services/types/staff'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import StaffFormFields, { StaffFormValues, emptyStaffForm } from '../StaffFormFields'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { UserPlusIcon } from '@heroicons/react/24/outline'


/** "Math Grade 5, Science Grade 6" -> ["Math Grade 5", "Science Grade 6"] */
const splitAssignments = (raw?: string): string[] | undefined => {
  const parts = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : undefined
}

interface StaffAddModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
}

const StaffAddModal: React.FC<StaffAddModalProps> = ({
  isOpen,
  onClose,
  onAdded
}) => {
  const user = useUserStore(state => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)

  // Form state is the FORM's shape (comma-separated assignments as text), not
  // the API payload shape — typing it as StaffRequest is what hid the bug where
  // a text input wrote a string into a string[] field.
  const [formData, setFormData] = useState<StaffFormValues>({
    ...emptyStaffForm,
    school: user.school || ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName.trim() || !formData.staffRole.trim()) {
      showNotification('Please fill in required fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload: StaffRequest = {
        ...formData,
        teachingAssignments: splitAssignments(formData.teachingAssignments),
        homeroomGrade: formData.homeroomGrade || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        preferredContact: formData.preferredContact || undefined,
        phoneContactHours: formData.phoneContactHours || undefined,
        emailContactHours: formData.emailContactHours || undefined
      }

      const response = await createStaff(payload)
      if (response.status === 'success') {
        showNotification('Staff member added successfully', 'success')
        onAdded()
        onClose()
        // Reset form
        setFormData({
          ...emptyStaffForm,
          school: user.school!
        })
      } else {
        showNotification(response.message || 'Failed to add staff member', 'error')
      }
    } catch (error) {
      console.error('Error adding staff:', error)
      showNotification('Error adding staff member', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title="Add staff member"
        subtitle="They appear in the school directory right away."
        icon={UserPlusIcon}
      />

      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          <StaffFormFields values={formData} onChange={handleInputChange} idPrefix="staff-add" />
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {submitting ? 'Adding' : 'Add staff member'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default StaffAddModal
