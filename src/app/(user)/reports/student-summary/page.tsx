'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { getClassesByTeacherId, getAllClasses } from '@/services/classService'
import { getAllStudents } from '@/services/studentService'
import { getTermsBySchool } from '@/services/termService'
import { ClassPayload } from '@/services/types/class'
import { StudentPayload } from '@/services/types/student'
import { TermPayload } from '@/services/types/term'
import { ArrowLeftIcon, DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const StudentSummaryPage = () => {
  const user = useUserStore((state) => state.user)
  const showNotification = useNotificationStore((state) => state.showNotification)
  
  const [students, setStudents] = useState<StudentPayload[]>([])
  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [activeTerm, setActiveTerm] = useState<TermPayload | null>(null)
  
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState<string>('active')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const loadClasses = useCallback(async () => {
    if (!user?.school || !user?.id) return

    try {
      let response
      if (user.role === 'ADMIN') {
        console.log("user is an admin")
        response = await getAllClasses(user.school)
      } else {
        console.log("user is an user")
        response = await getClassesByTeacherId(user.id)
      }

      if (response.status === 'success') {
        setClasses(response.data)
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      showNotification('Error loading classes', 'error')
    }
  }, [user?.school, user?.id, user?.role, showNotification])

  const loadStudents = useCallback(async () => {
    if (!user?.school) return

    try {
      const studentsResponse = await getAllStudents(user.school)
      if (studentsResponse.status === 'success') {
        setStudents(studentsResponse.data)
      }
    } catch (error) {
      console.error('Error loading students:', error)
      showNotification('Error loading students', 'error')
    }
  }, [user?.school, showNotification])

  const loadTerms = useCallback(async () => {
    if (!user?.school) return

    try {
      const response = await getTermsBySchool(user.school)
      if (response.status === 'success') {
        setTerms(response.data)
        const activeTerm = response.data.find(term => term.isActive)
        if (activeTerm) {
          setActiveTerm(activeTerm)
        }
      }
    } catch (error) {
      console.error('Error loading terms:', error)
    }
  }, [user?.school])

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || !user?.school) return

      setLoading(true)
      try {
        await Promise.all([loadClasses(), loadStudents(), loadTerms()])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id, user?.school, user?.role, loadClasses, loadStudents, loadTerms])


  // Filter students based on selected class
  const filteredStudents = selectedClass 
    ? students.filter(student => {
        const selectedClassData = classes.find(c => c.classId === selectedClass)
        return selectedClassData && student.grade === selectedClassData.grade
      })
    : students

  const handleGenerateReport = async () => {
    if (!selectedStudent || !selectedClass) {
      showNotification('Please select both a student and a class', 'error')
      return
    }

    setGenerating(true)
    try {
      // TODO: Call backend API to generate PDF report
      showNotification('Report generation coming soon!', 'error')
    } catch (error) {
      console.error('Error generating report:', error)
      showNotification('Error generating report', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const selectedStudentData = students.find(s => s.studentId === selectedStudent)
  const selectedClassData = classes.find(c => c.classId === selectedClass)

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      
      <div className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/reports" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Reports
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Summary Report</h1>
            <p className="text-gray-600">
              Generate comprehensive student performance reports for parent-teacher conferences.
            </p>
          </div>

          {/* Selection Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Report Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value)
                    setSelectedStudent('') // Reset student when class changes
                  }}
                  className="text-black w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a class...</option>
                  {classes.map((cls) => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.subject} - Grade {cls.grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Selection */}
              <div>
                <label className="text-black block text-sm font-medium text-gray-700 mb-2">
                  Select Student
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  disabled={!selectedClass}
                  className="text-black w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Choose a student...</option>
                  {filteredStudents.map((student) => (
                    <option key={student.studentId} value={student.studentId}>
                      {student.name} - Grade {student.grade}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedClass 
                    ? `Students from ${selectedClassData?.subject} class` 
                    : 'Select a class first'
                  }
                </p>
              </div>

              {/* Term Selection */}
              <div>
                <label className="text-black block text-sm font-medium text-gray-700 mb-2">
                  Term
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="text-black w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active Term ({activeTerm?.name})</option>
                  {terms.map((term) => (
                    <option key={term.termId} value={term.name}>
                      {term.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Active term is selected by default
                </p>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {selectedStudent && selectedClass && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Student:</span>
                    <span className="ml-2 text-gray-900">{selectedStudentData?.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Grade:</span>
                    <span className="ml-2 text-gray-900">{selectedStudentData?.grade}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Subject:</span>
                    <span className="ml-2 text-gray-900">{selectedClassData?.subject}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Term:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedTerm === 'active' 
                        ? `${activeTerm?.name} (Active)` 
                        : selectedTerm === 'all' 
                          ? 'All Terms' 
                          : selectedTerm}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Report will include:</strong> All assessments, grades, attendance records, 
                    and performance metrics for this student in the selected class during the specified term.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Report Buttons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGenerateReport}
                disabled={!selectedStudent || !selectedClass || generating}
                className={`flex-1 flex items-center justify-center px-6 py-3 rounded-md text-white font-medium transition-colors duration-200 ${
                  !selectedStudent || !selectedClass || generating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                {generating ? 'Generating...' : 'Download PDF Report'}
              </button>
              
              <button
                onClick={handleGenerateReport}
                disabled={!selectedStudent || !selectedClass || generating}
                className={`flex-1 flex items-center justify-center px-6 py-3 rounded-md font-medium border transition-colors duration-200 ${
                  !selectedStudent || !selectedClass || generating
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <EyeIcon className="h-5 w-5 mr-2" />
                Preview Report
              </button>
            </div>
            
            {(!selectedStudent || !selectedClass) && (
              <p className="mt-3 text-sm text-gray-500 text-center">
                Please select both a student and class to generate a report
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default StudentSummaryPage