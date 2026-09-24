'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import Spinner from '@/components/Spinner'
import AttendanceCalendar from '@/components/teacherAttendance/AttendanceCalendar'
import EditAttendanceModal from '@/components/teacherAttendance/EditAttendanceModal'
import WorkDaysControl from '@/components/teacherAttendance/WorkDaysControl'
import HoursPerDayControl from '@/components/teacherAttendance/HoursPerDayControl'
import PayPeriodCard from '@/components/teacherAttendance/PayPeriodCard'
import PayScheduleModal from '@/components/teacherAttendance/PayScheduleModal'
import { formatHours } from '@/components/teacherAttendance/payPeriodFormat'
import {
  getAllTeacherAttendance,
  updateTeacherRecord,
  downloadAttendancePDF,
  setWorkDays,
  resetWorkDays,
  setHoursPerDay,
  resetHoursPerDay,
  getPayPeriodContaining,
  savePaySchedule,
  deletePaySchedule,
} from '@/services/teacherAttendanceService'
import type {
  TeacherAttendanceData,
  PaySchedule,
  PayPeriod,
  PaySchedulePayload,
} from '@/services/types/teacherAttendance'
import { format, addMonths, subMonths } from 'date-fns'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  IdentificationIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import { useFilterParams } from '@/hooks/useFilterParams'
import { useNotificationStore } from '@/store/useNotificationStore'

