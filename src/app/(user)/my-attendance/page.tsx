'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import Spinner from '@/components/Spinner'
import AttendanceCalendar from '@/components/teacherAttendance/AttendanceCalendar'
import EditAttendanceModal from '@/components/teacherAttendance/EditAttendanceModal'
import { getMyMonth, getMyPayPeriod, updateMyRecord } from '@/services/teacherAttendanceService'
import type { AttendanceRecord, MyPayPeriodResponse } from '@/services/types/teacherAttendance'
import MyPayPeriodCard from '@/components/teacherAttendance/MyPayPeriodCard'
import { formatHours } from '@/components/teacherAttendance/payPeriodFormat'
import { useNotificationStore } from '@/store/useNotificationStore'
import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { useFilterParams } from '@/hooks/useFilterParams'
import { formatWorkDays } from '@/components/teacherAttendance/WorkDaysControl'

function MyAttendanceContent() {
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const { get, setParams } = useFilterParams()
  // Filter lives in the URL so Back/refresh/share restore it.
  const monthParam = get('month')
  const currentMonth = monthParam ? new Date(monthParam + '-01T00:00:00') : new Date()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [workingDays, setWorkingDays] = useState(0)
  const [workDays, setWorkDays] = useState<number[] | undefined>(undefined)
  const [presentDays, setPresentDays] = useState(0)
  const [absentDays, setAbsentDays] = useState(0)
  const [hoursWorked, setHoursWorked] = useState(0)
  const [payPeriod, setPayPeriod] = useState<MyPayPeriodResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<{
    date: string
    status: 'PRESENT' | 'ABSENT' | null
    notes: string | null
  } | null>(null)

  const monthStr = format(currentMonth, 'yyyy-MM')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyMonth(monthStr)
      setRecords(res.data.records)
      setWorkingDays(res.data.workingDays)
      setWorkDays(res.data.workDays)
      setPresentDays(res.data.presentDays)
      setAbsentDays(res.data.absentDays)
      setHoursWorked(res.data.hoursWorked)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [monthStr])

  const loadPayPeriod = useCallback(async () => {
    try {
      const res = await getMyPayPeriod()
      setPayPeriod(res.data)
    } catch {
      setPayPeriod(null)
    }
  }, [])

  useEffect(() => {
    if (user.id) loadData()
  }, [user.id, loadData])

  useEffect(() => {
    if (user.id) loadPayPeriod()
  }, [user.id, loadPayPeriod])

  const handleDayClick = (date: string, currentStatus: string | null) => {
    const record = records.find((r) => r.attendanceDate.substring(0, 10) === date)
    setEditTarget({
      date,
      status: (currentStatus as 'PRESENT' | 'ABSENT' | null) ?? null,
      notes: record?.notes ?? null,
    })
  }

  const handleEditSave = async (status: 'PRESENT' | 'ABSENT', notes: string | null) => {
    if (!editTarget) return
    const { date } = editTarget
    try {
      await updateMyRecord(date, status, notes)
      setEditTarget(null)
      await Promise.all([loadData(), loadPayPeriod()])
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error saving attendance', 'error')
    }
  }

  const unmarkedDays = workingDays - presentDays - absentDays

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarDaysIcon className="w-7 h-7 text-cyan-500" />
              My Attendance
            </h1>
            <p className="text-slate-500 mt-1">
              View and manage your attendance log
              {workDays && workDays.length < 5 && (
                <span className="ml-2 inline-block px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-xs font-medium">
                  Your work days: {formatWorkDays(workDays)}
                </span>
              )}
            </p>
          </div>

          {/* Current pay period (only when the school has a pay schedule) */}
          <MyPayPeriodCard data={payPeriod} />

          {/* Month Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <button
                onClick={() => setParams({ month: format(subMonths(currentMonth, 1), 'yyyy-MM') })}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-lg font-semibold text-slate-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setParams({ month: format(addMonths(currentMonth, 1), 'yyyy-MM') })}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronRightIcon className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Calendar */}
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : (
                <AttendanceCalendar
                  month={currentMonth}
                  records={records}
                  workDays={workDays}
                  onDayClick={handleDayClick}
                />
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Working Days</p>
              <p className="text-2xl font-bold text-slate-900">{workingDays}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-5 shadow-sm border border-emerald-100 text-center">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Present</p>
              <p className="text-2xl font-bold text-emerald-700">{presentDays}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-5 shadow-sm border border-red-100 text-center">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Absent</p>
              <p className="text-2xl font-bold text-red-700">{absentDays}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-5 shadow-sm border border-slate-200 text-center">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Unmarked</p>
              <p className="text-2xl font-bold text-slate-600">{unmarkedDays < 0 ? 0 : unmarkedDays}</p>
            </div>
            <div className="bg-cyan-50 rounded-2xl p-5 shadow-sm border border-cyan-100 text-center">
              <p className="text-xs font-medium text-cyan-600 uppercase tracking-wide mb-1">Hours</p>
              <p className="text-2xl font-bold text-cyan-700 tabular-nums">{formatHours(hoursWorked)}</p>
            </div>
          </div>
        </div>
      </main>

      <EditAttendanceModal
        isOpen={!!editTarget}
        date={editTarget?.date ?? ''}
        currentStatus={editTarget?.status ?? null}
        currentNotes={editTarget?.notes ?? null}
        onSave={handleEditSave}
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
