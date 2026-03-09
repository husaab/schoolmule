'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import Spinner from '@/components/Spinner'
import AttendanceCalendar from '@/components/teacherAttendance/AttendanceCalendar'
import {
  getAllTeacherAttendance,
  updateTeacherRecord,
  downloadAttendancePDF,
} from '@/services/teacherAttendanceService'
import { TeacherAttendanceData } from '@/services/types/teacherAttendance'
import { format, addMonths, subMonths } from 'date-fns'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  IdentificationIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

export default function StaffAttendancePage() {
  const user = useUserStore((s) => s.user)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [teachers, setTeachers] = useState<TeacherAttendanceData[]>([])
  const [workingDays, setWorkingDays] = useState(0)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const monthStr = format(currentMonth, 'yyyy-MM')

  const loadData = useCallback(async () => {
    if (!user.school) return
    setLoading(true)
    try {
      const res = await getAllTeacherAttendance(user.school, monthStr)
      setTeachers(res.data.teachers)
      setWorkingDays(res.data.workingDays)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [user.school, monthStr])

  useEffect(() => {
    if (user.id) loadData()
  }, [user.id, loadData])

  const handleDayClick = async (
    teacherId: string,
    date: string,
    currentStatus: string | null
  ) => {
    const newStatus: 'PRESENT' | 'ABSENT' =
      currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    try {
      await updateTeacherRecord(teacherId, date, newStatus)
      await loadData()
    } catch {
      // fail silently
    }
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
      // fail silently
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
                Manage and review staff attendance records
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

          {/* Card — controls fixed, content scrolls */}
          <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-100">
            {/* Controls bar — fixed */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
              {/* Month Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="text-lg font-semibold text-slate-900 min-w-[180px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Teacher Filter */}
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
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
                  {filteredTeachers.map((teacher, idx) => {
                    const present = teacher.records.filter(
                      (r) => r.status === 'PRESENT'
                    ).length
                    const absent = teacher.records.filter(
                      (r) => r.status === 'ABSENT'
                    ).length

                    return (
                      <div key={teacher.teacherId}>
                        {/* Teacher header */}
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-semibold text-slate-900">
                            {teacher.firstName || ''}{' '}
                            {teacher.lastName || teacher.username || ''}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium">
                              {present}P
                            </span>
                            <span className="px-2 py-1 rounded-lg bg-red-50 text-red-700 font-medium">
                              {absent}A
                            </span>
                            <span className="text-slate-400">/ {workingDays} days</span>
                          </div>
                        </div>

                        <AttendanceCalendar
                          month={currentMonth}
                          records={teacher.records}
                          onDayClick={(date, status) =>
                            handleDayClick(teacher.teacherId, date, status)
                          }
                        />

                        {/* Divider (except last) */}
                        {idx < filteredTeachers.length - 1 && (
                          <div className="border-t border-slate-100 mt-6" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
