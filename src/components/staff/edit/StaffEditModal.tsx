'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/shared/modal'
import { updateStaff } from '@/services/staffService'
import { StaffPayload, StaffRequest } from '@/services/types/staff'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

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

  const [formData, setFormData] = useState<StaffRequest>({
    school: user.school || '',
    fullName: '',
    staffRole: '',
    teachingAssignments: '',
    homeroomGrade: '',
    email: '',
    phone: '',
    preferredContact: '',
    phoneContactHours: '',
    emailContactHours: ''
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
          : staff.teachingAssignments || '',
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
      // Parse teaching assignments if it's a string
      const payload: Partial<StaffRequest> & { school: string } = {
        ...formData,
        teachingAssignments: formData.teachingAssignments 
          ? formData.teachingAssignments.split(',').map((s: string) => s.trim()).filter(Boolean)
          : undefined,
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
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-2xl w-11/12 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-semibold text-black mb-4">Edit Staff Member</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Staff Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="staffRole"
              value={formData.staffRole}
              onChange={handleInputChange}
              placeholder="e.g., Teacher, Principal, Secretary"
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Teaching Assignments</label>
          <input
            type="text"
            name="teachingAssignments"
            value={formData.teachingAssignments}
            onChange={handleInputChange}
            placeholder="e.g., Math Grade 5, Science Grade 6 (comma separated)"
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Separate multiple assignments with commas</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Homeroom Grade</label>
          <select
            name="homeroomGrade"
            value={formData.homeroomGrade}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Grade (Optional)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(grade => (
              <option key={grade} value={grade.toString()}>{grade}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Preferred Contact Method</label>
          <select
            name="preferredContact"
            value={formData.preferredContact}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Method (Optional)</option>
            <option value="Email">Email</option>
            <option value="Phone">Phone</option>
            <option value="Both">Both</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone Contact Hours</label>
            <input
              type="text"
              name="phoneContactHours"
              value={formData.phoneContactHours}
              onChange={handleInputChange}
              placeholder="e.g., 9 AM - 3 PM weekdays"
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email Contact Hours</label>
            <input
              type="text"
              name="emailContactHours"
              value={formData.emailContactHours}
              onChange={handleInputChange}
              placeholder="e.g., 24 hours, check daily"
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Staff Member'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default StaffEditModal