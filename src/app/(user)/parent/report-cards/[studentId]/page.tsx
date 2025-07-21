'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getStudentsByParentId } from '@/services/parentStudentService'
import { getSignedReportCardUrl, getGeneratedReportCardsByStudentId } from '@/services/reportCardService'
import { getTermsBySchool } from '@/services/termService'
import { ParentStudentPayload } from '@/services/types/parentStudent'
import { TermPayload } from '@/services/types/term'
import ReportCardViewerModal from '@/components/report-cards/view/reportCardViewerModal'
import Spinner from '@/components/Spinner'
import { EyeIcon, ArrowDownTrayIcon, ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

type ReportCardRow = {
  student_id: string
  student_name: string
  file_path: string
  generated_at: string
  grade: string
}

const ParentStudentReportCardsPage: React.FC = () => {
  const router = useRouter()
  const { studentId } = useParams() as { studentId: string }
  const user = useUserStore((state) => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)

  const [student, setStudent] = useState<ParentStudentPayload | null>(null)
  const [reportCards, setReportCards] = useState<ReportCardRow[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [loadingTerms, setLoadingTerms] = useState(false)
  const [loadingReports, setLoadingReports] = useState(false)
  const [term, setTerm] = useState<string>('')
  const [viewingUrl, setViewingUrl] = useState<string | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verify the student belongs to this parent and fetch initial data
  useEffect(() => {
    if (!user.id || !studentId) return

    setLoading(true)
    getStudentsByParentId(user.id)
      .then((res) => {
        const childData = res.data?.find(child => child.studentId === studentId)
        if (!childData) {
          setError('Student not found or access denied.')
          return
        }
        setStudent(childData)

        // Fetch terms for the school
        setLoadingTerms(true)
        return getTermsBySchool(user.school!)
      })
      .then((termsRes) => {
        if (termsRes?.status === 'success') {
          setTerms(termsRes.data)
          
          // Set default term to active term
          if (user.activeTerm) {
            setTerm(user.activeTerm)
          } else {
            const activeTerm = termsRes.data.find(t => t.isActive)
            if (activeTerm) {
              setTerm(activeTerm.name)
            } else if (termsRes.data.length > 0) {
              setTerm(termsRes.data[0].name)
            }
          }
        } else {
          showNotification('Failed to load terms', 'error')
        }
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load student data.')
      })
      .finally(() => {
        setLoading(false)
        setLoadingTerms(false)
      })
  }, [user.id, user.school, user.activeTerm, studentId, showNotification])

  // Fetch report cards when term is selected
  useEffect(() => {
    if (!student || !term) return

    setLoadingReports(true)
    getGeneratedReportCardsByStudentId(studentId, term)
      .then((res) => {
        if (res.status === 'success') {
          setReportCards(res.data)
        }
      })
      .catch((err) => {
        console.error('Error fetching report cards:', err)
        showNotification('Error loading report cards', 'error')
      })
      .finally(() => {
        setLoadingReports(false)
      })
  }, [student, term, studentId, showNotification])

  const handlePreview = async (filePath: string) => {
    if (signedUrls[filePath]) {
      setViewingUrl(signedUrls[filePath])
      return
    }

    const result = await getSignedReportCardUrl(filePath)
    if (result) {
      setSignedUrls((prev) => ({ ...prev, [filePath]: result }))
      setViewingUrl(result)
    }
  }

  const handleDownload = async (filePath: string) => {
    let url = signedUrls[filePath]

    if (!url) {
      const result = await getSignedReportCardUrl(filePath)
      if (!result) return
      setSignedUrls((prev) => ({ ...prev, [filePath]: result }))
      url = result
    }

    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = filePath.split('/').pop() || 'report-card.pdf'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Failed to download report card:', error)
      showNotification('Failed to download report card', 'error')
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
          <div className="flex justify-center items-center h-32">
            <Spinner />
          </div>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={() => router.push('/parent/report-cards')}
                className="mt-4 px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 cursor-pointer"
              >
                Back to Report Cards
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        {/* Header */}
        <div className="text-black text-center mb-6">
          <button
            onClick={() => router.push('/parent/report-cards')}
            className="flex items-center space-x-2 text-cyan-600 hover:text-cyan-700 mb-4 mx-auto cursor-pointer"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Report Cards</span>
          </button>
          <h1 className="text-2xl lg:text-3xl font-semibold">
            Report Cards - {student?.student?.name} - Grade {student?.student?.grade}
          </h1>
          <p className="text-gray-600 mt-2">
            View and download report cards
          </p>
          
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-md max-w-4xl mx-auto">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <DocumentTextIcon className="h-8 w-8 text-cyan-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {student?.student?.name}'s Report Cards
                  </h2>
                  <p className="text-sm text-gray-600">Select a term to view available report cards</p>
                </div>
              </div>
              
              <div className="max-w-sm">
                <label className="block text-sm font-medium mb-2 text-black">Select term:</label>
                {loadingTerms ? (
                  <p className="text-gray-600">Loading terms...</p>
                ) : (
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full border border-gray-300 text-black rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="" disabled>Select term</option>
                    {terms.map((t) => (
                      <option key={t.termId} value={t.name}>
                        {t.name} ({t.academicYear})
                        {t.isActive && ' - Active'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Report Cards Content */}
          <div className="p-6">
            {loadingReports ? (
              <div className="flex justify-center items-center h-32">
                <Spinner />
              </div>
            ) : reportCards.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium">No report cards found</p>
                <p className="text-sm">
                  {term ? `No report cards have been generated for ${term}.` : 'Please select a term to view report cards.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportCards.map((report) => (
                  <div
                    key={report.file_path}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{report.student_name}</p>
                      <p className="text-gray-600 text-sm">
                        Generated: {new Date(report.generated_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-gray-500 text-xs">Term: {term}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handlePreview(report.file_path)}
                        title="View PDF"
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(report.file_path)}
                        title="Download PDF"
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {viewingUrl && (
        <ReportCardViewerModal url={viewingUrl} onClose={() => setViewingUrl(null)} />
      )}

      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
      `}</style>
    </>
  )
}

export default ParentStudentReportCardsPage