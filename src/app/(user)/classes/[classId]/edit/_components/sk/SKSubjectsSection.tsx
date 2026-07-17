// File: src/app/(user)/classes/[classId]/edit/_components/sk/SKSubjectsSection.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { getSKSubjects, deleteSKSubject } from '@/services/skService'
import type { SKSubject } from '@/services/types/sk'
import SKSubjectEditModal from '@/components/sk/SKSubjectEditModal'
import SKSubjectAddModal from '@/components/sk/SKSubjectAddModal'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getGradeDisplayName, GradeValue } from '@/lib/schoolUtils'
import Spinner from '@/components/Spinner'
import {
  AcademicCapIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

interface SKSubjectsSectionProps {
  school: string
  grade: GradeValue
}

const SKSubjectsSection: React.FC<SKSubjectsSectionProps> = ({ school, grade }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [skProgressSubjects, setSkProgressSubjects] = useState<SKSubject[]>([])
  const [skReportCardSubjects, setSkReportCardSubjects] = useState<SKSubject[]>([])
  const [skSubjectsLoading, setSkSubjectsLoading] = useState(false)
  const [editingSubject, setEditingSubject] = useState<SKSubject | null>(null)
  const [addSubjectType, setAddSubjectType] = useState<'progress_report' | 'report_card' | null>(null)
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null)

  const refreshSKSubjects = async () => {
    if (!school) return
    setSkSubjectsLoading(true)
    try {
      const [prRes, rcRes] = await Promise.all([
        getSKSubjects('progress_report', school),
        getSKSubjects('report_card', school),
      ])
      const prSubjects = prRes.status === 'success' ? prRes.data : []
      const rcSubjects = rcRes.status === 'success' ? rcRes.data : []
      setSkProgressSubjects(prSubjects)
      setSkReportCardSubjects(rcSubjects)

      if (editingSubject) {
        const allSubjects = [...prSubjects, ...rcSubjects]
        const updated = allSubjects.find(s => s.subjectId === editingSubject.subjectId)
        if (updated) setEditingSubject(updated)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSkSubjectsLoading(false)
    }
  }

  useEffect(() => {
    refreshSKSubjects()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school])

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Delete this subject and all its standards?')) return
    setDeletingSubjectId(subjectId)
    try {
      const res = await deleteSKSubject(subjectId)
      if (res.status === 'success') {
        showNotification('Subject deleted', 'success')
        refreshSKSubjects()
      }
    } catch {
      showNotification('Failed to delete subject', 'error')
    } finally {
      setDeletingSubjectId(null)
    }
  }

  const renderSubjectGroup = (
    subjects: SKSubject[],
    headerBg: string,
    emptyLabel: string
  ) => (
    subjects.length > 0 ? (
      <div className="space-y-3">
        {subjects.map((subject) => (
          <div key={subject.subjectId} className="border border-slate-100 rounded-xl overflow-hidden group">
            <div className={`flex items-center justify-between px-4 py-3 ${headerBg}`}>
              <span className="font-medium text-slate-800 text-sm">{subject.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{subject.standards.length} standards</span>
                <button
                  onClick={() => setEditingSubject(subject)}
                  className="px-2.5 py-1 bg-white text-cyan-600 border border-cyan-200 rounded-lg text-xs font-medium hover:bg-cyan-50 cursor-pointer transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteSubject(subject.subjectId)}
                  disabled={deletingSubjectId === subject.subjectId}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                >
                  {deletingSubjectId === subject.subjectId ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {subject.standards.map((std) => (
                <div key={std.standardId} className="px-4 py-2 text-sm text-slate-600">
                  {std.name}
                </div>
              ))}
              {subject.standards.length === 0 && (
                <div className="px-4 py-3 text-sm text-slate-400 italic">No standards — click Edit to add</div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
        {emptyLabel}
      </div>
    )
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white cursor-pointer hover:from-indigo-600 hover:to-blue-600 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <ClipboardDocumentListIcon className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold">Subjects &amp; Standards</span>
          <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
            {skProgressSubjects.length + skReportCardSubjects.length} subjects
          </span>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 transform transition-transform duration-200 ${
            isCollapsed ? '-rotate-90' : 'rotate-0'
          }`}
        />
      </button>

      {!isCollapsed && (
        <div className="p-6 space-y-6">
          {skSubjectsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            <>
              {/* Info Banner */}
              <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <AcademicCapIcon className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-700">
                  <p className="font-medium mb-1">Curriculum-based grading for {getGradeDisplayName(grade)}</p>
                  <p className="text-indigo-600">SK uses subject-based curriculum standards. To enter ratings for students, open the gradebook.</p>
                </div>
              </div>

              {/* Progress Report Subjects */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    Progress Report Subjects
                    <span className="text-xs font-normal normal-case text-slate-400">(E / G / S / NI / NA)</span>
                  </h3>
                  <button
                    onClick={() => setAddSubjectType('progress_report')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600 cursor-pointer transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Add Subject
                  </button>
                </div>
                {renderSubjectGroup(skProgressSubjects, 'bg-teal-50', 'No progress report subjects yet')}
              </div>

              {/* Report Card Subjects */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Report Card Subjects
                    <span className="text-xs font-normal normal-case text-slate-400">(E / P / DV / EM / NI / NA)</span>
                  </h3>
                  <button
                    onClick={() => setAddSubjectType('report_card')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600 cursor-pointer transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Add Subject
                  </button>
                </div>
                {renderSubjectGroup(skReportCardSubjects, 'bg-indigo-50', 'No report card subjects yet')}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─ SK Subject Edit Modal ─ */}
      {editingSubject && (
        <SKSubjectEditModal
          isOpen={!!editingSubject}
          onClose={() => setEditingSubject(null)}
          subject={editingSubject}
          onUpdate={() => refreshSKSubjects()}
        />
      )}

      {/* ─ SK Subject Add Modal ─ */}
      {addSubjectType && (
        <SKSubjectAddModal
          isOpen={!!addSubjectType}
          onClose={() => setAddSubjectType(null)}
          documentType={addSubjectType}
          school={school}
          currentCount={addSubjectType === 'progress_report' ? skProgressSubjects.length : skReportCardSubjects.length}
          onAdded={() => refreshSKSubjects()}
        />
      )}
    </div>
  )
}

export default SKSubjectsSection
