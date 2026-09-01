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
import StatTile, { toneForRate, toneForScore } from '@/components/ui/StatTile'
import DailyBriefing from '@/components/dashboard/DailyBriefing'
import { useMyScheduleStore } from '@/store/useMyScheduleStore'
import SectionHeader from '@/components/ui/SectionHeader'
import { format, isWeekend } from 'date-fns'
import CheckInModal from '@/components/teacherAttendance/CheckInModal'
import DayRibbon from '@/components/schedulePlanner/DayRibbon'
import { getTodayStatus, checkIn } from '@/services/teacherAttendanceService'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
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

// Each action keeps its own hue so the row is scannable by colour, not just
// by reading three near-identical labels.
const QUICK_ACTIONS = [
  {
    href: '/classes',
    label: 'Open classes',
    icon: AcademicCapIcon,
    icon_class: 'text-cyan-600 bg-cyan-50',
    hover: 'hover:border-cyan-300 hover:bg-cyan-50/40',
  },
  {
    href: '/gradebook',
    label: 'Enter grades',
    icon: BookOpenIcon,
    icon_class: 'text-violet-600 bg-violet-50',
    hover: 'hover:border-violet-300 hover:bg-violet-50/40',
  },
  {
    href: '/attendance/general',
    label: 'Take attendance',
    icon: ClipboardDocumentCheckIcon,
    icon_class: 'text-emerald-600 bg-emerald-50',
    hover: 'hover:border-emerald-300 hover:bg-emerald-50/40',
  },
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
  // Already loaded by the day ribbon; read it so the briefing can flag a
  // school that has never published a timetable.
  const mySchedule = useMyScheduleStore((s) => s.data)

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
    { label: 'Students', value: summary.totalStudents || 0, tone: 'neutral' as const },
    { label: 'Classes', value: summary.totalClasses || 0, tone: 'neutral' as const },
    {
      label: 'Here today',
      value: pct(summary.todaysAttendance),
      tone: toneForRate(summary.todaysAttendance),
    },
    {
      label: 'Average grade',
      value: summary.averageStudentGrade ? `${summary.averageStudentGrade.toFixed(1)}%` : '—',
      tone: toneForScore(summary.averageStudentGrade),
    },
  ]

  const secondary = [
    { label: 'teachers', value: summary.totalTeachers || 0, tone: 'neutral' as const },
    { label: 'this week', value: pct(summary.weeklyAttendance), tone: toneForRate(summary.weeklyAttendance) },
    { label: 'this month', value: pct(summary.monthlyAttendance), tone: toneForRate(summary.monthlyAttendance) },
    { label: 'report cards', value: summary.reportCardsCount || 0, tone: 'neutral' as const },
    { label: 'avg. class size', value: summary.avgClassSize || 0, tone: 'neutral' as const },
  ]

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
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
              <StatTile key={m.label} label={m.label} value={m.value} tone={m.tone} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 px-1">
            {secondary.map((m) => (
              <StatTile key={m.label} label={m.label} value={m.value} tone={m.tone} compact />
            ))}
          </div>

          {/* Two columns on wide screens: the narrative and the chart carry the
              main column, short reference blocks sit in a right rail. */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6 items-start">
            <div className="xl:col-span-2 space-y-4">
              {user.school && (
                <DailyBriefing
                  summary={summary}
                  trend={trend}
                  schoolName={getSchoolName(user.school)}
                  schoolCode={user.school}
                  today={today}
                  hasPublishedSchedule={Boolean(mySchedule?.schedule)}
                />
              )}
              <Card>
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
                  <AreaChart data={trend} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    {/* The line schools are trying to stay above. */}
                    <ReferenceLine
                      y={0.9}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: '90% target', position: 'right', fill: '#b45309', fontSize: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#0891b2"
                      strokeWidth={2.5}
                      fill="url(#attendanceFill)"
                      dot={{ r: 3.5, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              </Card>
            </div>

            <div className="space-y-4">
            <Card>
              <SectionHeader title="Quick actions" />
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`group flex items-center gap-3 rounded-xl border border-slate-200/70 px-4 py-3 transition-colors ${action.hover}`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.icon_class}`}>
                      <action.icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-slate-800">{action.label}</span>
                    <ArrowRightIcon className="h-4 w-4 ml-auto text-slate-300 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </Card>

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
                <div className="border-t border-slate-200/70 p-5 lg:p-6 max-h-[32rem] overflow-y-auto">
                  <StaffList school={user.school!} showContactInfo showActions />
                </div>
              )}
            </Card>
            </div>
          </div>
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
