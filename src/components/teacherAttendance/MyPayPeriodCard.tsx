'use client'

// A staff member's own view of the current pay period: next pay day, the days
// it covers, and hours worked so far. Leads the My Attendance page, so it
// also says when there is nothing to show yet.

import React from 'react'
import { BanknotesIcon } from '@heroicons/react/24/outline'
import type { MyPayPeriodResponse } from '@/services/types/teacherAttendance'
import { dateRange, daysUntil, formatHours, relativeDays, shortDate } from './payPeriodFormat'

type Data = MyPayPeriodResponse['data']

interface MyPayPeriodCardProps {
  data: Data | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const MyPayPeriodCard: React.FC<MyPayPeriodCardProps> = ({ data, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden" aria-busy>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <span className="h-10 w-10 rounded-xl bg-slate-100 animate-pulse" />
          <span className="h-4 w-44 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          {[0, 1, 2].map((i) => (
            <div key={i} className="px-6 py-4 flex flex-col items-center gap-2">
              <span className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
              <span className="h-7 w-10 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-rose-900">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer sm:self-auto"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!data?.schedule || !data.period) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <BanknotesIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">No pay schedule yet</p>
          <p className="text-xs text-slate-500">Once the school sets its pay days, your hours to each pay day show here.</p>
        </div>
      </div>
    )
  }

  const { schedule, period } = data
  const until = daysUntil(period.payDate)

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
          {capitalize(relativeDays(until))}
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
