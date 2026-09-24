'use client'

// A staff member's own view of the current pay period: next pay day, the days
// it covers, and hours worked so far.

import React from 'react'
import { BanknotesIcon } from '@heroicons/react/24/outline'
import type { MyPayPeriodResponse } from '@/services/types/teacherAttendance'
import { dateRange, daysUntil, formatHours, shortDate } from './payPeriodFormat'

type Data = MyPayPeriodResponse['data']

const MyPayPeriodCard: React.FC<{ data: Data | null }> = ({ data }) => {
  if (!data?.schedule || !data.period) return null
  const { schedule, period } = data
  const until = daysUntil(period.payDate)
  const untilLabel = until === 0 ? 'Today' : until === 1 ? 'Tomorrow' : until > 1 ? `In ${until} days` : 'Passed'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-50 via-white to-teal-50 border-b border-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm">
          <BanknotesIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Next pay day {shortDate(period.payDate, true)}</p>
          <p className="text-xs text-slate-500">
            {schedule.description} · covers {dateRange(period.startDate, period.endDate)}
          </p>
        </div>
        <span className="ml-auto rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-medium text-cyan-700 border border-cyan-100 whitespace-nowrap">
          {untilLabel}
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        <div className="px-6 py-4 text-center">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Hours so far</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatHours(period.hoursWorked)}</p>
          {!period.isComplete && <p className="text-[11px] text-slate-400">through {shortDate(period.throughDate)}</p>}
        </div>
        <div className="px-6 py-4 text-center">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Days worked</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">{period.presentDays ?? 0}</p>
          <p className="text-[11px] text-slate-400">of {period.workingDays ?? 0} scheduled</p>
        </div>
        <div className="px-6 py-4 text-center">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Hours / day</p>
          <p className="text-2xl font-bold text-slate-700 tabular-nums">{formatHours(period.hoursPerDay)}</p>
        </div>
      </div>
    </div>
  )
}

export default MyPayPeriodCard
