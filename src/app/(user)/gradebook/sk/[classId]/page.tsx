'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getClassById, getStudentsInClass } from '@/services/classService'
import {
  getSKSubjects,
  getSKAssessments,
  bulkUpsertSKAssessments,
  getSKSubjectComments,
  bulkUpsertSKSubjectComments,
  getSKTeacherAssistant,
  upsertSKTeacherAssistant,
  getSKProgressReportComments,
  bulkUpsertSKProgressReportComments,
} from '@/services/skService'
import type { ClassPayload } from '@/services/types/class'
import type { StudentPayload } from '@/services/types/student'
import type { SKSubject } from '@/services/types/sk'
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import Link from 'next/link'

// Rating options for each document type
const SK_PROGRESS_REPORT_RATINGS = [
  { value: '', label: '\u2014' },
  { value: 'E', label: 'E' },
  { value: 'G', label: 'G' },
  { value: 'S', label: 'S' },
  { value: 'NI', label: 'NI' },
  { value: 'NA', label: 'NA' },
]

const SK_REPORT_CARD_RATINGS = [
  { value: '', label: '\u2014' },
  { value: 'E', label: 'E' },
  { value: 'P', label: 'P' },
  { value: 'DV', label: 'DV' },
  { value: 'EM', label: 'EM' },
  { value: 'NI', label: 'NI' },
  { value: 'N/A', label: 'N/A' },
]

type TabType = 'progress_report' | 'report_card'

