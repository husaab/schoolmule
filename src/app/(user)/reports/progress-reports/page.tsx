'use client'

// Progress reports for one term: every student once, with their report (or
// that there isn't one yet) and whether the family was emailed. The overview
// shows how far the term has got and doubles as the grade filter; the chips
// filter by status; a selection generates, emails, downloads or deletes in
// bulk. Filters live in the URL (term, grades, status, q).

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  DocumentPlusIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import BackLink from '@/components/shared/BackLink'
import EmptyState from '@/components/ui/EmptyState'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getTermsBySchool } from '@/services/termService'
import { getAllStudents } from '@/services/studentService'
import { generateBulkProgressReports, getProgressReportsByTermAndSchool, getSignedProgressReportUrl } from '@/services/progressReportService'
import type { TermPayload } from '@/services/types/term'
import type { StudentPayload } from '@/services/types/student'
import { useDebouncedParam, useFilterParams } from '@/hooks/useFilterParams'
import { saveBlob } from '@/lib/pdfDownload'
import {
  STATUS_FILTERS,
  buildRoster,
  filterRoster,
  gradeBreakdown,
  inGrades,
  isStatusFilter,
  localDateISO,
  matchesStatus,
  normalizeProgressReport,
  parseGenerateResult,
  parseGradeList,
  rosterCounts,
  selectionTargets,
  shortDate,
  type GenerateOutcome,
  type RawProgressReport,
  type StatusFilter,
} from '@/lib/progressReportRoster'
import ProgressOverview from '@/components/progress-report/roster/ProgressOverview'
import RosterTable, { type Row, type RowActions } from '@/components/progress-report/roster/RosterTable'
import PdfViewerModal from '@/components/reports/PdfViewerModal'
import GenerateProgressReportModal from '@/components/progress-report/generate/generateProgressReportModal'
import DeleteProgressReportModal from '@/components/progress-report/delete/deleteProgressReportModal'
import BulkDeleteProgressReportModal from '@/components/progress-report/delete/bulkDeleteProgressReportModal'
import BulkDownloadProgressReportModal from '@/components/progress-report/download/bulkDownloadProgressReportModal'
import SentEmailProgressReportModal from '@/components/progress-report/email/sent/sentEmailProgressReportModal'
import SingleEmailProgressReportModal from '@/components/progress-report/email/singleEmailProgressReportModal'
import BulkEmailProgressReportModal from '@/components/progress-report/email/bulkEmailProgressReportModal'

type Dialog =
  | { kind: 'view'; row: Row; url: string }
  | { kind: 'email'; row: Row }
  | { kind: 'sent'; row: Row }
  | { kind: 'delete'; row: Row }
  | { kind: 'bulkDelete'; paths: string[] }
  | { kind: 'bulkDownload'; paths: string[] }
  | { kind: 'bulkEmail'; preselect: string[] }

interface GenerateRun {
  students: { studentId: string; name: string }[]
  running: boolean
  outcome: GenerateOutcome | null
  error: string | null
}

const secondaryButton =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50'
const primaryButton =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const bulkButtonBase =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium shadow-sm ring-1 ring-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50'
const bulkButton = `${bulkButtonBase} text-slate-700 hover:bg-slate-50`
const dangerBulkButton = `${bulkButtonBase} text-rose-700 hover:bg-rose-50`

