'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  AcademicCapIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline'
import StatCard from '@/app/(user)/analytics/_components/StatCard'
import { coverageTitle, notYetGradedOf, shortCoverage } from '@/lib/analyticsUtils'
import { cellPct, fmtPct, formatDay, gradeText, orderAssessments, ordinal, subjectTermGrid, termDelta } from '@/lib/studentProfile'
import type { StudentClassBreakdown, StudentData } from '@/services/types/analytics'
import type { ProfileTerm, StudentOverview } from '@/services/types/studentProfile'
import { Card, CellStatusPill, ClassLinkList, EmptyState, GradeBar, linkClass, type GradebookLink } from './ui'

interface GradesTabProps {
  overview: StudentOverview
  term: ProfileTerm | null
  detail: StudentData | null
  /** The class whose marks are open (from ?class=). */
  openClassId: string | null
  onToggleClass: (classId: string | null) => void
  classAnalyticsHref: (classId: string) => string | null
  gradebookLink: GradebookLink
}

const GradesTab: React.FC<GradesTabProps> = ({ overview, term, detail, openClassId, onToggleClass, classAnalyticsHref, gradebookLink }) => {
  const grid = useMemo(() => subjectTermGrid(overview.terms), [overview.terms])
  const enrollmentById = useMemo(() => new Map(overview.enrollments.map((e) => [e.classId, e])), [overview.enrollments])

  if (overview.gradingMode === 'competency') {
    const termClasses = overview.enrollments.filter((e) => e.termId === term?.termId)
    return (
      <Card title={term ? `Classes · ${term.name}` : 'Classes'} subtitle="Skill ratings are recorded in each class’s gradebook" flush>
        <ClassLinkList classes={termClasses} gradebookLink={gradebookLink} linkLabel="Open gradebook →" />
      </Card>
    )
  }

  const delta = termDelta(overview.terms, term?.termId ?? null)
  const notYetGraded = detail?.overall.notYetGradedCount ?? 0

  return (
    <div className="space-y-6">
      {!detail ? (
        <Card>
          <EmptyState icon={AcademicCapIcon} title={term ? `Nothing graded in ${term.name}` : 'No terms set up'}>
            {overview.student.isArchived
              ? 'Archived students are left out of grade calculations.'
              : 'The student isn’t in a class this term, or no marks have been entered yet.'}
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Average"
              value={fmtPct(detail.overall.avg)}
              icon={ChartBarIcon}
              color="from-cyan-500 to-cyan-600"
              delta={delta}
              deltaLabel="vs the previous term"
              sub={`mean of ${detail.overall.classCount} class grades`}
            />
            <StatCard
              label="Grade percentile"
              value={detail.overall.percentileInGrade == null ? '—' : Math.round(detail.overall.percentileInGrade)}
              icon={PresentationChartLineIcon}
              color="from-teal-500 to-teal-600"
              sub={`within Grade ${detail.gradeLevel}`}
            />
            <StatCard
              label="Missing (flagged)"
              value={detail.overall.missingCount}
              icon={ExclamationTriangleIcon}
              color={detail.overall.missingCount >= 3 ? 'from-rose-500 to-rose-600' : 'from-slate-400 to-slate-500'}
              sub="counts as 0 until handed in"
            />
            <StatCard label="Not yet graded" value={notYetGraded} icon={ClockIcon} color="from-slate-400 to-slate-500" sub="carries no weight" />
          </div>

          <div className="space-y-3">
            {[...detail.classes]
              .sort((a, b) => a.subject.localeCompare(b.subject))
              .map((c) => {
                const enrollment = enrollmentById.get(c.classId)
                return (
                  <ClassGradeCard
                    key={c.classId}
                    cls={c}
                    open={openClassId === c.classId}
                    onToggle={() => onToggleClass(openClassId === c.classId ? null : c.classId)}
                    gradebookHref={enrollment ? gradebookLink(enrollment) : null}
                    analyticsHref={classAnalyticsHref(c.classId)}
                  />
                )
              })}
          </div>

          {detail.missingWork.length > 0 && (
            <Card
              title={
                <>
                  Missing work <span className="font-normal text-slate-400">({detail.missingWork.length})</span>
                </>
              }
              subtitle="Flagged by the teacher. Each counts as 0 until it’s handed in and graded."
              flush
            >
              <ul className="divide-y divide-slate-50 pb-2">
                {detail.missingWork.map((m) => (
                  <li key={`${m.classId}-${m.assessmentId}`} className="flex items-center justify-between gap-4 px-6 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{m.assessmentName}</p>
                      <p className="text-xs text-slate-500">
                        {m.subject}
                        {m.assessmentDate ? ` · ${formatDay(m.assessmentDate)}` : ''}
                      </p>
                    </div>
                    {m.weightPoints != null && <span className="whitespace-nowrap text-xs font-semibold text-amber-600">{m.weightPoints} pts</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {grid.length > 0 && overview.terms.length > 1 && (
        <Card title="Subjects across the year" subtitle="Each subject’s grade per term, matched by subject name" flush>
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-2 text-left font-semibold">Subject</th>
                  {overview.terms.map((t) => (
                    <th key={t.termId} className={`px-4 py-2 text-right font-semibold ${t.termId === term?.termId ? 'text-cyan-700' : ''}`}>
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row) => (
                  <tr key={row.subject} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-2 text-slate-800">{row.subject}</td>
                    {overview.terms.map((t) => (
                      <td
                        key={t.termId}
                        className={`px-4 py-2 text-right font-medium tabular-nums ${gradeText(row.byTerm[t.termId])} ${t.termId === term?.termId ? 'bg-cyan-50/50' : ''}`}
                      >
                        {fmtPct(row.byTerm[t.termId])}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-slate-50/60">
                  <td className="px-6 py-2 font-semibold text-slate-900">Overall</td>
                  {overview.terms.map((t) => (
                    <td key={t.termId} className={`px-4 py-2 text-right font-semibold tabular-nums ${gradeText(t.avg)}`}>
                      {fmtPct(t.avg)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

/** One class: the headline grade, and on open every mark behind it. */
const ClassGradeCard = ({
  cls,
  open,
  onToggle,
  gradebookHref,
  analyticsHref,
}: {
  cls: StudentClassBreakdown
  open: boolean
  onToggle: () => void
  gradebookHref: string | null
  analyticsHref: string | null
}) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const rows = useMemo(() => orderAssessments(cls.assessmentScores), [cls.assessmentScores])
  const notYet = notYetGradedOf(cls)

  // Arriving from the overview (?class=) should land on the class itself.
  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [open])

  return (
    <div ref={ref} className={`rounded-2xl border bg-white shadow-sm transition-colors ${open ? 'border-cyan-100 ring-1 ring-cyan-50' : 'border-slate-100'}`}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 px-5 py-4 text-left sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto]"
      >
        <div className="flex min-w-0 items-center gap-2">
          <ChevronDownIcon className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{cls.subject}</p>
            <p className="truncate text-xs text-slate-500">{cls.teacherName}</p>
          </div>
        </div>
        <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
          <GradeBar pct={cls.finalPct} average={cls.classAvg} />
          <p className="mt-1.5 text-[11px] text-slate-400" title={coverageTitle(cls.coverage)}>
            {shortCoverage(cls.coverage)}
            {cls.missingCount > 0 && <span className="font-medium text-rose-600"> · {cls.missingCount} missing</span>}
            {notYet > 0 && <> · {notYet} not yet graded</>}
          </p>
        </div>
        <div className="col-start-2 row-start-1 text-right sm:col-start-auto sm:row-start-auto">
          <p className={`text-lg font-bold tabular-nums ${gradeText(cls.finalPct)}`}>{cls.finalPct == null ? '—' : `${cls.finalPct}%`}</p>
          <p className="text-[11px] text-slate-400">
            class avg {fmtPct(cls.classAvg)}
            {cls.percentileInClass != null && <> · {ordinal(Math.round(cls.percentileInClass))} percentile</>}
          </p>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-4 pt-3">
          {rows.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No assessments in this class yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4 text-left font-semibold">Assessment</th>
                    <th className="px-3 py-2 text-left font-semibold">Date</th>
                    <th className="px-3 py-2 text-right font-semibold">Score</th>
                    <th className="px-3 py-2 text-right font-semibold">%</th>
                    <th className="py-2 pl-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ cell, depth }) => {
                    if (cell.isParent) {
                      // A category has no mark of its own; its children carry them.
                      return (
                        <tr key={cell.assessmentId} className="border-b border-slate-50">
                          <td colSpan={5} className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {cell.name}
                            {cell.weightPoints != null && <span className="ml-1.5 font-normal normal-case text-slate-400">· {cell.weightPoints} pts</span>}
                          </td>
                        </tr>
                      )
                    }
                    const pct = cellPct(cell)
                    return (
                      <tr key={cell.assessmentId} className="border-b border-slate-50 last:border-0">
                        <td className={`py-2 pr-4 text-slate-800 ${depth ? 'pl-4' : ''}`}>{cell.name}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{cell.date ? formatDay(cell.date) : '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600">
                          {cell.status === 'graded' && cell.score != null ? `${cell.score} / ${cell.maxScore ?? '—'}` : '—'}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium tabular-nums ${gradeText(pct)}`}>{fmtPct(pct)}</td>
                        <td className="py-2 pl-3 text-right">
                          <CellStatusPill status={cell.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {(gradebookHref || analyticsHref) && (
            <div className="mt-3 flex flex-wrap justify-end gap-4">
              {analyticsHref && <Link href={analyticsHref} className={linkClass}>Class analytics →</Link>}
              {gradebookHref && <Link href={gradebookHref} className={linkClass}>Open gradebook →</Link>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GradesTab
