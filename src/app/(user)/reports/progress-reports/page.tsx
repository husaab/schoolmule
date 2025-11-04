'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getTermsBySchool } from '@/services/termService'
import { getAllStudents } from '@/services/studentService'
import { getProgressReportsByTermAndSchool, generateBulkProgressReports, getSignedProgressReportUrl } from '@/services/progressReportService'
import type { TermPayload } from '@/services/types/term'
import type { StudentPayload } from '@/services/types/student'
import { getGradeOptions, getGradeNumericValue } from '@/lib/schoolUtils'
import { ArrowLeftIcon, DocumentArrowDownIcon, CalendarIcon, UserIcon, MagnifyingGlassIcon, FunnelIcon, EyeIcon, ArrowDownTrayIcon, TrashIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import GenerateProgressReportModal from '@/components/progress-report/generate/generateProgressReportModal'
import ViewProgressReportModal from '@/components/progress-report/view/viewProgressReportModal'
import DeleteProgressReportModal from '@/components/progress-report/delete/deleteProgressReportModal'
import SentEmailProgressReportModal from '@/components/progress-report/email/sent/sentEmailProgressReportModal'

interface ProgressReportRecord {
  student_id?: string
  studentId?: string
  term: string
  student_name?: string
  studentName?: string
  grade?: string
  file_path?: string
  filePath?: string
  generated_at?: string
  generatedAt?: string
  school?: string
  email_sent?: boolean
  email_sent_at?: string
  email_sent_by?: string
}

const ProgressReportsPage = () => {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const showNotification = useNotificationStore((state) => state.showNotification)

  const [terms, setTerms] = useState<TermPayload[]>([])
  const [students, setStudents] = useState<StudentPayload[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [generatedReports, setGeneratedReports] = useState<ProgressReportRecord[]>([])
  
  // Filter states
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [studentGradeFilter, setStudentGradeFilter] = useState('')
  const [reportSearchTerm, setReportSearchTerm] = useState('')
  const [reportGradeFilter, setReportGradeFilter] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // Modal states
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateResult, setGenerateResult] = useState('')
  const [viewingUrl, setViewingUrl] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<ProgressReportRecord | null>(null)
  const [selectedForEmail, setSelectedForEmail] = useState<ProgressReportRecord | null>(null)
  const [emailDetailsModalOpen, setEmailDetailsModalOpen] = useState(false)

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!user?.school) return

    try {
      setLoading(true)

      const [termsRes, studentsRes] = await Promise.all([
        getTermsBySchool(user.school),
        getAllStudents(user.school)
      ])

      if (termsRes.status === 'success') {
        setTerms(termsRes.data)
        // Set active term as default
        const activeTerm = termsRes.data.find(t => t.isActive)
        if (activeTerm) {
          setSelectedTerm(activeTerm.name)
        }
      }

      if (studentsRes.status === 'success') {
        setStudents(studentsRes.data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.school])

  // Fetch generated reports when term changes
  const fetchGeneratedReports = useCallback(async () => {
    if (!user?.school || !selectedTerm) return

    try {
      const reportsRes = await getProgressReportsByTermAndSchool(selectedTerm, user.school)
      if (reportsRes.status === 'success') {
        setGeneratedReports(reportsRes.data)
      }
    } catch (err) {
      console.error('Error fetching generated reports:', err)
    }
  }, [user?.school, selectedTerm])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchGeneratedReports()
  }, [fetchGeneratedReports])

  // Get grade options
  const grades = getGradeOptions()

  // Filter and sort students
  const filteredStudents = students
    .filter(s => {
      const matchesName = s.name.toLowerCase().includes(studentSearchTerm.toLowerCase())
      const matchesGrade = studentGradeFilter === '' || String(s.grade) === studentGradeFilter
      return matchesName && matchesGrade
    })
    .sort((a, b) => {
      // Sort by grade first (JK, SK, 1, 2, 3...8)
      const gradeA = getGradeNumericValue(a.grade || '')
      const gradeB = getGradeNumericValue(b.grade || '')
      
      if (gradeA !== gradeB) {
        return gradeA - gradeB
      }
      // Then sort by name alphabetically within the same grade
      return a.name.localeCompare(b.name)
    })

  // Filter and sort generated reports
  const filteredReports = generatedReports
    .filter(r => {
      const matchesName = (r.student_name || r.studentName || '').toLowerCase().includes(reportSearchTerm.toLowerCase())
      const matchesGrade = reportGradeFilter === '' || String(r.grade) === reportGradeFilter
      return matchesName && matchesGrade
    })
    .sort((a, b) => {
      // Sort by grade first (JK, SK, 1, 2, 3...8)
      const gradeA = getGradeNumericValue(a.grade || '')
      const gradeB = getGradeNumericValue(b.grade || '')
      
      if (gradeA !== gradeB) {
        return gradeA - gradeB
      }
      // Then sort by name alphabetically within the same grade
      const nameA = a.student_name || a.studentName || ''
      const nameB = b.student_name || b.studentName || ''
      return nameA.localeCompare(nameB)
    })

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(s => s.studentId))
    }
  }

  const handleGenerateReports = async () => {
    if (!selectedTerm || selectedStudents.length === 0) {
      showNotification('Please select a term and at least one student', 'error')
      return
    }

    setGenerating(true)
    setShowGenerateModal(true)
    
    try {
      const result = await generateBulkProgressReports({
        studentIds: selectedStudents,
        term: selectedTerm
      })

      const successCount = result.generated?.length || 0
      const failureCount = result.failed?.length || 0
      
      let message = `Generated ${successCount} progress report${successCount !== 1 ? 's' : ''}`
      if (failureCount > 0) {
        message += `, ${failureCount} failed`
      }
      
      setGenerateResult(message)
      showNotification(message, successCount > 0 ? 'success' : 'error')
      
      // Refresh generated reports list
      await fetchGeneratedReports()
      
      // Clear selections
      setSelectedStudents([])
      
    } catch (err) {
      console.error('Error generating reports:', err)
      setGenerateResult('Failed to generate progress reports')
      showNotification('Failed to generate progress reports', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadReport = async (report: ProgressReportRecord) => {
    try {
      const signedUrl = await getSignedProgressReportUrl(report.file_path || report.filePath || '')
      if (!signedUrl) {
        showNotification('Failed to get download link', 'error')
        return
      }

      const response = await fetch(signedUrl)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = (report.file_path || report.filePath || '').split('/').pop() || 'progress-report.pdf'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(blobUrl) // Clean up
    } catch (err) {
      console.error('Error downloading report:', err)
      showNotification('Failed to download report', 'error')
    }
  }

  const handlePreviewReport = async (report: ProgressReportRecord) => {
    try {
      const signedUrl = await getSignedProgressReportUrl(report.file_path || report.filePath || '')
      if (signedUrl) {
        setViewingUrl(signedUrl)
      } else {
        showNotification('Failed to get preview link', 'error')
      }
    } catch (err) {
      console.error('Error previewing report:', err)
      showNotification('Failed to preview report', 'error')
    }
  }

  const handleDeleteReport = (report: ProgressReportRecord) => {
    setSelectedForDelete(report)
    setDeleteModalOpen(true)
  }

  const handleEmailClick = (report: ProgressReportRecord) => {
    setSelectedForEmail(report)
    if (report.email_sent) {
      // Show email details modal if already sent
      setEmailDetailsModalOpen(true)
    } else {
      // TODO: Open send email modal
      console.log('Open send email modal for:', report.student_name || report.studentName)
    }
  }

  const getEmailIcon = (report: ProgressReportRecord) => {
    if (report.email_sent) {
      return (
        <CheckCircleIcon 
          className="h-5 w-5" 
          title={`Email sent on ${report.email_sent_at ? new Date(report.email_sent_at).toLocaleDateString() : 'Unknown date'}`}
        />
      )
    }
    return <EnvelopeIcon className="h-5 w-5" title="Send email" />
  }

  const getEmailButtonClasses = (report: ProgressReportRecord) => {
    if (report.email_sent) {
      return "p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
    }
    return "p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-64 pt-32 lg:pt-40 bg-white min-h-screen p-4 lg:p-10">
          <div className="text-center">
            <p className="text-gray-600">Loading progress reports...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      
      <main className="lg:ml-64 pt-32 lg:pt-40 bg-white min-h-screen p-4 lg:p-10 text-black">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/reports')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Back to Reports
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Reports</h1>
            <p className="text-gray-600">
              Generate and manage student progress reports with core standards, work habits, and behavior assessments.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Generate Reports Section */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <DocumentArrowDownIcon className="h-6 w-6" />
                  Generate Progress Reports
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Select students and generate progress reports for parent conferences
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Term Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Term
                  </label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a term</option>
                    {terms.map((term) => (
                      <option key={term.termId} value={term.name}>
                        {term.name} ({term.academicYear})
                        {term.isActive && ' - Active'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student Filters */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
                        Search Students
                      </label>
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FunnelIcon className="h-4 w-4 inline mr-1" />
                        Filter by Grade
                      </label>
                      <select
                        value={studentGradeFilter}
                        onChange={(e) => setStudentGradeFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Grades</option>
                        {grades.map(gradeOption => (
                          <option key={gradeOption.value} value={String(gradeOption.value)}>
                            Grade {gradeOption.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {(studentSearchTerm || studentGradeFilter) && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Showing {filteredStudents.length} of {students.length} students
                      </span>
                      <button
                        onClick={() => {
                          setStudentSearchTerm('')
                          setStudentGradeFilter('')
                        }}
                        className="text-sm cursor-pointer text-indigo-600 hover:text-indigo-800"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Student Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      <UserIcon className="h-4 w-4 inline mr-1" />
                      Students ({selectedStudents.length} selected)
                    </label>
                    <button
                      onClick={handleSelectAll}
                      className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto border border-gray-300 rounded-md">
                    {filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-gray-600">
                        {students.length === 0 ? 'No students found' : 'No students match your filters'}
                      </div>
                    ) : (
                      filteredStudents.map((student) => (
                        <label
                          key={student.studentId}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.studentId)}
                            onChange={() => handleStudentSelection(student.studentId)}
                            className="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-600">Grade {student.grade}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateReports}
                  disabled={!selectedTerm || selectedStudents.length === 0 || generating}
                  className={`w-full cursor-pointer py-3 px-4 rounded-lg font-medium transition-colors ${
                    !selectedTerm || selectedStudents.length === 0 || generating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {generating ? 'Generating Reports...' : `Generate ${selectedStudents.length} Progress Report${selectedStudents.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>

            {/* Generated Reports Section */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Generated Reports</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Download previously generated progress reports
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Report Filters */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
                        Search Reports
                      </label>
                      <input
                        type="text"
                        placeholder="Search by student name..."
                        value={reportSearchTerm}
                        onChange={(e) => setReportSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FunnelIcon className="h-4 w-4 inline mr-1" />
                        Filter by Grade
                      </label>
                      <select
                        value={reportGradeFilter}
                        onChange={(e) => setReportGradeFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Grades</option>
                        {grades.map(gradeOption => (
                          <option key={gradeOption.value} value={String(gradeOption.value)}>
                            Grade {gradeOption.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {(reportSearchTerm || reportGradeFilter) && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Showing {filteredReports.length} of {generatedReports.length} reports
                      </span>
                      <button
                        onClick={() => {
                          setReportSearchTerm('')
                          setReportGradeFilter('')
                        }}
                        className="text-sm cursor-pointer text-indigo-600 hover:text-indigo-800"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
                {filteredReports.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      {generatedReports.length === 0 ? 'No progress reports generated yet.' : 'No reports match your filters.'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {generatedReports.length === 0 ? 'Generate your first progress report to see it here.' : 'Try adjusting your search or filter criteria.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-120 overflow-y-auto">
                    {filteredReports.map((report) => (
                      <div
                        key={`${report.student_id || report.studentId}-${report.term}`}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium">{report.student_name || report.studentName}</div>
                          <div className="text-sm text-gray-600">
                            {report.term} • Grade {report.grade}
                          </div>
                          <div className="text-xs text-gray-500">
                            Generated: {new Date(report.generated_at || report.generatedAt || '').toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleEmailClick(report)}
                            title={report.email_sent ? 'View email details' : 'Send email'}
                            className={getEmailButtonClasses(report)}
                          >
                            {getEmailIcon(report)}
                          </button>
                          <button
                            onClick={() => handlePreviewReport(report)}
                            title="View PDF"
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDownloadReport(report)}
                            title="Download PDF"
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report)}
                            title="Delete Progress Report"
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <GenerateProgressReportModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        isLoading={generating}
        resultMessage={generateResult}
      />

      {viewingUrl && (
        <ViewProgressReportModal
          url={viewingUrl}
          onClose={() => setViewingUrl(null)}
        />
      )}

      {deleteModalOpen && selectedForDelete && (
        <DeleteProgressReportModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          studentName={selectedForDelete.student_name || selectedForDelete.studentName || ''}
          filePath={selectedForDelete.file_path || selectedForDelete.filePath || ''}
          onDeleted={(filePath: string) => {
            setGeneratedReports((prev) => prev.filter((r) => (r.file_path || r.filePath) !== filePath));
            setDeleteModalOpen(false);
            setSelectedForDelete(null);
          }}
        />
      )}

      {emailDetailsModalOpen && selectedForEmail && (
        <SentEmailProgressReportModal
          isOpen={emailDetailsModalOpen}
          onClose={() => {
            setEmailDetailsModalOpen(false);
            setSelectedForEmail(null);
          }}
          studentId={selectedForEmail.student_id || selectedForEmail.studentId || ''}
          studentName={selectedForEmail.student_name || selectedForEmail.studentName || ''}
          term={selectedForEmail.term}
        />
      )}
    </>
  )
}

export default ProgressReportsPage