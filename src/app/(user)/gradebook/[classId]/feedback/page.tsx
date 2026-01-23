'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'

import { getClassById, getStudentsInClass } from '@/services/classService'
import { getClassReportCardFeedback, upsertBulkReportCardFeedback } from '@/services/reportCardService'
import { getTermsBySchool } from '@/services/termService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

import type { ClassPayload } from '@/services/types/class'
import type { StudentPayload } from '@/services/types/student'
import type { TermPayload } from '@/services/types/term'
import type { ClassFeedbackEntry, ReportCardFeedbackPayload } from '@/services/types/reportCard'

import {
  UserGroupIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  SparklesIcon
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

interface EditedFeedback {
  workHabits?: string
  behavior?: string
  comment?: string
}

const BulkFeedbackPage = () => {
  const { classId } = useParams() as { classId: string }
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const user = useUserStore((s) => s.user)

  // Data state
  const [classData, setClassData] = useState<ClassPayload | null>(null)
  const [students, setStudents] = useState<StudentPayload[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')

  // Feedback state: Map of studentId -> feedback data
  const [existingFeedback, setExistingFeedback] = useState<Map<string, ClassFeedbackEntry>>(new Map())
  const [editedFeedback, setEditedFeedback] = useState<Map<string, EditedFeedback>>(new Map())

  // UI state
  const [loading, setLoading] = useState(true)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatingAI, setGeneratingAI] = useState<Set<string>>(new Set())

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = editedFeedback.size > 0

  // Calculate progress
  const calculateProgress = () => {
    let completed = 0
    students.forEach((stu) => {
      const existing = existingFeedback.get(stu.studentId)
      const edited = editedFeedback.get(stu.studentId)

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

  // Initial data load
  useEffect(() => {
    if (!classId || !user?.school) return

    setLoading(true)
    setError(null)

    Promise.all([
      getClassById(classId),
      getStudentsInClass(classId),
      getTermsBySchool(user.school),
    ])
      .then(([classRes, stuRes, termRes]) => {
        if (classRes.status !== 'success') {
          throw new Error(classRes.message || 'Failed to load class info')
        }
        setClassData(classRes.data)

        if (stuRes.status !== 'success') {
          throw new Error(stuRes.message || 'Failed to load students')
        }
        setStudents(stuRes.data)

        if (termRes.status !== 'success') {
          throw new Error('Failed to load terms')
        }
        setTerms(termRes.data)

        // Set default term to active term
        if (user.activeTerm) {
          setSelectedTerm(user.activeTerm)
        } else {
          const activeTerm = termRes.data.find((t: TermPayload) => t.isActive)
          if (activeTerm) {
            setSelectedTerm(activeTerm.name)
          } else if (termRes.data.length > 0) {
            setSelectedTerm(termRes.data[0].name)
          }
        }
      })
      .catch((err) => {
        console.error(err)
        setError(err.message || 'Failed to load data')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [classId, user?.school, user?.activeTerm])

  // Load feedback when term changes
  useEffect(() => {
    if (!classId || !selectedTerm) return

    setLoadingFeedback(true)
    // Clear edited feedback when changing terms
    setEditedFeedback(new Map())

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

  // Warn about unsaved changes on navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved feedback changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    const handlePopState = () => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm('You have unsaved feedback changes. Are you sure you want to leave?')
        if (!confirmLeave) {
          window.history.pushState(null, '', window.location.href)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    if (hasUnsavedChanges) {
      window.history.pushState(null, '', window.location.href)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasUnsavedChanges])

  // Get the current value for a field (edited or existing)
  const getFieldValue = (studentId: string, field: FeedbackField): string => {
    const edited = editedFeedback.get(studentId)
    if (edited && edited[field] !== undefined) {
      return edited[field] || ''
    }
    const existing = existingFeedback.get(studentId)
    return existing?.[field] || ''
  }

  // Check if a field has been edited
  const isFieldEdited = (studentId: string, field: FeedbackField): boolean => {
    const edited = editedFeedback.get(studentId)
    return edited !== undefined && edited[field] !== undefined
  }

  // Handle field change
  const handleFieldChange = (studentId: string, field: FeedbackField, value: string) => {
    setEditedFeedback((prev) => {
      const updated = new Map(prev)
      const existing = updated.get(studentId) || {}
      updated.set(studentId, { ...existing, [field]: value })
      return updated
    })
  }

  // Save all changes
  const handleSaveAll = async () => {
    if (!selectedTerm || editedFeedback.size === 0) return

    setSaving(true)

    // Build array of all feedback entries to save
    const feedbackEntries: ReportCardFeedbackPayload[] = []

    editedFeedback.forEach((edited, studentId) => {
      const existing = existingFeedback.get(studentId)
      feedbackEntries.push({
        studentId,
        classId,
        term: selectedTerm,
        workHabits: edited.workHabits !== undefined ? edited.workHabits : existing?.workHabits ?? undefined,
        behavior: edited.behavior !== undefined ? edited.behavior : existing?.behavior ?? undefined,
        comment: edited.comment !== undefined ? edited.comment : existing?.comment ?? undefined,
      })
    })

    try {
      const res = await upsertBulkReportCardFeedback(feedbackEntries)

      if (res.status === 'success') {
        showNotification(`Saved feedback for ${res.data.updated} students`, 'success')

        // Move all edited data to existing
        setExistingFeedback((prev) => {
          const updated = new Map(prev)
          editedFeedback.forEach((edited, studentId) => {
            const current = updated.get(studentId) || {
              studentId,
              studentName: students.find(s => s.studentId === studentId)?.name || '',
              classId,
              term: selectedTerm,
              workHabits: null,
              behavior: null,
              comment: null,
            }
            updated.set(studentId, {
              ...current,
              workHabits: edited.workHabits !== undefined ? edited.workHabits : current.workHabits,
              behavior: edited.behavior !== undefined ? edited.behavior : current.behavior,
              comment: edited.comment !== undefined ? edited.comment : current.comment,
            })
          })
          return updated
        })

        // Clear edited state
        setEditedFeedback(new Map())
      } else {
        showNotification(res.message || 'Failed to save feedback', 'error')
      }
    } catch (err) {
      console.error('Save all failed:', err)
      showNotification('Failed to save feedback', 'error')
    } finally {
      setSaving(false)
    }
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

  // Handle back button with unsaved changes check
  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved feedback changes. Are you sure you want to leave?')
      if (!confirmLeave) return
    }
    router.push(`/gradebook/${classId}`)
  }

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="flex justify-center items-center py-32">
            <Spinner size="lg" />
          </div>
        </main>
      </>
    )
  }

  // Error state
  if (error) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Page</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/gradebook')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium cursor-pointer"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Gradebook
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!classData) return null

  const { completed, total } = calculateProgress()
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl shadow-lg p-6 lg:p-8 text-white mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <button
                  onClick={handleBackClick}
                  className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-2 cursor-pointer"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Gradebook
                </button>
                <h1 className="text-2xl lg:text-3xl font-bold">
                  Report Card Feedback
                </h1>
                <p className="text-white/80 mt-1">
                  Grade {classData.grade} - {classData.subject}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Term Selector */}
                <select
                  value={selectedTerm}
                  onChange={(e) => {
                    if (hasUnsavedChanges) {
                      const confirmChange = window.confirm('You have unsaved changes. Changing term will discard them. Continue?')
                      if (!confirmChange) return
                    }
                    setSelectedTerm(e.target.value)
                  }}
                  className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
                >
                  {terms.map((t) => (
                    <option key={t.termId} value={t.name} className="text-slate-900">
                      {t.name} ({t.academicYear})
                      {t.isActive ? ' - Active' : ''}
                    </option>
                  ))}
                </select>

                {/* Save Button */}
                <button
                  onClick={handleSaveAll}
                  disabled={saving || editedFeedback.size === 0}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm cursor-pointer ${
                    saving || editedFeedback.size === 0
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : 'bg-white text-cyan-600 hover:bg-white/90 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save All'}
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
                    <p className="text-2xl font-bold text-white">{editedFeedback.size}</p>
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
                          const hasEdits = editedFeedback.has(stu.studentId)
                          const isGenerating = generatingAI.has(stu.studentId)
                          const workHabitsValue = getFieldValue(stu.studentId, 'workHabits')
                          const behaviorValue = getFieldValue(stu.studentId, 'behavior')

                          return (
                            <tr
                              key={stu.studentId}
                              className={`hover:bg-slate-50/50 transition-colors ${
                                hasEdits ? 'bg-amber-50/30' : ''
                              }`}
                            >
                              {/* Student Name */}
                              <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-900">
                                    {stu.name}
                                  </span>
                                  {hasEdits && (
                                    <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
                                  )}
                                </div>
                              </td>

                              {/* Work Habits Dropdown */}
                              <td className="px-3 py-2">
                                <select
                                  value={workHabitsValue}
                                  onChange={(e) => handleFieldChange(stu.studentId, 'workHabits', e.target.value)}
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
                                    placeholder="Enter comment or use AI to generate..."
                                    rows={4}
                                    className={`flex-1 px-3 py-2 text-sm border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${
                                      isFieldEdited(stu.studentId, 'comment')
                                        ? 'border-amber-300 bg-amber-50/50'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                  />
                                  <button
                                    onClick={() => handleGenerateAIComment(stu.studentId, stu.name)}
                                    disabled={isGenerating || !workHabitsValue || !behaviorValue}
                                    title={
                                      !workHabitsValue || !behaviorValue
                                        ? 'Generate with AI is only available when both Work Habits and Behavior are selected'
                                        : 'Generate comment with AI based on ratings'
                                    }
                                    className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
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

          {/* Unsaved changes sticky bar */}
          {hasUnsavedChanges && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-30">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 px-4 py-3 flex items-center gap-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{editedFeedback.size} unsaved changes</span>
                </div>
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save All'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default BulkFeedbackPage
