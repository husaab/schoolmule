// File: src/components/terms/edit/TermEditModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { updateTerm } from '@/services/termService'
import type { TermPayload } from '@/services/types/term'

interface TermEditModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedTerm: TermPayload) => void
  term: TermPayload
}

const TermEditModal: React.FC<TermEditModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  term,
}) => {
  const user = useUserStore((state) => state.user)
  const showNotification = useNotificationStore((state) => state.showNotification)

  const [formData, setFormData] = useState({
    name: '',
    academicYear: '',
    startDate: '',
    endDate: '',
    isActive: false
  })
  const [loading, setLoading] = useState(false)

  // Populate form when term changes or modal opens
  useEffect(() => {
    if (isOpen && term) {
      setFormData({
        name: term.name,
        academicYear: term.academicYear,
        startDate: term.startDate.split('T')[0], // Convert to YYYY-MM-DD format
        endDate: term.endDate.split('T')[0],
        isActive: term.isActive
      })
    }
  }, [isOpen, term])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.school) {
      showNotification('Unable to determine your school', 'error')
      return
    }

    if (!formData.name.trim() || !formData.academicYear.trim() || !formData.startDate || !formData.endDate) {
      showNotification('All fields are required', 'error')
      return
    }

    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    
    if (endDate <= startDate) {
      showNotification('End date must be after start date', 'error')
      return
    }

    setLoading(true)
    try {
      const payload = {
        school: user.school,
        name: formData.name.trim(),
        academicYear: formData.academicYear.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive
      }

      const res = await updateTerm(term.termId, payload)
      if (res.status === 'success') {
        showNotification('Term updated successfully', 'success')
        onUpdate(res.data)
        onClose()
      } else {
        showNotification('Failed to update term', 'error')
      }
    } catch (err) {
      console.error('Error updating term:', err)
      showNotification('Error updating term', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <h2 className="text-xl mb-4 text-black">Edit Term</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="block text-sm font-medium mb-1">Term Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="e.g., Fall Term, Spring Semester"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Academic Year</label>
          <input
            type="text"
            required
            value={formData.academicYear}
            onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="e.g., 2024-2025"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            required
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            required
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActiveEdit"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
          />
          <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-900">
            Set as active term
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Term'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default TermEditModal