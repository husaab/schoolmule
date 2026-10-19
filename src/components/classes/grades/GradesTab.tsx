// src/components/classes/grades/GradesTab.tsx
// The class's Grades tab (D10, Teacher-Grades board): today's gradebook,
// moved into the class. Sub-tabs in the URL (?sub=, Scores is the default):
// Scores · Assessments & categories · Report card comments · Progress report
// comments, with the toolbar beside them (the autosave pill and "Create
// assessment"; the class average sits in the grid's own stats line). Scores
// and both kinds of comments autosave (D17); the pill shows all three, and a
// sub-tab switch saves first. JK and SK classes show their competency
// gradebook alone; their skill domains and subjects live in Settings.
'use client'

import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import SavedPill from '@/components/gradebook/SavedPill'
import GradebookWorkspace from '@/components/gradebook/workspace/GradebookWorkspace'
import JKGradebookWorkspace from '@/components/gradebook/workspace/JKGradebookWorkspace'
import SKGradebookWorkspace from '@/components/gradebook/workspace/SKGradebookWorkspace'
import ReportCardCommentsWorkspace from '@/components/gradebook/workspace/ReportCardCommentsWorkspace'
import ProgressCommentsWorkspace from '@/components/gradebook/workspace/ProgressCommentsWorkspace'
import AssessmentsSection from '@/components/assessments/section/AssessmentsSection'
import { useScoreAutosave, type AutosaveStatus } from '@/hooks/useScoreAutosave'
import { useCommentAutosave } from '@/hooks/useCommentAutosave'
import { useFilterParams } from '@/hooks/useFilterParams'
import { classHref, GRADES_SUB_IDS, newItemHref, parseGradesSub, type GradesSub } from '@/lib/classroomRoutes'
import { isJK, isSK } from '@/lib/schoolUtils'
import { getClassById } from '@/services/classService'
import type { ClassPayload } from '@/services/types/class'
import type { ClassTabProps } from '@/components/classes/page/tabs'
import { useNotificationStore } from '@/store/useNotificationStore'

const SUB_LABELS: Record<GradesSub, string> = {
  scores: 'Scores',
  setup: 'Assessments & categories',
  'report-comments': 'Report card comments',
  'progress-comments': 'Progress report comments',
}

// The pill's one state for several queues: any failure first, then any save in progress.
const combinedStatus = (statuses: AutosaveStatus[]): AutosaveStatus =>
  statuses.includes('error') ? 'error' : statuses.includes('saving') ? 'saving' : 'saved'

interface LoadedClass {
  classId: string
  data: ClassPayload | null
  error: string | null
}

