'use client'

import React, { useMemo } from 'react'
import { CalendarDaysIcon, CheckCircleIcon, ClipboardDocumentCheckIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'
import StatCard from '@/app/(user)/analytics/_components/StatCard'
import { attendanceExceptions, attendanceMonths, attendanceTone, fmtPct, formatDay, type CalendarCell } from '@/lib/studentProfile'
import type { AttendanceStatus, StudentOverview } from '@/services/types/studentProfile'
import { Card, EmptyState } from './ui'

const STATUS_CELL: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-800',
  LATE: 'bg-amber-200 text-amber-900',
  ABSENT: 'bg-rose-500 text-white',
}
const STATUS_SWATCH: Record<AttendanceStatus, string> = { PRESENT: 'bg-emerald-100', LATE: 'bg-amber-200', ABSENT: 'bg-rose-500' }
const STATUS_WORD: Record<AttendanceStatus, string> = { PRESENT: 'Present', LATE: 'Late', ABSENT: 'Absent' }

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F']

const AttendanceTab: React.FC<{ overview: StudentOverview }> = ({ overview }) => {
  const { summary, days } = overview.attendance
  const months = useMemo(() => attendanceMonths(days, overview.terms), [days, overview.terms])
  const exceptions = useMemo(() => attendanceExceptions(days), [days])

  if (summary.totalDays === 0) {
    return (
      <Card>
        <EmptyState icon={CalendarDaysIcon} title="No attendance recorded yet">
          Daily attendance taken for this student this school year will appear here.
        </EmptyState>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance · year"
          value={fmtPct(summary.pct)}
          icon={ClipboardDocumentCheckIcon}
          color={attendanceTone(summary.pct)}
          sub={`${summary.totalDays} school days recorded`}
        />
        <StatCard label="Present" value={summary.presentDays} icon={CheckCircleIcon} color="from-emerald-500 to-emerald-600" sub="on time" />
        <StatCard label="Late" value={summary.lateDays} icon={ClockIcon} color="from-amber-500 to-amber-600" sub="count as present" />
        <StatCard
          label="Absent"
          value={summary.absentDays}
          icon={XCircleIcon}
          color={summary.absentDays > 0 ? 'from-rose-500 to-rose-600' : 'from-slate-400 to-slate-500'}
          sub="days missed"
        />
      </div>

      {overview.terms.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {overview.terms.map((t) => (
            <div key={t.termId} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t.name}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{fmtPct(t.attendance.pct)}</p>
              <p className="text-xs text-slate-400">
                {t.attendance.totalDays
                  ? `${t.attendance.absentDays} absent · ${t.attendance.lateDays} late of ${t.attendance.totalDays} days`
                  : 'no records'}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Calendar"
          subtitle="Daily attendance, Monday to Friday"
          action={
            <div className="hidden items-center gap-3 text-xs text-slate-500 sm:flex">
              {(['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded ${STATUS_SWATCH[s]}`} />
                  {STATUS_WORD[s]}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-slate-100" />
                Not taken
              </span>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {months.map((month) => (
              <div key={month.key}>
                <p className="mb-2 text-sm font-semibold text-slate-800">{month.label}</p>
                <div className="grid grid-cols-5 gap-1">
                  {WEEKDAYS.map((d, i) => (
                    <span key={i} className="text-center text-[10px] font-semibold text-slate-400">
                      {d}
                    </span>
                  ))}
                  {month.weeks.flat().map((cell, i) => (
                    <DayCell key={cell?.date ?? `${month.key}-pad-${i}`} cell={cell} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="self-start" title="Absences & lates" subtitle="Most recent first" flush>
          {exceptions.length === 0 ? (
            <EmptyState icon={CheckCircleIcon} title="Perfect attendance so far" />
          ) : (
            <ul className="max-h-[32rem] divide-y divide-slate-50 overflow-y-auto pb-2">
              {exceptions.map((d) => (
                <li key={d.date} className="flex items-center justify-between gap-3 px-6 py-2.5 text-sm">
                  <span className="text-slate-700">{formatDay(d.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      d.status === 'ABSENT' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {d.status ? STATUS_WORD[d.status] : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

const DayCell = ({ cell }: { cell: CalendarCell | null }) => {
  if (!cell) return <span className="h-7" />
  const label = `${formatDay(cell.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${cell.status ? STATUS_WORD[cell.status] : 'Not taken'}`
  const tone = cell.status ? STATUS_CELL[cell.status] : cell.outside ? 'text-slate-300' : 'bg-slate-50 text-slate-400'
  return (
    <span title={label} aria-label={label} className={`flex h-7 items-center justify-center rounded-md text-[11px] font-medium tabular-nums ${tone}`}>
      {cell.day}
    </span>
  )
}

export default AttendanceTab
