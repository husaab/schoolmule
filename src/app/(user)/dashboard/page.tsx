'use client'

// Schedule-first dashboard. The day ribbon leads because the first question a
// teacher has at 8:40 AM is "where am I supposed to be", not "what is the
// school's average class size". School-wide figures sit below it as a quiet
// row rather than nine gradient tiles competing with the schedule.

import React, { useEffect, useState, useCallback } from 'react'
import Navbar from '../../../components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { getSchoolName } from '@/lib/schoolUtils'
import { getDashboardSummary, getAttendanceTrend } from '@/services/dashboardService'
import { DashboardSummaryData, AttendanceTrendPoint } from '@/services/types/dashboard'
import Spinner from '@/components/Spinner'
import Card from '@/components/ui/Card'
import StatTile from '@/components/ui/StatTile'
import SectionHeader from '@/components/ui/SectionHeader'
import { format, isWeekend } from 'date-fns'
import CheckInModal from '@/components/teacherAttendance/CheckInModal'
import DayRibbon from '@/components/schedulePlanner/DayRibbon'
import { getTodayStatus, checkIn } from '@/services/teacherAttendanceService'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import StaffList from '@/components/staff/StaffList'
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

/** Time-of-day greeting — the dashboard is opened at a specific moment. */
const greetingFor = (date: Date): string => {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const QUICK_ACTIONS = [
  { href: '/classes', label: 'Open classes', icon: AcademicCapIcon },
  { href: '/gradebook', label: 'Enter grades', icon: BookOpenIcon },
  { href: '/attendance/general', label: 'Take attendance', icon: ClipboardDocumentCheckIcon },
]

const DashboardPage: React.FC = () => {
  const user = useUserStore((state) => state.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')
  const [trend, setTrend] = useState<AttendanceTrendPoint[]>([])
  const [daysWindow, setDaysWindow] = useState<number>(7)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [staffOpen, setStaffOpen] = useState(false)

  // Check-in flow: localStorage for instant suppression, backend as source of truth
  useEffect(() => {
    if (!user.id || user.role === 'PARENT') return

    // No check-in prompt on weekends or during summer break (July/August)
    const now = new Date()
    if (isWeekend(now) || now.getMonth() === 6 || now.getMonth() === 7) return

    const localKey = `checkin_date_${user.id}`
    const todayStr = format(new Date(), 'yyyy-MM-dd')

    // Fast path: already checked in today per localStorage
    if (localStorage.getItem(localKey) === todayStr) return

    // Slow path: ask the backend (send local date to avoid UTC mismatch)
    getTodayStatus(todayStr)
      .then((res) => {
        if (res.data.checkedIn) {
          localStorage.setItem(localKey, todayStr)
        } else {
          setShowCheckIn(true)
        }
      })
      .catch(() => {
        // Silently fail — don't block dashboard
      })
  }, [user.id, user.role])

  const handleCheckIn = useCallback(
    async (status: 'PRESENT' | 'ABSENT', notes: string | null) => {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      await checkIn(status, todayStr, notes)
      localStorage.setItem(`checkin_date_${user.id}`, todayStr)
      setShowCheckIn(false)
    },
    [user.id]
  )

  useEffect(() => {
    if (!user.school) return
    setLoading(true)
    Promise.all([
      getDashboardSummary(user.school, user.activeTerm!, today),
      getAttendanceTrend(user.school, daysWindow, today)
    ])
      .then(([sumRes, trendRes]) => {
        setSummary(sumRes.data)
        setTrend(trendRes.data)
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load dashboard data')
      })
      .finally(() => setLoading(false))
  }, [user.school, daysWindow, user.activeTerm, today, selectedYearId]) // refetch when the selected school year changes

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <Spinner />
          </div>
        </main>
      </>
    )
  }

  if (error || !summary) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-slate-600">{error || 'No data available'}</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  const pct = (v: number | null | undefined) => (v ? `${(v * 100).toFixed(1)}%` : '—')

  // Four figures carry the headline; the rest stay available without adding
  // eight more boxes to scan past.
  const headline = [
    { label: 'Students', value: summary.totalStudents || 0 },
    { label: 'Classes', value: summary.totalClasses || 0 },
    { label: 'Here today', value: pct(summary.todaysAttendance) },
    {
      label: 'Average grade',
      value: summary.averageStudentGrade ? `${summary.averageStudentGrade.toFixed(1)}%` : '—',
    },
  ]

  const secondary = [
    { label: 'teachers', value: summary.totalTeachers || 0 },
    { label: 'this week', value: pct(summary.weeklyAttendance) },
    { label: 'this month', value: pct(summary.monthlyAttendance) },
    { label: 'report cards', value: summary.reportCardsCount || 0 },
    { label: 'avg. class size', value: summary.avgClassSize || 0 },
  ]

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold text-slate-900 tracking-tight">
                {greetingFor(new Date())}, {user.username}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {format(new Date(), 'EEEE, MMMM d')}
                {user.school ? ` · ${getSchoolName(user.school)}` : ''}
              </p>
            </div>
          </div>

          {/* Today, as a proportional strip of the school day */}
          <DayRibbon />

          {/* School-wide figures */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {headline.map((m) => (
              <StatTile key={m.label} label={m.label} value={m.value} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 px-1">
            {secondary.map((m) => (
              <StatTile key={m.label} label={m.label} value={m.value} compact />
            ))}
          </div>

          {/* Trend + actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="lg:col-span-2">
              <SectionHeader
                title="Attendance"
                hint="Share of students present each day"
                action={
                  <select
                    value={daysWindow}
                    onChange={(e) => setDaysWindow(Number(e.target.value))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    {[7, 14, 30].map((d) => (
                      <option key={d} value={d}>Last {d} days</option>
                    ))}
                  </select>
                }
              />
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={trend} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => format(new Date(d), 'MM/dd')}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      padding={{ left: 20, right: 20 }}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={42}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      labelFormatter={(label) => format(new Date(label), 'EEEE, MMM do')}
                      formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Present']}
                      labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                      itemStyle={{ color: '#0891b2' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#0891b2"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <SectionHeader title="Quick actions" />
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200/70 px-4 py-3 hover:border-cyan-300 hover:bg-cyan-50/40 transition-colors"
                  >
                    <action.icon className="h-5 w-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                    <span className="text-sm font-medium text-slate-800">{action.label}</span>
                    <ArrowRightIcon className="h-4 w-4 ml-auto text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* Staff directory: still here for everyone who needs a colleague's
              contact details, but folded away so it stops burying the page. */}
          <Card flush>
            <button
              onClick={() => setStaffOpen((open) => !open)}
              aria-expanded={staffOpen}
              className="group flex w-full items-center gap-3 px-5 py-4 text-left cursor-pointer"
            >
              <UsersIcon className="h-5 w-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">Staff directory</p>
                <p className="text-xs text-slate-500">
                  {summary.totalTeachers || 0} staff members and their contact details
                </p>
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 ml-auto text-slate-400 transition-transform ${
                  staffOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {staffOpen && (
              <div className="border-t border-slate-200/70 p-5 lg:p-6">
                <StaffList school={user.school!} showContactInfo showActions />
              </div>
            )}
          </Card>
        </div>
      </main>
      <CheckInModal
        isOpen={showCheckIn}
        onCheckIn={handleCheckIn}
        onSkip={() => setShowCheckIn(false)}
      />
    </>
  )
}

export default DashboardPage
