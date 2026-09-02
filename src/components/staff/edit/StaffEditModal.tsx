'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/shared/modal'
import { updateStaff } from '@/services/staffService'
import { StaffPayload, StaffRequest } from '@/services/types/staff'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import StaffFormFields, { StaffFormValues, emptyStaffForm } from '../StaffFormFields'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { PencilSquareIcon } from '@heroicons/react/24/outline'


/** "Math Grade 5, Science Grade 6" -> ["Math Grade 5", "Science Grade 6"] */
const splitAssignments = (raw?: string): string[] | undefined => {
  const parts = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : undefined
}

interface StaffEditModalProps {
  isOpen: boolean
  onClose: () => void
  staff: StaffPayload
  onUpdated: () => void
}

const StaffEditModal: React.FC<StaffEditModalProps> = ({
  isOpen,
  onClose,
  staff,
  onUpdated
}) => {
  const user = useUserStore(state => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)

  // Form state is the FORM's shape (comma-separated assignments as text), not
  // the API payload shape — see StaffFormFields.
  const [formData, setFormData] = useState<StaffFormValues>({
    ...emptyStaffForm,
    school: user.school || ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Initialize form data when staff changes
  useEffect(() => {
    if (staff && isOpen) {
      setFormData({
        school: user.school || '',
        fullName: staff.fullName || '',
        staffRole: staff.staffRole || '',
        teachingAssignments: Array.isArray(staff.teachingAssignments)
          ? staff.teachingAssignments.join(', ')
          : (staff.teachingAssignments ?? ''),
        homeroomGrade: staff.homeroomGrade || '',
        email: staff.email || '',
        phone: staff.phone || '',
        preferredContact: staff.preferredContact || '',
        phoneContactHours: staff.phoneContactHours || '',
        emailContactHours: staff.emailContactHours || ''
      })
    }
  }, [staff, isOpen, user.school])

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
      const payload: Partial<StaffRequest> & { school: string } = {
        ...formData,
        teachingAssignments: splitAssignments(formData.teachingAssignments),
        homeroomGrade: formData.homeroomGrade || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        preferredContact: formData.preferredContact || undefined,
        phoneContactHours: formData.phoneContactHours || undefined,
        emailContactHours: formData.emailContactHours || undefined
      }

      const response = await updateStaff(staff.staffId, payload)
      if (response.status === 'success') {
        showNotification('Staff member updated successfully', 'success')
        onUpdated()
        onClose()
      } else {
        showNotification(response.message || 'Failed to update staff member', 'error')
      }
    } catch (error) {
      console.error('Error updating staff:', error)
      showNotification('Error updating staff member', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader title="Edit staff member" subtitle={staff.fullName} icon={PencilSquareIcon} />

      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          <StaffFormFields values={formData} onChange={handleInputChange} idPrefix="staff-edit" />
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {submitting ? 'Saving' : 'Save changes'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default StaffEditModal
