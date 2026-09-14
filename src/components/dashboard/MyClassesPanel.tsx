'use client'

// The teacher's academic view: their classes as a table (average, missing
// work, what is still ungraded, what parents can't see yet), the same
// averages as bars against the school line, and the students in those
// classes who are drifting. The classes come from the classes-health
// endpoint, which the server already scopes to the caller, so this panel
// never has to decide what a teacher is allowed to see.

import React, { useMemo } from 'react'
import Link from 'next/link'
import { AcademicCapIcon, ArrowRightIcon, BookOpenIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import Card from '@/components/ui/Card'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import TermComparisonChart from '@/components/analytics/charts/TermComparisonChart'
import type { HookState } from '@/components/analytics/useAnalyticsData'
import type { ClassesHealthData, OverviewData, SnapshotData, AtRiskResult } from '@/services/types/analytics'
import { computeAtRiskScore } from '@/lib/analyticsUtils'
import { ChartSkeleton, RowsSkeleton } from './DashboardSkeletons'
import { analyticsHref, gradebookHref } from './dashboardPaths'

interface MyClassesPanelProps {
  classesHealth: HookState<ClassesHealthData>
  snapshot: HookState<SnapshotData>
  overview: HookState<OverviewData>
  termId: string | null
  termName: string | null
  pending: boolean
  hasTerm: boolean
}

const CHART_HEIGHT = 220
const CHECK_IN_LIMIT = 6

const avgClass = (v: number | null) =>
  v == null ? 'text-slate-400' : v >= 75 ? 'text-emerald-700' : v >= 60 ? 'text-amber-700' : 'text-rose-700'

const TIER: Record<AtRiskResult['tier'], string> = {
  high: 'bg-rose-100 text-rose-700 border-rose-200',
  moderate: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const MyClassesPanel: React.FC<MyClassesPanelProps> = ({
  classesHealth,
  snapshot,
  overview,
  termId,
  termName,
  pending,
  hasTerm,
}) => {
  const classes = useMemo(() => classesHealth.data?.classes ?? [], [classesHealth.data])

  // Students in my classes who are drifting, most urgent first.
  const checkIns = useMemo(() => {
    if (!snapshot.data) return []
    const mine = new Set(classes.flatMap((c) => c.studentIds))
    return snapshot.data.students
      .filter((s) => mine.has(s.studentId))
      .map((s) => ({
        ...s,
        risk: computeAtRiskScore({
          gradePercent: s.overallAvg,
          attendancePercent: s.attendancePct,
          missingWorkCount: s.missingCount,
          trajectoryDelta: 0,
        }),
      }))
      .filter((s) => s.risk.tier !== 'low')
      .sort((a, b) => b.risk.score - a.risk.score)
      .slice(0, CHECK_IN_LIMIT)
  }, [snapshot.data, classes])

  // Same array across re-renders, so the bar chart animates once, not on
  // every unrelated state change higher up the page.
  const bars = useMemo(
    () => classes.map((c) => ({ label: `Gr ${c.grade} ${c.subject}`, current: c.classAvg })),
    [classes]
  )

  if (pending || classesHealth.loading) {
    return (
      <>
        <RowsSkeleton rows={5} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartSkeleton height={CHART_HEIGHT} />
          <RowsSkeleton rows={4} />
        </div>
      </>
    )
  }

  if (classesHealth.error) {
    return (
      <Card>
        <SectionHeader title="My classes" hint={termName ?? undefined} />
        <EmptyState
          icon={ChartBarIcon}
          iconClassName="text-rose-300"
          title="Couldn't load your classes"
          description={classesHealth.error}
          action={
            <button
              onClick={classesHealth.retry}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-colors cursor-pointer"
            >
              Try again
            </button>
          }
        />
      </Card>
    )
  }

  if (!hasTerm || classes.length === 0) {
    return (
      <Card>
        <SectionHeader title="My classes" hint={termName ?? undefined} />
        <EmptyState
          icon={AcademicCapIcon}
          iconClassName="text-cyan-400"
          title={hasTerm ? `No classes assigned to you for ${termName}` : 'No term set up yet'}
          description={
            hasTerm
              ? 'Once you are added to a class, its grades, missing work and publishing status appear here.'
              : 'Classes are organised by term; ask the office to set up the school year’s terms.'
          }
          action={
            hasTerm ? (
              <Link
                href="/classes"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-700 transition"
              >
                Open classes
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : undefined
          }
        />
      </Card>
    )
  }

  const anyGraded = classes.some((c) => c.classAvg != null)
  const schoolAvg = overview.data?.school.stats?.avg ?? null

  return (
    <>
      <Card>
        <SectionHeader
          title="My classes"
          hint={`${termName} · click a class to open its gradebook`}
          action={
            <Link
              href={analyticsHref({ termId })}
              className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-800"
            >
              Open analytics
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          }
        />
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[32rem]">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="text-left font-medium pb-2 px-1">Class</th>
                <th className="text-right font-medium pb-2 px-3 hidden sm:table-cell">Students</th>
                <th className="text-right font-medium pb-2 px-3">Average</th>
                <th className="text-right font-medium pb-2 px-3">Missing</th>
                <th className="text-right font-medium pb-2 px-3 hidden sm:table-cell">Ungraded</th>
                <th className="text-right font-medium pb-2 px-1">Parents</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.classId} className="border-t border-slate-100 hover:bg-cyan-50/30 transition-colors">
                  <td className="py-2.5 px-1">
                    <Link href={gradebookHref(c.classId)} className="text-sm font-medium text-slate-800 hover:text-cyan-700">
                      Gr {c.grade} {c.subject}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-right text-sm tabular-nums text-slate-700 hidden sm:table-cell">{c.studentCount}</td>
                  <td className={`py-2.5 px-3 text-right text-sm tabular-nums font-semibold ${avgClass(c.classAvg)}`}>
                    {c.classAvg != null ? `${c.classAvg.toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-sm tabular-nums text-slate-700">{c.missingCount}</td>
                  <td className="py-2.5 px-3 text-right text-sm tabular-nums text-slate-700 hidden sm:table-cell">{c.ungradedAssessments}</td>
                  <td className="py-2.5 px-1 text-right">
                    {c.assessmentCount === 0 || c.assessmentCount === c.ungradedAssessments ? (
                      <span className="text-xs text-slate-400">nothing graded</span>
                    ) : c.unpublishedGraded > 0 ? (
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 whitespace-nowrap">
                        {c.unpublishedGraded} to publish
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Published</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <SectionHeader
            title="Class averages"
            hint={schoolAvg != null ? `School average ${schoolAvg.toFixed(1)}%` : 'Average per class'}
          />
          {anyGraded ? (
            <TermComparisonChart data={bars} height={CHART_HEIGHT} currentName="Class average" />
          ) : (
            <EmptyState
              icon={BookOpenIcon}
              iconClassName="text-cyan-400"
              title="Grades appear once assessments are entered"
              action={
                <Link href="/gradebook" className="text-sm font-medium text-cyan-700 hover:text-cyan-800">
                  Open the gradebook →
                </Link>
              }
            />
          )}
        </Card>
        <Card>
          <SectionHeader title="Students to check in on" hint="From grades, attendance and missing work" />
          {snapshot.loading ? (
            <RowsSkeleton rows={4} bare />
          ) : snapshot.error ? (
            <p className="text-sm text-slate-500 py-4 text-center">Couldn&apos;t load student signals.</p>
          ) : checkIns.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No one in your classes needs a check-in right now.</p>
          ) : (
            <ul>
              {checkIns.map((s) => (
                <li key={s.studentId} className="border-b border-slate-100 last:border-0">
                  <Link
                    href={analyticsHref({ view: 'student', studentId: s.studentId, termId })}
                    className="flex items-center justify-between gap-3 py-2 rounded-lg hover:bg-cyan-50/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.studentName}</p>
                      <p className="text-xs text-slate-500 tabular-nums truncate">
                        Gr {s.gradeLevel}
                        {s.overallAvg != null ? ` · ${s.overallAvg}%` : ''}
                        {s.attendancePct != null ? ` · att ${s.attendancePct}%` : ''}
                        {s.missingCount > 0 ? ` · ${s.missingCount} missing` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold uppercase rounded-full px-2 py-0.5 border ${TIER[s.risk.tier]}`}>
                      {s.risk.tier}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

export default MyClassesPanel
