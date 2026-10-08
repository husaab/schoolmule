'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { ChildLite, useVisibleChildren } from '@/store/useSelectedChildStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { getChildGrades } from '@/services/parentPortalService'
import { getThreadStubs } from '@/services/messagingService'
import type { ThreadStub } from '@/services/types/messaging'
import { ChildGrades, ChildClassGrades } from '@/services/types/parentPortal'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ChildSections from '@/components/parent/ChildSections'
import ChildJumpNav from '@/components/parent/ChildJumpNav'
import ParentFilterBar from '@/components/parent/ParentFilterBar'
import ParentEmptyState from '@/components/parent/ParentEmptyState'
import ParentAssessmentTable from '@/components/parent/ParentAssessmentTable'
import Link from 'next/link'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import ClassGradesBarChart from '@/components/parent/ClassGradesBarChart'
import TermPicker from '@/components/parent/TermPicker'
import Spinner from '@/components/Spinner'
import TrendLineChart from '@/app/(user)/analytics/_components/charts/TrendLineChart'
import { gradeTextColor } from '@/components/parent/childColors'

const ClassCard: React.FC<{
  cls: ChildClassGrades
  missingCount: number
  child: ChildLite
  threadStubs: Record<string, ThreadStub>
  /** False when the grades on screen belong to a past term: no "Ask the teacher" (new threads are current-term only). */
  canAsk: boolean
}> = ({ cls, missingCount, child, threadStubs, canAsk }) => {
  const [expanded, setExpanded] = useState(false)

  const scored = cls.assessmentScores.filter(
    (s) => !s.isExcluded && s.score != null && s.maxScore,
  )
  // Chronological only when every assessment is dated; otherwise keep the
  // teacher's gradebook order (rows already arrive sorted by sort_order).
  const ordered = scored.every((s) => s.date)
    ? scored.slice().sort((a, b) => (a.date as string).localeCompare(b.date as string))
    : scored
  const trendData = ordered.map((s) => ({
    label: s.name,
    value: Math.round(((s.score as number) / (s.maxScore as number)) * 1000) / 10,
  }))
  const openThreads = cls.assessmentScores.filter((s) => threadStubs[s.assessmentId]?.status === 'open').length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-stone-50/60 transition-colors cursor-pointer"
      >
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-slate-900 truncate">{cls.subject}</h4>
          <p className="text-sm text-slate-500 truncate flex items-center gap-2">
            <span className="truncate">
              {cls.teacherName || 'Teacher TBD'}
              {cls.classAvg != null && ` · Class average: ${cls.classAvg}%`}
            </span>
            {openThreads > 0 && (
              <Link
                href="/parent/messages"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-px text-[11px] font-medium text-amber-800 hover:bg-amber-100"
              >
                <ChatBubbleLeftRightIcon className="h-3 w-3" />
                {openThreads} {openThreads === 1 ? 'conversation' : 'conversations'}
              </Link>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {missingCount > 0 && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-100">
              {missingCount} missing
            </span>
          )}
          <span className={`text-xl font-bold ${gradeTextColor(cls.finalPct)}`}>
            {cls.finalPct != null ? `${cls.finalPct}%` : '—'}
          </span>
          {expanded ? (
            <ChevronDownIcon className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-stone-100">
          {trendData.length >= 2 && (
            <div className="pt-4">
              <TrendLineChart
                data={trendData}
                height={180}
                seriesName="Score"
                referenceValue={cls.classAvg}
                referenceLabel={cls.classAvg != null ? `Class avg ${cls.classAvg}%` : undefined}
              />
            </div>
          )}
          <div className="pt-3">
            <ParentAssessmentTable
              scores={cls.assessmentScores}
              threadStubs={threadStubs}
              ask={
                canAsk
                  ? {
                      studentId: child.studentId,
                      studentFirstName: child.name.split(' ')[0],
                      classId: cls.classId,
                      teacherName: cls.teacherName,
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface ChildGradesSectionProps {
  child: ChildLite
  termId: string
  /** The year's active term, or null when none is active (then every term is askable). */
  activeTermId: string | null
  subjectFilter: string
  onSubjectsLoaded: (studentId: string, subjects: string[]) => void
}

const ChildGradesSection: React.FC<ChildGradesSectionProps> = ({
  child,
  termId,
  activeTermId,
  subjectFilter,
  onSubjectsLoaded,
}) => {
  const [grades, setGrades] = useState<ChildGrades | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [threadStubs, setThreadStubs] = useState<Record<string, ThreadStub>>({})
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId) // refetch when the selected school year changes

  // Existing conversations drive the chips on each row. Informational: a
  // failure here must never hide the grades.
  useEffect(() => {
    let cancelled = false
    getThreadStubs({ studentId: child.studentId })
      .then((res) => {
        if (cancelled) return
        const byAssessment: Record<string, ThreadStub> = {}
        for (const stub of res.data ?? []) if (stub.assessmentId) byAssessment[stub.assessmentId] = stub
        setThreadStubs(byAssessment)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [child.studentId, selectedYearId])

  useEffect(() => {
    // ChildSections keys on studentId, so this component survives a term
    // change — two quick TermPicker clicks can otherwise resolve out of order
    // and leave the previous term's grades on screen.
    let cancelled = false
    setLoading(true)
    setError(null)
    getChildGrades(child.studentId, termId || undefined)
      .then((res) => {
        if (cancelled) return
        const data = res.data || null
        setGrades(data)
        onSubjectsLoaded(child.studentId, data?.classes.map((c) => c.subject) ?? [])
      })
      .catch((err) => {
        if (cancelled) return
        console.error(err)
        setError('Failed to load grades.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [child.studentId, termId, selectedYearId, onSubjectsLoaded])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="md" />
      </div>
    )
  }
  if (error) {
    return <ParentEmptyState icon={BookOpenIcon} title="Something went wrong" message={error} />
  }
  if (!grades || grades.classes.length === 0) {
    return (
      <ParentEmptyState
        icon={BookOpenIcon}
        title="No grades yet"
        message="There are no graded assessments for this term yet. Check back soon!"
      />
    )
  }

  const classes = subjectFilter
    ? grades.classes.filter((c) => c.subject === subjectFilter)
    : grades.classes
  // Categories are never real missing work — a category has no score of its
  // own, so it looks ungraded even when every item under it is marked.
  const missingWork = (
    subjectFilter
      ? grades.missingWork.filter((m) => m.subject === subjectFilter)
      : grades.missingWork
  ).filter((m) => !m.isParent)

  if (classes.length === 0) {
    return (
      <ParentEmptyState
        icon={FunnelIcon}
        title={`No ${subjectFilter} class`}
        message={`${child.name.split(' ')[0]} doesn't have a ${subjectFilter} class this term.`}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Overall stat row only makes sense unfiltered */}
      {!subjectFilter && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
              Overall Average
            </p>
            <p className={`text-2xl font-bold ${gradeTextColor(grades.overall?.avg)}`}>
              {grades.overall?.avg != null ? `${grades.overall.avg}%` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
              Classes
            </p>
            <p className="text-2xl font-bold text-slate-900">{grades.overall?.classCount ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
              Missing Work
            </p>
            <p
              className={`text-2xl font-bold ${missingWork.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}
            >
              {missingWork.length}
            </p>
          </div>
        </div>
      )}

      {/* Grades-by-class chart (unfiltered view only — one bar is no chart) */}
      {!subjectFilter && <ClassGradesBarChart classes={grades.classes} />}

      {/* Missing work callout */}
      {missingWork.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
            <h4 className="text-sm font-semibold text-amber-800">Missing Work</h4>
          </div>
          <ul className="space-y-1">
            {missingWork.map((m) => (
              <li key={`${m.classId}-${m.assessmentId}`} className="text-sm text-slate-700">
                <span className="font-medium">{m.subject}:</span> {m.assessmentName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Class cards. "Ask the teacher" is hidden while a past term is on screen; under
          "All terms" the rows stay askable and the server refuses past-term ones. */}
      {classes.map((cls) => (
        <ClassCard
          key={cls.classId}
          cls={cls}
          missingCount={missingWork.filter((m) => m.classId === cls.classId).length}
          child={child}
          threadStubs={threadStubs}
          canAsk={!activeTermId || !grades.termId || grades.termId === 'all' || grades.termId === activeTermId}
        />
      ))}
    </div>
  )
}

const ParentGradesPage: React.FC = () => {
  const [termId, setTermId] = useState('')
  const [activeTermId, setActiveTermId] = useState<string | null>(null)
  const [subjectFilter, setSubjectFilter] = useState('')
  const [subjectsByChild, setSubjectsByChild] = useState<Record<string, string[]>>({})
  const visibleChildren = useVisibleChildren()
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)

  // A term from one year is meaningless in another — snap back to the
  // year's default term whenever the selected school year changes.
  useEffect(() => {
    setTermId('')
  }, [selectedYearId])

  const onSubjectsLoaded = useCallback((studentId: string, subjects: string[]) => {
    setSubjectsByChild((prev) =>
      prev[studentId]?.join('|') === subjects.join('|')
        ? prev
        : { ...prev, [studentId]: subjects },
    )
  }, [])

  const subjects = useMemo(() => {
    const all = visibleChildren.flatMap((c) => subjectsByChild[c.studentId] ?? [])
    return [...new Set(all)].sort((a, b) => a.localeCompare(b))
  }, [visibleChildren, subjectsByChild])

  // Drop a stale subject filter when it no longer exists (term/year/child change).
  useEffect(() => {
    if (subjectFilter && subjects.length > 0 && !subjects.includes(subjectFilter)) {
      setSubjectFilter('')
    }
  }, [subjects, subjectFilter])

  return (
    <ParentPageShell
      title="Grades"
      subtitle="Every assessment, average and trend — the same numbers as the report card."
      badge={{ icon: BookOpenIcon, label: 'Grades' }}
    >
      <ParentFilterBar>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
        >
          <option value="">All classes</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <TermPicker value={termId} onChange={setTermId} onTermsLoaded={(terms) => setActiveTermId(terms.find((t) => t.isActive)?.termId ?? null)} />
      </ParentFilterBar>

      <ChildSections
        renderChild={(child) => (
          <ChildGradesSection
            child={child}
            termId={termId}
            activeTermId={activeTermId}
            subjectFilter={subjectFilter}
            onSubjectsLoaded={onSubjectsLoaded}
          />
        )}
      />
      <ChildJumpNav />
    </ParentPageShell>
  )
}

export default ParentGradesPage
