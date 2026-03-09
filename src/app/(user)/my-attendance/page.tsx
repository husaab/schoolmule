'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import Spinner from '@/components/Spinner'
import AttendanceCalendar from '@/components/teacherAttendance/AttendanceCalendar'
import { getMyMonth, updateMyRecord } from '@/services/teacherAttendanceService'
import { AttendanceRecord } from '@/services/types/teacherAttendance'
import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'

export default function MyAttendancePage() {
  const user = useUserStore((s) => s.user)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [workingDays, setWorkingDays] = useState(0)
  const [presentDays, setPresentDays] = useState(0)
  const [absentDays, setAbsentDays] = useState(0)
  const [loading, setLoading] = useState(true)

  const monthStr = format(currentMonth, 'yyyy-MM')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyMonth(monthStr)
      setRecords(res.data.records)
      setWorkingDays(res.data.workingDays)
      setPresentDays(res.data.presentDays)
      setAbsentDays(res.data.absentDays)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [monthStr])

  useEffect(() => {
    if (user.id) loadData()
  }, [user.id, loadData])

  const handleDayClick = async (date: string, currentStatus: string | null) => {
    const newStatus: 'PRESENT' | 'ABSENT' = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    try {
      await updateMyRecord(date, newStatus)
      await loadData()
    } catch {
      // fail silently
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
            <p className="text-slate-500 mt-1">View and manage your attendance log</p>
          </div>

          {/* Month Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <button
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-lg font-semibold text-slate-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
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
                  onDayClick={handleDayClick}
                />
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
          </div>
        </div>
      </main>
    </>
  )
}