export default function GradesTab({ classId, data }: ClassTabProps) {
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const filters = useFilterParams({ remember: false })
  const { setParams } = filters
  const sub = parseGradesSub(filters.get('sub'))
  const addRequested = filters.get('add') === '1'
  // ?focus={assessmentId} (Classwork rows, Create assessment, the grading
  // view's Back): transient, dropped once the Scores grid has shown it.
  const focusAssessmentId = filters.get('focus') || null
  const clearFocus = useCallback(() => setParams({ focus: null }), [setParams])
  const kindergarten = isJK(data.class.grade) || isSK(data.class.grade)

  // The gradebook components take the class as /classes/:id returns it.
  const [loaded, setLoaded] = useState<LoadedClass | null>(null)
  const load = useCallback(() => {
    getClassById(classId).then(
      (res) => setLoaded({ classId, data: res.data, error: null }),
      (err: unknown) =>
        setLoaded({
          classId,
          data: null,
          error: err instanceof Error && err.message ? err.message : "The grades couldn't be loaded.",
        }),
    )
  }, [classId])
  useEffect(() => {
    load()
  }, [load])
  const classData = loaded?.classId === classId ? loaded.data : null
  const loadError = loaded?.classId === classId ? loaded.error : null

  // The same queues the score grid, its windows and the comment sub-tabs
  // use: the pill shows their state, and a sub-tab switch saves whatever is
  // still typed first.
  const autosave = useScoreAutosave({ classId })
  const reportComments = useCommentAutosave({ classId, kind: 'report' })
  const progressComments = useCommentAutosave({ classId, kind: 'progress' })
  const pillStatus = combinedStatus([autosave.status, reportComments.status, progressComments.status])
  const failedCount = autosave.failedKeys.size + reportComments.failedKeys.size + progressComments.failedKeys.size
  const { flush: flushScores, retry: retryScores } = autosave
  const { flush: flushReport, retry: retryReport } = reportComments
  const { flush: flushProgress, retry: retryProgress } = progressComments
  const flushAll = useCallback(() => {
    void flushScores()
    void flushReport()
    void flushProgress()
  }, [flushScores, flushReport, flushProgress])
  const retryAll = () => {
    void retryScores()
    void retryReport()
    void retryProgress()
  }
  const discardAll = () => {
    autosave.discard()
    reportComments.discard()
    progressComments.discard()
  }

  // JK and SK grading setup (skill domains, subjects) is in Settings: an old
  // #assessments link that landed on Grades → setup goes there.
  useEffect(() => {
    if (kindergarten && sub === 'setup') router.replace(classHref(classId, 'settings', {}, '#skills'))
  }, [kindergarten, sub, classId, router])

  const selectSub = useCallback(
    (next: GradesSub, extra: Record<string, string | null> = {}) => {
      flushAll()
      setParams({ sub: next === 'scores' ? null : next, add: null, focus: null, ...extra })
    },
    [flushAll, setParams],
  )

  // The New assessment form, which comes back here (to the new column) when
  // done. Whatever is typed is saved first; if any of it fails, Grades stays
  // open with the pill's Retry.
  const createAssessment = async () => {
    await Promise.all([flushScores(), flushReport(), flushProgress()])
    if (autosave.hasFailures() || reportComments.hasFailures() || progressComments.hasFailures()) {
      showNotification("Some changes didn't save. Retry them, then create the assessment.", 'error')
      return
    }
    router.push(newItemHref(classId, 'assessment', { from: 'grades' }))
  }
  const clearAdd = useCallback(() => setParams({ add: null }), [setParams])

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const i = GRADES_SUB_IDS.indexOf(sub)
    const next = GRADES_SUB_IDS[(i + (e.key === 'ArrowRight' ? 1 : GRADES_SUB_IDS.length - 1)) % GRADES_SUB_IDS.length]
    selectSub(next)
    window.requestAnimationFrame(() => document.getElementById(`grades-sub-${next}`)?.focus())
  }

  if (loadError && !classData) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
        <p className="mb-4 text-slate-600">{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoaded(null)
            load()
          }}
          className="cursor-pointer rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!classData || (kindergarten && sub === 'setup')) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (kindergarten) {
    return isJK(data.class.grade) ? (
      <JKGradebookWorkspace classId={classId} classData={classData} />
    ) : (
      <SKGradebookWorkspace classId={classId} classData={classData} />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Grades"
          onKeyDown={onTabKey}
          className="flex flex-wrap gap-1.5 rounded-[14px] bg-slate-100 p-1"
        >
          {GRADES_SUB_IDS.map((id) => {
            const on = id === sub
            return (
              <button
                key={id}
                id={`grades-sub-${id}`}
                type="button"
                role="tab"
                aria-selected={on}
                tabIndex={on ? 0 : -1}
                onClick={() => selectSub(id)}
                className={`cursor-pointer rounded-[10px] px-3.5 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {SUB_LABELS[id]}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SavedPill status={pillStatus} failedCount={failedCount} onRetry={retryAll} onDiscard={discardAll} />
          <button
            type="button"
            onClick={() => void createAssessment()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Create assessment
          </button>
        </div>
      </div>

      <div role="tabpanel" aria-labelledby={`grades-sub-${sub}`}>
        {sub === 'scores' && (
          <GradebookWorkspace
            classId={classId}
            classData={classData}
            focusAssessmentId={focusAssessmentId}
            onFocusHandled={clearFocus}
          />
        )}
        {sub === 'setup' && <AssessmentsSection classId={classId} openAdd={addRequested} onAddOpened={clearAdd} />}
        {sub === 'report-comments' && (
          <ReportCardCommentsWorkspace classId={classId} classData={classData} onOpenSub={selectSub} />
        )}
        {sub === 'progress-comments' && (
          <ProgressCommentsWorkspace classId={classId} classData={classData} onOpenSub={selectSub} />
        )}
      </div>
    </div>
  )
}