const ProgressReportsContent = () => {
  const user = useUserStore((state) => state.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const showNotification = useNotificationStore((state) => state.showNotification)
  const filters = useFilterParams()
  const { get, setParams } = filters

  const [terms, setTerms] = useState<TermPayload[]>([])
  const [students, setStudents] = useState<StudentPayload[]>([])
  // The report rows, tagged with the term they were read for, so a term switch never shows the old term's.
  const [reportsFor, setReportsFor] = useState<{ term: string; rows: RawProgressReport[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const latestReportsRequest = useRef(0)

  // Filters live in the URL so Back/refresh/share restore them.
  const selectedTerm = get('term')
  const selectedGrades = parseGradeList(get('grades'))
  const rawStatus = get('status')
  const status: StatusFilter = isStatusFilter(rawStatus) ? rawStatus : ''
  const [search, setSearch] = useDebouncedParam(filters, 'q')

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [run, setRun] = useState<GenerateRun | null>(null)
  // The date JK/SK progress reports print (other grades don't print one).
  const [reportDate, setReportDate] = useState(() => localDateISO())

  const fetchData = useCallback(async () => {
    if (!user?.school) return
    try {
      setLoading(true)
      const [termsRes, studentsRes] = await Promise.all([getTermsBySchool(user.school), getAllStudents(user.school)])
      if (termsRes.status === 'success') setTerms(termsRes.data)
      if (studentsRes.status === 'success') setStudents(studentsRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
      showNotification("Couldn't load students and terms", 'error')
    } finally {
      setLoading(false)
    }
  }, [user?.school, selectedYearId, showNotification]) // refetch when the selected school year changes

  // Default to the active term once terms load, only if the URL hasn't pinned one.
  useEffect(() => {
    if (selectedTerm || terms.length === 0) return
    const activeTerm = terms.find((t) => t.isActive)
    if (activeTerm) setParams({ term: activeTerm.name })
  }, [terms, selectedTerm, setParams])

  const fetchGeneratedReports = useCallback(async () => {
    if (!user?.school || !selectedTerm) return
    // Only the newest request lands: switching Term 1 → 2 → 1 quickly never shows Term 2's rows under Term 1.
    const request = ++latestReportsRequest.current
    try {
      const reportsRes = await getProgressReportsByTermAndSchool(selectedTerm, user.school)
      if (request !== latestReportsRequest.current) return
      if (reportsRes.status === 'success') setReportsFor({ term: selectedTerm, rows: reportsRes.data as unknown as RawProgressReport[] })
    } catch (err) {
      if (request !== latestReportsRequest.current) return
      console.error('Error fetching generated reports:', err)
      showNotification("Couldn't load this term's progress reports", 'error')
    }
  }, [user?.school, selectedTerm, selectedYearId, showNotification]) // refetch when the selected school year changes

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchGeneratedReports()
  }, [fetchGeneratedReports])

  // A new term or school year starts with nothing selected.
  useEffect(() => {
    setSelectedIds([])
  }, [selectedTerm, selectedYearId])

  // Until this term's rows arrive the list shows a skeleton and the header actions wait.
  const reportsReady = !!selectedTerm && reportsFor?.term === selectedTerm
  const rawReports = useMemo(() => (reportsReady ? reportsFor!.rows : []), [reportsReady, reportsFor])
  const reports = useMemo(() => rawReports.map(normalizeProgressReport), [rawReports])
  const roster = useMemo(() => buildRoster(students, reports), [students, reports])
  const rosterById = useMemo(() => new Map(roster.map((r) => [r.studentId, r])), [roster])
  const counts = useMemo(() => rosterCounts(roster), [roster])
  const grades = useMemo(() => gradeBreakdown(roster), [roster])
  const gradeRows = roster.filter((r) => inGrades(r, selectedGrades))
  const visible = filterRoster(roster, { grades: selectedGrades, status, q: search })
  // Only rows on screen count as selected, so a bulk action never reaches a student a filter
  // (or a row's own change, e.g. it was just emailed) has hidden.
  const visibleIdSet = new Set(visible.map((r) => r.studentId))
  const shownSelectedIds = selectedIds.filter((id) => visibleIdSet.has(id))
  const targets = selectionTargets(visible, shownSelectedIds)
  const missingIds = gradeRows.filter((r) => r.status === 'none' && r.student).map((r) => r.studentId)
  const unemailedReports = rawReports.filter((r) => !(r.email_sent ?? r.emailSent))
  const hasFilters = selectedGrades.length > 0 || status !== '' || search.trim() !== ''

  // Changing what's shown drops the selection, so a bulk action never reaches hidden rows.
  const changeFilters = (patch: Record<string, string | null>) => {
    setSelectedIds([])
    setParams(patch)
  }
  const toggleGrade = (grade: string) => {
    const next = selectedGrades.includes(grade) ? selectedGrades.filter((g) => g !== grade) : [...selectedGrades, grade]
    changeFilters({ grades: next.length ? next.join(',') : null })
  }
  const clearFilters = () => {
    setSelectedIds([])
    setSearch('')
    setParams({ grades: null, status: null, q: null })
  }

  const runGenerate = async (studentIds: string[]) => {
    if (!selectedTerm || studentIds.length === 0) return
    const runStudents = studentIds.map((id) => ({ studentId: id, name: rosterById.get(id)?.name ?? 'Student' }))
    setRun({ students: runStudents, running: true, outcome: null, error: null })
    setSelectedIds([])
    try {
      const outcome = parseGenerateResult(
        await generateBulkProgressReports({ studentIds, term: selectedTerm, reportDate: reportDate || undefined }),
      )
      setRun({ students: runStudents, running: false, outcome, error: null })
      const ok = outcome.generated.length
      const failed = outcome.failed.length
      showNotification(
        `Generated ${ok} progress report${ok !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} skipped` : ''}`,
        ok > 0 ? 'success' : 'error',
      )
      await fetchGeneratedReports()
    } catch (err) {
      console.error('Error generating reports:', err)
      setRun({ students: runStudents, running: false, outcome: null, error: 'The server could not generate the reports. Try again.' })
      showNotification('Failed to generate progress reports', 'error')
    }
  }

  const handleDownloadReport = async (row: Row) => {
    const filePath = row.report?.filePath || ''
    try {
      const signedUrl = await getSignedProgressReportUrl(filePath)
      if (!signedUrl) {
        showNotification('Failed to get download link', 'error')
        return
      }
      const response = await fetch(signedUrl)
      saveBlob(await response.blob(), filePath.split('/').pop() || 'progress-report.pdf')
    } catch (err) {
      console.error('Error downloading report:', err)
      showNotification('Failed to download report', 'error')
    }
  }

  const handlePreviewReport = async (row: Row) => {
    setOpeningId(row.studentId)
    try {
      const signedUrl = await getSignedProgressReportUrl(row.report?.filePath || '')
      if (signedUrl) setDialog({ kind: 'view', row, url: signedUrl })
      else showNotification('Failed to get preview link', 'error')
    } catch (err) {
      console.error('Error previewing report:', err)
      showNotification('Failed to preview report', 'error')
    } finally {
      setOpeningId(null)
    }
  }

  const actions: RowActions = {
    view: (row) => void handlePreviewReport(row),
    download: (row) => void handleDownloadReport(row),
    emailFamily: (row) => setDialog({ kind: 'email', row }),
    emailDetails: (row) => setDialog({ kind: 'sent', row }),
    generate: (ids) => void runGenerate(ids),
    remove: (row) => setDialog({ kind: 'delete', row }),
  }

  const removePaths = (paths: string[]) => {
    setReportsFor((prev) => prev && { ...prev, rows: prev.rows.filter((r) => !paths.includes(r.file_path || r.filePath || '')) })
    setSelectedIds([])
  }

  const toggleRow = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const visibleIds = visible.map((r) => r.studentId)
  const toggleAllShown = () => setSelectedIds((prev) => (visibleIds.length > 0 && visibleIds.every((id) => prev.includes(id)) ? [] : visibleIds))

  const termOptions = terms.map((term) => ({
    value: term.name,
    // The navbar already names the school year.
    label: `${term.name}${term.isActive ? ' · active' : ''}`,
  }))
  const summary = selectedTerm
    ? `${selectedTerm} · ${counts.total} student${counts.total !== 1 ? 's' : ''}`
    : 'Core standards, work habits and behaviour for every student, emailed to each family.'

  const sentRow = dialog?.kind === 'sent' ? dialog.row : null
  const generatedEmailable = (run?.outcome?.generated ?? []).filter((id) => rosterById.get(id)?.status === 'ready')

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 min-[1400px]:flex-row min-[1400px]:items-end min-[1400px]:justify-between">
            <div className="min-w-0">
              <BackLink to="/reports" className="mb-2 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                <ArrowLeftIcon className="h-4 w-4" />
                Reports
              </BackLink>
              <h1 className="font-display text-[26px] font-semibold leading-tight text-slate-900 sm:text-[30px]">Progress reports</h1>
              <p className="mt-1 text-[15px] text-slate-600">{summary}</p>
            </div>
            {/* A phone stacks them full width; wider screens keep them on one line. */}
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <SearchableSelect
                options={termOptions}
                value={selectedTerm}
                onChange={(v) => setParams({ term: v })}
                placeholder="Select a term"
                ariaLabel="Term"
                searchPlaceholder="Find a term"
                size="sm"
                className="sm:min-w-[11rem]"
              />
              <label
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm focus-within:ring-2 focus-within:ring-cyan-500"
                title="The date printed on JK and SK progress reports"
              >
                <CalendarDaysIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>Report date</span>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="border-0 bg-transparent p-0 text-sm font-medium text-slate-900 focus:outline-none focus:ring-0"
                />
              </label>
              <button
                type="button"
                onClick={() => setDialog({ kind: 'bulkEmail', preselect: unemailedReports.map((r) => r.student_id || r.studentId || '') })}
                disabled={!reportsReady || unemailedReports.length === 0}
                title={unemailedReports.length === 0 ? 'Every report this term has been emailed' : undefined}
                className={secondaryButton}
              >
                <EnvelopeIcon className="h-4 w-4 text-slate-500" />
                Email families ({unemailedReports.length})
              </button>
              <button
                type="button"
                onClick={() => void runGenerate(missingIds)}
                disabled={!reportsReady || missingIds.length === 0 || !!run?.running}
                title={missingIds.length === 0 ? 'Everyone shown has a report' : undefined}
                className={primaryButton}
              >
                <DocumentPlusIcon className="h-4 w-4" />
                Generate missing ({missingIds.length})
              </button>
            </div>
          </div>

          {!selectedTerm && !loading && (
            <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Pick a term to see its progress reports.
            </div>
          )}

          <ProgressOverview
            term={selectedTerm || 'this term'}
            counts={counts}
            grades={grades}
            selectedGrades={selectedGrades}
            onToggleGrade={toggleGrade}
            onClearGrades={() => changeFilters({ grades: null })}
            loading={loading || (!!selectedTerm && !reportsReady)}
          />

          <section aria-label="Students" className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by report status">
                {STATUS_FILTERS.map((chip) => {
                  const count = gradeRows.filter((r) => matchesStatus(r, chip.value)).length
                  // "Updated since emailed" only earns a chip when something needs it.
                  if (chip.value === 'updated' && count === 0 && status !== 'updated') return null
                  const active = status === chip.value
                  const attention = chip.value === 'updated' && count > 0 && !active
                  return (
                    <button
                      key={chip.value || 'all'}
                      type="button"
                      aria-pressed={active}
                      onClick={() => changeFilters({ status: chip.value || null })}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        active
                          ? 'border-cyan-200 bg-cyan-50 font-medium text-cyan-800'
                          : attention
                            ? 'border-amber-200 bg-amber-50 font-medium text-amber-800 hover:bg-amber-100'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {chip.label}
                      <span className="ml-1.5 text-xs tabular-nums text-slate-400">{count}</span>
                    </button>
                  )
                })}
              </div>
              <div className="relative xl:w-64">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSelectedIds([])
                    setSearch(e.target.value)
                  }}
                  placeholder="Search students"
                  aria-label="Search students"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Bulk bar */}
            {shownSelectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-cyan-100 bg-cyan-50/60 px-4 py-2.5 text-sm">
                <span className="mr-1 font-medium text-cyan-900">{shownSelectedIds.length} selected</span>
                <button type="button" onClick={() => void runGenerate(targets.generateIds)} disabled={targets.generateIds.length === 0} className={bulkButton}>
                  <DocumentPlusIcon className="h-4 w-4 text-slate-500" />
                  Generate {targets.generateIds.length}
                </button>
                <button type="button" onClick={() => setDialog({ kind: 'bulkEmail', preselect: targets.emailIds })} disabled={targets.emailIds.length === 0} className={bulkButton}>
                  <EnvelopeIcon className="h-4 w-4 text-slate-500" />
                  Email families ({targets.emailIds.length})
                </button>
                <button type="button" onClick={() => setDialog({ kind: 'bulkDownload', paths: targets.filePaths })} disabled={targets.filePaths.length === 0} className={bulkButton}>
                  <ArrowDownTrayIcon className="h-4 w-4 text-slate-500" />
                  Download ZIP ({targets.filePaths.length})
                </button>
                <button type="button" onClick={() => setDialog({ kind: 'bulkDelete', paths: targets.filePaths })} disabled={targets.filePaths.length === 0} className={dangerBulkButton}>
                  <TrashIcon className="h-4 w-4" />
                  Delete ({targets.filePaths.length})
                </button>
                {targets.replacing > 0 && (
                  <span className="text-xs text-cyan-800">
                    {targets.replacing} already {targets.replacing === 1 ? 'has a report that' : 'have reports that'} Generate will replace
                  </span>
                )}
                <button type="button" onClick={() => setSelectedIds([])} className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-slate-600 hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                  <XMarkIcon className="h-4 w-4" />
                  Clear
                </button>
              </div>
            )}

            {/* Rows */}
            {loading || (!!selectedTerm && !reportsReady) ? (
              <div className="space-y-2 p-4" aria-label="Loading students">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : roster.length === 0 ? (
              <EmptyState icon={UserGroupIcon} title="No students yet" description="Students added to this school year show up here, ready for their progress reports." />
            ) : visible.length === 0 ? (
              <EmptyState
                icon={MagnifyingGlassIcon}
                title="No students match these filters"
                description="Clear the search, or pick a different status or grade."
                action={
                  <button type="button" onClick={clearFilters} className={secondaryButton}>
                    Clear filters
                  </button>
                }
              />
            ) : (
              <RosterTable rows={visible} selectedIds={selectedIds} onToggle={toggleRow} onToggleAll={toggleAllShown} actions={actions} openingId={openingId} />
            )}

            {!loading && roster.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                <span>
                  Showing {visible.length} of {roster.length} students, by grade then name
                </span>
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="cursor-pointer rounded font-medium text-cyan-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <GenerateProgressReportModal
        isOpen={!!run}
        onClose={() => setRun(null)}
        running={!!run?.running}
        term={selectedTerm}
        students={run?.students ?? []}
        outcome={run?.outcome ?? null}
        error={run?.error ?? null}
        emailableIds={generatedEmailable}
        onEmailFamilies={(ids) => {
          setRun(null)
          setDialog({ kind: 'bulkEmail', preselect: ids })
        }}
      />

      <PdfViewerModal
        isOpen={dialog?.kind === 'view'}
        onClose={() => setDialog(null)}
        src={dialog?.kind === 'view' ? dialog.url : null}
        title={dialog?.kind === 'view' ? dialog.row.name : ''}
        subtitle={
          dialog?.kind === 'view'
            ? `${selectedTerm} progress report${dialog.row.report?.generatedAt ? `, generated ${shortDate(dialog.row.report.generatedAt)}` : ''}`
            : undefined
        }
        actions={
          dialog?.kind === 'view' ? (
            <>
              <button type="button" onClick={() => void handleDownloadReport(dialog.row)} aria-label="Download PDF" className={secondaryButton}>
                <ArrowDownTrayIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                type="button"
                onClick={() => setDialog({ kind: 'email', row: dialog.row })}
                aria-label={dialog.row.status === 'ready' ? 'Email family' : 'Email family again'}
                className={primaryButton}
              >
                <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{dialog.row.status === 'ready' ? 'Email family' : 'Email again'}</span>
              </button>
            </>
          ) : null
        }
      />

      {dialog?.kind === 'delete' && (
        <DeleteProgressReportModal
          isOpen
          onClose={() => setDialog(null)}
          studentName={dialog.row.name}
          filePath={dialog.row.report?.filePath || ''}
          onDeleted={(filePath: string) => {
            removePaths([filePath])
            setDialog(null)
          }}
        />
      )}

      {dialog?.kind === 'bulkDelete' && (
        <BulkDeleteProgressReportModal isOpen onClose={() => setDialog(null)} filePaths={dialog.paths} onDeleted={(filePaths: string[]) => removePaths(filePaths)} />
      )}

      {dialog?.kind === 'bulkDownload' && (
        <BulkDownloadProgressReportModal isOpen onClose={() => setDialog(null)} filePaths={dialog.paths} term={selectedTerm} onDownloaded={() => setSelectedIds([])} />
      )}

      {sentRow && (
        <SentEmailProgressReportModal
          isOpen
          onClose={() => setDialog(null)}
          studentId={sentRow.studentId}
          studentName={sentRow.name}
          term={selectedTerm}
          onEmailAgain={() => setDialog({ kind: 'email', row: sentRow })}
        />
      )}

      {dialog?.kind === 'email' && (
        <SingleEmailProgressReportModal
          isOpen
          onClose={() => setDialog(null)}
          studentId={dialog.row.studentId}
          studentName={dialog.row.name}
          term={selectedTerm}
          onEmailSent={() => {
            // Refresh the list so the row shows it was emailed.
            fetchGeneratedReports()
          }}
        />
      )}

      {dialog?.kind === 'bulkEmail' && (
        <BulkEmailProgressReportModal
          isOpen
          onClose={() => setDialog(null)}
          availableReports={unemailedReports}
          initialSelectedIds={dialog.preselect}
          term={selectedTerm}
          onEmailsSent={() => {
            setSelectedIds([])
            fetchGeneratedReports()
          }}
        />
      )}
    </>
  )
}

const ProgressReportsPage = () => (
  <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
    <ProgressReportsContent />
  </Suspense>
)

export default ProgressReportsPage
