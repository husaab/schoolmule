'use client'

// One person's month calendar in a centered modal, opened from their row in
// the pay-period table, so an admin can look at (and fix) someone's whole
// month without leaving the table. The modal loads its own month; the page
// owns the day editor and bumps `dataVersion` after any save so the calendar
// refreshes.

import React, { useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { format, addMonths, subMonths } from 'date-fns'
import Modal from '@/components/shared/modal'
import Spinner from '@/components/Spinner'
import { getAllTeacherAttendance } from '@/services/teacherAttendanceService'
import type { AttendanceRecord, TeacherAttendanceData } from '@/services/types/teacherAttendance'
import AttendanceCalendar from './AttendanceCalendar'
import MonthSwitcher from './MonthSwitcher'
import PresentAbsentChips from './PresentAbsentChips'
import WorkDaysControl from './WorkDaysControl'
import HoursPerDayControl from './HoursPerDayControl'
import type { StaffOption } from './StaffPicker'
import { errorMessage, formatHours } from './payPeriodFormat'

interface StaffCalendarModalProps {
  /** Who to show; null keeps the modal closed. */
  teacherId: string | null
  school: string
  /** Everyone on the page, in display order, for previous / next. */
  staff: StaffOption[]
  /** Month to open on. The modal then keeps its own month while open. */
  initialMonth: Date
  /** Bump after any save so the calendar reloads. */
  dataVersion: number
  onClose: () => void
  onChangePerson: (teacherId: string) => void
  onDayClick: (teacher: TeacherAttendanceData, date: string, record: AttendanceRecord | null) => void
  onSaveWorkDays: (teacherId: string, days: number[]) => Promise<void>
  onResetWorkDays: (teacherId: string) => Promise<void>
  onSaveHoursPerDay: (teacherId: string, hours: number) => Promise<void>
  onResetHoursPerDay: (teacherId: string) => Promise<void>
}

const personButton =
  'inline-flex max-w-[45%] items-center gap-1 truncate rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer'

const StaffCalendarModal: React.FC<StaffCalendarModalProps> = ({
  teacherId,
  school,
  staff,
  initialMonth,
  dataVersion,
  onClose,
  onChangePerson,
  onDayClick,
  onSaveWorkDays,
  onResetWorkDays,
  onSaveHoursPerDay,
  onResetHoursPerDay,
}) => {
  const open = teacherId !== null
  const [month, setMonth] = useState<Date>(initialMonth)
  const [teacher, setTeacher] = useState<TeacherAttendanceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start on the page's month each time the modal opens.
  useEffect(() => {
    if (open) setMonth(initialMonth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!teacherId || !school) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getAllTeacherAttendance(school, format(month, 'yyyy-MM'))
      .then((res) => {
        if (cancelled) return
        setTeacher(res.data.teachers.find((t) => t.teacherId === teacherId) ?? null)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load this month'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [teacherId, school, month, dataVersion])

  const index = staff.findIndex((s) => s.id === teacherId)
  const prev = index > 0 ? staff[index - 1] : null
  const next = index >= 0 && index < staff.length - 1 ? staff[index + 1] : null
  const name = staff[index]?.name ?? ''

  return (
    <Modal isOpen={open} onClose={onClose} size="2xl">
      <header className="border-b border-slate-100 bg-gradient-to-br from-cyan-50 via-white to-teal-50 px-6 pb-4 pt-5">
        {/* pr-10 keeps the title clear of the shared Modal's close button. */}
        <div className="min-w-0 pr-10">
          <h2 className="truncate text-lg font-semibold text-slate-900">{name}</h2>
          {teacher && (
            <div className="mt-1 -ml-2 flex flex-wrap items-center gap-1">
              <WorkDaysControl
                workDays={teacher.workDays}
                source={teacher.workDaysSource}
                onSave={(days) => onSaveWorkDays(teacher.teacherId, days)}
                onReset={() => onResetWorkDays(teacher.teacherId)}
              />
              <HoursPerDayControl
                hoursPerDay={teacher.hoursPerDay}
                source={teacher.hoursPerDaySource}
                onSave={(hours) => onSaveHoursPerDay(teacher.teacherId, hours)}
                onReset={() => onResetHoursPerDay(teacher.teacherId)}
              />
            </div>
          )}
        </div>
        <MonthSwitcher month={month} onPrev={() => setMonth((m) => subMonths(m, 1))} onNext={() => setMonth((m) => addMonths(m, 1))} className="mt-3" />
        {teacher && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <PresentAbsentChips presentDays={teacher.presentDays} absentDays={teacher.absentDays} />
            <span className="py-0.5 text-slate-400">
              of {teacher.workingDays} days · {formatHours(teacher.hoursWorked)} h this month
            </span>
          </div>
        )}
      </header>

      <div className="px-6 py-5">
        {loading && !teacher ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : !teacher ? (
          <p className="text-sm text-slate-500">This person has no attendance for {format(month, 'MMMM yyyy')}.</p>
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            <AttendanceCalendar
              month={month}
              records={teacher.records}
              workDays={teacher.workDays}
              onDayClick={(date) =>
                onDayClick(teacher, date, teacher.records.find((r) => r.attendanceDate.substring(0, 10) === date) ?? null)
              }
            />
            <p className="mt-4 text-center text-xs text-slate-400">Click a day to mark it, change its hours, or add a note.</p>
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <button type="button" onClick={() => prev && onChangePerson(prev.id)} disabled={!prev} className={personButton}>
          <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{prev ? prev.name : 'Previous'}</span>
        </button>
        <button type="button" onClick={() => next && onChangePerson(next.id)} disabled={!next} className={personButton}>
          <span className="truncate">{next ? next.name : 'Next'}</span>
          <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
        </button>
      </footer>
    </Modal>
  )
}

export default StaffCalendarModal
