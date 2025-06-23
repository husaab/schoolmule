'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '../../../components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getSchoolName } from '@/lib/schoolUtils'
import { getDashboardSummary } from '@/services/dashboardService'
import { DashboardSummaryData } from '@/services/types/dashboard'
import Spinner from '@/components/Spinner'
import { format } from 'date-fns'

const DashboardPage: React.FC = () => {
  const user = useUserStore((state) => state.user)
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')

  const term = 'Term 1' // TODO: replace with dynamic term selection

  useEffect(() => {
    if (!user.school) return
    setLoading(true)
    getDashboardSummary(user.school, term, today)
      .then((res) => {
        setSummary(res.data)
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load dashboard data')
      })
      .finally(() => setLoading(false))
  }, [user.school])

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
          <h1 className="text-3xl font-semibold">
            {getSchoolName(user.school!)} Dashboard
          </h1>
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
      </main>
    </>
  )
}

export default DashboardPage
