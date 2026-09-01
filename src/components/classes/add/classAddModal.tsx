// File: src/components/classes/add/classAddModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { createClass } from '@/services/classService'
import type { ClassPayload } from '@/services/types/class'
import { getTeachersBySchool } from '@/services/teacherService'
import type { TeacherPayload } from '@/services/types/teacher'
import { getTermsBySchool } from '@/services/termService'
import type { TermPayload } from '@/services/types/term'
import { getGradeDisplayName, getGradeOptions, GradeValue } from '@/lib/schoolUtils'
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
import { BookOpenIcon } from '@heroicons/react/24/outline'

interface ClassAddModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (newClass: ClassPayload) => void
}

const ClassAddModal: React.FC<ClassAddModalProps> = ({ isOpen, onClose, onAdd }) => {
  const user = useUserStore((state) => state.user)
  const showNotification = useNotificationStore((state) => state.showNotification)

  const [grade, setGrade] = useState<GradeValue | ''>('')
  const [subject, setSubject] = useState('')
  const [teacherId, setTeacherId] = useState<string>('')
  const [termId, setTermId] = useState<string>('')
  const [autoEnroll, setAutoEnroll] = useState(true)
  const [teachers, setTeachers] = useState<TeacherPayload[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(false)
  const [loadingTerms, setLoadingTerms] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState(false)

  // When the modal opens (and user.school is known), fetch teachers and terms
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

    if (grade === '' || subject.trim() === '' || teacherId === '' || termId === '') {
      showNotification('Grade, subject, teacher, and term are required', 'error')
      return
    }
    if (!user?.school) {
      showNotification('Unable to determine your school, contact support', 'error')
      return
    }

    const selectedTeacher = teachers.find((t) => t.userId === teacherId)
    if (!selectedTeacher) {
      showNotification('Selected teacher not found', 'error')
      return
    }

    const selectedTerm = terms.find((t) => t.termId === termId)
    if (!selectedTerm) {
      showNotification('Selected term not found', 'error')
      return
    }

    const payload = {
      school:      user.school,
      grade:       grade,
      subject:     subject.trim(),
      teacherName: selectedTeacher.fullName,
      teacherId:   selectedTeacher.userId,
      termId:      selectedTerm.termId,
      termName:    selectedTerm.name,
      autoEnroll,
    }

    setSubmitting(true)
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
          additionalTeachers: raw.additionalTeachers ?? [],
        }

        onAdd(newClass)
        const enrolledMsg = raw.autoEnrolled && raw.enrolledCount > 0
          ? ` — ${raw.enrolledCount} student${raw.enrolledCount === 1 ? '' : 's'} enrolled`
          : ''
        showNotification(`Class created successfully${enrolledMsg}`, 'success')
        onClose()

        // Reset fields
        setGrade('')
        setSubject('')
        setTeacherId('')
        setTermId('')
        setAutoEnroll(true)
      } else {
        showNotification(res.message || 'Failed to create class', 'error')
      }
    } catch (err) {
      console.error('Error creating class:', err)
      showNotification('Error creating class', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const loadingOptions = loadingTeachers || loadingTerms

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title="Add a class"
        subtitle="Assessments come later — add them from the class once it exists."
        icon={BookOpenIcon}
      />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          {loadingOptions ? (
            <div className="space-y-4" aria-label="Loading teachers and terms">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <FieldRow>
                <Field label="Grade" htmlFor="class-grade" required>
                  <select
                    id="class-grade"
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as GradeValue)}
                    className={selectClass}
                  >
                    <option value="" disabled>
                      Select grade
                    </option>
                    {getGradeOptions().map((gradeOption) => (
                      <option key={gradeOption.value} value={gradeOption.value}>
                        {gradeOption.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Term" htmlFor="class-term" required>
                  <select
                    id="class-term"
                    required
                    value={termId}
                    onChange={(e) => setTermId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="" disabled>
                      Select term
                    </option>
                    {terms.map((t) => (
                      <option key={t.termId} value={t.termId}>
                        {t.name} ({t.academicYear})
                      </option>
                    ))}
                  </select>
                </Field>
              </FieldRow>

              <Field label="Subject" htmlFor="class-subject" required>
                <input
                  id="class-subject"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Islamic Studies"
                  className={inputClass}
                />
              </Field>

              <Field label="Teacher" htmlFor="class-teacher" required>
                <select
                  id="class-teacher"
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className={selectClass}
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
              </Field>

              {/* Auto-enroll — the one decision here that quietly does a lot,
                  so it gets its own surface rather than sitting in the field flow. */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3.5 transition-colors hover:bg-cyan-50">
                <input
                  type="checkbox"
                  checked={autoEnroll}
                  onChange={(e) => setAutoEnroll(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm">
                  <span className="font-medium text-slate-800">
                    {grade === ''
                      ? 'Enroll every student in the selected grade'
                      : `Enroll every ${getGradeDisplayName(grade)} student`}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    You can adjust the roster anytime from the class.
                  </span>
                </span>
              </label>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting} disabled={loadingOptions}>
            {submitting ? 'Creating' : 'Add class'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default ClassAddModal
