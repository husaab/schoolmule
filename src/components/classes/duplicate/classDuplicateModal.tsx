// File: src/components/classes/duplicate/classDuplicateModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { duplicateClass } from '@/services/classService'
import type { ClassPayload } from '@/services/types/class'
import { getTeachersBySchool } from '@/services/teacherService'
import type { TeacherPayload } from '@/services/types/teacher'
import { getTermsBySchool } from '@/services/termService'
import type { TermPayload } from '@/services/types/term'
import { getGradeOptions, GradeValue } from '@/lib/schoolUtils'
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
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline'

interface ClassDuplicateModalProps {
  isOpen: boolean
  onClose: () => void
  sourceClass: ClassPayload
  onDuplicated: () => void
}

const ClassDuplicateModal: React.FC<ClassDuplicateModalProps> = ({
  isOpen,
  onClose,
  sourceClass,
  onDuplicated,
}) => {
  const user = useUserStore((state) => state.user)
  const showNotification = useNotificationStore((state) => state.showNotification)

  const [grade, setGrade] = useState<GradeValue | ''>(sourceClass.grade)
  const [subject, setSubject] = useState(sourceClass.subject)
  const [teacherId, setTeacherId] = useState(sourceClass.teacherId)
  const [termId, setTermId] = useState(sourceClass.termId)
  const [teachers, setTeachers] = useState<TeacherPayload[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch teachers and terms on open, then pre-fill fields
  useEffect(() => {
    if (!isOpen || !user?.school) return

    const fetchData = async () => {
      setLoadingData(true)
      try {
        const [teacherRes, termRes] = await Promise.all([
          getTeachersBySchool(user.school!),
          getTermsBySchool(user.school!),
        ])

        if (teacherRes.status === 'success') setTeachers(teacherRes.data)

        let fetchedTerms: TermPayload[] = []
        if (termRes.status === 'success') {
          fetchedTerms = termRes.data
          setTerms(fetchedTerms)
        }

        // Pre-fill fields from sourceClass
        setGrade(sourceClass.grade)
        setSubject(sourceClass.subject)
        setTeacherId(sourceClass.teacherId)

        // Default to the next term (by start date) instead of the same term
        const sourceTerm = fetchedTerms.find((t) => t.termId === sourceClass.termId)
        const sortedTerms = [...fetchedTerms].sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )

        let nextTermId = ''
        if (sourceTerm) {
          const sourceStart = new Date(sourceTerm.startDate).getTime()
          const nextTerm = sortedTerms.find(
            (t) => new Date(t.startDate).getTime() > sourceStart
          )
          nextTermId = nextTerm?.termId ?? ''
        }

        // If no future term found, leave blank so teacher must choose
        setTermId(nextTermId)
      } catch (err) {
        console.error('Error loading data for duplicate modal:', err)
        showNotification('Error loading teachers/terms', 'error')
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [isOpen, user?.school, sourceClass, showNotification])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (grade === '' || !subject.trim() || !teacherId || !termId) {
      showNotification('All fields are required', 'error')
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

    setSubmitting(true)
    try {
      const res = await duplicateClass(sourceClass.classId, {
        grade: grade as GradeValue,
        subject: subject.trim(),
        teacherName: selectedTeacher.fullName,
        teacherId: selectedTeacher.userId,
        termId: selectedTerm.termId,
        termName: selectedTerm.name,
      })

      if (res.status === 'success') {
        const { assessmentsCopied, studentsCopied } = res.data
        showNotification(
          `Class duplicated! ${assessmentsCopied} assessment${assessmentsCopied !== 1 ? 's' : ''} and ${studentsCopied} student${studentsCopied !== 1 ? 's' : ''} copied.`,
          'success'
        )
        onDuplicated()
        onClose()
      } else {
        showNotification(res.message || 'Failed to duplicate class', 'error')
      }
    } catch (err) {
      console.error('Error duplicating class:', err)
      showNotification('Error duplicating class', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title="Duplicate class"
        subtitle={`From ${sourceClass.subject}`}
        icon={DocumentDuplicateIcon}
        tone="violet"
      />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-sm text-violet-900">
            <p className="font-medium">The copy brings across:</p>
            <ul className="mt-2 space-y-1.5 opacity-90">
              <li className="flex gap-2">
                <span aria-hidden="true">·</span>
                <span>Every assessment, with its dates cleared</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true">·</span>
                <span>The full student roster</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true">·</span>
                <span>No scores — the new class starts ungraded</span>
              </li>
            </ul>
          </div>

          {loadingData ? (
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
                <Field label="Grade" htmlFor="dup-grade" required>
                  <select
                    id="dup-grade"
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as GradeValue)}
                    className={selectClass}
                  >
                    <option value="" disabled>Select grade</option>
                    {getGradeOptions().map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Term"
                  htmlFor="dup-term"
                  required
                  hint="Defaults to the next term after the original."
                >
                  <select
                    id="dup-term"
                    required
                    value={termId}
                    onChange={(e) => setTermId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="" disabled>Select term</option>
                    {terms.map((t) => (
                      <option key={t.termId} value={t.termId}>
                        {t.name} ({t.academicYear})
                      </option>
                    ))}
                  </select>
                </Field>
              </FieldRow>

              <Field label="Subject" htmlFor="dup-subject" required>
                <input
                  id="dup-subject"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Teacher" htmlFor="dup-teacher" required>
                <select
                  id="dup-teacher"
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className={selectClass}
                >
                  <option value="" disabled>Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>{t.fullName}</option>
                  ))}
                </select>
              </Field>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="violet" loading={submitting} disabled={loadingData}>
            {submitting ? 'Duplicating' : 'Duplicate class'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default ClassDuplicateModal
