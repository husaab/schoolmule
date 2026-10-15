'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getStudentsByParentId } from '@/services/parentStudentService'
import { getSignedReportCardUrl, getGeneratedReportCardsByStudentId } from '@/services/reportCardService'
import { getTermsBySchool } from '@/services/termService'
import { ParentStudentPayload } from '@/services/types/parentStudent'
import { TermPayload } from '@/services/types/term'
import ReportCardViewerModal from '@/components/report-cards/view/reportCardViewerModal'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ParentEmptyState from '@/components/parent/ParentEmptyState'
import Spinner from '@/components/Spinner'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { childColor, childInitial } from '@/components/parent/childColors'
import { useFilterParams, useRememberedHref } from '@/hooks/useFilterParams'
import {
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

type ReportCardRow = {
  student_id: string
  student_name: string
  file_path: string
  generated_at: string
  grade: string
}

const ParentStudentReportCardsContent: React.FC = () => {
  const router = useRouter()
  const { studentId } = useParams() as { studentId: string }
  const user = useUserStore((state) => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)
  // The term lives in the URL (?term=) so Back, refresh and the list's filter
  // memory all restore it; Back returns to the list as the parent left it.
  const { get, setParams } = useFilterParams()
  const term = get('term')
  const backHref = useRememberedHref('/parent/report-cards')

  const [student, setStudent] = useState<ParentStudentPayload | null>(null)
  const [reportCards, setReportCards] = useState<ReportCardRow[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [loadingTerms, setLoadingTerms] = useState(false)
  const [viewingUrl, setViewingUrl] = useState<string | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId) // refetch when the selected school year changes
  // Loading flags are derived: what is on screen belongs to the key it was
  // loaded for, so any other parent/child/year (or term) is still in flight.
  const studentKey = `${user.id}|${user.school ?? ''}|${studentId}|${selectedYearId ?? ''}`
  const [studentLoadedFor, setStudentLoadedFor] = useState<string | null>(null)
  const loading = studentLoadedFor !== studentKey
  const reportsKey = `${studentId}|${term}`
  const [reportsLoadedFor, setReportsLoadedFor] = useState<string | null>(null)
  const loadingReports = !!student && !!term && reportsLoadedFor !== reportsKey

  // Verify the student belongs to this parent and fetch initial data
  useEffect(() => {
    if (!user.id || !studentId) return

    getStudentsByParentId(user.id)
      .then((res) => {
        const childData = res.data?.find(child => child.studentId === studentId)
        if (!childData) {
          setError('Student not found or access denied.')
          return
        }
        setError(null)
        setStudent(childData)

        // Fetch terms for the school
        setLoadingTerms(true)
        return getTermsBySchool(user.school!)
      })
      .then((termsRes) => {
        if (termsRes?.status === 'success') {
          setTerms(termsRes.data)
        } else {
          showNotification('Failed to load terms', 'error')
        }
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load student data.')
      })
      .finally(() => {
        setStudentLoadedFor(studentKey)
        setLoadingTerms(false)
      })
  }, [user.id, user.school, studentId, studentKey, showNotification, selectedYearId])

  // Default term once the (year-scoped) list is in, unless the URL already
  // names one of its terms: the JWT's active term if it exists in this list,
  // else the list's active term, else the first — a past year has no active
  // term and may not contain activeTerm's name.
  useEffect(() => {
    if (terms.length === 0) return
    const names = terms.map(t => t.name)
    if (term && names.includes(term)) return
    const fallback =
      user.activeTerm && names.includes(user.activeTerm)
        ? user.activeTerm
        : (terms.find(t => t.isActive) ?? terms[0]).name
    setParams({ term: fallback })
  }, [terms, term, user.activeTerm, setParams])

  // Fetch report cards when term is selected
  useEffect(() => {
    if (!student || !term) return

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
        setReportsLoadedFor(reportsKey)
      })
  }, [student, term, studentId, reportsKey, showNotification])

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

  const color = childColor(studentId)
  const childName = student?.student?.name || 'Report Cards'

  return (
    <ParentPageShell
      title={student ? `${childName}'s Report Cards` : 'Report Cards'}
      subtitle={
        student?.student?.grade != null
          ? `Grade ${student.student.grade} · View and download report cards.`
          : 'View and download report cards.'
      }
      badge={{ icon: DocumentChartBarIcon, label: 'Report Cards' }}
    >
      <button
        onClick={() => router.push(backHref)}
        className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 mb-6 cursor-pointer"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Report Cards
      </button>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <ParentEmptyState icon={DocumentTextIcon} title="Something went wrong" message={error} />
      )}

      {!loading && !error && student && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70">
          {/* Header with term selector */}
          <div className="p-6 border-b border-stone-100">
            <div className="flex items-center gap-4 mb-5">
              <span
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${color.solid} flex items-center justify-center text-white text-lg font-semibold flex-shrink-0`}
              >
                {childInitial(childName)}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{childName}</h2>
                <p className="text-sm text-slate-500">Select a term to view available report cards</p>
              </div>
            </div>

            <div className="max-w-sm">
              {loadingTerms ? (
                <p className="text-sm text-slate-500">Loading terms...</p>
              ) : (
                <SearchableSelect
                  value={term}
                  onChange={(v) => setParams({ term: v || null })}
                  options={terms.map((t) => ({
                    value: t.name,
                    label: `${t.name} (${t.academicYear})${t.isActive ? ' - Active' : ''}`,
                  }))}
                  placeholder="Select term"
                  ariaLabel="Term"
                  className="w-full"
                  triggerClassName="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-700 shadow-sm focus:ring-amber-200"
                />
              )}
            </div>
          </div>

          {/* Report cards list */}
          <div className="p-6">
            {loadingReports ? (
              <div className="flex justify-center items-center h-32">
                <Spinner />
              </div>
            ) : reportCards.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-lg font-semibold text-slate-900 mb-1">No report cards found</p>
                <p className="text-sm text-slate-500">
                  {term
                    ? `No report cards have been generated for ${term} yet.`
                    : 'Please select a term to view report cards.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportCards.map((report) => (
                  <div
                    key={report.file_path}
                    className="flex items-center justify-between gap-4 p-4 bg-stone-50 border border-stone-100 rounded-xl hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{report.student_name}</p>
                      <p className="text-sm text-slate-500">
                        Generated{' '}
                        {new Date(report.generated_at).toLocaleDateString('en-CA', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-slate-400">Term: {term}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePreview(report.file_path)}
                        title="View PDF"
                        className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(report.file_path)}
                        title="Download PDF"
                        className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
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
      )}

      {viewingUrl && (
        <ReportCardViewerModal url={viewingUrl} onClose={() => setViewingUrl(null)} />
      )}
    </ParentPageShell>
  )
}

const ParentStudentReportCardsPage: React.FC = () => (
  <Suspense
    fallback={
      <ParentPageShell
        title="Report Cards"
        subtitle="View and download report cards."
        badge={{ icon: DocumentChartBarIcon, label: 'Report Cards' }}
      >
        <div className="h-[520px] rounded-2xl border border-stone-200/70 bg-white" />
      </ParentPageShell>
    }
  >
    <ParentStudentReportCardsContent />
  </Suspense>
)

export default ParentStudentReportCardsPage
