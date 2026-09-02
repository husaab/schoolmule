// File: src/components/terms/add/termAddModal.tsx
'use client'

import React, { useState } from 'react'
import Modal from '../../shared/modal'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { createTerm } from '@/services/termService'
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
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

interface TermAddModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (newTerm: TermPayload) => void
}

const TermAddModal: React.FC<TermAddModalProps> = ({
  isOpen,
  onClose,
  onAdd,
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

      const res = await createTerm(payload)
      if (res.status === 'success') {
        showNotification('Term created successfully', 'success')
        onAdd(res.data)
        resetForm()
        onClose()
      } else {
        showNotification('Failed to create term', 'error')
      }
    } catch (err) {
      console.error('Error creating term:', err)
      showNotification('Error creating term', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      academicYear: '',
      startDate: '',
      endDate: '',
      isActive: false
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style="w-full max-w-lg">
      <ModalHeader
        title="Add a term"
        subtitle="Classes, gradebooks, and report cards are all filed under a term."
        icon={CalendarDaysIcon}
      />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <FieldRow>
            <Field label="Term name" htmlFor="term-name" required>
              <input
                id="term-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Fall Term"
              />
            </Field>

            <Field label="Academic year" htmlFor="term-academic-year" required>
              <input
                id="term-academic-year"
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
            <Field label="Start date" htmlFor="term-start-date" required>
              <input
                id="term-start-date"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={selectClass}
              />
            </Field>

            <Field label="End date" htmlFor="term-end-date" required>
              <input
                id="term-end-date"
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
              id="isActive"
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
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? 'Creating' : 'Add term'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default TermAddModal
