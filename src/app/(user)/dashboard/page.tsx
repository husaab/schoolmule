'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '../../../components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getSchoolName } from '@/lib/schoolUtils'
import { getDashboardSummary, getAttendanceTrend  } from '@/services/dashboardService'
import { DashboardSummaryData, AttendanceTrendPoint  } from '@/services/types/dashboard'
import Spinner from '@/components/Spinner'
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

  const term = 'Term 1' // TODO: replace with dynamic term selection

  useEffect(() => {
    if (!user.school) return
    setLoading(true)
    Promise.all([
      getDashboardSummary(user.school, term, today),
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
      <div className="ml-32 p-10 text-red-600">
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
      <main className="ml-32 pt-40 bg-gray-50 min-h-screen p-10 ">
        <div className="text-black text-center">
          <h1 className="text-3xl font-semibold ">
            {getSchoolName(user.school!)} Dashboard
          </h1>
        </div>
        {/* Attendance Trend Chart */}
        <div className="w-[70%] mx-auto bg-white p-6 rounded-2xl shadow-md mt-10">
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
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ left: 0, right: 30, top: 0, bottom: 0 }} >
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
        <div className="text-center grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 w-[70%] mx-auto">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-gray-500 text-sm uppercase tracking-wide">
                {m.label}
              </h3>
              <p className="mt-2 text-2xl font-bold text-gray-800">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div className="w-[70%] mx-auto mt-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Next Steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link href="/classes" className="block bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <h3 className="text-lg font-medium mb-2 text-black">Explore Your Classes</h3>
                <p className="text-gray-600">View all your classes</p>
            </Link>
            <Link href="/gradebook" className="block bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <h3 className="text-lg font-medium mb-2 text-black">Add Student Grades</h3>
                <p className="text-gray-600">Record or update grades</p>
            </Link>
            <Link href="/attendance/general" className="block bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
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
