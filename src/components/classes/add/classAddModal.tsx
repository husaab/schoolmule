// File: src/components/class/add/ClassAddModal.tsx
'use client'

import React, { useState } from 'react'
import Modal from '../../shared/modal' // adjust path if needed
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { createClass } from '@/services/classService'
import { ClassPayload } from '@/services/types/class'

interface ClassAddModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (newClass: ClassPayload) => void
}

const ClassAddModal: React.FC<ClassAddModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const user = useUserStore((state) => state.user)
  const showNotification = useNotificationStore((state) => state.showNotification)

  const [grade, setGrade] = useState<number | ''>('')
  const [subject, setSubject] = useState('')
  const [homeroomTeacherName, setHomeroomTeacherName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (grade === '' || subject.trim() === '' || homeroomTeacherName.trim() === '') {
      showNotification('Grade, subject, and homeroom teacher name are required', 'error')
      return
    }

    if (!user?.school) {
      showNotification('Unable to determine your school, contact support', 'error')
      return
    }

    // Build the payload for createClass
    const payload = {
      school: user.school,
      grade: grade,
      subject: subject.trim(),
      homeroomTeacherName: homeroomTeacherName.trim(),
    }

    try {
      const res = await createClass(payload)
      if (res.status === 'success') {
        // Raw response is in res.data; shape: { classId, school, grade, subject, homeroomTeacherName, createdAt, lastModifiedAt }
        const raw = res.data as any

        const newClass: ClassPayload = {
            classId: raw.classId,
            school: raw.school,
            grade: raw.grade,
            subject: raw.subject,
            homeroomTeacherName: raw.homeroomTeacherName,
            createdAt: raw.createdAt,
            lastModifiedAt: raw.lastModifiedAt,
        }

        onAdd(newClass)
        showNotification('Class created successfully', 'success')
        onClose()

        // reset fields
        setGrade('')
        setSubject('')
        setHomeroomTeacherName('')
      } else {
        showNotification(res.message || 'Failed to create class', 'error')
      }
    } catch (err) {
      console.error('Error creating class:', err)
      showNotification('Error creating class', 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <h2 className="text-xl mb-4 text-black">Add New Class</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {/* Grade */}
        <div>
          <label className="block text-sm">Grade</label>
          <select
            required
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="w-full border rounded px-2 py-1"
          >
            <option value="" disabled>
              Select grade
            </option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm">Subject</label>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        {/* Homeroom Teacher Name */}
        <div>
          <label className="block text-sm">Homeroom Teacher Name</label>
          <input
            required
            value={homeroomTeacherName}
            onChange={(e) => setHomeroomTeacherName(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-400 text-white rounded-md cursor-pointer"
          >
            Add Class
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ClassAddModal
