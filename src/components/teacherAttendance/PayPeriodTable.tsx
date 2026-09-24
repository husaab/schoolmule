'use client'

// Everyone's hours for one pay period. A row per person on wide screens, a
// card per person on phones; either opens into that person's days so a
// half day or a note can be fixed without leaving the table. Overridden days
// wear their hours as a chip so payroll can see what was changed by hand.

import React from 'react'
import { ChevronDownIcon, PencilSquareIcon, PlusIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline'
import type { AttendanceRecord, PayPeriod, TeacherAttendanceData } from '@/services/types/teacherAttendance'
import { formatWorkDays } from './WorkDaysControl'
import { formatHours, staffName, weekdayDate } from './payPeriodFormat'

interface PayPeriodTableProps {
  period: PayPeriod
  teachers: TeacherAttendanceData[]
  expandedId: string | null
  onToggle: (teacherId: string) => void
  onEditDay: (teacher: TeacherAttendanceData, record: AttendanceRecord) => void
  onMarkDay: (teacher: TeacherAttendanceData) => void
}

const noteCount = (t: TeacherAttendanceData) => t.records.filter((r) => r.notes).length

const headCell = 'px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400'

/** One person's days in the period, each a button that opens the editor. */
const PeriodDayList: React.FC<{
  teacher: TeacherAttendanceData
  period: PayPeriod
  onEditDay: (record: AttendanceRecord) => void
  onMarkDay: () => void
}> = ({ teacher, period, onEditDay, onMarkDay }) => {
  const records = [...teacher.records].sort((a, b) => a.attendanceDate.localeCompare(b.attendanceDate))
  const ahead = teacher.workingDays - teacher.elapsedWorkingDays

  return (
    <div>
      {records.length === 0 ? (
        <p className="text-sm text-slate-500">No school days yet in this period.</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {records.map((r) => {
            const present = r.status === 'PRESENT'
            const override = r.hours !== null && r.hours !== undefined
            const hours = override ? Number(r.hours) : present ? teacher.hoursPerDay : 0
            return (
              <li key={r.attendanceDate}>
                <button
                  type="button"
                  onClick={() => onEditDay(r)}
                  title={r.notes ?? undefined}
                  className="group flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-cyan-300 hover:bg-cyan-50/40 cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${present ? 'bg-emerald-500' : 'bg-rose-500'}`} aria-hidden />
                  <span className="w-[6.5rem] shrink-0 tabular-nums text-slate-800">{weekdayDate(r.attendanceDate)}</span>
                  <span className={`text-xs font-medium ${present ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {present ? 'Present' : 'Absent'}
                  </span>
                  <span
                    className={`ml-auto rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums ${
                      override ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'text-slate-400'
                    }`}
                    title={override ? 'Hours set by hand for this day' : undefined}
                  >
                    {formatHours(hours)} h
                  </span>
                  {r.notes && <ChatBubbleBottomCenterTextIcon className="h-4 w-4 shrink-0 text-amber-500" aria-label="Has a note" />}
                  <PencilSquareIcon className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-cyan-600" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        {ahead > 0 && !period.isComplete && (
          <span>
            {ahead} school {ahead === 1 ? 'day' : 'days'} still ahead
          </span>
        )}
        <button
          type="button"
          onClick={onMarkDay}
          className="inline-flex items-center gap-1 font-medium text-cyan-700 hover:underline cursor-pointer"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Mark another day
        </button>
      </div>
    </div>
  )
}

const PayPeriodTable: React.FC<PayPeriodTableProps> = ({ period, teachers, expandedId, onToggle, onEditDay, onMarkDay }) => {
  const totalHours = teachers.reduce((sum, t) => sum + (Number(t.hoursWorked) || 0), 0)

  return (
    <>
      {/* Wide screens: a table with an expanding row. */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className={`${headCell} pl-5 text-left`}>Staff member</th>
              <th className={`${headCell} text-left`}>Works</th>
              <th className={`${headCell} text-right`}>Hrs / day</th>
              <th className={`${headCell} text-right`}>Present</th>
              <th className={`${headCell} text-right`}>Absent</th>
              <th className={`${headCell} text-right`} title="School days that have happened / scheduled in this period">
                Days
              </th>
              <th className={`${headCell} text-right`}>Hours worked</th>
              <th className={`${headCell} text-right`}>Notes</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teachers.map((t) => {
              const open = expandedId === t.teacherId
              const notes = noteCount(t)
              return (
                <React.Fragment key={t.teacherId}>
                  <tr
                    tabIndex={0}
                    role="button"
                    aria-expanded={open}
                    onClick={() => onToggle(t.teacherId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onToggle(t.teacherId)
                      }
                    }}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 ${
                      open ? 'bg-cyan-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 pl-5 pr-3 font-medium text-slate-900 whitespace-nowrap">{staffName(t)}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                      {formatWorkDays(t.workDays)}
                      {t.workDaysSource === 'custom' && <span className="text-cyan-600" title="Set by admin"> *</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                      {formatHours(t.hoursPerDay)}
                      {t.hoursPerDaySource === 'custom' && <span className="text-cyan-600" title="Set individually"> *</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">{t.presentDays}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${t.absentDays > 0 ? 'font-medium text-rose-700' : 'text-slate-400'}`}>
                      {t.absentDays}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                      {t.elapsedWorkingDays} / {t.workingDays}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">{formatHours(t.hoursWorked)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                      {notes > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
                          {notes}
                        </span>
                      ) : (
                        <span className="text-slate-300">–</span>
                      )}
                    </td>
                    <td className="pr-4 py-2.5 text-right">
                      <ChevronDownIcon className={`inline h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={9} className="px-5 py-4">
                        <PeriodDayList teacher={t} period={period} onEditDay={(r) => onEditDay(t, r)} onMarkDay={() => onMarkDay(t)} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
          {teachers.length > 1 && (
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/60">
                <td colSpan={6} className="py-2.5 pl-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total
                </td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-900">{formatHours(totalHours)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Phones: a card per person, same expansion. */}
      <ul className="md:hidden divide-y divide-slate-100">
        {teachers.map((t) => {
          const open = expandedId === t.teacherId
          const notes = noteCount(t)
          return (
            <li key={t.teacherId}>
              <button
                type="button"
                onClick={() => onToggle(t.teacherId)}
                aria-expanded={open}
                className="flex w-full items-start gap-3 px-4 py-3 text-left cursor-pointer active:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{staffName(t)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatWorkDays(t.workDays)} · {formatHours(t.hoursPerDay)} h/day · {t.elapsedWorkingDays}/{t.workingDays} days
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">{t.presentDays} present</span>
                    <span className={`rounded-md px-1.5 py-0.5 font-medium ${t.absentDays > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                      {t.absentDays} absent
                    </span>
                    {notes > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                        <ChatBubbleBottomCenterTextIcon className="h-3.5 w-3.5" />
                        {notes}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-semibold tabular-nums text-slate-900">{formatHours(t.hoursWorked)} h</p>
                  <ChevronDownIcon className={`ml-auto mt-1 h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {open && (
                <div className="bg-slate-50/60 px-4 py-3">
                  <PeriodDayList teacher={t} period={period} onEditDay={(r) => onEditDay(t, r)} onMarkDay={() => onMarkDay(t)} />
                </div>
              )}
            </li>
          )
        })}
        {teachers.length > 1 && (
          <li className="flex items-center justify-between bg-slate-50/60 px-4 py-2.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</span>
            <span className="font-bold tabular-nums text-slate-900">{formatHours(totalHours)} h</span>
          </li>
        )}
      </ul>
    </>
  )
}

export default PayPeriodTable
