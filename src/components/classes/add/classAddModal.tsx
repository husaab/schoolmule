// File: src/components/classes/add/ClassAddModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal' // adjust path if needed
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { createClass } from '@/services/classService'
import type { ClassPayload } from '@/services/types/class'
import { getTeachersBySchool } from '@/services/teacherService'
import type { TeacherPayload } from '@/services/types/teacher'
import { getTermsBySchool } from '@/services/termService'
import type { TermPayload } from '@/services/types/term'

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

  // ------ LOCAL STATE ------
  const [grade, setGrade] = useState<number | ''>('')
  const [subject, setSubject] = useState('')
  const [teacherId, setTeacherId] = useState<string>('')
  const [termId, setTermId] = useState<string>('')
  const [teachers, setTeachers] = useState<TeacherPayload[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(false)
  const [loadingTerms, setLoadingTerms] = useState<boolean>(false)
  // --------------------------

  // 1) When the modal opens (and user.school is known), fetch all teachers in that school
  useEffect(() => {
    if (!isOpen) return

    if (!user?.school) {
      showNotification('Unable to determine your school, contact support', 'error')
      return
    }

    const fetchTeachers = async () => {
      setLoadingTeachers(true)
      try {
        const res = await getTeachersBySchool(user.school!)
        if (res.status === 'success') {
          setTeachers(res.data)
        } else {
          console.error('Failed to fetch teachers:', res.message)
          showNotification('Failed to load teacher list', 'error')
        }
      } catch (err) {
        console.error('Error loading teachers:', err)
        showNotification('Error loading teacher list', 'error')
      } finally {
        setLoadingTeachers(false)
      }
    }

    const fetchTerms = async () => {
      setLoadingTerms(true)
      try {
        const res = await getTermsBySchool(user.school!)
        if (res.status === 'success') {
          setTerms(res.data)
        } else {
          showNotification('Failed to load terms list', 'error')
        }
      } catch (err) {
        console.error('Error loading terms:', err)
        showNotification('Error loading terms list', 'error')
      } finally {
        setLoadingTerms(false)
      }
    }

    fetchTeachers()
    fetchTerms()
  }, [isOpen, user?.school, showNotification])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 2) Validate required fields
    if (grade === '' || subject.trim() === '' || teacherId === '' || termId === '') {
      showNotification('Grade, subject, teacher, and term are required', 'error')
      return
    }
    if (!user?.school) {
      showNotification('Unable to determine your school, contact support', 'error')
      return
    }

    // 3) Find the teacher’s full name from the array
    const selectedTeacher = teachers.find((t) => t.userId === teacherId)
    if (!selectedTeacher) {
      showNotification('Selected teacher not found', 'error')
      return
    }

    // 4) Find the selected term's name
    const selectedTerm = terms.find((t) => t.termId === termId)
    if (!selectedTerm) {
      showNotification('Selected term not found', 'error')
      return
    }

    // 5) Build the payload for createClass()
    const payload = {
      school:      user.school,
      grade:       grade,
      subject:     subject.trim(),
      teacherName: selectedTeacher.fullName,
      teacherId:   selectedTeacher.userId,
      termId:      selectedTerm.termId,
      termName:    selectedTerm.name,
    }

    try {
      const res = await createClass(payload)
      if (res.status === 'success') {
        const raw = res.data
        const newClass: ClassPayload = {
          classId:        raw.classId,
          school:         raw.school,
          grade:          raw.grade,
          subject:        raw.subject,
          teacherName:    raw.teacherName,
          teacherId:      raw.teacherId,
          termId:         raw.termId,
          termName:       raw.termName,
          createdAt:      raw.createdAt,
          lastModifiedAt: raw.lastModifiedAt,
        }

        onAdd(newClass)
        showNotification('Class created successfully', 'success')
        onClose()

        // Reset fields
        setGrade('')
        setSubject('')
        setTeacherId('')
        setTermId('')
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

      {/* If teachers or terms are still loading, show a spinner or message */}
      {loadingTeachers || loadingTerms ? (
        <p className="text-gray-600">Loading data…</p>
      ) : (
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

          {/* Teacher Dropdown */}
          <div>
            <label className="block text-sm">Teacher</label>
            <select
              required
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="" disabled>
                Select teacher
              </option>
              {teachers.map((t) => (
                <option key={t.userId} value={t.userId}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Term Dropdown */}
          <div>
            <label className="block text-sm">Term</label>
            <select
              required
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              className="w-full border rounded px-2 py-1 text-black"
            >
              <option value="" disabled className="text-black">
                Select term
              </option>
              {terms.map((t) => (
                <option key={t.termId} value={t.termId} className="text-black">
                  {t.name} ({t.academicYear})
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-gray-600 italic">
            Note: you can only add Assessments and Students after creating the class.
            Once created, click “Edit” to add both.
          </p>

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
      )}
    </Modal>
  )
}

export default ClassAddModal