const SKGradebook = () => {
  const { classId } = useParams() as { classId: string }
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)

  // Core data
  const [classData, setClassData] = useState<ClassPayload | null>(null)
  const [students, setStudents] = useState<StudentPayload[]>([])
  const [subjects, setSubjects] = useState<SKSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Selection state
  const [activeTab, setActiveTab] = useState<TabType>('progress_report')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  // Rating state: standardId -> rating
  const [ratings, setRatings] = useState<Record<string, string>>({})
  // Subject comments: subjectId -> comment
  const [subjectComments, setSubjectComments] = useState<Record<string, string>>({})
  // Teacher assistant
  const [teacherAssistant, setTeacherAssistant] = useState('')
  // Progress report comments: sectionType -> comment
  const [progressComments, setProgressComments] = useState<Record<string, string>>({})

  // AI generation state
  const [generatingAI, setGeneratingAI] = useState<Set<string>>(new Set())
  const [generatingAllAI, setGeneratingAllAI] = useState(false)

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false)

  const term = classData?.termName || ''

  // Load class and students on mount
  useEffect(() => {
    if (!classId) return

    setLoading(true)
    Promise.all([getClassById(classId), getStudentsInClass(classId)])
      .then(([classRes, stuRes]) => {
        if (classRes.status === 'success') setClassData(classRes.data)
        if (stuRes.status === 'success') {
          setStudents(stuRes.data)
          if (stuRes.data.length > 0) {
            setSelectedStudentId(stuRes.data[0].studentId)
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [classId])

  // Load subjects when tab changes
  useEffect(() => {
    if (!user?.school) return
    getSKSubjects(activeTab, user.school)
      .then((res) => {
        if (res.status === 'success') setSubjects(res.data)
      })
      .catch(console.error)
  }, [activeTab, user?.school])

  // Load student data when student or tab changes
  const loadStudentData = useCallback(async () => {
    if (!selectedStudentId || !term) return

    try {
      // Clear stale state before loading new data
      setRatings({})
      setSubjectComments({})
      setProgressComments({})

      // Load standard assessments
      const assessRes = await getSKAssessments(selectedStudentId, term, activeTab)
      if (assessRes.status === 'success') {
        const map: Record<string, string> = {}
        assessRes.data.forEach((a) => {
          if (a.rating) map[a.standardId] = a.rating
        })
        setRatings(map)
      }

      // For report card tab, also load subject comments and TA
      if (activeTab === 'report_card') {
        const [commentsRes, taRes] = await Promise.all([
          getSKSubjectComments(selectedStudentId, term),
          getSKTeacherAssistant(selectedStudentId, term),
        ])

        if (commentsRes.status === 'success') {
          const cmap: Record<string, string> = {}
          commentsRes.data.forEach((c) => {
            if (c.comment) cmap[c.subjectId] = c.comment
          })
          setSubjectComments(cmap)
        }

        if (taRes.status === 'success' && taRes.data) {
          setTeacherAssistant(taRes.data.teacherAssistantName || '')
        } else {
          setTeacherAssistant('')
        }
      }

      // For progress report tab, load subject comments and progress report comments
      if (activeTab === 'progress_report') {
        const [commentsRes, prCommentsRes] = await Promise.all([
          getSKSubjectComments(selectedStudentId, term),
          getSKProgressReportComments(selectedStudentId, term).catch(() => ({ status: 'error', data: [] })),
        ])

        if (commentsRes.status === 'success') {
          const cmap: Record<string, string> = {}
          commentsRes.data.forEach((c) => {
            if (c.comment) cmap[c.subjectId] = c.comment
          })
          setSubjectComments(cmap)
        }

        if (prCommentsRes.status === 'success') {
          const pmap: Record<string, string> = {}
          prCommentsRes.data.forEach((c) => {
            if (c.comment) pmap[c.sectionType] = c.comment
          })
          setProgressComments(pmap)
        }
      }

      setHasChanges(false)
    } catch (err) {
      console.error('Error loading student data:', err)
    }
  }, [selectedStudentId, term, activeTab])

  useEffect(() => {
    loadStudentData()
  }, [loadStudentData])

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  // Handlers
  const handleRatingChange = (standardId: string, value: string) => {
    setRatings((prev) => ({ ...prev, [standardId]: value }))
    setHasChanges(true)
  }

  const handleSubjectCommentChange = (subjectId: string, value: string) => {
    setSubjectComments((prev) => ({ ...prev, [subjectId]: value }))
    setHasChanges(true)
  }

  const handleProgressCommentChange = (sectionType: string, value: string) => {
    setProgressComments((prev) => ({ ...prev, [sectionType]: value }))
    setHasChanges(true)
  }

  // Generate AI comment for a single subject or section
  const handleGenerateAIComment = async (
    key: string,
    subjectName: string,
    standardsForPrompt: Array<{ name: string; rating: string; description?: string }>
  ) => {
    if (!selectedStudent) return

    const ratedStandards = standardsForPrompt.filter((s) => s.rating && s.rating !== '')
    if (ratedStandards.length === 0) {
      showNotification('Please rate at least one standard before generating a comment', 'error')
      return
    }

    setGeneratingAI((prev) => new Set(prev).add(key))
    try {
      const response = await fetch('/api/ai/generate-jksk-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedStudent.name,
          domainName: subjectName,
          skills: ratedStandards,
          ratingScale: activeTab === 'progress_report' ? 'EGSNINA' : 'EPDVEMNI',
          gradeLevel: 'SK',
          documentType: activeTab,
          term: term || 'Current Term',
        }),
      })

      if (!response.ok) throw new Error('Failed to generate comment')

      const data = await response.json()
      if (data.comment) {
        if (activeTab === 'report_card') {
          handleSubjectCommentChange(key, data.comment)
        } else {
          // For progress report, subject comments use subjectId key
          handleSubjectCommentChange(key, data.comment)
        }
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
        updated.delete(key)
        return updated
      })
    }
  }

  // Generate AI comments for all subjects at once
  const handleGenerateAllComments = async () => {
    if (!selectedStudent) return

    setGeneratingAllAI(true)

    // Generate for each subject that has ratings
    const subjectPromises = subjects
      .filter((subject) => subject.standards.some((s) => ratings[s.standardId]))
      .map((subject) => {
        const standardsForPrompt = subject.standards
          .filter((s) => ratings[s.standardId])
          .map((s) => ({
            name: s.name,
            rating: ratings[s.standardId],
            description: s.description || undefined,
          }))
        return handleGenerateAIComment(subject.subjectId, subject.name, standardsForPrompt)
      })

    await Promise.allSettled(subjectPromises)

    setGeneratingAllAI(false)
  }

  const handleSave = async () => {
    if (!selectedStudentId || !user?.school) return

    setSaving(true)
    try {
      // Save standard assessments
      const assessmentEntries = Object.entries(ratings)
        .filter(([, val]) => val !== '')
        .map(([standardId, rating]) => ({
          studentId: selectedStudentId,
          standardId,
          term,
          rating,
          school: user.school!,
          assessedBy: user.id,
        }))

      if (assessmentEntries.length > 0) {
        await bulkUpsertSKAssessments(assessmentEntries)
      }

      // Save subject comments (both tabs use per-subject comments)
      const commentEntries = Object.entries(subjectComments)
        .filter(([, val]) => val && val.trim() !== '')
        .map(([subjectId, comment]) => ({
          studentId: selectedStudentId,
          subjectId,
          term,
          comment,
          school: user.school!,
        }))

      if (commentEntries.length > 0) {
        await bulkUpsertSKSubjectComments(commentEntries)
      }

      // For progress report, also save progress report comments
      if (activeTab === 'progress_report') {
        const prCommentEntries = Object.entries(progressComments)
          .filter(([, val]) => val && val.trim() !== '')
          .map(([sectionType, comment]) => ({
            studentId: selectedStudentId,
            term,
            sectionType: sectionType as 'academic_achievement' | 'socio_emotional',
            comment,
            school: user.school!,
          }))

        if (prCommentEntries.length > 0) {
          await bulkUpsertSKProgressReportComments(prCommentEntries)
        }
      }

      // For report card, also save TA
      if (activeTab === 'report_card') {
        if (teacherAssistant !== undefined) {
          await upsertSKTeacherAssistant({
            studentId: selectedStudentId,
            teacherAssistantName: teacherAssistant || null,
            term,
            school: user.school!,
          })
        }
      }

      setHasChanges(false)
      showNotification('Saved successfully', 'success')
    } catch (err) {
      console.error('Error saving:', err)
      showNotification('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleStudentSwitch = async (studentId: string) => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Switch student without saving?')
      if (!confirmed) return
    }
    setSelectedStudentId(studentId)
  }

  const handleTabChange = (tab: TabType) => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Switch tab without saving?')
      if (!confirmed) return
    }
    setActiveTab(tab)
  }

  const ratingOptions =
    activeTab === 'progress_report' ? SK_PROGRESS_REPORT_RATINGS : SK_REPORT_CARD_RATINGS
  const selectedStudent = students.find((s) => s.studentId === selectedStudentId)

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50 flex items-center justify-center">
          <Spinner size="lg" />
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/gradebook"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Gradebook
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {classData?.subject || 'Senior Kindergarten'}
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  {classData?.teacherName} &middot; {term}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <span className="text-amber-600 text-sm font-medium">Unsaved changes</span>
                )}
                {selectedStudentId && (
                  <button
                    onClick={handleGenerateAllComments}
                    disabled={generatingAllAI || generatingAI.size > 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <SparklesIcon
                      className={`w-4 h-4 ${generatingAllAI ? 'animate-pulse' : ''}`}
                    />
                    {generatingAllAI ? 'Generating...' : 'Generate All AI Comments'}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {saving ? <Spinner size="sm" /> : <CheckCircleIcon className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => handleTabChange('progress_report')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'progress_report'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              Progress Report (E/G/S/NI/NA)
            </button>
            <button
              onClick={() => handleTabChange('report_card')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'report_card'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <DocumentTextIcon className="w-4 h-4" />
              Report Card (E/P/DV/EM/NI/N/A)
            </button>
          </div>

          <div className="flex gap-6">
            {/* Student Sidebar */}
            <div className="w-56 flex-shrink-0">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm sticky top-28">
                <div className="p-3 border-b border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Students ({students.length})
                  </h3>
                </div>
                <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
                  {students.map((stu) => (
                    <button
                      key={stu.studentId}
                      onClick={() => handleStudentSwitch(stu.studentId)}
                      className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                        selectedStudentId === stu.studentId
                          ? 'bg-emerald-50 text-emerald-700 font-medium border-r-2 border-emerald-500'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <UserIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{stu.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {!selectedStudentId ? (
                <div className="text-center py-12 text-slate-500">
                  Select a student to begin assessment
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sticky: Student Header + Legend */}
                  <div className="sticky top-20 z-10 space-y-2">
                    {/* Student Header */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{selectedStudent?.name}</p>
                        <p className="text-xs text-slate-500">
                          OEN: {selectedStudent?.oen || 'N/A'} &middot; Senior Kindergarten
                        </p>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Scale
                        </span>
                        {activeTab === 'progress_report' ? (
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-emerald-50 rounded text-emerald-700">
                              <strong>E</strong> Excellent
                            </span>
                            <span className="px-2 py-0.5 bg-blue-50 rounded text-blue-700">
                              <strong>G</strong> Good
                            </span>
                            <span className="px-2 py-0.5 bg-amber-50 rounded text-amber-700">
                              <strong>S</strong> Satisfactory
                            </span>
                            <span className="px-2 py-0.5 bg-orange-50 rounded text-orange-700">
                              <strong>NI</strong> Needs Improvement
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                              <strong>NA</strong> Not Applicable
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-emerald-50 rounded text-emerald-700">
                              <strong>E</strong> Exemplary
                            </span>
                            <span className="px-2 py-0.5 bg-blue-50 rounded text-blue-700">
                              <strong>P</strong> Proficient
                            </span>
                            <span className="px-2 py-0.5 bg-cyan-50 rounded text-cyan-700">
                              <strong>DV</strong> Developing
                            </span>
                            <span className="px-2 py-0.5 bg-amber-50 rounded text-amber-700">
                              <strong>EM</strong> Emerging
                            </span>
                            <span className="px-2 py-0.5 bg-orange-50 rounded text-orange-700">
                              <strong>NI</strong> Needs Improvement
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                              <strong>N/A</strong> Not Assessed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Teacher Assistant (report card only) */}
                  {activeTab === 'report_card' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Teacher Assistant (optional)
                      </label>
                      <input
                        type="text"
                        value={teacherAssistant}
                        onChange={(e) => {
                          setTeacherAssistant(e.target.value)
                          setHasChanges(true)
                        }}
                        placeholder="Enter teacher assistant name"
                        className="w-full max-w-sm border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Subject Cards */}
                  {subjects.map((subject) => (
                    <div
                      key={subject.subjectId}
                      className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3">
                        <h3 className="text-white font-semibold text-sm">{subject.name}</h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {activeTab === 'report_card' ? (
                          /* Report Card: Standard + Description + Rating */
                          <>
                            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              <div className="col-span-4">Standard</div>
                              <div className="col-span-5">Description</div>
                              <div className="col-span-3 text-center">Rating</div>
                            </div>
                            {subject.standards.map((standard) => (
                              <div
                                key={standard.standardId}
                                className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-slate-50 transition-colors"
                              >
                                <div className="col-span-4 text-sm font-medium text-slate-700">
                                  {standard.name}
                                </div>
                                <div className="col-span-5 text-sm text-slate-500">
                                  {standard.description || ''}
                                </div>
                                <div className="col-span-3 flex justify-center">
                                  <select
                                    value={ratings[standard.standardId] || ''}
                                    onChange={(e) =>
                                      handleRatingChange(standard.standardId, e.target.value)
                                    }
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center w-20 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  >
                                    {ratingOptions.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          /* Progress Report: Standard + Rating */
                          subject.standards.map((standard) => (
                            <div
                              key={standard.standardId}
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                            >
                              <span className="text-sm text-slate-700">{standard.name}</span>
                              <select
                                value={ratings[standard.standardId] || ''}
                                onChange={(e) =>
                                  handleRatingChange(standard.standardId, e.target.value)
                                }
                                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center w-20 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              >
                                {ratingOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Subject Comment */}
                      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-slate-500">
                            {activeTab === 'report_card'
                              ? 'Strengths / Next Steps'
                              : 'Teacher Comment'}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const standardsForPrompt = subject.standards
                                .filter((s) => ratings[s.standardId])
                                .map((s) => ({
                                  name: s.name,
                                  rating: ratings[s.standardId],
                                  description: s.description || undefined,
                                }))
                              handleGenerateAIComment(
                                subject.subjectId,
                                subject.name,
                                standardsForPrompt
                              )
                            }}
                            disabled={
                              generatingAI.has(subject.subjectId) ||
                              !subject.standards.some((s) => ratings[s.standardId])
                            }
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <SparklesIcon
                              className={`w-3.5 h-3.5 ${generatingAI.has(subject.subjectId) ? 'animate-pulse' : ''}`}
                            />
                            {generatingAI.has(subject.subjectId)
                              ? 'Generating...'
                              : 'Generate with AI'}
                          </button>
                        </div>
                        <textarea
                          value={subjectComments[subject.subjectId] || ''}
                          onChange={(e) =>
                            handleSubjectCommentChange(subject.subjectId, e.target.value)
                          }
                          rows={3}
                          placeholder={
                            activeTab === 'report_card'
                              ? "Click 'Generate with AI' or type strengths and next steps..."
                              : "Click 'Generate with AI' or type your own comment..."
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Bottom Save Bar */}
                  {hasChanges && (
                    <div className="sticky bottom-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-center justify-between">
                      <span className="text-sm text-amber-600 font-medium">
                        You have unsaved changes for {selectedStudent?.name}
                      </span>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {saving ? <Spinner size="sm" /> : <CheckCircleIcon className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default SKGradebook
