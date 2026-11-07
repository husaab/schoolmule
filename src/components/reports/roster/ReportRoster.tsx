'use client'

// One term's reports, progress reports or report cards (`doc`): every student
// once, with their report (or that there isn't one yet) and whether the family
// was emailed. The overview shows how far the term has got and doubles as the
// grade filter; the chips filter by status; a selection generates, emails,
// downloads or deletes in bulk. Report cards also show whose teacher comments
// are in, and can narrow to the students still missing some. Filters live in
// the URL (term, grades, status, comments, q); ?preview=<studentId> opens that
// student's report once the term loads. Generate queues the students on the
// server and answers at once (useReportGenerationRuns): a card follows the
// term's generation, waiting rows say so, and the results wait on the page
// until someone dismisses them. Nobody has to keep the page open.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
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
import type { TermPayload } from '@/services/types/term'
import type { StudentPayload } from '@/services/types/student'
import { useDebouncedParam, useFilterParams } from '@/hooks/useFilterParams'
import { saveBlob } from '@/lib/pdfDownload'
import { canOpenPath } from '@/lib/permissions'
import {
  STATUS_FILTERS,
  buildRoster,
  commentsMissing,
  filterRoster,
  gradeBreakdown,
  inGrades,
  isStatusFilter,
  localDateISO,
  matchesStatus,
  missingSubjects,
  normalizeReport,
  generateErrorText,
  parseGradeList,
  rosterCounts,
  selectionTargets,
  shortDate,
  type CommentsStatus,
  type RawReport,
  type StatusFilter,
} from '@/lib/reportRoster'
import { withUnlistedReports } from '@/lib/reportGeneration'
import { useReportGenerationRuns } from '@/hooks/useReportGenerationRuns'
import TermOverview from './TermOverview'
import GenerationCard from './GenerationCard'
import RosterTable, { type Row, type RowActions } from './RosterTable'
import GenerateMissingModal from './GenerateMissingModal'
import GenerateResultModal from './GenerateResultModal'
import PdfViewerModal from '../PdfViewerModal'
import DeleteReportModal from '../DeleteReportModal'
import BulkDeleteReportModal from '../BulkDeleteReportModal'
import BulkDownloadReportModal from '../BulkDownloadReportModal'
import SentEmailReportModal from '../email/SentEmailReportModal'
import SingleEmailReportModal from '../email/SingleEmailReportModal'
import BulkEmailReportModal from '../email/BulkEmailReportModal'
import type { ReportDoc } from '../reportDocs'

type Dialog =
  | { kind: 'view'; row: Row; url: string }
  | { kind: 'email'; row: Row }
  | { kind: 'sent'; row: Row }
  | { kind: 'delete'; row: Row }
  | { kind: 'bulkDelete'; paths: string[] }
  | { kind: 'bulkDownload'; paths: string[] }
  | { kind: 'bulkEmail'; preselect: string[] }
  | { kind: 'generateMissing' }

// While a run goes, the report list is read again at most this often (and once at the end).
const REPORTS_REFRESH_MS = 10 * 1000

const REPORT_TEMPLATES_PATH = '/admin-panel/report-templates'

const secondaryButton =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50'
const primaryButton =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const bulkButtonBase =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium shadow-sm ring-1 ring-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50'
const bulkButton = `${bulkButtonBase} text-slate-700 hover:bg-slate-50`
const dangerBulkButton = `${bulkButtonBase} text-rose-700 hover:bg-rose-50`
const linkButton = 'cursor-pointer rounded font-medium text-cyan-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'

const chipClass = (active: boolean, attention: boolean) =>
  `cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
    active
      ? 'border-cyan-200 bg-cyan-50 font-medium text-cyan-800'
      : attention
        ? 'border-amber-200 bg-amber-50 font-medium text-amber-800 hover:bg-amber-100'
        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
  }`

