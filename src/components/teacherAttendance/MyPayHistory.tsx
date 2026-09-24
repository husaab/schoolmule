'use client'

// A staff member's last few pay days: what each covered and the hours it
// paid. Read-only; the calendar above is where a day gets changed.

import React from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'
import type { MyPayPeriodResponse } from '@/services/types/teacherAttendance'
import { dateRange, formatHours, shortDate } from './payPeriodFormat'

export type MyPeriod = NonNullable<MyPayPeriodResponse['data']['period']>

interface MyPayHistoryProps {
  periods: MyPeriod[]
  loading: boolean
  error: string | null
}

const MyPayHistory: React.FC<MyPayHistoryProps> = ({ periods, loading, error }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
      <ClockIcon className="h-4 w-4 text-slate-400" />
      <h2 className="text-sm font-semibold text-slate-900">Previous pay days</h2>
    </div>
    {loading ? (
      <ul className="divide-y divide-slate-100">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center justify-between px-5 py-3">
            <span className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
            <span className="h-4 w-12 rounded bg-slate-100 animate-pulse" />
          </li>
        ))}
      </ul>
    ) : error ? (
      <p className="px-5 py-4 text-sm text-rose-700">{error}</p>
    ) : periods.length === 0 ? (
      <p className="px-5 py-4 text-sm text-slate-500">Your first pay day is still ahead.</p>
    ) : (
      <ul className="divide-y divide-slate-100">
        {periods.map((p) => (
          <li key={p.payDate} className="flex items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">Paid {shortDate(p.payDate, true)}</p>
              <p className="text-xs text-slate-500">
                {dateRange(p.startDate, p.endDate)} · {p.presentDays ?? 0} of {p.workingDays ?? 0} days worked
                {(p.absentDays ?? 0) > 0 && <span className="text-rose-600"> · {p.absentDays} absent</span>}
              </p>
            </div>
            <p className="shrink-0 text-base font-semibold tabular-nums text-slate-900">{formatHours(p.hoursWorked)} h</p>
          </li>
        ))}
      </ul>
    )}
  </div>
)

export default MyPayHistory
