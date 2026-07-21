'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ClipboardDocumentCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { ChildLite } from '@/store/useSelectedChildStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { getChildAttendance } from '@/services/parentPortalService'
import { ChildAttendance } from '@/services/types/parentPortal'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ChildSections from '@/components/parent/ChildSections'
import ChildJumpNav from '@/components/parent/ChildJumpNav'
import ParentFilterBar from '@/components/parent/ParentFilterBar'
import ParentEmptyState from '@/components/parent/ParentEmptyState'
import AttendanceMonthGrid from '@/components/parent/AttendanceMonthGrid'
import TermPicker from '@/components/parent/TermPicker'
import Spinner from '@/components/Spinner'

type Month = { year: number; month: number } // month 1-12

const monthOf = (iso: string): Month => ({
  year: parseInt(iso.slice(0, 4), 10),
  month: parseInt(iso.slice(5, 7), 10),
})
const monthKey = (m: Month) => m.year * 12 + (m.month - 1)
const addMonths = (m: Month, delta: number): Month => {
  const k = monthKey(m) + delta
  return { year: Math.floor(k / 12), month: (k % 12) + 1 }
}
const monthLabel = (m: Month) =>
  new Date(Date.UTC(m.year, m.month - 1, 1)).toLocaleDateString('en-CA', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

const StatTile: React.FC<{ label: string; value: string; accent?: string }> = ({
  label,
  value,
  accent = 'text-slate-900',
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-4">
    <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${accent}`}>{value}</p>
  </div>
)

const ChildAttendanceSection: React.FC<{ child: ChildLite; termId: string }> = ({
  child,
  termId,
}) => {
  const [attendance, setAttendance] = useState<ChildAttendance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMonth, setViewMonth] = useState<Month | null>(null)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId) // refetch when the selected school year changes

  useEffect(() => {
    setLoading(true)
    setError(null)
    // One fetch for the whole term; month paging slices client-side.
    getChildAttendance(child.studentId, termId ? { termId } : undefined)
      .then((res) => {
        const data = res.data || null
        setAttendance(data)
        if (data) {
          const today = new Date().toISOString().slice(0, 10)
          const from = data.from ? String(data.from).slice(0, 10) : today
          const to = data.to ? String(data.to).slice(0, 10) : today
          // Start on the current month, clamped into the term window.
          const clamped = today < from ? from : today > to ? to : today
          setViewMonth(monthOf(clamped))
        }
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load attendance.')
      })
      .finally(() => setLoading(false))
  }, [child.studentId, termId, selectedYearId])

  const range = useMemo(() => {
    if (!attendance?.from || !attendance?.to) return null
    return {
      first: monthOf(String(attendance.from).slice(0, 10)),
      last: monthOf(String(attendance.to).slice(0, 10)),
    }
  }, [attendance])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="md" />
      </div>
    )
  }
  if (error) {
    return (
      <ParentEmptyState
        icon={ClipboardDocumentCheckIcon}
        title="Something went wrong"
        message={error}
      />
    )
  }
  if (!attendance || attendance.summary.totalDays === 0) {
    return (
      <ParentEmptyState
        icon={ClipboardDocumentCheckIcon}
        title="No attendance yet"
        message="No attendance has been recorded for this term yet."
      />
    )
  }

  const { summary } = attendance
  const canPrev = range && viewMonth ? monthKey(viewMonth) > monthKey(range.first) : false
  const canNext = range && viewMonth ? monthKey(viewMonth) < monthKey(range.last) : false

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Present" value={String(summary.presentDays)} accent="text-emerald-600" />
        <StatTile label="Late" value={String(summary.lateDays)} accent="text-amber-600" />
        <StatTile label="Absent" value={String(summary.absentDays)} accent="text-rose-600" />
        <StatTile
          label="Attendance Rate"
          value={summary.pct != null ? `${summary.pct}%` : '—'}
        />
      </div>

      {viewMonth && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold text-slate-900">{monthLabel(viewMonth)}</h4>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                disabled={!canPrev}
                className="p-2 rounded-lg text-slate-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                disabled={!canNext}
                className="p-2 rounded-lg text-slate-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
                aria-label="Next month"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          <AttendanceMonthGrid
            year={viewMonth.year}
            month={viewMonth.month}
            days={attendance.days}
          />
        </div>
      )}
    </div>
  )
}

const ParentAttendancePage: React.FC = () => {
  const [termId, setTermId] = useState('')
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)

  // A term from one year is meaningless in another — snap back to the
  // year's default term whenever the selected school year changes.
  useEffect(() => {
    setTermId('')
  }, [selectedYearId])

  return (
    <ParentPageShell
      title="Attendance"
      subtitle="Day-by-day attendance, term by term."
      badge={{ icon: ClipboardDocumentCheckIcon, label: 'Attendance' }}
    >
      <ParentFilterBar>
        {/* Attendance is a per-term day grid — no "all terms" view */}
        <TermPicker value={termId} onChange={setTermId} includeAll={false} />
      </ParentFilterBar>

      <ChildSections
        renderChild={(child) => <ChildAttendanceSection child={child} termId={termId} />}
      />
      <ChildJumpNav />
    </ParentPageShell>
  )
}

export default ParentAttendancePage
