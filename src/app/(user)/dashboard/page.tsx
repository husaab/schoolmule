'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '../../../components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getSchoolName } from '@/lib/schoolUtils'
import { getDashboardSummary, getAttendanceTrend } from '@/services/dashboardService'
import { DashboardSummaryData, AttendanceTrendPoint } from '@/services/types/dashboard'
import Spinner from '@/components/Spinner'
import StaffList from '@/components/staff/StaffList'
import { format } from 'date-fns'
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import Link from 'next/link'
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  UsersIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const DashboardPage: React.FC = () => {
  const user = useUserStore((state) => state.user)
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')
  const [trend, setTrend] = useState<AttendanceTrendPoint[]>([])
  const [daysWindow, setDaysWindow] = useState<number>(7)

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
  }, [user.school, daysWindow, user.activeTerm, today])

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

  const metrics = [
    { label: 'Total Students', value: summary.totalStudents || 0, icon: UserGroupIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Teachers', value: summary.totalTeachers || 0, icon: UsersIcon, color: 'from-purple-500 to-purple-600' },
    { label: 'Total Classes', value: summary.totalClasses || 0, icon: AcademicCapIcon, color: 'from-emerald-500 to-emerald-600' },
    { label: "Today's Attendance", value: summary.todaysAttendance ? (summary.todaysAttendance * 100).toFixed(1) + '%' : 'N/A', icon: ClipboardDocumentCheckIcon, color: 'from-cyan-500 to-cyan-600' },
    { label: 'Weekly Attendance', value: summary.weeklyAttendance ? (summary.weeklyAttendance * 100).toFixed(1) + '%' : 'N/A', icon: CalendarDaysIcon, color: 'from-amber-500 to-amber-600' },
    { label: 'Monthly Attendance', value: summary.monthlyAttendance ? (summary.monthlyAttendance * 100).toFixed(1) + '%' : 'N/A', icon: ClockIcon, color: 'from-rose-500 to-rose-600' },
    { label: 'Avg. Grade', value: summary.averageStudentGrade ? summary.averageStudentGrade.toFixed(1) + '%' : 'N/A', icon: ChartBarIcon, color: 'from-indigo-500 to-indigo-600' },
    { label: 'Report Cards', value: summary.reportCardsCount || 0, icon: DocumentChartBarIcon, color: 'from-teal-500 to-teal-600' },
    { label: 'Avg. Class Size', value: summary.avgClassSize || 0, icon: BookOpenIcon, color: 'from-orange-500 to-orange-600' }
  ]

  const quickActions = [
    {
      href: '/classes',
      title: 'Explore Classes',
      description: 'View and manage all your classes',
      icon: AcademicCapIcon,
      color: 'bg-gradient-to-br from-cyan-500 to-teal-500'
    },
    {
      href: '/gradebook',
      title: 'Grade Students',
      description: 'Record or update student grades',
      icon: BookOpenIcon,
      color: 'bg-gradient-to-br from-purple-500 to-indigo-500'
    },
    {
      href: '/attendance/general',
      title: 'Take Attendance',
      description: "Mark today's attendance",
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-gradient-to-br from-emerald-500 to-green-500'
    }
  ]

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Welcome back, {user.username}
            </h1>
            <p className="text-slate-500 mt-1">
              Here&apos;s what&apos;s happening at {user.school ? getSchoolName(user.school) : 'your school'} today.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-8">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                      {m.label}
                    </p>
                    <p className="text-2xl font-bold text-slate-900">{m.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center flex-shrink-0`}>
                    <m.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Attendance Trend Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-cyan-500" />
                  Attendance Trend
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">Track attendance patterns over time</p>
              </div>
              <select
                value={daysWindow}
                onChange={(e) => setDaysWindow(Number(e.target.value))}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent cursor-pointer"
              >
                {[7, 14, 30].map((d) => (
                  <option key={d} value={d}>Last {d} days</option>
                ))}
              </select>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={trend} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format(new Date(d), 'MM/dd')}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    labelFormatter={(label) => format(new Date(label), 'EEEE, MMM do')}
                    formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Attendance Rate']}
                    labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                    itemStyle={{ color: '#0891b2' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#0891b2"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }}
                    fill="url(#attendanceGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all"
                >
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    {action.title}
                    <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-sm text-slate-500">{action.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Staff Directory */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-purple-500" />
                  Staff Directory
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">View and manage school staff members</p>
              </div>
            </div>
            <StaffList school={user.school!} showContactInfo={true} showActions={true} />
          </div>
        </div>
      </main>
    </>
  )
}

export default DashboardPage
