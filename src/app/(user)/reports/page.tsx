'use client'

import React from 'react'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useNotificationStore } from '@/store/useNotificationStore'
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'

const ReportsPage = () => {
  const showNotification = useNotificationStore((state) => state.showNotification)

  const handleWorkInProgress = (reportTitle: string) => {
    showNotification(`${reportTitle} is work in progress!`, 'error')
  }

  const reportTypes = [
    {
      title: 'Student Summary',
      description: 'Generate comprehensive student reports including grades, attendance by class.',
      href: '/reports/student-summary',
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      isAvailable: true
    },
    {
      title: 'Progress Reports',
      description: 'Generate progress reports with core standards, work habits, and behavior assessments for parent conferences.',
      href: '/reports/progress-reports',
      icon: DocumentChartBarIcon,
      color: 'bg-indigo-500',
      isAvailable: true
    },
    {
      title: 'Attendance Reports',
      description: 'View and generate attendance summaries for students, classes, or specific date ranges.',
      href: '/reports/attendance-summary',
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-500',
      isAvailable: false
    },
    {
      title: 'Class Overview',
      description: 'Get detailed insights into class performance, grade distributions, and assessment results.',
      href: '/reports/class-overview',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      isAvailable: false
    },
    {
      title: 'Grade Analysis',
      description: 'Analyze grade trends, assessment performance, and student progress over time.',
      href: '/reports/grade-analysis',
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      isAvailable: false
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
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Reports</h1>
            <p className="text-slate-500 mt-1">
              Generate comprehensive reports for students, classes, and school performance analytics
            </p>
          </div>

          {/* Report Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((report) => {
              const IconComponent = report.icon

              if (report.isAvailable) {
                return (
                  <Link
                    key={report.title}
                    href={report.href}
                    className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`${report.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors duration-200">
                            {report.title}
                          </h3>
                          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                            {report.description}
                          </p>
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      <div className="absolute top-6 right-6 text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-l from-cyan-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  </Link>
                )
              } else {
                return (
                  <div
                    key={report.title}
                    onClick={() => handleWorkInProgress(report.title)}
                    className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer opacity-75"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`${report.color} p-3 rounded-xl text-white transition-transform duration-200 opacity-60`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
                            {report.title}
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                              Coming Soon
                            </span>
                          </h3>
                          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                            {report.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Report Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                </div>
                <span className="text-slate-600">Generate PDF reports instantly</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                </div>
                <span className="text-slate-600">Filter by term and date ranges</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
                </div>
                <span className="text-slate-600">Perfect for parent-teacher conferences</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default ReportsPage