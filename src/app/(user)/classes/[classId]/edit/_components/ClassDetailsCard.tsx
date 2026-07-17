// File: src/app/(user)/classes/[classId]/edit/_components/ClassDetailsCard.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { updateClass } from '@/services/classService'
import type { ClassPayload } from '@/services/types/class'
import type { TeacherPayload } from '@/services/types/teacher'
import type { TermPayload } from '@/services/types/term'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getGradeDisplayName, getGradeOptions, GradeValue } from '@/lib/schoolUtils'
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'

interface ClassDetailsCardProps {
  classData: ClassPayload
  teachers: TeacherPayload[]
  terms: TermPayload[]
  loadingTeachers: boolean
  loadingTerms: boolean
  currentTermData: TermPayload | null
  onSaved: (updated: ClassPayload) => void
}

const ClassDetailsCard: React.FC<ClassDetailsCardProps> = ({
  classData,
  teachers,
  terms,
  loadingTeachers,
  loadingTerms,
  currentTermData,
  onSaved,
}) => {
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [isEditing, setIsEditing] = useState(false)
  const [editSubject, setEditSubject] = useState('')
  const [editGrade, setEditGrade] = useState<GradeValue | ''>('')
  const [editTeacherId, setEditTeacherId] = useState<string>('')
  const [editTermId, setEditTermId] = useState<string>('')

  const { subject, grade, teacherName, termName, school, createdAt, lastModifiedAt } = classData

  useEffect(() => {
    if (isEditing && classData) {
      setEditSubject(classData.subject)
      setEditGrade(classData.grade)
      setEditTeacherId(classData.teacherId)
      setEditTermId(classData.termId || '')
    }
  }, [isEditing, classData])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      editSubject.trim() === '' ||
      editGrade === '' ||
      editTeacherId.trim() === '' ||
      editTermId.trim() === ''
    ) {
      showNotification('All fields are required', 'error')
      return
    }

    const selectedTeacher = teachers.find((t) => t.userId === editTeacherId)
    if (!selectedTeacher) {
      showNotification('Selected teacher not found', 'error')
      return
    }

    const selectedTerm = terms.find((t) => t.termId === editTermId)
    if (!selectedTerm) {
      showNotification('Selected term not found', 'error')
      return
    }

    try {
      const payload = {
        grade:       editGrade as GradeValue,
        subject:     editSubject.trim(),
        teacherName: selectedTeacher.fullName,
        teacherId:   selectedTeacher.userId,
        termId:      selectedTerm.termId,
        termName:    selectedTerm.name,
      }
      const res = await updateClass(classData.classId, payload)
      if (res.status === 'success') {
        const updatedRaw = res.data
        onSaved({
          classId:        updatedRaw.classId,
          school:         updatedRaw.school,
          grade:          updatedRaw.grade,
          subject:        updatedRaw.subject,
          teacherName:    updatedRaw.teacherName,
          teacherId:      updatedRaw.teacherId,
          termId:         updatedRaw.termId,
          termName:       updatedRaw.termName,
          createdAt:      updatedRaw.createdAt,
          lastModifiedAt: updatedRaw.lastModifiedAt,
          additionalTeachers: updatedRaw.additionalTeachers ?? [],
        })
        showNotification('Class updated successfully', 'success')
        setIsEditing(false)
      } else {
        showNotification(res.message || 'Failed to update class', 'error')
      }
    } catch (err) {
      console.error('Error updating class:', err)
      showNotification('Error updating class', 'error')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
            <AcademicCapIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Class Details</h2>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all font-medium cursor-pointer text-sm"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="cursor-pointer px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium text-sm"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6">
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Subject</p>
              <p className="text-slate-900 font-medium">{subject}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Grade</p>
              <p className="text-slate-900 font-medium">{getGradeDisplayName(grade)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Teacher</p>
              <p className="text-slate-900 font-medium">{teacherName || '-'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">School</p>
              <p className="text-slate-900 font-medium">{school}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl md:col-span-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Term</p>
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                <p className="text-slate-900 font-medium">{termName || 'Not assigned'}</p>
                {currentTermData && (
                  <span className="text-sm text-slate-500">
                    ({new Date(currentTermData.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })} - {new Date(currentTermData.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })})
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Created</p>
              <p className="text-slate-900 font-medium">{new Date(createdAt).toLocaleDateString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Last Modified</p>
              <p className="text-slate-900 font-medium">{lastModifiedAt ? new Date(lastModifiedAt).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  required
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-black bg-slate-50 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Grade</label>
                <select
                  required
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value as GradeValue)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-black bg-slate-50 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all cursor-pointer"
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
              </div>

              {/* Teacher Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teacher</label>
                {loadingTeachers ? (
                  <p className="text-slate-500 py-2">Loading teachers…</p>
                ) : (
                  <select
                    required
                    value={editTeacherId}
                    onChange={(e) => setEditTeacherId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-black bg-slate-50 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all cursor-pointer"
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
                )}
              </div>

              {/* Term Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Term</label>
                {loadingTerms ? (
                  <p className="text-slate-500 py-2">Loading terms…</p>
                ) : (
                  <select
                    required
                    value={editTermId}
                    onChange={(e) => setEditTermId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-black bg-slate-50 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all cursor-pointer"
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
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ClassDetailsCard