function StaffAttendanceContent() {
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const { get, setParams } = useFilterParams()
  // Filters live in the URL so Back/refresh/share restore them.
  const monthParam = get('month')
  const currentMonth = monthParam ? new Date(monthParam + '-01T00:00:00') : new Date()
  const selectedTeacherId = get('teacher')
  const [teachers, setTeachers] = useState<TeacherAttendanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [paySchedule, setPaySchedule] = useState<PaySchedule | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<PayPeriod | null>(null)
  const [periodLoading, setPeriodLoading] = useState(true)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<{
    teacherId: string
    date: string
    status: 'PRESENT' | 'ABSENT' | null
    notes: string | null
    hours: number | null
    usualHours: number
  } | null>(null)

  const monthStr = format(currentMonth, 'yyyy-MM')

  const loadData = useCallback(async () => {
    if (!user.school) return
    setLoading(true)
    try {
      const res = await getAllTeacherAttendance(user.school, monthStr)
      setTeachers(res.data.teachers)
      setPaySchedule(res.data.paySchedule ?? null)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [user.school, monthStr])

  // The pay period containing today — independent of which month is on screen.
  const loadPayPeriod = useCallback(async () => {
    setPeriodLoading(true)
    try {
      const res = await getPayPeriodContaining()
      setPaySchedule(res.data.schedule)
      setCurrentPeriod(res.data.periods[0] ?? null)
    } catch {
      setCurrentPeriod(null)
    } finally {
      setPeriodLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user.id) loadData()
  }, [user.id, loadData])

  useEffect(() => {
    if (user.id) loadPayPeriod()
  }, [user.id, loadPayPeriod])

  const reloadAll = async () => {
    await Promise.all([loadData(), loadPayPeriod()])
  }

  const handleDayClick = (
    teacher: TeacherAttendanceData,
    date: string,
    currentStatus: string | null
  ) => {
    const record = teacher.records.find((r) => r.attendanceDate.substring(0, 10) === date)
    setEditTarget({
      teacherId: teacher.teacherId,
      date,
      status: (currentStatus as 'PRESENT' | 'ABSENT' | null) ?? null,
      notes: record?.notes ?? null,
      hours: record?.hours ?? null,
      usualHours: teacher.hoursPerDay,
    })
  }

  const handleEditSave = async (status: 'PRESENT' | 'ABSENT', notes: string | null, hours?: number | null) => {
    if (!editTarget) return
    const { teacherId, date } = editTarget
    try {
      await updateTeacherRecord(teacherId, date, status, notes, hours ?? null)
      setEditTarget(null)
      await reloadAll()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error saving attendance', 'error')
    }
  }

  // Work days and hours change what every day is worth, so reload after.
  const withReload = (label: string, action: () => Promise<unknown>) => async () => {
    try {
      await action()
      showNotification(label, 'success')
      await reloadAll()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Something went wrong', 'error')
      throw err
    }
  }

  const handleSavePaySchedule = async (payload: PaySchedulePayload) => {
    await savePaySchedule(payload)
    showNotification('Pay schedule saved', 'success')
    setScheduleModalOpen(false)
    await reloadAll()
  }

  const handleDeletePaySchedule = async () => {
    await deletePaySchedule()
    showNotification('Pay schedule removed', 'success')
    setScheduleModalOpen(false)
    await reloadAll()
  }

  const handleDownloadPDF = async () => {
    if (!user.school) return
    setDownloading(true)
    try {
      await downloadAttendancePDF(
        user.school,
        monthStr,
        selectedTeacherId || undefined
      )
    } catch {
      showNotification('Could not generate the PDF', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const filteredTeachers = selectedTeacherId
    ? teachers.filter((t) => t.teacherId === selectedTeacherId)
    : teachers

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 h-screen flex flex-col bg-slate-50">
        <div className="flex flex-col flex-1 min-h-0 p-6 lg:p-8 max-w-5xl mx-auto w-full">
          {/* Header — fixed */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <IdentificationIcon className="w-7 h-7 text-cyan-500" />
                Staff Attendance
              </h1>
              <p className="text-slate-500 mt-1">
                Attendance, work days and hours for every staff member
              </p>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              {downloading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>

          {/* Current pay period — fixed */}
          <div className="flex-shrink-0 mb-6">
            <PayPeriodCard
              schedule={paySchedule}
              period={currentPeriod}
              loading={periodLoading}
              teacherId={selectedTeacherId || undefined}
              onConfigure={() => setScheduleModalOpen(true)}
            />
          </div>

          {/* Card — controls fixed, content scrolls */}
          <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-100">
            {/* Controls bar — fixed */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
              {/* Month Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setParams({ month: format(subMonths(currentMonth, 1), 'yyyy-MM') })}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="text-lg font-semibold text-slate-900 min-w-[180px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setParams({ month: format(addMonths(currentMonth, 1), 'yyyy-MM') })}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Teacher Filter */}
              <select
                value={selectedTeacherId}
                onChange={(e) => setParams({ teacher: e.target.value })}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent cursor-pointer"
              >
                <option value="">All Teachers</option>
                {teachers.map((t) => (
                  <option key={t.teacherId} value={t.teacherId}>
                    {t.firstName || ''} {t.lastName || t.username || ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable teacher calendars */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : filteredTeachers.length === 0 ? (
                <p className="text-center text-slate-500 py-12">No teachers found</p>
              ) : (
                <div className="space-y-8">
                  {filteredTeachers.map((teacher, idx) => (
                    <div key={teacher.teacherId}>
                      {/* Teacher header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">
                            {teacher.firstName || ''}{' '}
                            {teacher.lastName || teacher.username || ''}
                          </h3>
                          <WorkDaysControl
                            workDays={teacher.workDays}
                            source={teacher.workDaysSource}
                            onSave={(days) => withReload('Work days saved', () => setWorkDays(teacher.teacherId, days))()}
                            onReset={withReload('Work days reset to the schedule planner', () => resetWorkDays(teacher.teacherId))}
                          />
                          <HoursPerDayControl
                            hoursPerDay={teacher.hoursPerDay}
                            source={teacher.hoursPerDaySource}
                            onSave={(hours) => withReload('Hours per day saved', () => setHoursPerDay(teacher.teacherId, hours))()}
                            onReset={withReload('Hours per day reset to the school default', () => resetHoursPerDay(teacher.teacherId))}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium">
                            {teacher.presentDays}P
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-red-50 text-red-700 font-medium">
                            {teacher.absentDays}A
                          </span>
                          <span className="text-slate-400">/ {teacher.workingDays} days</span>
                          <span
                            className="px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 font-medium tabular-nums"
                            title="Hours worked this month"
                          >
                            {formatHours(teacher.hoursWorked)} h
                          </span>
                        </div>
                      </div>

                      <AttendanceCalendar
                        month={currentMonth}
                        records={teacher.records}
                        workDays={teacher.workDays}
                        onDayClick={(date, status) => handleDayClick(teacher, date, status)}
                      />

                      {/* Divider (except last) */}
                      {idx < filteredTeachers.length - 1 && (
                        <div className="border-t border-slate-100 mt-6" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <EditAttendanceModal
        isOpen={!!editTarget}
        date={editTarget?.date ?? ''}
        currentStatus={editTarget?.status ?? null}
        currentNotes={editTarget?.notes ?? null}
        allowHours
        currentHours={editTarget?.hours ?? null}
        usualHours={editTarget?.usualHours}
        onSave={handleEditSave}
        onClose={() => setEditTarget(null)}
      />

      <PayScheduleModal
        isOpen={scheduleModalOpen}
        schedule={paySchedule}
        onSave={handleSavePaySchedule}
        onDelete={handleDeletePaySchedule}
        onClose={() => setScheduleModalOpen(false)}
      />
    </>
  )
}

export default function StaffAttendancePage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 h-screen flex flex-col bg-slate-50" />}>
      <StaffAttendanceContent />
    </Suspense>
  )
}
