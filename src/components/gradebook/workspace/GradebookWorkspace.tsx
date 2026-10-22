// src/components/gradebook/workspace/GradebookWorkspace.tsx
// The class's score grid: Grades → Scores on the class page (it was the
// /gradebook/[classId] page). One column per category (opening the category
// window) or standalone assessment (scored in place, its header opens the
// column window), the term total pinned at the far right.
//
// Scores autosave (D17): each cell queues what the teacher types through
// useScoreAutosave, which saves after 600 ms of quiet and at once when the
// teacher leaves the cell (blur, Enter, Tab, arrows), switches sub-tab, leaves
// the page or hides it. There is no Save button; the Saved pill in the Grades
// toolbar shows the state and failed cells are outlined with Retry. What is
// saved, and through which endpoint, is exactly what the old Save sent.
//
// Classwork (spec D3, Teacher-Grades board): a column filled by an assignment
// or quiz keeps its scores as drafts on the students' submissions until it is
// published, so the grid lays the classwork overlay
// (GET /api/classroom/classes/:id/grid-overlay, re-read after saves) over the
// score matrix: drafts grey and italic, "In" for work turned in with no grade
// yet, a rose dot for work past due, words under category scores, and
// "Publish N" on a column holding N drafts. Drafts never count in the totals.
//
// Layout (UX review E1): the grid fills the page width; category scores and
// the term total are large and coloured by band (scoreTone), a category says
// "Missing work" / "To grade" in words, and each browser keeps its own
// comfortable or compact rows.
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getStudentsInClass,
  getAssessmentsByClass,
  getScoresByClass,
  downloadGradebookExcel,
  type UpsertScoresResponse,
} from '@/services/classService'
import type { ClassPayload } from '@/services/types/class'
import type { StudentPayload } from '@/services/types/student'
import type { AssessmentPayload } from '@/services/types/assessment'
import StudentAssessmentsModal from '@/components/assessments/student/studentAssessmentsModal'
import ChildAssessmentsModal from '@/components/assessments/child/ChildAssessmentsModal'
import ExcludedAssessmentsModal from '@/components/assessments/excluded/excludedAssessmentsModal'
import AssessmentJumper from '@/components/gradebook/AssessmentJumper'
import PublishAssessmentsModal from '@/components/gradebook/publish/PublishAssessmentsModal'
import { getPublicationState } from '@/services/assessmentPublicationService'
import type { AssessmentPublicationState } from '@/services/types/assessmentPublication'
import StandaloneAssessmentModal from '@/components/assessments/standalone/StandaloneAssessmentModal'
import PublishStateBadge from '@/components/assessments/publish/PublishStateBadge'
import { summarizePublication } from '@/lib/publicationSummary'
import { mergeAssessmentMutation } from '@/lib/assessmentMutation'
import type { AssessmentMutation } from '@/components/assessments/section/useAssessmentForm'
import { buildScoreLookups, type ScoreRow } from '@/components/assessments/scores/types'
import { buildScoreLookup, computeAssessmentForStudent, computeClassGrade, formatCoverage } from '@/lib/gradeEngine'
import { groupRowsByStudent, liveRowsForStudent, toEngineAssessments } from '@/components/assessments/scores/liveGrade'
import ScoreCell from '@/components/assessments/scores/ScoreCell'
import CategoryCell from '@/components/assessments/scores/CategoryCell'
import { useCellStatus } from '@/components/assessments/scores/useCellStatus'
import { useScoreGridNav } from '@/components/assessments/scores/useScoreGridNav'
import { writeStoredGrades, type StoredGrades } from '@/lib/bulkFeedbackGrades'
import { getThreadStubs } from '@/services/messagingService'
import type { ThreadStub } from '@/services/types/messaging'
import NewConversationModal from '@/components/messaging/NewConversationModal'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useScoreAutosave } from '@/hooks/useScoreAutosave'
import type { CellValue } from '@/lib/scoreAutosaveQueue'
import {
  applySavedScores,
  categoryDot,
  draftCount,
  EMPTY_OVERLAY,
  indexOverlay,
  isTurnInColumn,
  notPostedLabel,
  overlayCell,
  withoutDraftColumns,
  type OverlayIndex,
} from '@/lib/gridOverlay'
import { classItemHref } from '@/lib/classroomRoutes'
import { firstName, kindWord, OUTSIDE_AUDIENCE_CODE, publishOutcome } from '@/lib/gradingView'
import { isApiError } from '@/services/apiClient'
import { getGridOverlay, publishGrades } from '@/services/gradingService'
import { getClasswork } from '@/services/classworkService'
import type { ItemStatus } from '@/services/types/classwork'
import type { ScoreCellMark } from '@/components/assessments/scores/ScoreCell'
import { useNotificationStore } from '@/store/useNotificationStore'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import GridLegend from '@/components/gradebook/GridLegend'
import {
  MinusCircleIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import Avatar from '@/components/avatar/Avatar'
import { readGridDensity, scoreTone, writeGridDensity, type GridDensity } from '@/lib/gradesLayout'

interface GradebookWorkspaceProps {
  classId: string
  classData: ClassPayload
  /** The class average (null when nothing is graded yet), for the Grades toolbar. */
  onClassAverage?: (average: number | null) => void
  /**
   * ?focus= (transient): a column to bring into view once the grid has
   * loaded. A top-level column scrolls into view and flashes; an assessment
   * inside a category opens the category window on it.
   */
  focusAssessmentId?: string | null
  /** The focus was applied (the page drops ?focus=). */
  onFocusHandled?: () => void
}

/** A turn-in column's "Publish N": publishes its drafts after a confirm (the count is read live). */
interface DraftPublish {
  assessment: AssessmentPayload
  itemId: string
  /** The column also holds grades for students the item isn't for: publish it whole instead. */
  outside: boolean
}

const OVERLAY_REFRESH_MS = 800

const pointsOf = (a: AssessmentPayload) => a.weightPoints || a.weightPercent || 0

// Pinned at the far right of the grid, with a shadow over the columns that
// scroll beneath it.
const TOTAL_SHADOW = 'sm:shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.18)]'
// On a phone the term total scrolls with the row; pinned, it would leave no room for the scores.
const TOTAL_PIN = 'sm:sticky sm:right-0'

export default function GradebookWorkspace({
  classId,
  classData,
  onClassAverage,
  focusAssessmentId = null,
  onFocusHandled,
}: GradebookWorkspaceProps) {
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)

  // The classwork layer: turn-in columns and their draft / In / past-due
  // cells, and the posting state of each column's classwork (by assessment).
  const [overlay, setOverlay] = useState<OverlayIndex>(EMPTY_OVERLAY)
  const [itemStatus, setItemStatus] = useState<Record<string, ItemStatus>>({})
  const [draftPublish, setDraftPublish] = useState<DraftPublish | null>(null)
  const [publishingDrafts, setPublishingDrafts] = useState(false)
  // The column the category window opens on (?focus= on an assessment inside a category).
  const [modalFocusId, setModalFocusId] = useState<string | null>(null)

  // Reads can overlap (a save's re-read, a status change, a Publish): only
  // the newest one is applied.
  const overlayTicketRef = useRef(0)
  const loadOverlay = useCallback(async () => {
    const ticket = ++overlayTicketRef.current
    try {
      const res = await getGridOverlay(classId)
      if (ticket === overlayTicketRef.current) setOverlay(indexOverlay(res.data))
    } catch (err) {
      // The overlay is informational: grade entry goes on without it.
      console.error('Error loading the classwork overlay:', err)
    }
  }, [classId])

  // After saves the overlay is read again, once things go quiet.
  const overlayTimerRef = useRef<number | null>(null)
  const refreshOverlaySoon = useCallback(() => {
    if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current)
    overlayTimerRef.current = window.setTimeout(() => {
      overlayTimerRef.current = null
      void loadOverlay()
    }, OVERLAY_REFRESH_MS)
  }, [loadOverlay])
  useEffect(
    () => () => {
      if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current)
    },
    [],
  )

  const loadItemStatus = useCallback(async () => {
    try {
      const res = await getClasswork(classId)
      const next: Record<string, ItemStatus> = {}
      for (const item of res.data.items) if (item.gradebook) next[item.gradebook.assessmentId] = item.effectiveStatus
      setItemStatus(next)
    } catch (err) {
      console.error('Error loading the classwork list:', err)
    }
  }, [classId])

  const [students, setStudents] = useState<StudentPayload[]>([])
  const [assessments, setAssessments] = useState<AssessmentPayload[]>([])
  const [scoresMatrix, setScoresMatrix] = useState<ScoreRow[]>([])

  // Child assessments (category) window
  const [selectedParentAssessment, setSelectedParentAssessment] = useState<AssessmentPayload | null>(null)
  // Standalone column window. Stored by id so an edit made inside it is
  // reflected straight away (the object is re-derived from `assessments`).
  const [standaloneAssessmentId, setStandaloneAssessmentId] = useState<string | null>(null)

  // Per-student window
  const [selectedStudent, setSelectedStudent] = useState<{ studentId: string; name: string } | null>(null)
  // Excused assessments window
  const [selectedExclusionStudent, setSelectedExclusionStudent] = useState<{ studentId: string; name: string } | null>(null)

  // Assessment jumper: refs for horizontal scroll-to-column + transient highlight
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const thRefs = useRef<Record<string, HTMLTableCellElement | null>>({})
  const highlightTimeoutRef = useRef<number | null>(null)
  const [highlightedAssessmentId, setHighlightedAssessmentId] = useState<string | null>(null)

  // Publishing: which assessments are live, and which are ticked for the
  // next publish action.
  const [publications, setPublications] = useState<Record<string, AssessmentPublicationState>>({})
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<Set<string>>(new Set())
  const [publishTargets, setPublishTargets] = useState<AssessmentPayload[]>([])
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)

  // Parent conversations: chips beside a student's name (open threads) and
  // inside a score cell (that assessment has a thread). Keyed "studentId|assessmentId".
  const [threadStubs, setThreadStubs] = useState<Record<string, ThreadStub>>({})
  const [messagePreset, setMessagePreset] = useState<{ studentId?: string; assessmentId?: string; mode?: 'assessment' | 'general' } | null>(null)
  const bumpUnread = useMessagingStore((s) => s.bump)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  // Saved rows come back from POST …/scores: merge them in place (by
  // student and assessment) instead of re-reading the whole matrix. A save
  // acknowledged while the grid is still loading (the teacher came back while
  // it was in flight) may postdate the GET, so the matrix is read once more.
  const loadedRef = useRef(false)
  const ackedWhileLoadingRef = useRef(false)
  const mergeSaved = useCallback((res: UpsertScoresResponse) => {
    // Drafts (turn-in columns not published yet) land in the overlay at once.
    setOverlay((prev) => applySavedScores(prev, res))
    refreshOverlaySoon()
    if (!loadedRef.current) {
      ackedWhileLoadingRef.current = true
      return
    }
    const rows = Array.isArray(res?.data) ? res.data : []
    if (rows.length === 0) return
    const byKey = new Map(rows.map((r) => [`${r.student_id}|${r.assessment_id}`, r]))
    setScoresMatrix((prev) =>
      prev.map((row) => {
        const hit = byKey.get(`${row.student_id}|${row.assessment_id}`)
        if (!hit) return row
        const status = hit.status ?? row.status
        return { ...row, score: hit.score, status, is_excluded: status === 'excused' }
      }),
    )
  }, [refreshOverlaySoon])

  const autosave = useScoreAutosave({ classId, onSaved: mergeSaved })
  const { pendingMap, drop: dropLocal } = autosave

  // A value queued for a column or student that no longer exists (deleted in
  // Assessments & categories, unenrolled) can never save, and has no cell to
  // retype: forget it whenever the matrix is read.
  const localRef = useRef({ pendingMap, dropLocal })
  useEffect(() => {
    localRef.current = { pendingMap, dropLocal }
  }, [pendingMap, dropLocal])
  const forgetGoneKeys = useCallback((rows: ScoreRow[]) => {
    const present = new Set(rows.map((r) => `${r.student_id}|${r.assessment_id}`))
    const { pendingMap: local, dropLocal: forget } = localRef.current
    for (const key of Object.keys(local())) if (!present.has(key)) forget(key)
  }, [])

  const loadThreadStubs = useCallback(async () => {
    try {
      const res = await getThreadStubs({ classId })
      if (res.status === 'success' && res.data) {
        setThreadStubs(Object.fromEntries(res.data.map((st) => [`${st.studentId}|${st.assessmentId}`, st])))
      }
    } catch (err) {
      // Chips are informational — a failure here must not block grade entry.
      console.error('Error loading conversation stubs:', err)
    }
  }, [classId])

  // Publish state drives the Live / Not sent badges on each column header.
  const loadPublications = useCallback(async () => {
    try {
      const res = await getPublicationState(classId)
      if (res.status === 'success' && res.data) {
        setPublications(
          Object.fromEntries(res.data.map((p) => [p.assessmentId, p])) as Record<string, AssessmentPublicationState>,
        )
      }
    } catch (err) {
      // Badges are informational — a failure here must not block grade entry.
      console.error('Error loading publication state:', err)
    }
  }, [classId])

  // Re-read the matrix (after a missing/excused flag) and the overlay (a flag
  // on an unpublished turn-in column is a draft). A cell flagged since the
  // teacher typed into it keeps the flag: its unsent value is forgotten.
  const refreshScoresMatrix = useCallback(async () => {
    void loadOverlay()
    try {
      const refreshed = await getScoresByClass(classId)
      if (refreshed.status === 'success') {
        const rows = refreshed.data as ScoreRow[]
        setScoresMatrix(rows)
        forgetGoneKeys(rows)
        const flagged = new Set(
          rows
            .filter((r) => r.status === 'missing' || r.status === 'excused')
            .map((r) => `${r.student_id}|${r.assessment_id}`),
        )
        for (const key of Object.keys(pendingMap())) if (flagged.has(key)) dropLocal(key)
      }
    } catch (err) {
      console.error('Error refreshing scores matrix:', err)
    }
  }, [classId, pendingMap, dropLocal, forgetGoneKeys, loadOverlay])

  // Missing / excused flags save straight away (after any typed score), then
  // the matrix is re-read.
  const { togglingKey, setStatus } = useCellStatus({ classId, onRefresh: refreshScoresMatrix, autosave })
  const nav = useScoreGridNav('grade', students.length, assessments.filter((a) => !a.parentAssessmentId).length)

  const load = useCallback(() => {
    Promise.all([getStudentsInClass(classId), getAssessmentsByClass(classId), getScoresByClass(classId)])
      .then(([stuRes, assessRes, scoreRes]) => {
        if (stuRes.status !== 'success') throw new Error(stuRes.message || 'Failed to load students')
        if (assessRes.status !== 'success') throw new Error(assessRes.message || 'Failed to load assessments')
        if (scoreRes.status !== 'success') throw new Error(scoreRes.message || 'Failed to load scores')
        const rows = scoreRes.data as ScoreRow[]
        setStudents(stuRes.data)
        setAssessments(assessRes.data)
        setScoresMatrix(rows)
        setError(null)
        forgetGoneKeys(rows)
        loadedRef.current = true
        if (ackedWhileLoadingRef.current) {
          ackedWhileLoadingRef.current = false
          getScoresByClass(classId)
            .then((again) => {
              if (again.status === 'success') setScoresMatrix(again.data as ScoreRow[])
            })
            .catch((err) => console.error('Error re-reading scores:', err))
        }
        void loadPublications()
        void loadThreadStubs()
        void loadOverlay()
        void loadItemStatus()
      })
      .catch((err: unknown) => {
        console.error(err)
        setError(err instanceof Error && err.message ? err.message : 'Unexpected error')
      })
      .finally(() => setLoading(false))
  }, [classId, loadPublications, loadThreadStubs, forgetGoneKeys, loadOverlay, loadItemStatus])

  useEffect(() => {
    load()
  }, [load])

  // ---- Derived grid data (all grade maths goes through the engine) ----
  const displayedAssessments = useMemo(() => assessments.filter((a) => !a.parentAssessmentId), [assessments])
  const sortedStudents = useMemo(() => [...students].sort((a, b) => a.name.localeCompare(b.name)), [students])
  const { existing: existingScoreMap, status: statusMap } = useMemo(() => buildScoreLookups(scoresMatrix), [scoresMatrix])
  const engineAssessments = useMemo(() => toEngineAssessments(assessments), [assessments])
  const engineById = useMemo(
    () => Object.fromEntries(engineAssessments.map((a) => [a.assessment_id, a])),
    [engineAssessments],
  )
  const rowsByStudent = useMemo(() => groupRowsByStudent(scoresMatrix), [scoresMatrix])

  // A turn-in column not published yet keeps what is typed into it as drafts.
  const keepsDrafts = useCallback(
    (assessmentId: string) =>
      isTurnInColumn(overlay, assessmentId) && publications[assessmentId] !== undefined && !publications[assessmentId].isPublished,
    [overlay, publications],
  )
  const childIdsOf = useMemo(() => {
    const out: Record<string, string[]> = {}
    for (const a of assessments) if (a.parentAssessmentId) (out[a.parentAssessmentId] ||= []).push(a.assessmentId)
    return out
  }, [assessments])
  // What "Publish" publishes besides the gradebook's own cells: a column's
  // drafts, and for a category the drafts of every column inside it.
  const draftsByColumn = useMemo(() => {
    const out: Record<string, number> = {}
    for (const a of assessments) {
      const n = a.isParent
        ? (childIdsOf[a.assessmentId] ?? []).reduce((sum, id) => sum + draftCount(overlay, id), 0)
        : draftCount(overlay, a.assessmentId)
      if (n > 0) out[a.assessmentId] = n
    }
    return out
  }, [assessments, childIdsOf, overlay])
  const notPosted = useMemo(() => {
    const out: Record<string, string> = {}
    for (const [id, status] of Object.entries(itemStatus)) {
      const label = notPostedLabel(status)
      if (label) out[id] = label
    }
    return out
  }, [itemStatus])

  /** One cell with the classwork layer over the matrix: its saved value and status, and its marks. */
  const cellFor = useCallback(
    (studentId: string, assessmentId: string) => {
      const key = `${studentId}|${assessmentId}`
      return overlayCell(
        overlay,
        studentId,
        assessmentId,
        { saved: existingScoreMap[key] ?? null, status: statusMap[key] ?? 'graded' },
        !keepsDrafts(assessmentId),
      )
    },
    [overlay, existingScoreMap, statusMap, keepsDrafts],
  )

  // Live rows merge the values not yet confirmed by the server over the saved
  // matrix, so totals show what the grid shows. Drafts are not grades: a
  // value typed into a column that keeps drafts never counts.
  const liveByStudent = useMemo(() => {
    const local = withoutDraftColumns(pendingMap(), keepsDrafts)
    return new Map(
      students.map((stu) => {
        const rows = liveRowsForStudent(stu.studentId, rowsByStudent[stu.studentId], local)
        return [stu.studentId, { lookup: buildScoreLookup(rows), grade: computeClassGrade(engineAssessments, rows) }]
      }),
    )
  }, [students, rowsByStudent, pendingMap, engineAssessments, keepsDrafts])

  // Class average = mean of the students who have any graded work.
  const assessedPcts = [...liveByStudent.values()].map((v) => v.grade.pct).filter((pct): pct is number => pct != null)
  const classAverage = assessedPcts.length > 0 ? assessedPcts.reduce((sum, pct) => sum + pct, 0) / assessedPcts.length : null
  useEffect(() => {
    if (!loading && !error) onClassAverage?.(classAverage)
  }, [classAverage, loading, error, onClassAverage])

  // Comfortable or compact rows, remembered for this browser (read after
  // mount so the server render and the first client render agree).
  const [density, setDensity] = useState<GridDensity>('comfortable')
  useEffect(() => {
    setDensity(readGridDensity(window.localStorage))
  }, [])
  const toggleDensity = () => {
    const next: GridDensity = density === 'compact' ? 'comfortable' : 'compact'
    setDensity(next)
    writeGridDensity(window.localStorage, next)
  }
  const rowPad = density === 'compact' ? 'py-1.5' : 'py-3'

  // Hand each student's live grade (null = nothing graded yet) and coverage to
  // the report card and progress comment sub-tabs (bulkFeedbackGrades).
  const storedGrades = useMemo(() => {
    const out: StoredGrades = {}
    students.forEach((stu) => {
      const grade = liveByStudent.get(stu.studentId)?.grade
      out[stu.studentId] = { pct: grade?.pct ?? null, coverage: grade?.coverage ?? null }
    })
    return JSON.stringify(out)
  }, [students, liveByStudent])
  useEffect(() => {
    if (loading || error || students.length === 0) return
    writeStoredGrades(classId, JSON.parse(storedGrades) as StoredGrades)
  }, [classId, storedGrades, loading, error, students.length])

  // The per-student window re-reads its inputs whenever they change identity,
  // so they are memoized: its saved scores (the gradebook's, which is what
  // counts), the classwork drafts it shows marked (never counted), and the
  // local values in its old shape ('' = cleared).
  const studentModalScores = useMemo(
    () =>
      scoresMatrix.map((score) => ({
        studentId: score.student_id,
        assessmentId: score.assessment_id,
        score: score.score,
        status: score.status,
      })),
    [scoresMatrix],
  )
  const studentModalDrafts = useMemo(() => {
    const out: Record<string, { score: number | null; status: 'graded' | 'missing' | 'excused' }> = {}
    for (const cell of Object.values(overlay.cells)) {
      if (cell.state !== 'draft') continue
      const status = cell.draftStatus ?? 'graded'
      out[`${cell.studentId}|${cell.assessmentId}`] = { score: status === 'missing' ? null : cell.draftScore, status }
    }
    return out
  }, [overlay])
  const studentModalLocal = useMemo(
    () =>
      Object.fromEntries(Object.entries(pendingMap()).map(([k, v]) => [k, v == null ? '' : v])) as Record<
        string,
        number | ''
      >,
    [pendingMap],
  )

  // Scroll the grid horizontally so the clicked assessment's column is centered.
  // Manual scrollLeft math (not scrollIntoView) so the page never scrolls vertically.
  const handleJumpToAssessment = useCallback((assessmentId: string) => {
    const container = scrollContainerRef.current
    const th = thRefs.current[assessmentId]
    if (!container || !th) return
    const targetLeft = th.offsetLeft - (container.clientWidth - th.clientWidth) / 2
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
    setHighlightedAssessmentId(assessmentId)
    if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current)
    highlightTimeoutRef.current = window.setTimeout(() => setHighlightedAssessmentId(null), 1500)
  }, [])

  // ?focus=: once the grid is on screen, bring the column into view (or open
  // its category window on it), then let the page drop the param.
  useEffect(() => {
    if (loading || error || !focusAssessmentId) return
    const frame = window.requestAnimationFrame(() => {
      const target = assessments.find((a) => a.assessmentId === focusAssessmentId)
      const parent = target?.parentAssessmentId
        ? assessments.find((a) => a.assessmentId === target.parentAssessmentId)
        : null
      if (target && parent) {
        setModalFocusId(target.assessmentId)
        setSelectedParentAssessment(parent)
      } else if (target) {
        handleJumpToAssessment(target.assessmentId)
      }
      onFocusHandled?.()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [loading, error, focusAssessmentId, assessments, handleJumpToAssessment, onFocusHandled])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
          <AcademicCapIcon className="h-8 w-8 text-rose-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-900">The grades couldn&apos;t be loaded</h3>
        <p className="mb-6 text-rose-600">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            load()
          }}
          className="cursor-pointer rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200"
        >
          Try again
        </button>
      </div>
    )
  }

  const standaloneAssessment = standaloneAssessmentId
    ? assessments.find((a) => a.assessmentId === standaloneAssessmentId && !a.isParent) ?? null
    : null

  const excusedCountFor = (studentId: string) =>
    (rowsByStudent[studentId] || []).filter((r) => !r.is_parent && r.status === 'excused').length
  const openThreadsFor = (studentId: string) =>
    Object.values(threadStubs).filter((st) => st.studentId === studentId && st.status === 'open').length

  // A category is outlined when a score inside it failed to save.
  const failedCategoryFor = (studentId: string, categoryId: string) =>
    assessments.some(
      (c) => c.parentAssessmentId === categoryId && autosave.failedKeys.has(`${studentId}|${c.assessmentId}`),
    )

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

  // A Publish also copies a turn-in column's drafts into the gradebook, so
  // the matrix and the overlay are read again with the publish state.
  const handlePublishChanged = async () => {
    await Promise.all([loadPublications(), refreshScoresMatrix()])
    setSelectedAssessmentIds(new Set())
  }

  // What "manage" means for a column: the item itself, plus (for a category)
  // whichever children are already live, so the publish window offers
  // Unpublish / resend for what families can actually see.
  const manageTargets = (a: AssessmentPayload): AssessmentPayload[] =>
    a.isParent
      ? [a, ...assessments.filter((c) => c.parentAssessmentId === a.assessmentId && publications[c.assessmentId]?.isPublished)]
      : [a]

  // A typed score: queued for autosave. Flagged cells (and the cell whose
  // flag is being set) never take a number, so a stray value can't clear a flag.
  const handleValue = (studentId: string, assessmentId: string, value: CellValue) => {
    const key = `${studentId}|${assessmentId}`
    const cell = cellFor(studentId, assessmentId)
    if (cell.status !== 'graded' || togglingKey === key) return
    autosave.queue(studentId, assessmentId, value, cell.saved)
  }

  // The marks a turn-in column's cell carries (none on a plain column).
  const markFor = (assessmentId: string, cell: ReturnType<typeof cellFor>, shown: CellValue): ScoreCellMark | undefined =>
    isTurnInColumn(overlay, assessmentId)
      ? {
          draft: cell.draft || (keepsDrafts(assessmentId) && shown != null),
          turnedIn: cell.turnedIn,
          late: cell.isLate,
          derivedMissing: cell.derivedMissing,
        }
      : undefined

  const studentFirst = (studentId: string) => firstName(students.find((s) => s.studentId === studentId)?.name) || 'the student'

  // "Publish N" on a turn-in column: asks first, then publishes every draft.
  const openDraftPublish = async (a: AssessmentPayload) => {
    const column = overlay.columns[a.assessmentId]
    if (!column || draftCount(overlay, a.assessmentId) === 0) return
    // What was just typed is saved first; its draft lands in the overlay, so
    // the confirm's count (read as it renders) includes it.
    await autosave.flush()
    setDraftPublish({ assessment: a, itemId: column.itemId, outside: false })
  }
  const draftPublishCount = draftPublish ? draftCount(overlay, draftPublish.assessment.assessmentId) : 0
  const draftPublishWord = draftPublish ? kindWord(overlay.columns[draftPublish.assessment.assessmentId]?.kind ?? 'assignment') : 'assignment'

  const runDraftPublish = async () => {
    if (!draftPublish || publishingDrafts) return
    setPublishingDrafts(true)
    try {
      await autosave.flush()
      if (autosave.hasFailures()) {
        showNotification("Some grades didn't save. Retry them, then publish.", 'error')
        return
      }
      const res = await publishGrades(draftPublish.itemId, 'graded')
      const outcome = publishOutcome(res.data, studentFirst, true, draftPublishWord)
      showNotification(outcome.message, outcome.tone === 'success' ? 'success' : 'info')
      setDraftPublish(null)
      await Promise.all([refreshScoresMatrix(), loadPublications()])
    } catch (err) {
      if (isApiError(err) && err.code === OUTSIDE_AUDIENCE_CODE) {
        setDraftPublish((d) => (d ? { ...d, outside: true } : d))
      } else {
        showNotification(err instanceof Error && err.message ? err.message : "The drafts couldn't be published.", 'error')
      }
    } finally {
      setPublishingDrafts(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      await autosave.flush()
      const blob = await downloadGradebookExcel(classId)
      const safeSubject = String(classData.subject).trim().replace(/\s+/g, '_')
      const fileName = `Gradebook_Grade_${classData.grade}_${safeSubject}.xlsx`
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setExportError(null)
    } catch (err) {
      console.error(err)
      setExportError('Failed to download Excel sheet')
    }
  }

  const openColumn = (a: AssessmentPayload) => {
    if (a.isParent) setSelectedParentAssessment(a)
    else setStandaloneAssessmentId(a.assessmentId)
  }

  // Name / points / max score / date edited from the column window (a move
  // into a category, or a new category, arrives as the class's whole list).
  // The header, the Total column and the score clamp all read `assessments`,
  // so a merge is enough — no refetch. A lower max score pulls a typed value
  // down with it, so a 95 typed against /100 is not saved against /50.
  const applyAssessmentMutation = (result: AssessmentMutation) => {
    const local = pendingMap()
    result.updated.forEach((u) => {
      const before = assessments.find((a) => a.assessmentId === u.assessmentId)
      const max = Number(u.maxScore)
      if (!before || !(max > 0) || Number(before.maxScore) === max) return
      for (const [key, value] of Object.entries(local)) {
        const [studentId, assessmentId] = key.split('|')
        if (assessmentId === u.assessmentId && value != null && value > max) {
          autosave.queue(studentId, assessmentId, max, existingScoreMap[key] ?? null)
        }
      }
    })
    setAssessments((prev) => mergeAssessmentMutation(prev, result))
  }

  // "Live" counts the items families can actually see: standalones plus the
  // items inside categories. A category's own flag is not an item.
  const gradedItems = assessments.filter((a) => !a.isParent)
  const liveItemCount = gradedItems.filter((a) => publications[a.assessmentId]?.isPublished).length
  const liveLabel =
    gradedItems.length === displayedAssessments.length
      ? `${liveItemCount} published`
      : `${liveItemCount} of ${gradedItems.length} items published`

  return (
    <div className="space-y-4">
      {/* The class at a glance, and the grid's own actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
          <span>
            <strong className="font-semibold tabular-nums text-slate-900">{students.length}</strong>{' '}
            {students.length === 1 ? 'student' : 'students'}
          </span>
          <span>
            <strong className="font-semibold tabular-nums text-slate-900">{displayedAssessments.length}</strong>{' '}
            {displayedAssessments.length === 1 ? 'column' : 'columns'}
            {displayedAssessments.length > 0 && `, ${liveLabel}`}
          </span>
          <span>
            {assessedPcts.length} of {students.length} students assessed
          </span>
          <span className="flex items-baseline gap-1.5">
            Class average
            <strong className={`font-display text-lg font-semibold tabular-nums ${classAverage == null ? 'text-slate-400' : 'text-slate-900'}`}>
              {classAverage == null ? '—' : `${classAverage.toFixed(1)}%`}
            </strong>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleDensity}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            title={density === 'compact' ? 'Show taller rows' : 'Fit more students on the screen'}
          >
            {density === 'compact' ? (
              <ArrowsPointingOutIcon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowsPointingInIcon className="h-4 w-4" aria-hidden="true" />
            )}
            {density === 'compact' ? 'Comfortable rows' : 'Compact rows'}
          </button>
          <button
            type="button"
            onClick={() => setMessagePreset({})}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-sm font-medium text-cyan-700 shadow-sm transition-all hover:bg-cyan-100"
            title="Write to a student's guardians"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Message parents
          </button>
          <button
            type="button"
            onClick={() => void handleExportExcel()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            title="Download this class's gradebook as a spreadsheet"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {exportError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{exportError}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <AssessmentJumper
          assessments={displayedAssessments}
          onJump={handleJumpToAssessment}
          activeAssessmentId={highlightedAssessmentId}
        />
        <div className="overflow-x-auto" ref={scrollContainerRef}>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-20 min-w-[130px] border-b border-slate-100 bg-slate-50 px-4 py-3 text-left text-[13px] font-semibold text-slate-700 sm:min-w-[240px]">
                  Student
                </th>
                {displayedAssessments.map((a) => {
                  const children = a.isParent ? assessments.filter((c) => c.parentAssessmentId === a.assessmentId) : []
                  const detail = a.isParent
                    ? `${pointsOf(a)} pts · ${children.length} ${children.length === 1 ? 'assessment' : 'assessments'}`
                    : `${pointsOf(a)} pts · out of ${Number(a.maxScore || 100)}`
                  return (
                    <th
                      key={a.assessmentId}
                      ref={(el) => {
                        thRefs.current[a.assessmentId] = el
                      }}
                      className={`min-w-[150px] cursor-pointer border-b border-l border-slate-100 px-3 py-3 text-center align-top transition-colors duration-300 hover:bg-slate-100 ${
                        highlightedAssessmentId === a.assessmentId ? 'ring-2 ring-inset ring-cyan-400' : ''
                      }`}
                      onClick={() => openColumn(a)}
                      title={a.isParent ? 'Open this category\'s assessments' : 'See every score, edit details or publish'}
                    >
                      <div className="flex items-start justify-center gap-1.5">
                        {/* stopPropagation: the header itself opens the column's window. */}
                        <input
                          type="checkbox"
                          checked={selectedAssessmentIds.has(a.assessmentId)}
                          onChange={() => toggleAssessmentSelected(a.assessmentId)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-400"
                          title="Select for publishing"
                          aria-label={`Select ${a.name} for publishing`}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openColumn(a)
                          }}
                          className="flex min-w-0 cursor-pointer flex-col items-center gap-0.5 rounded-lg px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                        >
                          <span
                            className={`flex max-w-[220px] items-center gap-1 font-display text-[15px] font-semibold ${
                              a.isParent ? 'text-cyan-700' : 'text-slate-800'
                            }`}
                          >
                            <span className="truncate">{a.name}</span>
                            {a.isParent && <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                          </span>
                          <span className="whitespace-nowrap text-xs font-normal text-slate-500">{detail}</span>
                        </button>
                      </div>
                      {notPosted[a.assessmentId] && (
                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {notPosted[a.assessmentId]}
                        </span>
                      )}
                      {/* A turn-in column holding drafts offers "Publish N";
                          other columns keep their publish state. Categories
                          are judged by their children ("2 of 13 sent"), not
                          the category's own flag. Clicking a live badge
                          manages publishing; "Not sent" falls through to the header. */}
                      {!a.isParent && draftCount(overlay, a.assessmentId) > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void openDraftPublish(a)
                          }}
                          className="mt-1 cursor-pointer rounded-full bg-cyan-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-cyan-700"
                          title="Publish the drafts in this column"
                        >
                          Publish {draftCount(overlay, a.assessmentId)}
                        </button>
                      ) : (
                        <PublishStateBadge
                          summary={summarizePublication(a, assessments, publications)}
                          variant="header"
                          onClick={() => openPublishModal(manageTargets(a))}
                        />
                      )}
                      {!a.isParent && overlay.columns[a.assessmentId] && (
                        <Link
                          href={classItemHref(classId, overlay.columns[a.assessmentId].itemId, undefined, { from: 'grades' })}
                          onClick={(e) => {
                            e.stopPropagation()
                            void autosave.flush()
                          }}
                          className="mt-1 block text-[11px] font-medium text-cyan-700 hover:text-cyan-800"
                        >
                          Grade with work
                        </Link>
                      )}
                    </th>
                  )
                })}
                <th
                  className={`${TOTAL_PIN} z-20 min-w-[110px] border-b border-l-2 border-slate-100 border-l-emerald-100 bg-emerald-50 px-4 py-3 text-center font-display text-sm font-semibold text-emerald-800 ${TOTAL_SHADOW}`}
                >
                  Term total
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={2 + displayedAssessments.length} className="px-4 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <UserGroupIcon className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">No students enrolled</h3>
                    <p className="text-sm text-slate-500">No students are currently enrolled in this class.</p>
                  </td>
                </tr>
              ) : (
                sortedStudents.map((stu, rowIndex) => {
                  const live = liveByStudent.get(stu.studentId) ?? {
                    lookup: {},
                    grade: computeClassGrade(engineAssessments, []),
                  }
                  const grade = live.grade
                  return (
                    <tr key={stu.studentId} className="transition-colors hover:bg-slate-50/50">
                      <td className={`sticky left-0 z-10 border-r border-t border-slate-100 bg-white px-4 ${rowPad}`}>
                        <div className="flex items-center gap-2.5">
                          {/* No avatar on a phone: the name column stays narrow enough to leave room for scores. */}
                          <span className="hidden shrink-0 sm:inline-flex">
                            <Avatar student name={stu.name} avatar={stu.avatar ?? null} photoUrl={stu.photoUrl} size={density === 'compact' ? 24 : 30} />
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              void autosave.flush()
                              setSelectedStudent({ studentId: stu.studentId, name: stu.name })
                            }}
                            className="cursor-pointer text-left text-[15px] font-medium text-slate-900 transition-colors hover:text-cyan-600 sm:whitespace-nowrap"
                            title="View or edit every assessment for this student"
                          >
                            {stu.name}
                          </button>
                          {openThreadsFor(stu.studentId) > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/messages?classId=${encodeURIComponent(classId)}&q=${encodeURIComponent(stu.name)}`)
                              }
                              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-1.5 py-px text-[10px] font-medium text-cyan-700 hover:bg-cyan-100"
                              title={`${openThreadsFor(stu.studentId)} open parent conversation(s)`}
                            >
                              <ChatBubbleLeftRightIcon className="h-3 w-3" />
                              {openThreadsFor(stu.studentId)}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              void autosave.flush()
                              setSelectedExclusionStudent({ studentId: stu.studentId, name: stu.name })
                            }}
                            className="flex cursor-pointer items-center gap-1 text-slate-400 hover:text-slate-600"
                            title={`Excused assessments (${excusedCountFor(stu.studentId)} excused)`}
                          >
                            <MinusCircleIcon className="h-4 w-4" />
                            {excusedCountFor(stu.studentId) > 0 && (
                              <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                                {excusedCountFor(stu.studentId)}
                              </span>
                            )}
                          </button>
                        </div>
                      </td>

                      {displayedAssessments.map((a, colIndex) => {
                        const key = `${stu.studentId}|${a.assessmentId}`
                        const highlight = highlightedAssessmentId === a.assessmentId ? 'ring-2 ring-inset ring-cyan-400' : ''
                        const cellLabel = `${stu.name} score for ${a.name}`

                        if (a.isParent) {
                          const childStates = engineAssessments
                            .filter((c) => c.parent_assessment_id === a.assessmentId)
                            .map((c) => live.lookup[c.assessment_id]?.state ?? 'blank')
                          return (
                            <CategoryCell
                              key={a.assessmentId}
                              label={cellLabel}
                              result={computeAssessmentForStudent(engineById[a.assessmentId], engineAssessments, live.lookup)}
                              childStates={childStates}
                              dot={categoryDot(
                                overlay,
                                stu.studentId,
                                childIdsOf[a.assessmentId] ?? [],
                                childStates.includes('missing') ||
                                  (childIdsOf[a.assessmentId] ?? []).some((id) => cellFor(stu.studentId, id).status === 'missing'),
                              )}
                              isToggling={togglingKey === key}
                              toggleDisabled={togglingKey !== null}
                              onSetStatus={(status) => setStatus(stu.studentId, a.assessmentId, status)}
                              onClick={() => setSelectedParentAssessment(a)}
                              failed={failedCategoryFor(stu.studentId, a.assessmentId)}
                              className={`border-l border-t border-slate-100 transition-colors hover:bg-cyan-50/60 ${rowPad} ${highlight}`}
                              title="Open this category's assessments"
                              dense={density === 'compact'}
                            />
                          )
                        }

                        const cell = cellFor(stu.studentId, a.assessmentId)
                        const shown = autosave.displayValue(key, cell.saved)
                        return (
                          <ScoreCell
                            key={a.assessmentId}
                            inputId={nav.inputId(rowIndex, colIndex)}
                            label={cellLabel}
                            value={shown}
                            maxScore={Number(a.maxScore || 100)}
                            status={cell.status}
                            mark={markFor(a.assessmentId, cell, shown)}
                            isToggling={togglingKey === key}
                            toggleDisabled={togglingKey !== null}
                            failed={autosave.failedKeys.has(key)}
                            onValue={(v) => handleValue(stu.studentId, a.assessmentId, v)}
                            onCommit={() => void autosave.flush()}
                            onSetStatus={(status) => setStatus(stu.studentId, a.assessmentId, status)}
                            onKeyDown={(e) => nav.onKeyDown(e, rowIndex, colIndex)}
                            className={`border-l border-t border-slate-100 ${rowPad} ${highlight}`}
                            corner={
                              threadStubs[key] && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(`/messages?thread=${encodeURIComponent(threadStubs[key].conversationId)}`)
                                  }
                                  className={`absolute left-1 top-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-md ${
                                    threadStubs[key].unreadCount > 0
                                      ? 'bg-cyan-600 text-white'
                                      : 'border border-cyan-200 bg-cyan-50 text-cyan-600'
                                  }`}
                                  title={
                                    threadStubs[key].unreadCount > 0
                                      ? `${threadStubs[key].unreadCount} unread in the parent conversation`
                                      : 'Open parent conversation'
                                  }
                                >
                                  <ChatBubbleLeftRightIcon className="h-2.5 w-2.5" />
                                </button>
                              )
                            }
                          />
                        )
                      })}

                      <td
                        className={`${TOTAL_PIN} z-10 border-l-2 border-t border-slate-100 border-l-emerald-100 bg-emerald-50 px-4 text-center ${rowPad} ${TOTAL_SHADOW}`}
                        title={density === 'compact' ? formatCoverage(grade.coverage) : undefined}
                      >
                        <div className={`font-display text-xl font-bold leading-tight tabular-nums ${scoreTone(grade.pct)}`}>
                          {grade.pct == null ? '—' : `${grade.pct.toFixed(1)}%`}
                        </div>
                        {density === 'comfortable' && (
                          <div className="whitespace-nowrap text-[11px] font-normal tabular-nums text-slate-500">
                            {formatCoverage(grade.coverage)}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GridLegend variant="grid" classwork={Object.keys(overlay.columns).length > 0} />


      {/* Floating publish tray: appears when columns are ticked. */}
      {selectedAssessmentIds.size > 0 && (
        <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4 lg:left-72">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-2xl border border-cyan-200 bg-cyan-50/95 py-2 pl-4 pr-2 shadow-lg backdrop-blur-sm">
            <span className="mr-1 flex flex-col">
              <span className="text-sm font-semibold text-cyan-800">
                {selectedAssessmentIds.size} assessment{selectedAssessmentIds.size === 1 ? '' : 's'} selected
              </span>
              <span className="text-xs text-cyan-800/80">Publishing shows these grades to students and parents.</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedAssessmentIds(new Set())}
              className="cursor-pointer rounded-xl px-3 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                void autosave.flush()
                openPublishModal(displayedAssessments.filter((a) => selectedAssessmentIds.has(a.assessmentId)))
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-700"
            >
              <MegaphoneIcon className="h-4 w-4" />
              Publish
            </button>
          </div>
        </div>
      )}

      {selectedParentAssessment && (
        <ChildAssessmentsModal
          isOpen
          onClose={() => {
            void autosave.flush()
            setSelectedParentAssessment(null)
            setModalFocusId(null)
          }}
          overlay={overlay}
          keepsDrafts={keepsDrafts}
          notPosted={notPosted}
          highlightAssessmentId={modalFocusId}
          onPublishDrafts={openDraftPublish}
          parentAssessment={selectedParentAssessment}
          childAssessments={assessments.filter((a) => a.parentAssessmentId === selectedParentAssessment.assessmentId)}
          students={sortedStudents}
          scoresMatrix={scoresMatrix}
          autosave={autosave}
          classId={classId}
          onRefresh={refreshScoresMatrix}
          publications={publications}
          onPublish={(targets) => {
            void autosave.flush()
            setSelectedParentAssessment(null)
            openPublishModal(targets)
          }}
        />
      )}

      {standaloneAssessment && (
        <StandaloneAssessmentModal
          key={standaloneAssessment.assessmentId}
          isOpen
          onClose={() => {
            void autosave.flush()
            setStandaloneAssessmentId(null)
          }}
          overlay={overlay}
          keepsDrafts={keepsDrafts}
          onPublishDrafts={openDraftPublish}
          assessment={standaloneAssessment}
          allAssessments={assessments}
          students={sortedStudents}
          scoresMatrix={scoresMatrix}
          autosave={autosave}
          classId={classId}
          onRefresh={refreshScoresMatrix}
          publications={publications}
          onPublish={(targets) => {
            void autosave.flush()
            setStandaloneAssessmentId(null)
            openPublishModal(targets)
          }}
          onAssessmentMutated={(result) => {
            applyAssessmentMutation(result)
            // Moved into a category, or made one: it is no longer a column of
            // its own, so its window closes and the grid regroups.
            const self = result.updated.find((u) => u.assessmentId === standaloneAssessment.assessmentId)
            if (self?.parentAssessmentId) {
              void autosave.flush()
              setStandaloneAssessmentId(null)
              void refreshScoresMatrix()
            }
          }}
        />
      )}

      <StudentAssessmentsModal
        isOpen={selectedStudent !== null}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
        classId={classId}
        assessments={assessments}
        existingScores={studentModalScores}
        drafts={studentModalDrafts}
        keepsDrafts={keepsDrafts}
        currentEditedScores={studentModalLocal}
        onRefreshScores={refreshScoresMatrix}
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
        draftCounts={draftsByColumn}
        notPosted={notPosted}
      />

      {/* "Publish N" on a turn-in column: every draft in it, after a confirm. */}
      <Modal isOpen={draftPublish !== null} onClose={() => !publishingDrafts && setDraftPublish(null)} size="md">
        {draftPublish && (
          <>
            <ModalHeader
              title={
                draftPublish.outside
                  ? 'Publish the whole column'
                  : `Publish ${draftPublishCount} draft${draftPublishCount === 1 ? '' : 's'}?`
              }
              subtitle={draftPublish.assessment.name}
              icon={MegaphoneIcon}
            />
            <ModalBody>
              <ConfirmBody tone={draftPublish.outside ? 'warning' : 'brand'}>
                {draftPublish.outside
                  ? `This column also has grades for students the ${draftPublishWord} isn't assigned to, so it is published as a whole: its Publish window shows those grades and every draft in it.`
                  : 'Students and parents will see these grades.'}
              </ConfirmBody>
            </ModalBody>
            <ModalFooter>
              <Button type="button" variant="secondary" onClick={() => setDraftPublish(null)} disabled={publishingDrafts}>
                Cancel
              </Button>
              {draftPublish.outside ? (
                <Button
                  type="button"
                  onClick={() => {
                    const target = draftPublish.assessment
                    setDraftPublish(null)
                    setSelectedParentAssessment(null)
                    setStandaloneAssessmentId(null)
                    openPublishModal([target])
                  }}
                >
                  Open Publish…
                </Button>
              ) : (
                <Button
                  type="button"
                  loading={publishingDrafts}
                  disabled={draftPublishCount === 0}
                  onClick={() => void runDraftPublish()}
                >
                  Publish
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </Modal>

      {selectedExclusionStudent && (
        <ExcludedAssessmentsModal
          isOpen
          onClose={() => setSelectedExclusionStudent(null)}
          studentId={selectedExclusionStudent.studentId}
          studentName={selectedExclusionStudent.name}
          classId={classId}
          assessments={assessments}
          scoresMatrix={scoresMatrix}
          onUpdate={refreshScoresMatrix}
        />
      )}
    </div>
  )
}
