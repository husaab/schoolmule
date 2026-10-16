// src/components/gradebook/workspace/ReportCardCommentsWorkspace.tsx
// Grades → Report card comments on the class page (it was
// /gradebook/[classId]/feedback). The report card ratings and comment of every
// student for the class's own term, with AI-assisted comments. The grades
// under each name come from the Scores sub-tab (bulkFeedbackGrades).
// Ratings and comments autosave (D17, useCommentAutosave): a second after the
// teacher stops, at once on leaving a field, and on every way out of the tab,
// with the same bulk payloads Save All sends (Save All is now a manual flush).
'use client'

import React, { useState, useEffect } from 'react'
import Spinner from '@/components/Spinner'

import { getStudentsInClass } from '@/services/classService'
import { getClassReportCardFeedback } from '@/services/reportCardService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'

import type { ClassPayload } from '@/services/types/class'
import type { StudentPayload } from '@/services/types/student'
import { gradeBand, readStoredGrades, type StoredGrades } from '@/lib/bulkFeedbackGrades'
import { formatCoverage } from '@/lib/gradeEngine'
import type { GradesSub } from '@/lib/classroomRoutes'
import type { ClassFeedbackEntry } from '@/services/types/reportCard'
import { useCommentAutosave } from '@/hooks/useCommentAutosave'
import { feedbackEntry, REPORT_CARD_FIELDS, withFeedbackField, type FeedbackEntry } from '@/lib/commentAutosave'

