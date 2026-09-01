'use client'

// The dashboard's narrative summary. Unlike the analytics panel — which
// re-fires whenever the snapshot changes — this generates once per school per
// day and caches the result, so opening the dashboard twenty times in a
// morning costs one call.

import React, { useCallback, useEffect, useState } from 'react'
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import type { AttendanceTrendPoint, DashboardSummaryData } from '@/services/types/dashboard'

interface DailyBriefingProps {
  summary: DashboardSummaryData
  trend: AttendanceTrendPoint[]
  schoolName: string
  /** Cache key component so two schools never share a briefing. */
  schoolCode: string
  /** yyyy-mm-dd — the briefing is per-day. */
  today: string
  /** Null when the planner has nothing published, so the AI can flag it. */
  hasPublishedSchedule: boolean
}

const pct = (v: number | null | undefined) =>
  typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : 'no data yet'

/** Compact, explicit snapshot — the model only ever sees these facts. */
const buildContext = (p: DailyBriefingProps): string => {
  const history = p.trend.length
    ? p.trend.map((t) => `${t.date}: ${(t.rate * 100).toFixed(1)}%`).join(', ')
    : 'no attendance recorded yet'
  return [
    `School: ${p.schoolName}`,
    `Date: ${p.today}`,
    `Students: ${p.summary.totalStudents ?? 0}`,
    `Teachers: ${p.summary.totalTeachers ?? 0}`,
    `Classes: ${p.summary.totalClasses ?? 0}`,
    `Average class size: ${p.summary.avgClassSize ?? 0}`,
    `Attendance today: ${pct(p.summary.todaysAttendance)}`,
    `Attendance this week: ${pct(p.summary.weeklyAttendance)}`,
    `Attendance this month: ${pct(p.summary.monthlyAttendance)}`,
    `Average student grade: ${
      typeof p.summary.averageStudentGrade === 'number'
        ? `${p.summary.averageStudentGrade.toFixed(1)}%`
        : 'no grades entered yet'
    }`,
    `Report cards generated: ${p.summary.reportCardsCount ?? 0}`,
    `Weekly timetable published: ${p.hasPublishedSchedule ? 'yes' : 'no'}`,
    `Daily attendance history: ${history}`,
  ].join('\n')
}

const DailyBriefing: React.FC<DailyBriefingProps> = (props) => {
  const { schoolCode, today } = props
  const cacheKey = `dashboard_briefing_${schoolCode}_${today}`

  const [briefing, setBriefing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(
    async (force = false) => {
      if (!force) {
        try {
          const cached = localStorage.getItem(cacheKey)
          if (cached) {
            setBriefing(cached)
            return
          }
        } catch {
          // Private browsing or blocked storage — just regenerate.
        }
      }

      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/ai/dashboard-briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: buildContext(props) }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to generate briefing')
        setBriefing(data.briefing)
        try {
          localStorage.setItem(cacheKey, data.briefing)
        } catch {
          // Cache is an optimisation, not a requirement.
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate briefing')
      } finally {
        setLoading(false)
      }
    },
    // props is read only inside buildContext at call time; the cache key is
    // what decides whether a new briefing is due.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKey]
  )

  useEffect(() => {
    generate()
  }, [generate])

  return (
    <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-cyan-50/60 p-5 lg:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base font-semibold text-slate-900 inline-flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-violet-500" />
          Today at {props.schoolName}
        </h2>
        <button
          onClick={() => generate(true)}
          disabled={loading}
          title="Write a new briefing"
          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-100/60 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !briefing ? (
        <div className="space-y-2 animate-pulse" aria-label="Writing your briefing">
          <div className="h-3 rounded bg-slate-200/70 w-full" />
          <div className="h-3 rounded bg-slate-200/70 w-11/12" />
          <div className="h-3 rounded bg-slate-200/70 w-3/5" />
        </div>
      ) : error ? (
        <p className="text-sm text-slate-500">
          {error}{' '}
          <button
            onClick={() => generate(true)}
            className="text-violet-700 font-medium hover:underline cursor-pointer"
          >
            Try again
          </button>
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-slate-700">{briefing}</p>
      )}
    </div>
  )
}

export default DailyBriefing
