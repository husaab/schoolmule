'use client'

// The numbers an admin checks before running payroll, for one pay period:
// when it pays, how many people, hours so far, who has an absence, and how
// many school days are still to come. The pay-day tile leads; the rest are
// plain counts, so only "with an absence" carries a colour.

import React from 'react'
import { BanknotesIcon } from '@heroicons/react/24/outline'
import StatTile from '@/components/ui/StatTile'
import type { PayPeriod, TeacherAttendanceData } from '@/services/types/teacherAttendance'
import { dateRange, daysUntil, formatHours, relativeDays, shortDate } from './payPeriodFormat'

interface AttendanceOverviewProps {
  period: PayPeriod | null
  /** The people the page is currently showing (all, or the one filtered to). */
  teachers: TeacherAttendanceData[]
  loading: boolean
}

const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({ period, teachers, loading }) => {
  const totalHours = teachers.reduce((sum, t) => sum + (Number(t.hoursWorked) || 0), 0)
  const withAbsence = teachers.filter((t) => t.absentDays > 0).length
  const daysLeft = teachers.reduce((max, t) => Math.max(max, t.workingDays - t.elapsedWorkingDays), 0)
  const until = period ? daysUntil(period.payDate) : 0
  const past = until < 0

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
      <div className="col-span-2 relative overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-teal-50 pl-5 pr-4 py-4">
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-teal-500" aria-hidden />
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm">
            <BanknotesIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            {loading || !period ? (
              <span className="block h-8 w-32 rounded-lg bg-white/70 animate-pulse" aria-label="Loading" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums text-slate-900">{shortDate(period.payDate, true)}</p>
            )}
            <p className="text-xs text-slate-600 mt-0.5">
              {past ? 'Pay day was' : 'Next pay day'}
              {period && <span className="font-medium"> {relativeDays(until)}</span>}
            </p>
            {period && (
              <p className="text-xs text-slate-500 mt-1.5">
                Covers {dateRange(period.startDate, period.endDate)}
                {!period.isComplete && <> · hours through {shortDate(period.throughDate)}</>}
              </p>
            )}
          </div>
        </div>
      </div>
      <StatTile label="Staff" value={teachers.length} loading={loading} />
      <StatTile label="Hours worked" value={formatHours(totalHours)} loading={loading} sub={period && !period.isComplete ? 'so far' : 'in this period'} />
      <StatTile
        label="With an absence"
        value={withAbsence}
        tone={withAbsence > 0 ? 'warn' : 'neutral'}
        loading={loading}
        sub={withAbsence === 0 ? 'nobody missed a day' : `of ${teachers.length}`}
      />
      <StatTile label="School days left" value={daysLeft} loading={loading} sub={daysLeft === 0 ? 'period complete' : 'before pay day'} />
    </div>
  )
}

export default AttendanceOverview
