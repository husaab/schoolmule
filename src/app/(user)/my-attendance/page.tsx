'use client'

// A staff member's own attendance. The next pay day leads — hours so far and
// days worked — then the month calendar to fix a day, then the month's
// counts and the last few pay days.

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import Spinner from '@/components/Spinner'
import StatTile from '@/components/ui/StatTile'
import EmptyState from '@/components/ui/EmptyState'
import AttendanceCalendar from '@/components/teacherAttendance/AttendanceCalendar'
import EditAttendanceModal from '@/components/teacherAttendance/EditAttendanceModal'
import MyPayPeriodCard from '@/components/teacherAttendance/MyPayPeriodCard'
import MyPayHistory, { type MyPeriod } from '@/components/teacherAttendance/MyPayHistory'
import { getMyMonth, getMyPayPeriod, updateMyRecord, deleteMyRecord } from '@/services/teacherAttendanceService'
import type { AttendanceSummary, MyPayPeriodResponse } from '@/services/types/teacherAttendance'
import { errorMessage, formatHours, shiftDate } from '@/components/teacherAttendance/payPeriodFormat'
import MonthSwitcher from '@/components/teacherAttendance/MonthSwitcher'
import { formatWorkDays } from '@/components/teacherAttendance/WorkDaysControl'
import { useNotificationStore } from '@/store/useNotificationStore'
import { format, addMonths, subMonths } from 'date-fns'
import { CalendarDaysIcon, ExclamationTriangleIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import { useFilterParams } from '@/hooks/useFilterParams'

const HISTORY_LENGTH = 3


function MyAttendanceContent() {
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const { get, setParams } = useFilterParams()
  // Filter lives in the URL so Back/refresh/share restore it.
  const monthParam = get('month')
  const currentMonth = monthParam ? new Date(monthParam + '-01T00:00:00') : new Date()
  const monthStr = format(currentMonth, 'yyyy-MM')

  const [month, setMonth] = useState<AttendanceSummary | null>(null)
  const [monthLoading, setMonthLoading] = useState(true)
  const [monthError, setMonthError] = useState<string | null>(null)
  const [payPeriod, setPayPeriod] = useState<MyPayPeriodResponse['data'] | null>(null)
  const [history, setHistory] = useState<MyPeriod[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<{
    date: string
    status: 'PRESENT' | 'ABSENT' | null
    notes: string | null
  } | null>(null)

  const loadMonth = useCallback(async () => {
    setMonthLoading(true)
    setMonthError(null)
    try {
      const res = await getMyMonth(monthStr)
      setMonth(res.data)
    } catch (err) {
      setMonthError(errorMessage(err, 'Could not load this month'))
    } finally {
      setMonthLoading(false)
    }
  }, [monthStr])

  // The current period, then the few before it — each found from the day
  // before the previous one started, since only the server knows pay days.
  const loadPayPeriods = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const current = await getMyPayPeriod()
      setPayPeriod(current.data)
      const past: MyPeriod[] = []
      let cursor = current.data.period
      while (current.data.schedule && cursor && past.length < HISTORY_LENGTH) {
        const res = await getMyPayPeriod(shiftDate(cursor.startDate, -1))
        cursor = res.data.period
        if (cursor) past.push(cursor)
      }
      setHistory(past)
    } catch (err) {
      setHistoryError(errorMessage(err, 'Could not load previous pay days'))
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user.id) loadMonth()
  }, [user.id, loadMonth])

  useEffect(() => {
    if (user.id) loadPayPeriods()
  }, [user.id, loadPayPeriods])

  const handleDayClick = (date: string, currentStatus: string | null) => {
    const record = month?.records.find((r) => r.attendanceDate.substring(0, 10) === date)
    setEditTarget({
      date,
      status: (currentStatus as 'PRESENT' | 'ABSENT' | null) ?? null,
      notes: record?.notes ?? null,
    })
  }

  const handleEditDelete = async () => {
    if (!editTarget) return
    try {
      await deleteMyRecord(editTarget.date)
      setEditTarget(null)
      showNotification('Record removed', 'success')
      await Promise.all([loadMonth(), loadPayPeriods()])
    } catch (err) {
      showNotification(errorMessage(err, 'Could not remove the record'), 'error')
    }
  }

  const handleEditSave = async (status: 'PRESENT' | 'ABSENT', notes: string | null) => {
    if (!editTarget) return
    try {
      await updateMyRecord(editTarget.date, status, notes)
      setEditTarget(null)
      showNotification('Attendance saved', 'success')
      await Promise.all([loadMonth(), loadPayPeriods()])
    } catch (err) {
      showNotification(errorMessage(err, 'Could not save attendance'), 'error')
    }
  }

  const workingDays = month?.workingDays ?? 0
  const presentDays = month?.presentDays ?? 0
  const absentDays = month?.absentDays ?? 0
  const unmarkedDays = Math.max(0, workingDays - presentDays - absentDays)
  const partTime = !!month && month.workDays.length < 5
  const hasSchedule = !!payPeriod?.schedule

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarDaysIcon className="w-7 h-7 text-cyan-500" />
              My Attendance
            </h1>
            <p className="text-slate-500 mt-1">
              Your days, your hours, and when they are paid
              {partTime && month && (
                <span className="ml-2 inline-block px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-xs font-medium">
                  You work {formatWorkDays(month.workDays)}
                </span>
              )}
            </p>
            {/* Admins land here from Staff Attendance; give them the way back. */}
            {user.role === 'ADMIN' && (
              <Link
                href="/staff-attendance"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-cyan-300 hover:text-cyan-700 transition-colors"
              >
                <IdentificationIcon className="h-4 w-4" />
                Staff attendance
              </Link>
            )}
          </div>

          {/* Next pay day */}
          <MyPayPeriodCard data={payPeriod} loading={historyLoading && !payPeriod} error={historyError && !payPeriod ? historyError : null} onRetry={loadPayPeriods} />

          {/* Calendar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="px-4 py-3 sm:px-5 border-b border-slate-100">
              <MonthSwitcher
                month={currentMonth}
                onPrev={() => setParams({ month: format(subMonths(currentMonth, 1), 'yyyy-MM') })}
                onNext={() => setParams({ month: format(addMonths(currentMonth, 1), 'yyyy-MM') })}
              />
            </div>

            <div className="p-4 sm:p-5">
              {monthLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : monthError || !month ? (
                <EmptyState
                  icon={ExclamationTriangleIcon}
                  iconClassName="text-rose-300"
                  title="Could not load this month"
                  description={monthError ?? undefined}
                  action={
                    <button
                      type="button"
                      onClick={loadMonth}
                      className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Try again
                    </button>
                  }
                />
              ) : (
                <AttendanceCalendar month={currentMonth} records={month.records} workDays={month.workDays} onDayClick={handleDayClick} />
              )}
            </div>
          </div>

          {/* This month's counts */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Scheduled days" value={workingDays} loading={monthLoading} />
            <StatTile label="Present" value={presentDays} tone={presentDays > 0 ? 'good' : 'neutral'} loading={monthLoading} />
            <StatTile label="Absent" value={absentDays} tone={absentDays > 0 ? 'bad' : 'neutral'} loading={monthLoading} />
            <StatTile
              label="Hours this month"
              value={formatHours(month?.hoursWorked)}
              loading={monthLoading}
              sub={unmarkedDays > 0 ? `${unmarkedDays} ${unmarkedDays === 1 ? 'day' : 'days'} still ahead` : undefined}
            />
          </div>

          {hasSchedule && <MyPayHistory periods={history} loading={historyLoading} error={historyError} />}
        </div>
      </main>

      <EditAttendanceModal
        isOpen={!!editTarget}
        date={editTarget?.date ?? ''}
        currentStatus={editTarget?.status ?? null}
        currentNotes={editTarget?.notes ?? null}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
        onClose={() => setEditTarget(null)}
      />
    </>
  )
}

export default function MyAttendancePage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      <MyAttendanceContent />
    </Suspense>
  )
}
