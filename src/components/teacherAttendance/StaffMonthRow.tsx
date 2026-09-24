'use client'

// One person in the month view: a header you can scan closed (name, work
// days, hours per day, this month's counts) that opens into their calendar.
// The work-day and hours editors live here because they change what every
// day on that calendar is worth.

import React from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import type { TeacherAttendanceData } from '@/services/types/teacherAttendance'
import AttendanceCalendar from './AttendanceCalendar'
import WorkDaysControl from './WorkDaysControl'
import HoursPerDayControl from './HoursPerDayControl'
import PresentAbsentChips from './PresentAbsentChips'
import { formatHours, staffName } from './payPeriodFormat'

interface StaffMonthRowProps {
  teacher: TeacherAttendanceData
  month: Date
  open: boolean
  onToggle: () => void
  onDayClick: (date: string, currentStatus: string | null) => void
  onSaveWorkDays: (days: number[]) => Promise<void>
  onResetWorkDays: () => Promise<void>
  onSaveHoursPerDay: (hours: number) => Promise<void>
  onResetHoursPerDay: () => Promise<void>
}

const StaffMonthRow: React.FC<StaffMonthRowProps> = ({
  teacher,
  month,
  open,
  onToggle,
  onDayClick,
  onSaveWorkDays,
  onResetWorkDays,
  onSaveHoursPerDay,
  onResetHoursPerDay,
}) => (
  <li>
    <div className={`flex items-start gap-3 px-4 py-3 sm:px-5 ${open ? 'bg-cyan-50/40' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-w-0 flex-1 items-start gap-3 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg"
      >
        <ChevronDownIcon className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-slate-900 truncate">{staffName(teacher)}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <PresentAbsentChips presentDays={teacher.presentDays} absentDays={teacher.absentDays} />
            <span className="text-slate-400">of {teacher.workingDays} days</span>
          </span>
        </span>
      </button>
      <div className="shrink-0 text-right">
        <p className="text-lg font-semibold tabular-nums text-slate-900" title="Hours worked this month">
          {formatHours(teacher.hoursWorked)} h
        </p>
      </div>
    </div>
    {open && (
      <div className="border-t border-slate-100 px-4 pb-5 pt-3 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center gap-1">
          <WorkDaysControl workDays={teacher.workDays} source={teacher.workDaysSource} onSave={onSaveWorkDays} onReset={onResetWorkDays} />
          <HoursPerDayControl hoursPerDay={teacher.hoursPerDay} source={teacher.hoursPerDaySource} onSave={onSaveHoursPerDay} onReset={onResetHoursPerDay} />
        </div>
        <AttendanceCalendar month={month} records={teacher.records} workDays={teacher.workDays} onDayClick={onDayClick} />
      </div>
    )}
  </li>
)

export default StaffMonthRow
