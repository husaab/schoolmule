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
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <DocumentDuplicateIcon className="w-5 h-5 text-violet-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Duplicate Class</h2>
      </div>

      {/* Info banner */}
      <div className="mb-4 p-3 bg-violet-50 border border-violet-200 rounded-xl text-sm text-violet-700">
        Assessments and students will be copied. Scores will not be copied. Assessment dates are cleared.
      </div>

      {loadingData ? (
        <p className="text-gray-600">Loading data…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          {/* Grade */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
            <select
              required
              value={grade}
              onChange={(e) => setGrade(e.target.value as GradeValue)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="" disabled>Select grade</option>
              {getGradeOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
            <select
              required
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="" disabled>Select teacher</option>
              {teachers.map((t) => (
                <option key={t.userId} value={t.userId}>{t.fullName}</option>
              ))}
            </select>
          </div>

          {/* Term */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Term</label>
            <select
              required
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="" disabled>Select term</option>
              {terms.map((t) => (
                <option key={t.termId} value={t.termId}>
                  {t.name} ({t.academicYear})
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:from-violet-600 hover:to-purple-600 transition-all font-medium text-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Duplicating…' : 'Duplicate Class'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default ClassDuplicateModal
