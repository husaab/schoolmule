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
      
      <div className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10 pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
            <p className="text-gray-600">
              Generate comprehensive reports for students, classes, and school performance analytics.
            </p>
          </div>

          {/* Report Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {reportTypes.map((report) => {
              const IconComponent = report.icon
              
              if (report.isAvailable) {
                return (
                  <Link
                    key={report.title}
                    href={report.href}
                    className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`${report.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform duration-200`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                            {report.title}
                          </h3>
                          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                            {report.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Arrow indicator */}
                      <div className="absolute top-6 right-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-l from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  </Link>
                )
              } else {
                return (
                  <div
                    key={report.title}
                    onClick={() => handleWorkInProgress(report.title)}
                    className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`${report.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform duration-200 opacity-60`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                            {report.title}
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Coming Soon
                            </span>
                          </h3>
                          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                            {report.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Arrow indicator */}
                      <div className="absolute top-6 right-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-l from-yellow-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  </div>
                )
              }
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-12 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Report Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Generate PDF reports instantly</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Filter by term and date ranges</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Perfect for parent-teacher conferences</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ReportsPage