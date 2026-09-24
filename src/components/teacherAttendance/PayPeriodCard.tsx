'use client'

// The current pay period at a glance for admins: when the next pay day is,
// which days it covers, and everyone's hours so far. Sits above the monthly
// calendars on the Staff Attendance page.

import React from 'react'
import { BanknotesIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import type { PayPeriod, PaySchedule } from '@/services/types/teacherAttendance'
import { dateRange, daysUntil, formatHours, shortDate } from './payPeriodFormat'

interface PayPeriodCardProps {
  schedule: PaySchedule | null
  period: PayPeriod | null
  loading: boolean
  /** Narrow the table to one person (the page's teacher filter). */
  teacherId?: string
  onConfigure: () => void
}

const PayPeriodCard: React.FC<PayPeriodCardProps> = ({ schedule, period, loading, teacherId, onConfigure }) => {
  if (!schedule) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <BanknotesIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">No pay schedule yet</p>
            <p className="text-xs text-slate-500">Set when staff are paid to see hours worked up to each pay day.</p>
          </div>
        </div>
        <button
          onClick={onConfigure}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <Cog6ToothIcon className="h-4 w-4" />
          Set up pay schedule
        </button>
      </div>
    )
  }

  const teachers = period ? (teacherId ? period.teachers.filter((t) => t.teacherId === teacherId) : period.teachers) : []
  const totalHours = teachers.reduce((sum, t) => sum + (Number(t.hoursWorked) || 0), 0)
  const until = period ? daysUntil(period.payDate) : 0
  const untilLabel = until === 0 ? 'today' : until === 1 ? 'tomorrow' : until > 1 ? `in ${until} days` : 'passed'

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-cyan-50 via-white to-teal-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm">
            <BanknotesIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {period ? (
                <>
                  Next pay day {shortDate(period.payDate, true)}
                  <span className="ml-2 rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-medium text-cyan-700 border border-cyan-100">
                    {untilLabel}
                  </span>
                </>
              ) : (
                'Current pay period'
              )}
            </p>
            <p className="text-xs text-slate-500">
              {schedule.description}
              {period && <> · covers {dateRange(period.startDate, period.endDate)}</>}
              {period && !period.isComplete && <> · hours through {shortDate(period.throughDate)}</>}
            </p>
          </div>
        </div>
        <button
          onClick={onConfigure}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <Cog6ToothIcon className="h-4 w-4" />
          Pay schedule
        </button>
      </div>

      {loading ? (
        <p className="px-5 py-4 text-sm text-slate-400">Loading hours…</p>
      ) : teachers.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-400">No staff to show.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-5 py-2 text-left font-semibold">Staff member</th>
                <th className="px-3 py-2 text-right font-semibold">Present</th>
                <th className="px-3 py-2 text-right font-semibold">Absent</th>
                <th className="px-3 py-2 text-right font-semibold" title="Work days that have happened / scheduled in this period">
                  Days
                </th>
                <th className="px-3 py-2 text-right font-semibold">Hrs / day</th>
                <th className="px-5 py-2 text-right font-semibold">Hours worked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((t) => (
                <tr key={t.teacherId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-2 font-medium text-slate-800 whitespace-nowrap">
                    {t.firstName || ''} {t.lastName || t.username || ''}
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-700">{t.presentDays}</td>
                  <td className="px-3 py-2 text-right text-red-700">{t.absentDays}</td>
                  <td className="px-3 py-2 text-right text-slate-500">
                    {t.elapsedWorkingDays} / {t.workingDays}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">
                    {formatHours(t.hoursPerDay)}
                    {t.hoursPerDaySource === 'custom' && (
                      <span className="text-cyan-600" title="Set individually">
                        {' '}*
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2 text-right font-semibold text-slate-900 tabular-nums">{formatHours(t.hoursWorked)}</td>
                </tr>
              ))}
            </tbody>
            {teachers.length > 1 && (
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/60">
                  <td className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500" colSpan={5}>
                    Total
                  </td>
                  <td className="px-5 py-2 text-right font-bold text-slate-900 tabular-nums">{formatHours(totalHours)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  )
}

export default PayPeriodCard
