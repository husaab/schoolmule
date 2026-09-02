// File: src/components/terms/edit/termEditModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { updateTerm } from '@/services/termService'
import type { TermPayload } from '@/services/types/term'
import {
  Button,
  Field,
  FieldRow,
  ModalBody,
  ModalFooter,
  ModalHeader,
  inputClass,
  selectClass,
} from '../../shared/modalKit'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

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
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title="Edit term"
        subtitle={`${term.name} · ${term.academicYear}`}
        icon={PencilSquareIcon}
      />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <FieldRow>
            <Field label="Term name" htmlFor="term-edit-name" required>
              <input
                id="term-edit-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Fall Term"
              />
            </Field>

            <Field label="Academic year" htmlFor="term-edit-academic-year" required>
              <input
                id="term-edit-academic-year"
                type="text"
                required
                value={formData.academicYear}
                onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                className={inputClass}
                placeholder="e.g. 2024-2025"
              />
            </Field>
          </FieldRow>

          <FieldRow>
            <Field label="Start date" htmlFor="term-edit-start-date" required>
              <input
                id="term-edit-start-date"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={selectClass}
              />
            </Field>

            <Field label="End date" htmlFor="term-edit-end-date" required>
              <input
                id="term-edit-end-date"
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className={selectClass}
              />
            </Field>
          </FieldRow>

          {/* Making a term active is a school-wide switch, not a field-level
              detail, so it gets its own surface rather than sitting in the flow. */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3.5 transition-colors hover:bg-cyan-50">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm">
              <span className="font-medium text-slate-800">Set as the active term</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                A school has one active term at a time.
              </span>
            </span>
          </label>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? 'Saving' : 'Save changes'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default TermEditModal
