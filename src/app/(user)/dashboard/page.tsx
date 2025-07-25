'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '../../../components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getSchoolName } from '@/lib/schoolUtils'
import { getDashboardSummary, getAttendanceTrend  } from '@/services/dashboardService'
import { DashboardSummaryData, AttendanceTrendPoint  } from '@/services/types/dashboard'
import Spinner from '@/components/Spinner'
import StaffList from '@/components/staff/StaffList'
import { Listbox, Transition } from '@headlessui/react'
import { format } from 'date-fns'
import {
  LineChart, Line, CartesianGrid,
  XAxis, YAxis, Tooltip,ResponsiveContainer } from 'recharts'
import Link from 'next/link'

const DashboardPage: React.FC = () => {
  const user = useUserStore((state) => state.user)
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')
  const [trend, setTrend]     = useState<AttendanceTrendPoint[]>([])
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
  }, [user.school, daysWindow])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="lg:ml-64 p-4 lg:p-10 text-red-600">
        {error || 'No data available'}
      </div>
    )
  }

  const metrics = [
    { label: 'Total Students', value: summary.totalStudents },
    { label: 'Total Teachers', value: summary.totalTeachers },
    { label: 'Total Classes', value: summary.totalClasses },
    { label: "Today's Attendance %", value: (summary.todaysAttendance * 100).toFixed(1) + '%' },
    { label: 'Weekly Attendance %', value: (summary.weeklyAttendance * 100).toFixed(1) + '%' },
    { label: 'Monthly Attendance %', value: (summary.monthlyAttendance * 100).toFixed(1) + '%' },
    { label: 'Avg. Student Grade', value: summary.averageStudentGrade.toFixed(2) + '%' },
    { label: 'Report Cards Generated', value: summary.reportCardsCount },
    { label: 'Avg. Class Size', value: summary.avgClassSize }
  ]

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="text-black text-center">
          <h1 className="text-2xl lg:text-3xl font-semibold">
            {user.school
              ? `${getSchoolName(user.school)} Dashboard`
              : 'Dashboard'
            }
          </h1>
        </div>
        {/* Attendance Trend Chart */}
        <div className="w-full lg:w-[90%] xl:w-[70%] mx-auto bg-white p-4 lg:p-6 rounded-2xl shadow-md mt-6 lg:mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Attendance Trend</h2>
            <select
              value={daysWindow}
              onChange={(e) => setDaysWindow(Number(e.target.value))}
              className="px-3 py-1 bg-white rounded-xl text-black shadow-lg"
            >
              {[7, 14, 30].map((d) => (
                <option key={d} value={d}>Last {d} days</option>
              ))}
            </select>
          </div>
          <div style={{ width: '100%', height: 300}}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ left: 0, right: 30, top: 10, bottom: 0 }} >
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => format(new Date(d), 'MM/dd')}
                  tick={{ fill: '#000' }}
                  axisLine={false}
                  tickLine={false}
                  padding={{ left: 20, right: 20}}
                />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fill: '#000' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  wrapperStyle={{ backgroundColor: '#fff', borderRadius: 8 }}
                  labelFormatter={(label) => format(new Date(label), 'EEEE, MMM do')}
                  formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Attendance Rate']}
                  contentStyle={{ border: 'none' }}
                  labelStyle={{ color: '#000', fontWeight: 500 }}
                  itemStyle={{ color: '#000' }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#3182ce"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="text-center grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mt-6 lg:mt-8 w-full lg:w-[90%] xl:w-[70%] mx-auto px-4 lg:px-0">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white p-4 lg:p-6 rounded-2xl shadow-md">
              <h3 className="text-gray-500 text-sm uppercase tracking-wide">
                {m.label}
              </h3>
              <p className="mt-2 text-2xl font-bold text-gray-800">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Staff Directory */}
        <div className="w-full lg:w-[90%] xl:w-[70%] mx-auto mt-8 lg:mt-12 px-4 lg:px-0">
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">School Staff Directory</h2>
            <p className="text-sm text-gray-600 mb-6">Manage and view school staff members.</p>
            <StaffList school={user.school!} showContactInfo={true} showActions={true} />
          </div>
        </div>

        {/* Next Steps */}
        <div className="w-full md:w-[70%] lg:w-[80%] xl:w-[70%] mx-auto mt-8 lg:mt-12 px-4 lg:px-0">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Next Steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <Link href="/classes" className="block bg-white p-4 lg:p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <h3 className="text-lg font-medium mb-2 text-black">Explore Your Classes</h3>
                <p className="text-gray-600">View all your classes</p>
            </Link>
            <Link href="/gradebook" className="block bg-white p-4 lg:p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <h3 className="text-lg font-medium mb-2 text-black">Add Student Grades</h3>
                <p className="text-gray-600">Record or update grades</p>
            </Link>
            <Link href="/attendance/general" className="block bg-white p-4 lg:p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <h3 className="text-lg font-medium mb-2 text-black">Mark Attendance</h3>
                <p className="text-gray-600">Take today’s attendance</p>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

export default DashboardPage
