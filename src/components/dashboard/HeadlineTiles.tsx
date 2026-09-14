'use client'

// The four figures that carry the page, each a door into the page that
// explains it. Admins see the school; teachers see their own classes, read
// from the classes-health endpoint (server-scoped, so nothing here decides
// what a teacher may see — it only decides what is worth showing them).

import React from 'react'
import StatTile, { toneForRate, toneForScore } from '@/components/ui/StatTile'
import type { DashboardSummaryData } from '@/services/types/dashboard'
import type { ClassesHealthData, OverviewData } from '@/services/types/analytics'
import type { HookState } from '@/components/analytics/useAnalyticsData'
import { analyticsHref, attendanceHref } from './dashboardPaths'

interface HeadlineTilesProps {
  isAdmin: boolean
  summary: DashboardSummaryData
  /** yyyy-MM-dd, for the attendance deep link. */
  today: string
  termId: string | null
  previousTermName: string | null
  /** True while the term is still being resolved, before analytics can start. */
  pending: boolean
  overview: HookState<OverviewData>
  classesHealth: HookState<ClassesHealthData>
}

// The summary reports 0 when nothing has been recorded, and "nobody came in"
// is never what that means — so a zero rate reads as no data, not as bad.
const rate = (v: number | null | undefined) => (typeof v === 'number' && v > 0 ? `${(v * 100).toFixed(1)}%` : '—')
const rateTone = (v: number | null | undefined) => (typeof v === 'number' && v > 0 ? toneForRate(v) : 'neutral')
const score = (v: number | null | undefined) => (typeof v === 'number' ? `${v.toFixed(1)}%` : '—')

const HeadlineTiles: React.FC<HeadlineTilesProps> = ({
  isAdmin,
  summary,
  today,
  termId,
  previousTermName,
  pending,
  overview,
  classesHealth,
}) => {
  const schoolAvg = overview.data?.school.stats?.avg ?? null
  // Analytics failing must not blank the tile: fall back to the summary's
  // (cached, null-zero) average and simply drop the delta.
  const avgShown = overview.error ? (summary.averageStudentGrade ?? null) : schoolAvg
  const diff = overview.data?.termDiff?.school?.avgDiff
  const delta =
    diff != null && previousTermName ? { value: diff, label: `vs ${previousTermName}` } : null

  if (isAdmin) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile label="Students" value={summary.totalStudents || 0} href="/students" />
        <StatTile label="Classes" value={summary.totalClasses || 0} href="/classes" />
        <StatTile
          label="Here today"
          value={rate(summary.todaysAttendance)}
          tone={rateTone(summary.todaysAttendance)}
          href={attendanceHref(today)}
          sub={`week ${rate(summary.weeklyAttendance)} · month ${rate(summary.monthlyAttendance)}`}
        />
        <StatTile
          label="Average grade"
          value={score(avgShown)}
          tone={toneForScore(avgShown)}
          href={analyticsHref({ termId })}
          loading={pending || overview.loading}
          delta={delta}
          sub={
            overview.data?.school.stats
              ? `median ${overview.data.school.stats.median.toFixed(1)}%`
              : undefined
          }
        />
      </div>
    )
  }

  const classes = classesHealth.data?.classes ?? []
  const studentCount = new Set(classes.flatMap((c) => c.studentIds)).size
  const avgs = classes.map((c) => c.classAvg).filter((v): v is number => v != null)
  const myAvg = avgs.length ? avgs.reduce((s, v) => s + v, 0) / avgs.length : null
  const missing = classes.reduce((s, c) => s + c.missingCount, 0)
  const loading = pending || classesHealth.loading

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <StatTile label="My students" value={studentCount} href="/students" loading={loading} />
      <StatTile label="My classes" value={classes.length} href="/classes" loading={loading} />
      <StatTile
        label="My average"
        value={score(myAvg)}
        tone={toneForScore(myAvg)}
        href={analyticsHref({ termId })}
        loading={loading}
        sub={schoolAvg != null ? `school ${schoolAvg.toFixed(1)}%` : undefined}
      />
      <StatTile
        label="Missing work"
        value={missing}
        tone={loading || !classes.length ? 'neutral' : missing === 0 ? 'good' : 'warn'}
        href="/gradebook"
        loading={loading}
        sub="ungraded items across your classes"
      />
    </div>
  )
}

export default HeadlineTiles
