// src/components/gradebook/workspace/SKGradebookWorkspace.tsx
// The SK class's competency grades: Grades on the class page (it was the
// /gradebook/sk/[classId] page). Progress report and report card
// ratings and comments, one student at a time; the subjects and standards themselves are
// set up in the class's Settings. The document and the student live in the
// URL (?doc=report_card&student=; the progress report is the default).
// Everything autosaves (D17, useKindergartenAutosave): the open document is
// queued whole on every change and saved with the Save button's own calls;
// the Save button is now a manual flush and the pill shows Saved / Retry.
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getStudentsInClass } from '@/services/classService'
import {
  getSKSubjects,
  getSKAssessments,
  getSKSubjectComments,
  getSKTeacherAssistant,
  getSKProgressReportComments,
} from '@/services/skService'
import type { ClassPayload } from '@/services/types/class'
import type { StudentPayload } from '@/services/types/student'
import type { SKSubject } from '@/services/types/sk'
import {
  Cog6ToothIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import { useFilterParams } from '@/hooks/useFilterParams'
import { classHref } from '@/lib/classroomRoutes'
import SavedPill from '@/components/gradebook/SavedPill'
import { useKindergartenAutosave } from '@/hooks/useKindergartenAutosave'
import {
  applyKindergartenChange,
  kindergartenKey,
  openSKDocument,
  otherKindergartenDoc,
  type KindergartenFields,
} from '@/lib/kindergartenSave'
import { aiFetch } from '@/services/aiClient'

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

const EMPTY_FIELDS: KindergartenFields = { ratings: {}, comments: {}, learningSkills: {}, teacherAssistant: '', progressComments: {} }
const DOC_NAME: Record<TabType, string> = { progress_report: 'progress report', report_card: 'report card' }

interface SKGradebookWorkspaceProps {
  classId: string
  classData: ClassPayload
}

export default function SKGradebookWorkspace({ classId, classData }: SKGradebookWorkspaceProps) {
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const showNotification = useNotificationStore((s) => s.showNotification)

  // Core data
  const [students, setStudents] = useState<StudentPayload[]>([])
  const [subjects, setSubjects] = useState<SKSubject[]>([])
  const [loading, setLoading] = useState(true)

  // Selection state lives in the URL (?doc=report_card&student=; the default
  // document is omitted) so Back and refresh restore it. Not remembered: the
  // class page itself never re-expands a bare URL (?tab= is the class tab).
  const { get, setParams } = useFilterParams({ remember: false })
  const activeTab: TabType = get('doc') === 'report_card' ? 'report_card' : 'progress_report'
  const selectedStudentId = get('student') || null
  const setActiveTab = (tab: TabType) => setParams({ doc: tab === 'progress_report' ? null : tab })
  const setSelectedStudentId = (studentId: string) => setParams({ student: studentId })

  // Rating state: standardId -> rating
  const [ratings, setRatings] = useState<Record<string, string>>({})
  // Subject comments: subjectId -> comment
  const [subjectComments, setSubjectComments] = useState<Record<string, string>>({})
  // Teacher assistant
  const [teacherAssistant, setTeacherAssistant] = useState('')
  // Progress report comments (sectionType -> comment) have no fields here: they
  // ride in the open document (docRef) and are saved back as loaded.

  // AI generation state
  const [generatingAI, setGeneratingAI] = useState<Set<string>>(new Set())
  const [generatingAllAI, setGeneratingAllAI] = useState(false)

  const term = classData?.termName || ''

  // Autosave. The open document's fields are mirrored in a ref, so a change
  // (even several AI comments landing at once) queues the newest whole
  // document. Changes queue only once this document has loaded (the teacher
  // assistant is always sent, so a half-loaded report card must never save),
  // and a late answer for another student or document is dropped.
  // 'blocked': the student's other document has a save that failed; the two
  // share subject comments, so this one opens after Retry or Discard
  // (openSKDocument).
  const autosave = useKindergartenAutosave({ classId, kind: 'sk' })
  const docKey = selectedStudentId ? kindergartenKey(selectedStudentId, activeTab) : null
  const docRef = useRef<KindergartenFields>(EMPTY_FIELDS)
  const readyKeyRef = useRef<string | null>(null)
  const loadSeq = useRef(0)
  const [docState, setDocState] = useState<'loading' | 'ready' | 'error' | 'blocked'>('loading')
  const { flush: flushDocs, getState: docsQueue } = autosave
  const applyDoc = useCallback((next: KindergartenFields) => {
    docRef.current = next
    setRatings(next.ratings)
    setSubjectComments(next.comments)
    setTeacherAssistant(next.teacherAssistant)
  }, [])

  // Load class and students on mount
  // Load the class's students (the class itself comes from the Grades tab)
  useEffect(() => {
    if (!classId) return
    getStudentsInClass(classId)
      .then((stuRes) => {
        if (stuRes.status === 'success') setStudents(stuRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [classId])

  // Start on the first student unless the URL already names one in this class.
  useEffect(() => {
    if (students.length === 0) return
    if (selectedStudentId && students.some((s) => s.studentId === selectedStudentId)) return
    setParams({ student: students[0].studentId })
  }, [students, selectedStudentId, setParams])

  // Load subjects when tab changes
  useEffect(() => {
    if (!user?.school) return
    getSKSubjects(activeTab, user.school)
      .then((res) => {
        if (res.status === 'success') setSubjects(res.data)
      })
      .catch(console.error)
  }, [activeTab, user?.school, selectedYearId]) // refetch when the selected school year changes

  // Load student data when student or tab changes
  const loadStudentData = useCallback(async () => {
    if (!selectedStudentId || !term) return
    const ticket = ++loadSeq.current
    const key = kindergartenKey(selectedStudentId, activeTab)
    readyKeyRef.current = null
    setDocState('loading')
    // Clear stale state before loading new data
    applyDoc(EMPTY_FIELDS)

    try {
      // Earlier edits save first, and a failed save of the other document
      // holds this one: SK subject comments belong to both documents. What
      // the teacher changed here and hasn't saved yet wins over the server.
      const opened = await openSKDocument(selectedStudentId, activeTab, { flush: flushDocs, getState: docsQueue }, async () => {
        const fields: KindergartenFields = { ...EMPTY_FIELDS }

        // Load standard assessments
        const assessRes = await getSKAssessments(selectedStudentId, term, activeTab)
        if (assessRes.status === 'success') {
          const map: Record<string, string> = {}
          assessRes.data.forEach((a) => {
            if (a.rating) map[a.standardId] = a.rating
          })
          fields.ratings = map
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
            fields.comments = cmap
          }

          fields.teacherAssistant = taRes.status === 'success' && taRes.data ? taRes.data.teacherAssistantName || '' : ''
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
            fields.comments = cmap
          }

          if (prCommentsRes.status === 'success') {
            const pmap: Record<string, string> = {}
            prCommentsRes.data.forEach((c) => {
              if (c.comment) pmap[c.sectionType] = c.comment
            })
            fields.progressComments = pmap
          }
        }

        return fields
      })

      if (ticket !== loadSeq.current) return
      if (opened.state === 'blocked') {
        setDocState('blocked')
        return
      }
      applyDoc(opened.fields)
      readyKeyRef.current = key
      setDocState('ready')
    } catch (err) {
      if (ticket !== loadSeq.current) return
      console.error('Error loading student data:', err)
      setDocState('error')
    }
  }, [selectedStudentId, term, activeTab, applyDoc, flushDocs, docsQueue])

  useEffect(() => {
    loadStudentData()
  }, [loadStudentData])

  // Handlers
  // A change updates the fields and queues the whole open document. `forKey`
  // is the document it was made for: an AI comment requested for one student
  // can arrive after the teacher switched, and is then dropped (false), never
  // applied to the student now open.
  const change = (patch: Partial<KindergartenFields>, forKey: string | null = docKey): boolean => {
    const next = applyKindergartenChange({ readyKey: readyKeyRef.current, fields: docRef.current }, forKey, patch)
    if (!next || !forKey) return false
    applyDoc(next)
    if (!user?.school) return true
    const [studentId, doc] = forKey.split('|') as [string, TabType]
    autosave.queue(forKey, { studentId, term, doc, school: user.school, assessedBy: user.id ?? null, ...next })
    return true
  }

  const handleRatingChange = (standardId: string, value: string) =>
    change({ ratings: { ...docRef.current.ratings, [standardId]: value } })

  const handleSubjectCommentChange = (subjectId: string, value: string, forKey: string | null = docKey) =>
    change({ comments: { ...docRef.current.comments, [subjectId]: value } }, forKey)

  const handleProgressCommentChange = (sectionType: string, value: string) =>
    change({ progressComments: { ...docRef.current.progressComments, [sectionType]: value } })

  // Generate AI comment for a single subject or section
  const handleGenerateAIComment = async (
    key: string,
    subjectName: string,
    standardsForPrompt: Array<{ name: string; rating: string; description?: string }>
  ) => {
    if (!selectedStudent) return
    // The document this comment is for, whatever is open when it arrives.
    const requestedKey = docKey

    const ratedStandards = standardsForPrompt.filter((s) => s.rating && s.rating !== '')
    if (ratedStandards.length === 0) {
      showNotification('Please rate at least one standard before generating a comment', 'error')
      return
    }

    setGeneratingAI((prev) => new Set(prev).add(key))
    try {
      const response = await aiFetch('/api/ai/generate-jksk-comment', {
        studentName: selectedStudent.name,
        domainName: subjectName,
        skills: ratedStandards,
        ratingScale: activeTab === 'progress_report' ? 'EGSNINA' : 'EPDVEMNI',
        gradeLevel: 'SK',
        documentType: activeTab,
        term: term || 'Current Term',
      })

      if (!response.ok) throw new Error('Failed to generate comment')

      const data = await response.json()
      if (data.comment) {
        // Both documents keep subject comments by subjectId.
        const applied = handleSubjectCommentChange(key, data.comment, requestedKey)
        if (applied) showNotification('Comment generated successfully', 'success')
        else showNotification(`The AI comment for ${selectedStudent.name} arrived after you switched, so it wasn't added.`, 'error')
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

  // Save (manual): send whatever has not saved yet, now.
  const saveNow = () => {
    void autosave.flush()
  }

  // Retry. A document held by its sibling's failed save opens again once the
  // retry has run (the load waits for it, and stays held if it fails again).
  const retrySaves = () => {
    void autosave.retry()
    if (docState === 'blocked') void loadStudentData()
  }

  // Switching student or document saves the open one first (no confirm).
  const handleStudentSwitch = (studentId: string) => {
    void autosave.flush()
    setSelectedStudentId(studentId)
  }

  const handleTabChange = (tab: TabType) => {
    void autosave.flush()
    setActiveTab(tab)
  }

  // A student whose progress report or report card didn't save.
  const failedFor = (studentId: string) =>
    autosave.failedKeys.has(kindergartenKey(studentId, 'progress_report')) ||
    autosave.failedKeys.has(kindergartenKey(studentId, 'report_card'))

  const ratingOptions =
    activeTab === 'progress_report' ? SK_PROGRESS_REPORT_RATINGS : SK_REPORT_CARD_RATINGS
  const selectedStudent = students.find((s) => s.studentId === selectedStudentId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
        <div>
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {classData?.subject || 'Senior Kindergarten'}
                </h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  {classData?.teacherName} &middot; {term}
                </p>
                <Link
                  href={classHref(classId, 'settings', {}, '#skills')}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800"
                >
                  <Cog6ToothIcon className="h-4 w-4" aria-hidden="true" />
                  Subjects and standards are set up in Settings
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <SavedPill
                  status={autosave.status}
                  failedCount={autosave.failedKeys.size}
                  onRetry={retrySaves}
                  onDiscard={() => {
                    autosave.discard()
                    void loadStudentData()
                  }}
                />
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
                  onClick={saveNow}
                  disabled={autosave.status === 'saved'}
                  title="Grades save by themselves; this saves right away"
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {autosave.status === 'saving' ? <Spinner size="sm" /> : <CheckCircleIcon className="w-4 h-4" />}
                  {autosave.status === 'saving' ? 'Saving…' : 'Save'}
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

          {!term && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This class has no term yet, so ratings and comments can&apos;t be saved. Set its term in the class&apos;s Settings.
            </div>
          )}

          {docState === 'error' && selectedStudentId && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              This student&apos;s record couldn&apos;t be loaded, so changes can&apos;t be saved yet.
              <button
                type="button"
                onClick={() => void loadStudentData()}
                className="cursor-pointer rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-medium hover:bg-rose-100"
              >
                Try again
              </button>
            </div>
          )}

          {docState === 'blocked' && selectedStudentId && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <span>
                {selectedStudent?.name ?? 'This student'}&apos;s {DOC_NAME[otherKindergartenDoc(activeTab)]} didn&apos;t save, and the
                two share subject comments. The {DOC_NAME[activeTab]} opens once you Retry (or Discard) that save.
              </span>
              <button
                type="button"
                onClick={retrySaves}
                className="cursor-pointer rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-medium hover:bg-rose-100"
              >
                Retry
              </button>
            </div>
          )}

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
                      {failedFor(stu.studentId) && (
                        <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-rose-500" title="Didn't save. Use Retry above." />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content: leaving any field saves at once */}
            <div className="flex-1 min-w-0" onBlur={() => void autosave.flush()}>
              {!selectedStudentId ? (
                <div className="text-center py-12 text-slate-500">
                  Select a student to begin assessment
                </div>
              ) : (
                <div
                  className={`space-y-4 ${docState === 'ready' ? '' : 'opacity-60'}`}
                  inert={docState !== 'ready'}
                  aria-busy={docState === 'loading'}
                >
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
                        onChange={(e) => change({ teacherAssistant: e.target.value })}
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

                </div>
              )}
            </div>
          </div>
        </div>
  )
}