import {
  UserGroupIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

// Rating options for Work Habits and Behavior
const RATING_OPTIONS = [
  { value: '', label: 'Select rating' },
  { value: 'E', label: 'E - Excellent' },
  { value: 'G', label: 'G - Good' },
  { value: 'S', label: 'S - Satisfactory' },
  { value: 'N', label: 'N - Needs Improvement' },
]

type FeedbackField = 'workHabits' | 'behavior' | 'comment'


interface ReportCardCommentsWorkspaceProps {
  classId: string
  classData: ClassPayload
  /** Opens another Grades sub-tab (the "progress report" link). */
  onOpenSub?: (sub: GradesSub) => void
}

export default function ReportCardCommentsWorkspace({ classId, classData, onOpenSub }: ReportCardCommentsWorkspaceProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  // A class belongs to exactly one term: comments are always entered for it.
  const selectedTerm = classData.termName ?? ''

  // Data state
  const [students, setStudents] = useState<StudentPayload[]>([])

  // Feedback state: Map of studentId -> feedback data
  const [existingFeedback, setExistingFeedback] = useState<Map<string, ClassFeedbackEntry>>(new Map())

  // UI state
  const [loading, setLoading] = useState(true)
  // Nothing to load for a class without a term (it shows a note instead).
  const [loadingFeedback, setLoadingFeedback] = useState(() => Boolean(classData.termName))
  const [error, setError] = useState<string | null>(null)
  const [generatingAI, setGeneratingAI] = useState<Set<string>>(new Set())

  // Student grades from localStorage (computed in the gradebook by the grade
  // engine). pct is null when nothing has been graded yet — never 0.
  const [studentGrades] = useState<StoredGrades>(() => readStoredGrades(classId))

  // Autosave: latest wins per student; a failed save keeps the text and the
  // Grades toolbar's pill offers Retry. Saved entries fold into the saved
  // comments, as Save All did.
  const comments = useCommentAutosave({
    classId,
    kind: 'report',
    onSaved: (entries) =>
      setExistingFeedback((prev) => {
        const updated = new Map(prev)
        for (const entry of entries) {
          const current: ClassFeedbackEntry = updated.get(entry.studentId) || {
            studentId: entry.studentId,
            studentName: students.find((s) => s.studentId === entry.studentId)?.name || '',
            classId,
            term: selectedTerm,
            workHabits: null,
            behavior: null,
            comment: null,
          }
          const next = { ...current }
          for (const field of REPORT_CARD_FIELDS) if (entry[field] !== undefined) next[field] = entry[field] as string
          updated.set(entry.studentId, next)
        }
        return updated
      }),
  })
  const hasUnsavedChanges = comments.unsavedCount > 0

  // Calculate progress
  const calculateProgress = () => {
    let completed = 0
    students.forEach((stu) => {
      const existing = existingFeedback.get(stu.studentId)
      const edited = comments.entryFor(stu.studentId)

      const workHabits = edited?.workHabits ?? existing?.workHabits
      const behavior = edited?.behavior ?? existing?.behavior
      const comment = edited?.comment ?? existing?.comment

      // Consider complete if all fields are filled
      if (workHabits && behavior && comment) {
        completed++
      }
    })
    return { completed, total: students.length }
  }

  // Initial data load (the class itself comes from the Grades tab)
  useEffect(() => {
    if (!classId || !user?.school) return

    getStudentsInClass(classId)
      .then((stuRes) => {
        if (stuRes.status !== 'success') {
          throw new Error(stuRes.message || 'Failed to load students')
        }
        setStudents(stuRes.data)

      })
      .catch((err) => {
        console.error(err)
        setError(err.message || 'Failed to load data')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [classId, user?.school, selectedYearId]) // refetch when the selected school year changes

  // Load feedback when term changes
  useEffect(() => {
    if (!classId || !selectedTerm) return

    getClassReportCardFeedback(classId, selectedTerm)
      .then((res) => {
        if (res.status === 'success') {
          const feedbackMap = new Map<string, ClassFeedbackEntry>()
          res.data.forEach((entry) => {
            feedbackMap.set(entry.studentId, entry)
          })
          setExistingFeedback(feedbackMap)
        }
      })
      .catch((err) => {
        console.error('Error loading feedback:', err)
      })
      .finally(() => {
        setLoadingFeedback(false)
      })
  }, [classId, selectedTerm])

  // The student's entry as saved (what Save All sent for an untouched field).
  const savedEntry = (studentId: string): FeedbackEntry<FeedbackField> =>
    feedbackEntry({ studentId, classId, term: selectedTerm }, REPORT_CARD_FIELDS, existingFeedback.get(studentId))

  // Get the current value for a field (not yet saved, else saved)
  const getFieldValue = (studentId: string, field: FeedbackField): string => {
    const local = comments.entryFor(studentId)
    if (local) return local[field] ?? ''
    const existing = existingFeedback.get(studentId)
    return existing?.[field] || ''
  }

  // A field whose new value is not saved yet
  const isFieldEdited = (studentId: string, field: FeedbackField): boolean => {
    const local = comments.entryFor(studentId)
    return local !== null && (local[field] ?? '') !== (existingFeedback.get(studentId)?.[field] ?? '')
  }

  // Queue the student's whole entry (the class needs a term to save anything)
  const handleFieldChange = (studentId: string, field: FeedbackField, value: string) => {
    if (!selectedTerm) return
    const saved = savedEntry(studentId)
    comments.queue(studentId, withFeedbackField(comments.entryFor(studentId) ?? saved, field, value), saved)
  }

  // Save All: send whatever has not saved yet, now
  const handleSaveAll = () => {
    void comments.flush()
  }

  // Generate AI comment for a student
  const handleGenerateAIComment = async (studentId: string, studentName: string) => {
    const workHabits = getFieldValue(studentId, 'workHabits')
    const behavior = getFieldValue(studentId, 'behavior')

    if (!workHabits || !behavior) {
      showNotification('Please select Work Habits and Behavior ratings first', 'error')
      return
    }

    setGeneratingAI((prev) => new Set(prev).add(studentId))

    // undefined: the gradebook never handed us this student's grade (direct
    // visit, other device), so say nothing about it. null: the gradebook
    // confirmed nothing is graded yet, and the route tells the model so.
    const stored = studentGrades[studentId]
    const grade = stored ? stored.pct : undefined
    const coverage = stored?.coverage ?? undefined

    try {
      const response = await fetch('/api/ai/generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          subject: classData?.subject || 'this class',
          workHabits,
          behavior,
          term: selectedTerm,
          grade,
          coverage,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate comment')
      }

      const data = await response.json()

      if (data.comment) {
        handleFieldChange(studentId, 'comment', data.comment)
        showNotification('Comment generated successfully', 'success')
      } else {
        throw new Error('No comment returned')
      }
    } catch (err) {
      console.error('AI generation failed:', err)
      showNotification('Failed to generate comment. Please try again.', 'error')
    } finally {
      setGeneratingAI((prev) => {
        const updated = new Set(prev)
        updated.delete(studentId)
        return updated
      })
    }
  }

  // Open the progress report comments (the Grades tab checks for unsaved changes)
  const navigateToProgressReportFeedback = () => onOpenSub?.('progress-comments')

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Page</h3>
          <p className="text-red-600 mb-6">{error}</p>
        </div>
    )
  }

  const { completed, total } = calculateProgress()
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <>
        <div>
          {/* Header */}
          <div className="bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl shadow-lg p-6 lg:p-8 text-white mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">
                  Report card comments
                </h2>
                <p className="text-white/80 mt-1">
                  Grade {classData.grade} - {classData.subject}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Term — fixed to the class's term (feedback is always for this term) */}
                <div
                  className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white"
                  title="Feedback is saved for this class's term"
                >
                  {classData.termName}
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveAll}
                  disabled={comments.status === 'saved'}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm cursor-pointer ${
                    comments.status === 'saved'
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : 'bg-white text-cyan-600 hover:bg-white/90 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {comments.status === 'saving' ? 'Saving…' : 'Save All'}
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{students.length}</p>
                    <p className="text-xs text-white/70">Students</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{completed}/{total}</p>
                    <p className="text-xs text-white/70">Completed</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{progressPercent}%</p>
                    <p className="text-xs text-white/70">Progress</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    hasUnsavedChanges ? 'bg-amber-400/30' : 'bg-white/20'
                  }`}>
                    <CheckCircleIcon className={`w-5 h-5 ${
                      hasUnsavedChanges ? 'text-amber-200' : 'text-white/70'
                    }`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{comments.unsavedCount}</p>
                    <p className="text-xs text-white/70">Unsaved</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Destination Disclaimer Banner */}
          <div className="mb-6 rounded-2xl bg-cyan-50 border border-cyan-200 p-5">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-6 w-6 text-cyan-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-cyan-900">
                  This page is for report cards
                </h3>
                <p className="text-sm text-cyan-800/80 mt-1">
                  Everything entered here appears on students&apos; <span className="font-semibold">report card</span> PDFs.
                  Looking to enter progress report feedback instead?
                </p>
                <button
                  onClick={navigateToProgressReportFeedback}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  Go to Progress report comments
                  <span aria-hidden>&rarr;</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Feature Info Banner */}
          <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 border border-purple-200/40 p-5">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-300/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-fuchsia-300/20 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

            <div className="relative flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-200/50">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-purple-900 mb-1.5 flex items-center gap-2">
                  AI-Powered Comment Generation
                </h3>
                <p className="text-sm text-purple-800/70 leading-relaxed max-w-3xl">
                  Click the <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 rounded text-purple-700 font-medium text-xs"><SparklesIcon className="w-3 h-3" />sparkle</span> button next to each comment field to generate personalized feedback.
                  The AI combines <span className="font-medium text-purple-800">Work Habits</span>, <span className="font-medium text-purple-800">Behavior</span> ratings, and the student&apos;s <span className="font-medium text-purple-800">current grade</span> to craft appropriate comments.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-purple-600/80">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Select both ratings first</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Grades shown under each name</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Edit generated text as needed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!selectedTerm && (

            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">

              This class has no term yet, so comments can&apos;t be saved. Set its term in the class&apos;s Settings.

            </div>

          )}

          {/* Feedback Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {loadingFeedback ? (
              <div className="flex justify-center items-center py-16">
                <Spinner size="md" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[180px]">
                        Student Name
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-700 min-w-[160px]">
                        Work Habits
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-700 min-w-[160px]">
                        Behavior
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-700 min-w-[400px]">
                        <div className="flex items-center gap-2">
                          <span>Comment</span>
                          <span className="text-xs text-slate-400 font-normal">(AI-assisted)</span>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                            <UserGroupIcon className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Students Enrolled</h3>
                          <p className="text-sm text-slate-500">No students are currently enrolled in this class.</p>
                        </td>
                      </tr>
                    ) : (
                      students
                        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
                        .map((stu) => {
                          const hasEdits = comments.entryFor(stu.studentId) !== null
                          const saveFailed = comments.failedKeys.has(stu.studentId)
                          const isGenerating = generatingAI.has(stu.studentId)
                          const workHabitsValue = getFieldValue(stu.studentId, 'workHabits')
                          const behaviorValue = getFieldValue(stu.studentId, 'behavior')

                          return (
                            <tr
                              key={stu.studentId}
                              className={`hover:bg-slate-50/50 transition-colors ${
                                saveFailed ? 'bg-rose-50/40' : hasEdits ? 'bg-amber-50/30' : ''
                              }`}
                            >
                              {/* Student Name */}
                              <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-slate-100">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900">
                                      {stu.name}
                                    </span>
                                    {hasEdits && (
                                      <span
                                        className={`w-2 h-2 rounded-full ${saveFailed ? 'bg-rose-500' : 'bg-amber-400'}`}
                                        title={saveFailed ? "Didn't save. Use Retry above." : 'Saving…'}
                                      />
                                    )}
                                  </div>
                                  {/* Grade Display */}
                                  <div className="mt-0.5">
                                    {studentGrades[stu.studentId]?.pct != null ? (
                                      <>
                                        <span className={`text-xs font-medium ${gradeBand(studentGrades[stu.studentId].pct).color}`}>
                                          {(studentGrades[stu.studentId].pct as number).toFixed(1)}%
                                        </span>
                                        {studentGrades[stu.studentId].coverage && (
                                          <span className="block text-[10px] text-slate-400 tabular-nums">
                                            {formatCoverage(studentGrades[stu.studentId].coverage)}
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-xs text-slate-400">No grades yet</span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Work Habits Dropdown */}
                              <td className="px-3 py-2">
                                <select
                                  value={workHabitsValue}
                                  onChange={(e) => handleFieldChange(stu.studentId, 'workHabits', e.target.value)}
                                  onBlur={() => void comments.flush()}
                                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent cursor-pointer ${
                                    isFieldEdited(stu.studentId, 'workHabits')
                                      ? 'border-amber-300 bg-amber-50/50'
                                      : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {RATING_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Behavior Dropdown */}
                              <td className="px-3 py-2">
                                <select
                                  value={behaviorValue}
                                  onChange={(e) => handleFieldChange(stu.studentId, 'behavior', e.target.value)}
                                  onBlur={() => void comments.flush()}
                                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent cursor-pointer ${
                                    isFieldEdited(stu.studentId, 'behavior')
                                      ? 'border-amber-300 bg-amber-50/50'
                                      : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {RATING_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Comment with AI Generate Button */}
                              <td className="px-3 py-2">
                                <div className="flex gap-2">
                                  <textarea
                                    value={getFieldValue(stu.studentId, 'comment')}
                                    onChange={(e) => handleFieldChange(stu.studentId, 'comment', e.target.value)}
                                    onBlur={() => void comments.flush()}
                                    placeholder="Enter comment or use AI to generate..."
                                    rows={4}
                                    className={`flex-1 px-3 py-2 text-sm border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${
                                      isFieldEdited(stu.studentId, 'comment')
                                        ? 'border-amber-300 bg-amber-50/50'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                  />
                                  {/* AI Generate Button with Tooltip */}
                                  <div className="relative group/ai flex-shrink-0">
                                    <button
                                      onClick={() => handleGenerateAIComment(stu.studentId, stu.name)}
                                      disabled={isGenerating || !workHabitsValue || !behaviorValue}
                                      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                                        isGenerating
                                          ? 'bg-purple-100 text-purple-400'
                                          : !workHabitsValue || !behaviorValue
                                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                      }`}
                                    >
                                      {isGenerating ? (
                                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <SparklesIcon className="w-5 h-5" />
                                      )}
                                    </button>
                                    {/* Tooltip - shows when button is disabled */}
                                    {(!workHabitsValue || !behaviorValue) && (
                                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover/ai:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                        <div className="flex items-center gap-1.5">
                                          <InformationCircleIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                          <span>Please select Work Habits and Behavior first to generate AI comments</span>
                                        </div>
                                        {/* Tooltip arrow */}
                                        <div className="absolute top-full right-3 border-4 border-transparent border-t-slate-800" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
    </>
  )
}