export default function ReportRoster({ doc }: { doc: ReportDoc }) {
  const user = useUserStore((state) => state.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const showNotification = useNotificationStore((state) => state.showNotification)
  const filters = useFilterParams()
  const { get, setParams } = filters

  const [terms, setTerms] = useState<TermPayload[]>([])
  const [students, setStudents] = useState<StudentPayload[]>([])
  // The report rows, tagged with the term they were read for, so a term switch never shows the old term's.
  const [reportsFor, setReportsFor] = useState<{ term: string; rows: RawReport[] } | null>(null)
  // Whose teacher comments are in (report cards), tagged the same way; `failed` hides the column.
  const [commentsFor, setCommentsFor] = useState<{ term: string; rows: CommentsStatus[]; failed: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const latestReportsRequest = useRef(0)
  const latestCommentsRequest = useRef(0)

  // Filters live in the URL so Back/refresh/share restore them.
  const selectedTerm = get('term')
  const selectedGrades = parseGradeList(get('grades'))
  const rawStatus = get('status')
  const status: StatusFilter = isStatusFilter(rawStatus) ? rawStatus : ''
  const missingCommentsOnly = !!doc.commentsStatus && get('comments') === 'missing'
  const previewId = get('preview')
  const [search, setSearch] = useDebouncedParam(filters, 'q')

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  // The date JK/SK progress reports print (other grades and documents don't print one).
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

  const generation = useReportGenerationRuns(
    selectedTerm ? { reportType: doc.type, term: selectedTerm, yearId: selectedYearId ?? null } : null,
    user?.id ?? null,
  )

  const fetchGeneratedReports = useCallback(async () => {
    if (!user?.school || !selectedTerm) return
    // Only the newest request lands: switching Term 1 → 2 → 1 quickly never shows Term 2's rows under Term 1.
    const request = ++latestReportsRequest.current
    try {
      const rows = await doc.list(selectedTerm, user.school)
      if (request !== latestReportsRequest.current) return
      setReportsFor({ term: selectedTerm, rows })
    } catch (err) {
      if (request !== latestReportsRequest.current) return
      console.error('Error fetching generated reports:', err)
      showNotification(`Couldn't load this term's ${doc.nouns}`, 'error')
    }
  }, [doc, user?.school, selectedTerm, selectedYearId, showNotification]) // refetch when the selected school year changes

  const fetchComments = useCallback(async () => {
    if (!doc.commentsStatus || !selectedTerm) return
    const request = ++latestCommentsRequest.current
    try {
      const rows = await doc.commentsStatus(selectedTerm)
      if (request !== latestCommentsRequest.current) return
      setCommentsFor({ term: selectedTerm, rows, failed: false })
    } catch (err) {
      if (request !== latestCommentsRequest.current) return
      console.error('Error fetching comments status:', err)
      setCommentsFor({ term: selectedTerm, rows: [], failed: true })
      showNotification("Couldn't check whose teacher comments are in", 'error')
    }
  }, [doc, selectedTerm, selectedYearId, showNotification]) // refetch when the selected school year changes

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchGeneratedReports()
  }, [fetchGeneratedReports])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // A new term or school year starts with nothing selected.
  useEffect(() => {
    setSelectedIds([])
  }, [selectedTerm, selectedYearId])

  // Until this term's rows (and, for report cards, its comments) arrive the list shows a skeleton and the header actions wait.
  const commentsReady = !doc.commentsStatus || commentsFor?.term === selectedTerm
  const reportsReady = !!selectedTerm && reportsFor?.term === selectedTerm && commentsReady
  const listLoading = loading || (!!selectedTerm && !reportsReady)
  const rawReports = useMemo(() => (reportsReady ? reportsFor!.rows : []), [reportsReady, reportsFor])
  const reports = useMemo(() => rawReports.map(normalizeReport), [rawReports])
  const roster = useMemo(() => buildRoster(students, reports), [students, reports])
  const rosterById = useMemo(() => new Map(roster.map((r) => [r.studentId, r])), [roster])
  const comments = useMemo(
    () => (doc.commentsStatus && reportsReady && commentsFor && !commentsFor.failed ? new Map(commentsFor.rows.map((c) => [c.studentId, c])) : undefined),
    [doc.commentsStatus, reportsReady, commentsFor],
  )
  // Students waiting to be generated, and anyone just made whose new report the list hasn't read yet.
  const waiting = useMemo(
    () => withUnlistedReports(generation.summary.waiting, generation.runs, (id) => !!rosterById.get(id)?.report),
    [generation.summary.waiting, generation.runs, rosterById],
  )
  const counts = useMemo(() => rosterCounts(roster), [roster])
  const grades = useMemo(() => gradeBreakdown(roster), [roster])
  const gradeRows = roster.filter((r) => inGrades(r, selectedGrades))
  const missingCommentsIn = (rows: Row[]) => (comments ? rows.filter((r) => commentsMissing(comments.get(r.studentId))) : [])
  // The comments filter steps aside when the counts couldn't be read (the chip is hidden then too).
  const visible = filterRoster(roster, { grades: selectedGrades, status, q: search }).filter(
    (r) => !missingCommentsOnly || !comments || commentsMissing(comments.get(r.studentId)),
  )
  // Only rows on screen count as selected, so a bulk action never reaches a student a filter
  // (or a row's own change, e.g. it was just emailed) has hidden.
  const visibleIdSet = new Set(visible.map((r) => r.studentId))
  const shownSelectedIds = selectedIds.filter((id) => visibleIdSet.has(id))
  const targets = selectionTargets(visible, shownSelectedIds, waiting)
  // Everyone this term without a report and not waiting for one; "Generate missing" lists them all and
  // ticks the grades on screen (all of them when no grade is picked).
  const missingRows = roster.filter((r) => r.status === 'none' && r.student && !waiting.has(r.studentId))
  const missingPreselect = (selectedGrades.length > 0 ? missingRows.filter((r) => inGrades(r, selectedGrades)) : missingRows).map((r) => r.studentId)
  // A report being made again isn't offered for email: it would attach the old PDF.
  const unemailedReports = rawReports.filter((r) => !(r.email_sent ?? r.emailSent) && !waiting.has(r.student_id || r.studentId || ''))
  const hasFilters = selectedGrades.length > 0 || status !== '' || missingCommentsOnly || search.trim() !== ''

  // Report cards: who'd print with blank comments, for the Generate missing list.
  const gaps = comments ? new Map<string, string>() : undefined
  for (const r of comments ? missingRows : []) {
    const c = comments!.get(r.studentId)
    if (commentsMissing(c)) gaps!.set(r.studentId, c!.complete === 0 ? 'No teacher comments in yet' : `Comments missing in ${missingSubjects(c)}`)
  }

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
    setParams({ grades: null, status: null, comments: null, q: null })
  }

  // Queues the students on the server; the card and the rows follow from here.
  const runGenerate = async (studentIds: string[]) => {
    if (!selectedTerm || studentIds.length === 0) return
    setSelectedIds([])
    try {
      const { run, alreadyQueued } = await generation.start(studentIds, doc.reportDate ? reportDate || undefined : undefined)
      if (!run) {
        showNotification(studentIds.length === 1 ? `That ${doc.noun} is already being generated` : `Those ${doc.nouns} are already being generated`, 'info')
      } else if (alreadyQueued > 0) {
        showNotification(`${alreadyQueued} ${alreadyQueued === 1 ? 'was' : 'were'} already being generated; the rest are queued`, 'info')
      }
    } catch (err) {
      console.error('Error starting report generation:', err)
      showNotification(`Couldn't start generating the ${doc.nouns}. Try again.`, 'error')
    }
  }

  // One student pressed here: a toast when it's done, instead of a card.
  const toasted = useRef(new Set<string>())
  useEffect(() => {
    for (const run of generation.finishedHere) {
      if (toasted.current.has(run.runId)) continue
      toasted.current.add(run.runId)
      const item = run.items[0]
      if (!item || item.status === 'cancelled') continue
      const name = rosterById.get(item.studentId)?.name ?? 'This student'
      if (item.status === 'generated') showNotification(`${name}'s ${doc.noun} is ready`, 'success')
      else showNotification(`${name}'s ${doc.noun} couldn't be made. ${generateErrorText(item.error || 'Unknown error', run.term)}`, 'error')
    }
  }, [generation.finishedHere, rosterById, doc.noun, showNotification])

  // New reports show up as they're made: the list is read again at most every
  // 10 seconds while a run goes, and once more when it ends.
  const generatedSoFar = generation.runs.reduce((n, r) => n + r.counts.generated, 0)
  const anyRunning = generation.runs.some((r) => !r.finishedAt)
  const reportsRead = useRef({ at: 0, generated: 0, running: false })
  useEffect(() => {
    const last = reportsRead.current
    const newReports = generatedSoFar !== last.generated
    const due = anyRunning ? newReports && Date.now() - last.at >= REPORTS_REFRESH_MS : last.running
    reportsRead.current = { ...last, running: anyRunning }
    if (!due) return
    reportsRead.current = { at: Date.now(), generated: generatedSoFar, running: anyRunning }
    void fetchGeneratedReports()
  }, [generatedSoFar, anyRunning, fetchGeneratedReports])

  const guarded = (what: string, fn: () => Promise<void>) => async () => {
    try {
      await fn()
    } catch (err) {
      console.error(`Error: ${what}`, err)
      showNotification(`Couldn't ${what}. Try again.`, 'error')
    }
  }

  const handleDownloadReport = async (row: Row) => {
    const filePath = row.report?.filePath || ''
    try {
      const signedUrl = await doc.signedUrl(filePath)
      if (!signedUrl) {
        showNotification('Failed to get download link', 'error')
        return
      }
      const response = await fetch(signedUrl)
      saveBlob(await response.blob(), filePath.split('/').pop() || `${doc.fileStem}.pdf`)
    } catch (err) {
      console.error('Error downloading report:', err)
      showNotification(`Failed to download the ${doc.noun}`, 'error')
    }
  }

  const handlePreviewReport = async (row: Row) => {
    setOpeningId(row.studentId)
    try {
      const signedUrl = await doc.signedUrl(row.report?.filePath || '')
      if (signedUrl) setDialog({ kind: 'view', row, url: signedUrl })
      else showNotification('Failed to get preview link', 'error')
    } catch (err) {
      console.error('Error previewing report:', err)
      showNotification(`Failed to open the ${doc.noun}`, 'error')
    } finally {
      setOpeningId(null)
    }
  }

  // ?preview=<studentId> (an older link to the View page): open it once, then drop it from the URL.
  useEffect(() => {
    if (!previewId || !reportsReady) return
    const row = rosterById.get(previewId)
    setParams({ preview: null })
    if (row?.report) void handlePreviewReport(row)
    // handlePreviewReport only reads the row it's given.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewId, reportsReady, rosterById, setParams])

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
  const summary = selectedTerm ? `${selectedTerm} · ${counts.total} student${counts.total !== 1 ? 's' : ''}` : doc.blurb

  const sentRow = dialog?.kind === 'sent' ? dialog.row : null
  const finished = generation.summary.finished
  const generatedEmailable = (finished?.generatedIds ?? []).filter((id) => rosterById.get(id)?.status === 'ready' && !waiting.has(id))
  const names = useMemo(() => new Map(roster.map((r) => [r.studentId, r.name])), [roster])

  // Report cards: how many grade 1-8 students have every class's comments in.
  const commentsCounted = comments ? roster.filter((r) => (comments.get(r.studentId)?.total ?? 0) > 0) : []
  const commentsMissingCount = missingCommentsIn(commentsCounted).length
  const missingCommentsChipCount = missingCommentsIn(gradeRows).length

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 min-[1400px]:flex-row min-[1400px]:items-end min-[1400px]:justify-between">
            <div className="min-w-0">
              {doc.back && (
                <BackLink to={doc.back.href} className="mb-2 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                  <ArrowLeftIcon className="h-4 w-4" />
                  {doc.back.label}
                </BackLink>
              )}
              <h1 className="font-display text-[26px] font-semibold leading-tight text-slate-900 sm:text-[30px]">{doc.title}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[15px] text-slate-600">
                <span>{summary}</span>
                {canOpenPath(REPORT_TEMPLATES_PATH, user) && (
                  <>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <Link
                      href={REPORT_TEMPLATES_PATH}
                      className="inline-flex items-center gap-1 rounded font-medium text-cyan-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                      <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
                      Report templates
                    </Link>
                  </>
                )}
              </p>
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
              {doc.reportDate && (
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
              )}
              <button
                type="button"
                onClick={() => setDialog({ kind: 'bulkEmail', preselect: unemailedReports.map((r) => r.student_id || r.studentId || '') })}
                disabled={!reportsReady || unemailedReports.length === 0}
                title={unemailedReports.length === 0 ? `Every ${doc.noun} this term has been emailed` : undefined}
                className={secondaryButton}
              >
                <EnvelopeIcon className="h-4 w-4 text-slate-500" />
                Email families ({unemailedReports.length})
              </button>
              <button
                type="button"
                onClick={() => setDialog({ kind: 'generateMissing' })}
                disabled={!reportsReady || missingRows.length === 0}
                title={missingRows.length === 0 ? `Everyone has a ${selectedTerm} ${doc.noun}` : undefined}
                className={primaryButton}
              >
                <DocumentPlusIcon className="h-4 w-4" />
                Generate missing ({missingRows.length})
              </button>
            </div>
          </div>

          {!selectedTerm && !loading && (
            <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Pick a term to see its {doc.nouns}.
            </div>
          )}

          {selectedTerm && (
            <GenerationCard
              doc={doc}
              summary={generation.summary}
              emailableCount={generatedEmailable.length}
              onStop={guarded('stop generating', () => generation.stop(generation.summary.active?.runIds ?? []))}
              onRetry={guarded('try those again', () => generation.retry(finished?.runIds ?? []))}
              onDismiss={guarded('dismiss this', () => generation.dismiss(finished?.runIds ?? []))}
              onSeeDetails={() => setDetailsOpen(true)}
              onEmailFamilies={() => setDialog({ kind: 'bulkEmail', preselect: generatedEmailable })}
            />
          )}

          <TermOverview
            term={selectedTerm || 'this term'}
            noun={doc.noun}
            counts={counts}
            grades={grades}
            selectedGrades={selectedGrades}
            onToggleGrade={toggleGrade}
            onClearGrades={() => changeFilters({ grades: null })}
            loading={listLoading}
          >
            {comments && commentsCounted.length > 0 && (
              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <span>
                  Teacher comments:{' '}
                  <span className="font-medium tabular-nums text-slate-900">{commentsCounted.length - commentsMissingCount}</span> of{' '}
                  {commentsCounted.length} students have every class&apos;s comments in.
                </span>
                {commentsMissingCount > 0 && !missingCommentsOnly && (
                  <button type="button" onClick={() => changeFilters({ comments: 'missing' })} className={linkButton}>
                    Show the {commentsMissingCount} still missing some
                  </button>
                )}
              </p>
            )}
          </TermOverview>

          <section aria-label="Students" className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Filter by ${doc.noun} status`}>
                {STATUS_FILTERS.map((chip) => {
                  const count = gradeRows.filter((r) => matchesStatus(r, chip.value)).length
                  // "Updated since emailed" only earns a chip when something needs it.
                  if (chip.value === 'updated' && count === 0 && status !== 'updated') return null
                  const active = status === chip.value
                  return (
                    <button
                      key={chip.value || 'all'}
                      type="button"
                      aria-pressed={active}
                      onClick={() => changeFilters({ status: chip.value || null })}
                      className={chipClass(active, chip.value === 'updated' && count > 0)}
                    >
                      {chip.label}
                      <span className="ml-1.5 text-xs tabular-nums text-slate-400">{count}</span>
                    </button>
                  )
                })}
                {comments && (missingCommentsChipCount > 0 || missingCommentsOnly) && (
                  <>
                    <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />
                    <button
                      type="button"
                      aria-pressed={missingCommentsOnly}
                      onClick={() => changeFilters({ comments: missingCommentsOnly ? null : 'missing' })}
                      className={chipClass(missingCommentsOnly, missingCommentsChipCount > 0)}
                    >
                      Comments missing
                      <span className="ml-1.5 text-xs tabular-nums text-slate-400">{missingCommentsChipCount}</span>
                    </button>
                  </>
                )}
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
                <button type="button" onClick={() => setDialog({ kind: 'bulkDownload', paths: targets.downloadPaths })} disabled={targets.downloadPaths.length === 0} className={bulkButton}>
                  <ArrowDownTrayIcon className="h-4 w-4 text-slate-500" />
                  Download ZIP ({targets.downloadPaths.length})
                </button>
                <button type="button" onClick={() => setDialog({ kind: 'bulkDelete', paths: targets.filePaths })} disabled={targets.filePaths.length === 0} className={dangerBulkButton}>
                  <TrashIcon className="h-4 w-4" />
                  Delete ({targets.filePaths.length})
                </button>
                {targets.replacing > 0 && (
                  <span className="text-xs text-cyan-800">
                    {targets.replacing} already {targets.replacing === 1 ? `has a ${doc.noun} that` : `have ${doc.nouns} that`} Generate will replace
                  </span>
                )}
                <button type="button" onClick={() => setSelectedIds([])} className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-slate-600 hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                  <XMarkIcon className="h-4 w-4" />
                  Clear
                </button>
              </div>
            )}

            {/* Rows */}
            {listLoading ? (
              <div className="space-y-2 p-4" aria-label="Loading students">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : roster.length === 0 ? (
              <EmptyState icon={UserGroupIcon} title="No students yet" description={`Students added to this school year show up here, ready for their ${doc.nouns}.`} />
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
              <RosterTable
                doc={doc}
                rows={visible}
                selectedIds={selectedIds}
                onToggle={toggleRow}
                onToggleAll={toggleAllShown}
                actions={actions}
                openingId={openingId}
                comments={comments}
                waiting={waiting}
              />
            )}

            {!loading && roster.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                <span>
                  Showing {visible.length} of {roster.length} students, by grade then name
                </span>
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className={linkButton}>
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {dialog?.kind === 'generateMissing' && (
        <GenerateMissingModal
          doc={doc}
          onClose={() => setDialog(null)}
          term={selectedTerm}
          students={missingRows.map((r) => ({ studentId: r.studentId, name: r.name, grade: r.grade, photoUrl: r.student?.photoUrl, avatar: r.student?.avatar }))}
          initialSelectedIds={missingPreselect}
          gaps={gaps}
          gapsNote={(n) =>
            `${n} ticked student${n === 1 ? ' is' : 's are'} missing teacher comments in a class. Those comments print blank on ${n === 1 ? 'their report card' : 'their report cards'}.`
          }
          reportDate={doc.reportDate ? reportDate : undefined}
          onReportDateChange={doc.reportDate ? setReportDate : undefined}
          onGenerate={(ids) => {
            setDialog(null)
            void runGenerate(ids)
          }}
        />
      )}

      {finished && (
        <GenerateResultModal
          doc={doc}
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          term={selectedTerm}
          names={names}
          outcome={{ generated: finished.generatedIds, failed: finished.failed }}
          emailableIds={generatedEmailable}
          onEmailFamilies={(ids) => {
            setDetailsOpen(false)
            setDialog({ kind: 'bulkEmail', preselect: ids })
          }}
        />
      )}

      <PdfViewerModal
        isOpen={dialog?.kind === 'view'}
        onClose={() => setDialog(null)}
        src={dialog?.kind === 'view' ? dialog.url : null}
        title={dialog?.kind === 'view' ? dialog.row.name : ''}
        subtitle={
          dialog?.kind === 'view'
            ? `${selectedTerm} ${doc.noun}${dialog.row.report?.generatedAt ? `, generated ${shortDate(dialog.row.report.generatedAt)}` : ''}`
            : undefined
        }
        actions={
          dialog?.kind === 'view' ? (
            <>
              <button type="button" onClick={() => void handleDownloadReport(dialog.row)} aria-label="Download PDF" className={secondaryButton}>
                <ArrowDownTrayIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span className="hidden sm:inline">Download</span>
              </button>
              {/* Not while a new version is being made: the email would attach this one. */}
              {!waiting.has(dialog.row.studentId) && (
                <button
                  type="button"
                  onClick={() => setDialog({ kind: 'email', row: dialog.row })}
                  aria-label={dialog.row.status === 'ready' ? 'Email family' : 'Email family again'}
                  className={primaryButton}
                >
                  <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{dialog.row.status === 'ready' ? 'Email family' : 'Email again'}</span>
                </button>
              )}
            </>
          ) : null
        }
      />

      {dialog?.kind === 'delete' && (
        <DeleteReportModal
          doc={doc}
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
        <BulkDeleteReportModal doc={doc} isOpen onClose={() => setDialog(null)} filePaths={dialog.paths} onDeleted={(filePaths: string[]) => removePaths(filePaths)} />
      )}

      {dialog?.kind === 'bulkDownload' && (
        <BulkDownloadReportModal doc={doc} isOpen onClose={() => setDialog(null)} filePaths={dialog.paths} term={selectedTerm} onDownloaded={() => setSelectedIds([])} />
      )}

      {sentRow && (
        <SentEmailReportModal
          doc={doc}
          isOpen
          onClose={() => setDialog(null)}
          studentId={sentRow.studentId}
          studentName={sentRow.name}
          term={selectedTerm}
          onEmailAgain={() => setDialog({ kind: 'email', row: sentRow })}
        />
      )}

      {dialog?.kind === 'email' && (
        <SingleEmailReportModal
          doc={doc}
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
        <BulkEmailReportModal
          doc={doc}
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

