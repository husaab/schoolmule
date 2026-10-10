'use client'

import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'

import {
  getClassById,
  getStudentsInClass,
  getAssessmentsByClass,
  getScoresByClass,
  upsertScoresByClass,
  downloadGradebookExcel
} from '@/services/classService'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { ClassPayload } from '@/services/types/class'
import type { StudentPayload } from '@/services/types/student'
import type { AssessmentPayload } from '@/services/types/assessment'
import { getTermByNameAndSchool } from '@/services/termService'
import StudentAssessmentsModal from '@/components/assessments/student/studentAssessmentsModal'
import type { TermPayload } from '@/services/types/term'
import ChildAssessmentsModal from '@/components/assessments/child/ChildAssessmentsModal';
import ExcludedAssessmentsModal from '@/components/assessments/excluded/excludedAssessmentsModal';
import AssessmentJumper from '@/components/gradebook/AssessmentJumper';
import AssessmentsSection from '@/components/assessments/section/AssessmentsSection';
import PublishAssessmentsModal from '@/components/gradebook/publish/PublishAssessmentsModal';
import { getPublicationState } from '@/services/assessmentPublicationService';
import type { AssessmentPublicationState } from '@/services/types/assessmentPublication';
import StandaloneAssessmentModal from '@/components/assessments/standalone/StandaloneAssessmentModal';
import PublishStateBadge from '@/components/assessments/publish/PublishStateBadge';
import { summarizePublication } from '@/lib/publicationSummary';
import { mergeAssessmentMutation } from '@/lib/assessmentMutation';
import type { AssessmentMutation } from '@/components/assessments/section/useAssessmentForm';
import { buildScoreLookups, type ScoreRow } from '@/components/assessments/scores/types';
import { buildScoreLookup, computeAssessmentForStudent, computeClassGrade, formatCoverage } from '@/lib/gradeEngine';
import { groupRowsByStudent, liveRowsForStudent, toEngineAssessments } from '@/components/assessments/scores/liveGrade';
import ScoreCell from '@/components/assessments/scores/ScoreCell';
import CategoryCell from '@/components/assessments/scores/CategoryCell';
import { useCellStatus } from '@/components/assessments/scores/useCellStatus';
import { useScoreGridNav } from '@/components/assessments/scores/useScoreGridNav';
import { writeStoredGrades, type StoredGrades } from '@/lib/bulkFeedbackGrades';
import { getThreadStubs } from '@/services/messagingService';
import type { ThreadStub } from '@/services/types/messaging';
import NewConversationModal from '@/components/messaging/NewConversationModal';
import { useMessagingStore } from '@/store/useMessagingStore';
import {
  MinusCircleIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';
import Spinner from '@/components/Spinner';
import MenuButton from '@/components/shared/MenuButton';


const GradebookClass = () => {
  const { classId } = useParams() as { classId: string }
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [classData, setClassData] = useState<ClassPayload | null>(null)
  const [students, setStudents] = useState<StudentPayload[]>([])
  const [assessments, setAssessments] = useState<AssessmentPayload[]>([])
  const [scoresMatrix, setScoresMatrix] = useState<ScoreRow[]>([])
  const [termData, setTermData] = useState<TermPayload | null>(null)


  // Child assessments modal state
  const [selectedParentAssessment, setSelectedParentAssessment] = useState<AssessmentPayload | null>(null);
  const [isChildAssessmentsModalOpen, setIsChildAssessmentsModalOpen] = useState(false);
  // Standalone column modal. Stored by id so an edit made inside it is
  // reflected straight away (the object is re-derived from `assessments`).
  const [standaloneAssessmentId, setStandaloneAssessmentId] = useState<string | null>(null);

  // Student assessments modal state
  const [selectedStudent, setSelectedStudent] = useState<{ studentId: string; name: string } | null>(null);
  const [isStudentAssessmentsModalOpen, setIsStudentAssessmentsModalOpen] = useState(false);

  // Excused assessments modal state
  const [selectedExclusionStudent, setSelectedExclusionStudent] = useState<{ studentId: string; name: string } | null>(null);
  const [isExclusionsModalOpen, setIsExclusionsModalOpen] = useState(false);

  // Edited scores: keyed by "studentId|assessmentId" → number or '' (empty means "no entry yet")
  const [editedScores, setEditedScores] = useState<{ [key: string]: number | '' }>({})

  // Assessment jumper: refs for horizontal scroll-to-column + transient highlight
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const thRefs = useRef<Record<string, HTMLTableCellElement | null>>({})
  const highlightTimeoutRef = useRef<number | null>(null)
  const [highlightedAssessmentId, setHighlightedAssessmentId] = useState<string | null>(null)

  // Parent publishing: which assessments are live, and which are ticked for
  // the next publish action.
  const [publications, setPublications] = useState<Record<string, AssessmentPublicationState>>({})

  // Parent conversations: chips beside a student's name (open threads) and
  // inside a score cell (that assessment has a thread). Keyed "studentId|assessmentId".
  const [threadStubs, setThreadStubs] = useState<Record<string, ThreadStub>>({})
  const [messagePreset, setMessagePreset] = useState<{ studentId?: string; assessmentId?: string; mode?: 'assessment' | 'general' } | null>(null)
  const bumpUnread = useMessagingStore((s) => s.bump)
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<Set<string>>(new Set())
  const [publishTargets, setPublishTargets] = useState<AssessmentPayload[]>([])
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)

  // In-page view switch: grade entry vs. assessment management
  const [activeView, setActiveView] = useState<'grades' | 'assessments'>('grades')
  const assessmentsChangedRef = useRef(false)
  const [refreshing, setRefreshing] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(editedScores).length > 0

  // Selection for publishing. Mirrors the Set<string> pattern used by the
  // report-card generator's student picker.
  const toggleAssessmentSelected = (assessmentId: string) => {
    setSelectedAssessmentIds((prev) => {
      const next = new Set(prev)
      if (next.has(assessmentId)) next.delete(assessmentId)
      else next.add(assessmentId)
      return next
    })
  }

  const openPublishModal = (targets: AssessmentPayload[]) => {
    if (targets.length === 0) return
    setPublishTargets(targets)
    setIsPublishModalOpen(true)
  }

  const handlePublishChanged = async () => {
    await loadPublications()
    setSelectedAssessmentIds(new Set())
  }

  const loadThreadStubs = useCallback(async () => {
    try {
      const res = await getThreadStubs({ classId })
      if (res.status === 'success' && res.data) {
        setThreadStubs(Object.fromEntries(res.data.map((st) => [`${st.studentId}|${st.assessmentId}`, st])))
      }
    } catch (error) {
      // Chips are informational — a failure here must not block grade entry.
      console.error('Error loading conversation stubs:', error)
    }
  }, [classId])

  const openThreadsFor = (studentId: string) =>
    Object.values(threadStubs).filter((st) => st.studentId === studentId && st.status === 'open').length

  // Publish state drives the Live / Not sent badges on each column header.
  const loadPublications = useCallback(async () => {
    try {
      const res = await getPublicationState(classId)
      if (res.status === 'success' && res.data) {
        setPublications(
          Object.fromEntries(res.data.map((p) => [p.assessmentId, p])) as Record<
            string,
            AssessmentPublicationState
          >
        )
      }
    } catch (error) {
      // Badges are informational — a failure here must not block grade entry.
      console.error('Error loading publication state:', error)
    }
  }, [classId])

  // Refresh scores matrix from backend (scores and cell statuses live there)
  const refreshScoresMatrix = useCallback(async () => {
    try {
      const refreshed = await getScoresByClass(classId)
      if (refreshed.status === 'success') {
        const rows = refreshed.data as ScoreRow[]
        setScoresMatrix(rows)
        // A cell flagged missing/excused since the teacher typed into it keeps
        // the flag: drop the stale unsaved edit so Save cannot undo the flag.
        const flagged = new Set(
          rows.filter((r) => r.status === 'missing' || r.status === 'excused').map((r) => `${r.student_id}|${r.assessment_id}`),
        )
        if (flagged.size > 0) {
          setEditedScores((prev) => {
            const next = { ...prev }
            let changed = false
            for (const key of Object.keys(next)) {
              if (flagged.has(key)) { delete next[key]; changed = true }
            }
            return changed ? next : prev
          })
        }
      }
    } catch (error) {
      console.error('Error refreshing scores matrix:', error)
    }
  }, [classId])

  // Missing / excused flags save straight away, then the matrix is re-read.
  const { togglingKey, setStatus } = useCellStatus({ classId, onRefresh: refreshScoresMatrix })
  const nav = useScoreGridNav(
    'grade',
    students.length,
    assessments.filter((a) => !a.parentAssessmentId).length,
  )

  useEffect(() => {
    if (!classId) return

    setLoading(true)
    setError(null)

    Promise.all([
      getClassById(classId),
      getStudentsInClass(classId),
      getAssessmentsByClass(classId),
      getScoresByClass(classId),
    ])
      .then(([classRes, stuRes, assessRes, scoreRes]) => {
        if (classRes.status !== 'success') {
          throw new Error(classRes.message || 'Failed to load class info')
        }
        setClassData(classRes.data)

        if (stuRes.status !== 'success') {
          throw new Error(stuRes.message || 'Failed to load students')
        }
        setStudents(stuRes.data)

        if (assessRes.status !== 'success') {
          throw new Error(assessRes.message || 'Failed to load assessments')
        }
        setAssessments(assessRes.data)

        if (scoreRes.status !== 'success') {
          throw new Error(scoreRes.message || 'Failed to load scores')
        }
        setScoresMatrix(scoreRes.data as ScoreRow[])

        loadPublications()
        loadThreadStubs()
      })
      .catch((err) => {
        console.error(err)
        setError(err.message || 'Unexpected error')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [classId, loadPublications, loadThreadStubs])

  // Fetch term details when classData becomes available
  useEffect(() => {
    if (!classData?.termName || !classData?.school) return

    const fetchTermData = async () => {
      try {
        const res = await getTermByNameAndSchool(classData.termName, classData.school)
        if (res.status === 'success') {
          setTermData(res.data)
        }
      } catch (err) {
        console.error('Error fetching term data:', err)
      }
    }

    fetchTermData()
  }, [classData?.termName, classData?.school])

  // Warn user about unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have not saved your grade changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    const handlePopState = () => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm('You have not saved your grade changes. Are you sure you want to leave?')
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

  if (error) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Gradebook</h3>
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

  // Filter assessments to show only parent and standalone (hide children)
  const displayedAssessments = assessments.filter(a => !a.parentAssessmentId)
  const standaloneAssessment = standaloneAssessmentId
    ? assessments.find(a => a.assessmentId === standaloneAssessmentId && !a.isParent) ?? null
    : null

  // Build quick lookups
  const { existing: existingScoreMap, status: statusMap } = buildScoreLookups(scoresMatrix)

  // All grade maths goes through the engine. Live rows merge the teacher's
  // unsaved edits over the saved matrix so totals preview what will be saved.
  const engineAssessments = toEngineAssessments(assessments)
  const engineById = Object.fromEntries(engineAssessments.map((a) => [a.assessment_id, a]))
  const rowsByStudent = groupRowsByStudent(scoresMatrix)
  const liveByStudent = new Map(
    students.map((stu) => {
      const rows = liveRowsForStudent(stu.studentId, rowsByStudent[stu.studentId], editedScores)
      return [stu.studentId, { lookup: buildScoreLookup(rows), grade: computeClassGrade(engineAssessments, rows) }]
    })
  )
  const excusedCountFor = (studentId: string) =>
    (rowsByStudent[studentId] || []).filter((r) => !r.is_parent && r.status === 'excused').length
  const pctColor = (pct: number | null) =>
    pct == null ? 'text-slate-400' : pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-slate-900' : 'text-rose-600'

  const handleExportExcel = async () => {
    try {
      const blob = await downloadGradebookExcel(classId);
      const safeSubject = String(classData.subject)
        .trim()
        .replace(/\s+/g, '_');
      const fileName = `Gradebook_Grade_${classData.grade}_${safeSubject}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Failed to download Excel sheet');
    }
  };

  const handleScoreChange = (
    studentId: string,
    assessmentId: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const raw = e.target.value

    let val: number | '' = ''
    if (raw !== '') {
      const parsed = parseFloat(raw)
      if (!isNaN(parsed)) {
        const assessment = assessments.find(a => a.assessmentId === assessmentId)
        if (assessment) {
          const maxScore = Number(assessment.maxScore || 100)
          val = Math.min(Math.max(parsed, 0), maxScore)
        } else {
          val = Math.min(Math.max(parsed, 0), 100)
        }
      } else {
        val = ''
      }
    }

    const compositeKey = `${studentId}|${assessmentId}`
    const existingValue = existingScoreMap[compositeKey] ?? null

    setEditedScores((prev) => {
      const newState = { ...prev }

      const isBackToOriginal = (
        (val === '' && existingValue === null) ||
        (typeof val === 'number' && val === existingValue)
      )

      if (isBackToOriginal) {
        delete newState[compositeKey]
      } else {
        newState[compositeKey] = val
      }

      return newState
    })
  }

  // Hand each student's live grade (null = nothing graded yet) and coverage
  // to the bulk feedback / progress pages.
  const saveGradesToLocalStorage = () => {
    const gradesMap: StoredGrades = {}
    students.forEach((stu) => {
      const grade = liveByStudent.get(stu.studentId)?.grade
      gradesMap[stu.studentId] = { pct: grade?.pct ?? null, coverage: grade?.coverage ?? null }
    })
    writeStoredGrades(classId, gradesMap)
  }

  // Navigate to bulk feedback (saves grades first)
  const navigateToBulkFeedback = () => {
    saveGradesToLocalStorage()
    router.push(`/gradebook/${classId}/feedback`)
  }

  // Navigate to bulk progress (saves grades first)
  const navigateToBulkProgress = () => {
    saveGradesToLocalStorage()
    router.push(`/gradebook/${classId}/progress`)
  }

  const handleSaveAll = async (): Promise<boolean> => {
    setSaving(true)
    setError(null)

    const toUpsert: Array<{ studentId: string; assessmentId: string; score: number | null }> = []

    Object.entries(editedScores).forEach(([compositeKey, newScore]) => {
      const [stuId, assessId] = compositeKey.split('|')
      const existing = existingScoreMap[compositeKey] ?? null
      // Never let a stale edit overwrite a saved missing/excused flag.
      if ((statusMap[compositeKey] ?? 'graded') !== 'graded') return

      if (typeof newScore === 'number' && newScore !== existing) {
        toUpsert.push({
          studentId: stuId,
          assessmentId: assessId,
          score: newScore,
        })
      } else if (newScore === '' && existing !== null) {
        toUpsert.push({
          studentId: stuId,
          assessmentId: assessId,
          score: null,
        })
      }
    })

    if (toUpsert.length === 0) {
      setSaving(false)
      setEditedScores({})
      showNotification('No changes to save', 'success')
      return true
    }

    try {
      await upsertScoresByClass(classId, toUpsert)
      const refreshed = await getScoresByClass(classId)
      if (refreshed.status === 'success') {
        setScoresMatrix(refreshed.data as ScoreRow[])
        setEditedScores({})
      } else {
        throw new Error(refreshed.message || 'Failed to refresh scores')
      }
      showNotification('Grades successfully saved', 'success')
      return true
    } catch (err) {
      console.error(err)
      setError('Error saving scores')
      return false
    } finally {
      setSaving(false)
    }
  }

  // Switch to the in-page Assessments view (grades must be saved first so the
  // score matrix can't drift under edited assessments)
  const handleGoToAssessments = async () => {
    if (hasUnsavedChanges) {
      const confirmSave = window.confirm(
        'You have unsaved grade changes. They must be saved before editing assessments. Save now?'
      )
      if (!confirmSave) return
      const saved = await handleSaveAll()
      if (!saved) return
    }
    setActiveView('assessments')
  }

  // Return to grade entry; re-sync grid data if assessments were changed
  const handleBackToGrades = async () => {
    setActiveView('grades')
    if (!assessmentsChangedRef.current) return
    assessmentsChangedRef.current = false

    setRefreshing(true)
    try {
      const [assessRes] = await Promise.all([
        getAssessmentsByClass(classId),
        refreshScoresMatrix(),
      ])
      if (assessRes.status === 'success') {
        setAssessments(assessRes.data)
        // Drop edited-score keys for assessments that no longer exist
        const validIds = new Set(assessRes.data.map((a: AssessmentPayload) => a.assessmentId))
        setEditedScores((prev) => {
          const entries = Object.entries(prev).filter(([key]) => validIds.has(key.split('|')[1]))
          return entries.length === Object.keys(prev).length ? prev : Object.fromEntries(entries)
        })
        // Same for the publish selection, or the sticky bar keeps offering to
        // publish an assessment that was just deleted.
        setSelectedAssessmentIds((prev) => {
          const kept = [...prev].filter((id) => validIds.has(id))
          return kept.length === prev.size ? prev : new Set(kept)
        })
        loadPublications()
      } else {
        throw new Error(assessRes.message || 'Failed to refresh assessments')
      }
    } catch (err) {
      console.error('Error refreshing after assessment changes:', err)
      showNotification('Failed to refresh gradebook', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  // Scroll the grid horizontally so the clicked assessment's column is centered.
  // Manual scrollLeft math (not scrollIntoView) so the page never scrolls vertically.
  const handleJumpToAssessment = (assessmentId: string) => {
    const container = scrollContainerRef.current
    const th = thRefs.current[assessmentId]
    if (!container || !th) return

    const targetLeft = th.offsetLeft - (container.clientWidth - th.clientWidth) / 2
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })

    setHighlightedAssessmentId(assessmentId)
    if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current)
    highlightTimeoutRef.current = window.setTimeout(
      () => setHighlightedAssessmentId(null),
      1500
    )
  }

  const handleParentAssessmentClick = (parentAssessment: AssessmentPayload) => {
    setSelectedParentAssessment(parentAssessment)
    setIsChildAssessmentsModalOpen(true)
  }

  // Name / points / max score / date edited from the standalone modal. The
  // header, the Total column and the score clamp all read `assessments`, so a
  // merge is enough — no refetch.
  const applyAssessmentMutation = (result: AssessmentMutation) => {
    // A lower max score must pull unsaved drafts down with it, or a 95 typed
    // against /100 would be saved against /50.
    const loweredMax = new Map<string, number>()
    result.updated.forEach((u) => {
      const before = assessments.find((a) => a.assessmentId === u.assessmentId)
      const max = Number(u.maxScore)
      if (before && max > 0 && Number(before.maxScore) !== max) loweredMax.set(u.assessmentId, max)
    })
    if (loweredMax.size > 0) {
      setEditedScores((prev) => {
        const next = { ...prev }
        Object.entries(prev).forEach(([key, value]) => {
          const max = loweredMax.get(key.split('|')[1])
          if (max !== undefined && typeof value === 'number' && value > max) next[key] = max
        })
        return next
      })
    }
    setAssessments((prev) => mergeAssessmentMutation(prev, result))
  }

  // What "manage" means for a column: the item itself, plus (for a category)
  // whichever children are already live, so the publish window offers
  // Unpublish / resend for what parents can actually see. The header badge
  // counts children, so the targets must too.
  const manageTargets = (a: AssessmentPayload): AssessmentPayload[] =>
    a.isParent
      ? [a, ...assessments.filter((c) => c.parentAssessmentId === a.assessmentId && publications[c.assessmentId]?.isPublished)]
      : [a]

  const handleScoreUpdateFromModal = async () => {
    try {
      const refreshed = await getScoresByClass(classId)
      if (refreshed.status === 'success') {
        setScoresMatrix(refreshed.data as ScoreRow[])
      }
    } catch (error) {
      console.error('Error refreshing scores:', error)
    }
  }

  // Calculate class statistics
  // "Live" counts the items parents can actually see: standalones plus the
  // items inside categories. A category's own flag is not an item.
  const gradedItems = assessments.filter((a) => !a.isParent)
  const liveItemCount = gradedItems.filter((a) => publications[a.assessmentId]?.isPublished).length
  const liveLabel =
    gradedItems.length === displayedAssessments.length
      ? `${liveItemCount} live for parents`
      : `${liveItemCount} of ${gradedItems.length} items live for parents`
  // Class average = mean of the students who have any graded work.
  const assessedPcts = [...liveByStudent.values()]
    .map((v) => v.grade.pct)
    .filter((pct): pct is number => pct != null)
  const classAverage = assessedPcts.length > 0
    ? assessedPcts.reduce((sum, pct) => sum + pct, 0) / assessedPcts.length
    : null

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50 pb-28">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?')
                        if (confirmLeave) {
                          router.push('/gradebook')
                        }
                      } else {
                        router.push('/gradebook')
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                    {classData.subject}
                  </h1>
                  <span className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg text-sm font-medium">
                    Grade {classData.grade}
                  </span>
                </div>
                <p className="text-slate-500">
                  {classData.termName && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDaysIcon className="h-4 w-4" />
                      {classData.termName}
                      {termData && (
                        <span className="text-slate-400">
                          ({new Date(termData.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })} - {new Date(termData.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })})
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>

              {activeView === 'grades' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setMessagePreset({})}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-xl hover:bg-cyan-100 transition-all font-medium cursor-pointer shadow-sm"
                  title="Write to a student's guardians"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  Message parents
                </button>
                <MenuButton
                  label="Feedback"
                  items={[
                    {
                      key: 'report',
                      label: 'Report card feedback',
                      description: 'Comments that print on the report card',
                      icon: ChatBubbleBottomCenterTextIcon,
                      onSelect: navigateToBulkFeedback,
                    },
                    {
                      key: 'progress',
                      label: 'Progress report feedback',
                      description: 'Comments for the progress report only',
                      icon: ClipboardDocumentCheckIcon,
                      onSelect: navigateToBulkProgress,
                    },
                  ]}
                  triggerClassName="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all font-medium cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  trigger={
                    <>
                      <PencilSquareIcon className="h-4 w-4" />
                      Feedback
                      <ChevronDownIcon className="h-3.5 w-3.5" />
                    </>
                  }
                />
                <button
                  onClick={() => { void handleExportExcel() }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium cursor-pointer shadow-sm"
                  title="Download this class's gradebook as a spreadsheet"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export
                </button>
              </div>
              )}
            </div>

            {/* View switch and the class at a glance */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={activeView === 'assessments' ? handleBackToGrades : undefined}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeView === 'grades'
                      ? 'bg-white text-cyan-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Grade Entry
                </button>
                <button
                  onClick={activeView === 'grades' ? handleGoToAssessments : undefined}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeView === 'assessments'
                      ? 'bg-white text-cyan-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Assessments
                </button>
              </div>
              {activeView === 'grades' && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
                  <span>
                    <strong className="font-semibold text-slate-900 tabular-nums">{students.length}</strong>{' '}
                    {students.length === 1 ? 'student' : 'students'}
                  </span>
                  <span>
                    <strong className="font-semibold text-slate-900 tabular-nums">{displayedAssessments.length}</strong>{' '}
                    {displayedAssessments.length === 1 ? 'assessment' : 'assessments'}
                    {displayedAssessments.length > 0 && `, ${liveLabel}`}
                  </span>
                  <span>
                    <strong className="font-semibold text-slate-900 tabular-nums">
                      {classAverage == null ? '—' : `${classAverage.toFixed(1)}%`}
                    </strong>{' '}
                    class average · {assessedPcts.length} of {students.length} students assessed
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assessments management view */}
          {activeView === 'assessments' && (
            <AssessmentsSection
              classId={classId}
              onMutated={() => { assessmentsChangedRef.current = true }}
            />
          )}

          {/* Main Content Card - Gradebook Table */}
          {activeView === 'grades' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <AssessmentJumper
              assessments={displayedAssessments}
              onJump={handleJumpToAssessment}
              activeAssessmentId={highlightedAssessmentId}
            />
            {refreshing ? (
              <div className="flex justify-center items-center py-24">
                <Spinner size="md" />
              </div>
            ) : (
            <div className="overflow-x-auto" ref={scrollContainerRef}>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[200px]">
                      Student Name
                    </th>
                    {displayedAssessments.map((a: AssessmentPayload) => (
                      <th
                        key={a.assessmentId}
                        ref={(el) => { thRefs.current[a.assessmentId] = el }}
                        className={`px-3 py-3 text-center text-sm font-semibold text-slate-700 min-w-[100px] cursor-pointer transition-colors duration-300 ${
                          a.isParent ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-100'
                        } ${
                          highlightedAssessmentId === a.assessmentId
                            ? 'ring-2 ring-cyan-400 ring-inset'
                            : ''
                        }`}
                        onClick={() => (a.isParent ? handleParentAssessmentClick(a) : setStandaloneAssessmentId(a.assessmentId))}
                        title={a.isParent ? 'Click to edit individual assessments' : 'Click to see every score, edit details or publish'}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {/* stopPropagation: the <th> itself opens the child
                              assessments modal for a category column. */}
                          <input
                            type="checkbox"
                            checked={selectedAssessmentIds.has(a.assessmentId)}
                            onChange={() => toggleAssessmentSelected(a.assessmentId)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-400 cursor-pointer"
                            title="Select for publishing to parents"
                          />
                          <div className="truncate max-w-[100px]">
                            {a.name}
                          </div>
                        </div>
                        {a.isParent && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded">
                            Multiple
                          </span>
                        )}
                        <div className="text-xs font-normal text-slate-400 mt-0.5">
                          {a.weightPoints || a.weightPercent || 0} pts
                        </div>
                        {/* Categories are judged by their children: "2 of 13 sent" rather
                            than the category's own flag. Clicking a live badge manages
                            publishing; "Not sent" falls through to the header click. */}
                        <PublishStateBadge
                          summary={summarizePublication(a, assessments, publications)}
                          variant="header"
                          onClick={() => openPublishModal(manageTargets(a))}
                        />
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 min-w-[80px] bg-emerald-50">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2 + displayedAssessments.length}
                        className="px-4 py-12 text-center"
                      >
                        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Students Enrolled</h3>
                        <p className="text-sm text-slate-500">No students are currently enrolled in this class.</p>
                      </td>
                    </tr>
                  ) : (
                    students
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((stu, rowIndex) => {
                      const live = liveByStudent.get(stu.studentId) ?? {
                        lookup: {},
                        grade: computeClassGrade(engineAssessments, []),
                      }
                      const grade = live.grade
                      return (
                        <tr
                          key={stu.studentId}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-slate-100">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedStudent({ studentId: stu.studentId, name: stu.name })
                                  setIsStudentAssessmentsModalOpen(true)
                                }}
                                className="font-medium text-slate-900 hover:text-cyan-600 transition-colors cursor-pointer"
                                title="Click to view/edit all assessments for this student"
                              >
                                {stu.name}
                              </button>
                              {openThreadsFor(stu.studentId) > 0 && (
                                <button
                                  onClick={() => router.push(`/messages?classId=${encodeURIComponent(classId)}&q=${encodeURIComponent(stu.name)}`)}
                                  className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-1.5 py-px text-[10px] font-medium text-cyan-700 hover:bg-cyan-100 cursor-pointer"
                                  title={`${openThreadsFor(stu.studentId)} open parent conversation(s)`}
                                >
                                  <ChatBubbleLeftRightIcon className="h-3 w-3" />
                                  {openThreadsFor(stu.studentId)}
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedExclusionStudent({ studentId: stu.studentId, name: stu.name })
                                  setIsExclusionsModalOpen(true)
                                }}
                                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                title={`Excused assessments (${excusedCountFor(stu.studentId)} excused)`}
                              >
                                <MinusCircleIcon className="h-4 w-4" />
                                {excusedCountFor(stu.studentId) > 0 && (
                                  <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full font-medium">
                                    {excusedCountFor(stu.studentId)}
                                  </span>
                                )}
                              </button>
                            </div>
                          </td>

                          {displayedAssessments.map((a: AssessmentPayload, colIndex) => {
                            const key = `${stu.studentId}|${a.assessmentId}`
                            const highlight = highlightedAssessmentId === a.assessmentId ? 'ring-2 ring-cyan-400 ring-inset' : ''
                            const cellLabel = `${stu.name} score for ${a.name}`

                            if (a.isParent) {
                              return (
                                <CategoryCell
                                  key={a.assessmentId}
                                  label={cellLabel}
                                  result={computeAssessmentForStudent(engineById[a.assessmentId], engineAssessments, live.lookup)}
                                  childStates={engineAssessments
                                    .filter((c) => c.parent_assessment_id === a.assessmentId)
                                    .map((c) => live.lookup[c.assessment_id]?.state ?? 'blank')}
                                  isToggling={togglingKey === key}
                                  toggleDisabled={togglingKey !== null}
                                  onSetStatus={(status) => setStatus(stu.studentId, a.assessmentId, status)}
                                  onClick={() => handleParentAssessmentClick(a)}
                                  className={`bg-blue-50/50 transition-colors hover:bg-blue-100 ${highlight}`}
                                  title="Click to edit individual assessments"
                                />
                              )
                            }

                            const currentValue =
                              editedScores[key] !== undefined
                                ? editedScores[key]
                                : existingScoreMap[key] ?? ''

                            return (
                              <ScoreCell
                                key={a.assessmentId}
                                inputId={nav.inputId(rowIndex, colIndex)}
                                label={cellLabel}
                                value={currentValue}
                                maxScore={Number(a.maxScore || 100)}
                                status={statusMap[key] ?? 'graded'}
                                isToggling={togglingKey === key}
                                toggleDisabled={togglingKey !== null}
                                onChange={(e) => handleScoreChange(stu.studentId, a.assessmentId, e)}
                                onSetStatus={(status) => setStatus(stu.studentId, a.assessmentId, status)}
                                onKeyDown={(e) => nav.onKeyDown(e, rowIndex, colIndex)}
                                className={`py-2 ${highlight}`}
                                corner={
                                  threadStubs[key] && (
                                    <button
                                      onClick={() => router.push(`/messages?thread=${encodeURIComponent(threadStubs[key].conversationId)}`)}
                                      className={`absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-md cursor-pointer ${
                                        threadStubs[key].unreadCount > 0 ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                                      }`}
                                      title={threadStubs[key].unreadCount > 0 ? `${threadStubs[key].unreadCount} unread in the parent conversation` : 'Open parent conversation'}
                                    >
                                      <ChatBubbleLeftRightIcon className="h-2.5 w-2.5" />
                                    </button>
                                  )
                                }
                              />
                            )
                          })}

                          <td className="px-4 py-2 text-center bg-emerald-50/50">
                            <div className={`font-semibold tabular-nums ${pctColor(grade.pct)}`}>
                              {grade.pct == null ? '—' : `${grade.pct.toFixed(1)}%`}
                            </div>
                            <div className="text-[10px] font-normal text-slate-400 tabular-nums whitespace-nowrap">
                              {formatCoverage(grade.coverage)}
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
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Floating action trays. Publish appears when assessments are ticked,
            Save when a score changed. Independent concerns, so both can show. */}
        {(hasUnsavedChanges || selectedAssessmentIds.size > 0) && activeView === 'grades' && (
          <div className="pointer-events-none fixed bottom-4 left-0 right-0 lg:left-72 z-20 flex flex-col items-center gap-2 px-4">
            {selectedAssessmentIds.size > 0 && (
              <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-2xl border border-cyan-200 bg-cyan-50/95 py-2 pl-4 pr-2 shadow-lg backdrop-blur-sm">
                <span className="mr-2 text-sm font-semibold text-cyan-800">
                  {selectedAssessmentIds.size} assessment{selectedAssessmentIds.size === 1 ? '' : 's'} selected
                </span>
                <button
                  onClick={() => setSelectedAssessmentIds(new Set())}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100 cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() =>
                    openPublishModal(
                      displayedAssessments.filter((a: AssessmentPayload) =>
                        selectedAssessmentIds.has(a.assessmentId)
                      )
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 transition-colors cursor-pointer"
                >
                  <MegaphoneIcon className="h-4 w-4" />
                  Publish to parents
                </button>
              </div>
            )}

            {hasUnsavedChanges && (
              <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-900 py-2 pl-4 pr-2 text-white shadow-xl">
                <span className="mr-2 text-sm font-semibold">
                  {Object.keys(editedScores).length} score{Object.keys(editedScores).length === 1 ? '' : 's'} changed
                </span>
                <button
                  onClick={() => setEditedScores({})}
                  disabled={saving}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedParentAssessment && (
        <ChildAssessmentsModal
          isOpen={isChildAssessmentsModalOpen}
          onClose={() => {
            setSelectedParentAssessment(null)
            setIsChildAssessmentsModalOpen(false)
          }}
          parentAssessment={selectedParentAssessment}
          childAssessments={assessments.filter(a => a.parentAssessmentId === selectedParentAssessment.assessmentId)}
          students={students}
          scoresMatrix={scoresMatrix}
          editedScores={editedScores}
          onScoreChange={handleScoreChange}
          classId={classId}
          onRefresh={refreshScoresMatrix}
          publications={publications}
          onPublish={(targets) => {
            setIsChildAssessmentsModalOpen(false)
            openPublishModal(targets)
          }}
        />
      )}

      {standaloneAssessment && (
        <StandaloneAssessmentModal
          key={standaloneAssessment.assessmentId}
          isOpen
          onClose={() => setStandaloneAssessmentId(null)}
          assessment={standaloneAssessment}
          allAssessments={assessments}
          students={students}
          scoresMatrix={scoresMatrix}
          editedScores={editedScores}
          onScoreChange={handleScoreChange}
          classId={classId}
          onRefresh={refreshScoresMatrix}
          publications={publications}
          onPublish={(targets) => {
            setStandaloneAssessmentId(null)
            openPublishModal(targets)
          }}
          onAssessmentMutated={applyAssessmentMutation}
        />
      )}

      <StudentAssessmentsModal
        isOpen={isStudentAssessmentsModalOpen}
        onClose={() => {
          setSelectedStudent(null)
          setIsStudentAssessmentsModalOpen(false)
        }}
        student={selectedStudent}
        classId={classId as string}
        assessments={assessments}
        existingScores={scoresMatrix.map(score => ({
          studentId: score.student_id,
          assessmentId: score.assessment_id,
          score: score.score,
          status: score.status,
        }))}
        currentEditedScores={editedScores}
        onRefreshScores={handleScoreUpdateFromModal}
        threadStubs={threadStubs}
        onOpenConversation={(conversationId) => router.push(`/messages?thread=${encodeURIComponent(conversationId)}`)}
        onMessageGuardians={(assessmentId) => {
          if (!selectedStudent) return
          setMessagePreset({ studentId: selectedStudent.studentId, assessmentId, mode: assessmentId ? 'assessment' : 'general' })
        }}
      />

      <NewConversationModal
        isOpen={messagePreset !== null}
        onClose={() => setMessagePreset(null)}
        tone="staff"
        role="TEACHER"
        classId={classId}
        preset={messagePreset ?? undefined}
        onCreated={(thread) => {
          setMessagePreset(null)
          void loadThreadStubs()
          void bumpUnread()
          router.push(`/messages?thread=${encodeURIComponent(thread.conversation.conversationId)}`)
        }}
      />

      <PublishAssessmentsModal
        isOpen={isPublishModalOpen}
        onClose={() => {
          setIsPublishModalOpen(false)
          setPublishTargets([])
        }}
        classId={classId}
        assessments={publishTargets}
        publications={publications}
        onChanged={handlePublishChanged}
      />

      {selectedExclusionStudent && (
        <ExcludedAssessmentsModal
          isOpen={isExclusionsModalOpen}
          onClose={() => {
            setSelectedExclusionStudent(null)
            setIsExclusionsModalOpen(false)
          }}
          studentId={selectedExclusionStudent.studentId}
          studentName={selectedExclusionStudent.name}
          classId={classId}
          assessments={assessments}
          scoresMatrix={scoresMatrix}
          onUpdate={refreshScoresMatrix}
        />
      )}
    </>
  )
}

export default GradebookClass
