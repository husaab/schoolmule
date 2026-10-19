'use client'

// Admin Panel → People → Student accounts. Every student of the selected
// school year with their own address and SchoolMule login: invite (after the
// admin confirms parental consent), fix addresses, resend or reset, print and
// void QR cards, preview as the student, relink a returning student's login,
// archive and delete. Classroom settings live behind the header button.

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import SearchableSelect from '@/components/ui/SearchableSelect'
import StudentAccountsTable from '@/components/studentAccounts/StudentAccountsTable'
import InviteStudentsModal from '@/components/studentAccounts/InviteStudentsModal'
import EditStudentEmailModal from '@/components/studentAccounts/EditStudentEmailModal'
import ClassroomSettingsModal from '@/components/studentAccounts/ClassroomSettingsModal'
import ArchiveStudentAccountModal from '@/components/studentAccounts/ArchiveStudentAccountModal'
import DeleteStudentAccountModal from '@/components/studentAccounts/DeleteStudentAccountModal'
import LinkStudentAccountModal from '@/components/studentAccounts/LinkStudentAccountModal'
import PrintQrCardsModal from '@/components/studentAccounts/PrintQrCardsModal'
import VoidQrCardsModal from '@/components/studentAccounts/VoidQrCardsModal'
import ViewAsStudentModal from '@/components/studentAccounts/ViewAsStudentModal'
import CancelInviteModal from '@/components/studentAccounts/CancelInviteModal'
import {
  getStudentAccounts,
  printQrCards,
  resendStudentInvite,
  resendStudentInvites,
  resetStudentPassword,
} from '@/services/studentAccountService'
import { getAllClasses } from '@/services/classService'
import type { ClassPayload } from '@/services/types/class'
import type { ClassroomSettings, StudentAccountRow } from '@/services/types/studentAccount'
import { useFilterParams, useDebouncedParam } from '@/hooks/useFilterParams'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import {
  GRADE_CODES,
  GRADE_OPTIONS,
  NEEDS_ATTENTION_LABEL,
  STATUS_LABELS,
  STATUS_ORDER,
  STUDENT_BATCH_LIMIT,
  canResendInvite,
  chunk,
  countByStatus,
  filterRows,
  gradeLabel,
  isStatusFilter,
  printNeedsConfirm,
  settingsSummary,
  type RowAction,
  type StatusFilter,
} from '@/lib/studentAccounts'
import {
  ArrowPathIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  PaperAirplaneIcon,
  PrinterIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

type ModalState =
  | { kind: 'settings' }
  | { kind: 'email'; row: StudentAccountRow }
  | { kind: 'invite'; rows: StudentAccountRow[] }
  | { kind: 'void'; rows: StudentAccountRow[] }
  | { kind: 'print'; targets: StudentAccountRow[]; bulk: boolean }
  | { kind: 'view_as'; row: StudentAccountRow }
  | { kind: 'link'; row: StudentAccountRow; mode: 'link' | 'unlink' }
  | { kind: 'archive'; row: StudentAccountRow; mode: 'archive' | 'unarchive' }
  | { kind: 'delete'; row: StudentAccountRow }
  | { kind: 'cancel_invite'; row: StudentAccountRow }

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const StudentAccountsContent = () => {
  const notify = useNotificationStore((s) => s.showNotification)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const school = useUserStore((s) => s.user.school)

  const filters = useFilterParams()
  const { get, setParams } = filters
  const [search, setSearch] = useDebouncedParam(filters, 'q')
  const rawGrade = get('grade')
  const rawStatus = get('status')
  const grade = (GRADE_CODES as readonly string[]).includes(rawGrade) ? rawGrade : ''
  const status: StatusFilter | '' = isStatusFilter(rawStatus) ? rawStatus : ''
  const q = get('q')
  // One class's roster (the server filters it).
  const classId = get('classId')
  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [resending, setResending] = useState(false)

  const [rows, setRows] = useState<StudentAccountRow[]>([])
  const [settings, setSettings] = useState<ClassroomSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [printing, setPrinting] = useState(false)
  const [modal, setModal] = useState<ModalState | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await getStudentAccounts(classId || undefined)
      setRows(res.data.students)
      setSettings(res.data.settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load student accounts")
    } finally {
      setLoading(false)
    }
  }, [classId])

  // The list is per school year (and class): reload (and drop the selection) on a switch.
  useEffect(() => {
    setLoading(true)
    setSelected(new Set())
    void load()
  }, [load, selectedYearId])

  // The class filter's choices: this year's classes, by grade then subject.
  useEffect(() => {
    if (!school) return
    let cancelled = false
    getAllClasses(school)
      .then((res) => { if (!cancelled) setClasses(res.data ?? []) })
      .catch(() => { if (!cancelled) setClasses([]) })
    return () => { cancelled = true }
  }, [school, selectedYearId])
  const classOptions = useMemo(
    () =>
      [...classes]
        .sort((a, b) => GRADE_CODES.indexOf(a.grade as never) - GRADE_CODES.indexOf(b.grade as never) || a.subject.localeCompare(b.subject))
        .map((c) => ({ value: c.classId, label: `${gradeLabel(String(c.grade))} · ${c.subject}` })),
    [classes],
  )

  // Chip counts follow the grade and search filters, not the status filter.
  const scoped = useMemo(() => filterRows(rows, { grade, status: '', q }), [rows, grade, q])
  const counts = useMemo(() => countByStatus(scoped), [scoped])
  const shown = useMemo(() => filterRows(rows, { grade, status, q }), [rows, grade, status, q])

  // Bulk actions only ever act on students the admin can see.
  useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(shown.map((r) => r.studentId))
      const next = new Set([...prev].filter((id) => visible.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [shown])

  const selectedRows = useMemo(() => shown.filter((r) => selected.has(r.studentId)), [shown, selected])

  const replaceRow = (next: StudentAccountRow) =>
    setRows((prev) => prev.map((r) => (r.studentId === next.studentId ? next : r)))

  const withBusy = async (studentId: string, fn: () => Promise<void>) => {
    setBusyIds((prev) => new Set(prev).add(studentId))
    try {
      await fn()
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(studentId)
        return next
      })
    }
  }

  const print = async (targets: StudentAccountRow[]) => {
    const eligible = targets.filter((r) => r.qrEligible)
    if (eligible.length === 0) {
      notify(
        targets.length === 1
          ? `${targets[0].name} can't get a QR card. Cards are for invited or active accounts in the QR grades.`
          : "None of these students can get a QR card. Cards are for invited or active accounts in the QR grades.",
        'error',
      )
      return
    }
    const batches = chunk(eligible.map((r) => r.studentId), STUDENT_BATCH_LIMIT)
    let skipped = 0
    try {
      for (let i = 0; i < batches.length; i += 1) {
        const filename = batches.length > 1 ? `student-cards-${i + 1}.pdf` : 'student-cards.pdf'
        const result = await printQrCards(batches[i], filename)
        skipped += result.count
      }
      const printed = eligible.length - skipped
      const notPrinted = targets.length - printed
      notify(
        `${plural(printed, 'QR card', 'QR cards')} printed. Older cards for ${printed === 1 ? 'this student' : 'these students'} no longer work.` +
          (notPrinted > 0 ? ` ${notPrinted} skipped (no invited or active account in a QR grade).` : ''),
        'success',
      )
    } catch (err) {
      notify(err instanceof Error ? err.message : "The QR cards couldn't be printed", 'error')
    } finally {
      void load()
    }
  }

  // Printing issues new cards and voids the old ones, so it asks first whenever any of these students
  // holds a card now. A first card, or nobody who can get one (print() says why), needs no question.
  const askToPrint = (targets: StudentAccountRow[], bulk: boolean) => {
    const eligible = targets.filter((r) => r.qrEligible)
    const withCards = eligible.filter((r) => r.account?.qr.active).length
    if (eligible.length === 0 || !printNeedsConfirm(withCards)) return void runPrint(targets, bulk)
    setModal({ kind: 'print', targets, bulk })
  }

  const runPrint = async (targets: StudentAccountRow[], bulk: boolean) => {
    if (!bulk && targets.length === 1) return withBusy(targets[0].studentId, () => print(targets))
    setPrinting(true)
    try {
      await print(targets)
    } finally {
      setPrinting(false)
    }
  }

  const onAction = (row: StudentAccountRow, action: RowAction) => {
    const email = row.account?.email ?? row.studentEmail ?? ''
    switch (action) {
      case 'edit_email':
        return setModal({ kind: 'email', row })
      case 'invite':
        return setModal({ kind: 'invite', rows: [row] })
      case 'resend_invite':
        return void withBusy(row.studentId, async () => {
          try {
            await resendStudentInvite(row.studentId)
            notify(`Invite sent again to ${email}`, 'success')
            void load()
          } catch (err) {
            notify(err instanceof Error ? err.message : "The invite couldn't be sent", 'error')
          }
        })
      case 'cancel_invite':
        return setModal({ kind: 'cancel_invite', row })
      case 'reset_password':
        return void withBusy(row.studentId, async () => {
          try {
            await resetStudentPassword(row.studentId)
            notify(`Password link sent to ${email}`, 'success')
          } catch (err) {
            notify(err instanceof Error ? err.message : "The password link couldn't be sent", 'error')
          }
        })
      case 'print_qr':
        return askToPrint([row], false)
      case 'void_qr':
        return setModal({ kind: 'void', rows: [row] })
      case 'view_as':
        return setModal({ kind: 'view_as', row })
      case 'link':
      case 'unlink':
        return setModal({ kind: 'link', row, mode: action })
      case 'archive':
      case 'unarchive':
        return setModal({ kind: 'archive', row, mode: action })
      case 'delete':
        return setModal({ kind: 'delete', row })
    }
  }

  const toggle = (studentId: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })

  const toggleAll = (checked: boolean) => setSelected(checked ? new Set(shown.map((r) => r.studentId)) : new Set())

  const bulkPrint = () => askToPrint(selectedRows, true)

  // Resend to every selected student whose login is waiting to be set up.
  const bulkResend = async () => {
    const targets = selectedRows.filter(canResendInvite)
    if (targets.length === 0) {
      notify('None of the selected students is waiting for an invite.', 'error')
      return
    }
    setResending(true)
    try {
      let sent = 0
      let notSent = 0
      for (const batch of chunk(targets.map((r) => r.studentId), 10)) {
        const res = await resendStudentInvites(batch)
        for (const r of res.data.results) {
          if (r.outcome === 'sent') sent += 1
          else notSent += 1
        }
      }
      notify(
        `${plural(sent, 'invite', 'invites')} sent again.` + (notSent > 0 ? ` ${notSent} not sent; see each student's row.` : ''),
        notSent > 0 && sent === 0 ? 'error' : 'success',
      )
    } catch (err) {
      notify(err instanceof Error ? err.message : "The invites couldn't be sent", 'error')
    } finally {
      setResending(false)
      void load()
    }
  }

  const bulkVoid = () => {
    const withCards = selectedRows.filter((r) => r.account?.qr.active)
    if (withCards.length === 0) {
      notify('None of the selected students has an active QR card.', 'error')
      return
    }
    setModal({ kind: 'void', rows: withCards })
  }

  const hasFilters = Boolean(grade || status || q || classId)
  const closeModal = () => setModal(null)

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Student accounts</h1>
              <p className="text-slate-500 mt-1 max-w-3xl">
                {settings ? settingsSummary(settings) : 'Invite students with the email they already have.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => settings && setModal({ kind: 'settings' })}
              disabled={!settings}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <Cog6ToothIcon className="h-5 w-5 text-slate-500" />
              Classroom settings
            </button>
          </div>

          {settings && !settings.enabled && (
            <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
              <p>
                Student sign-in is off. Turn it on in{' '}
                <button
                  type="button"
                  onClick={() => setModal({ kind: 'settings' })}
                  className="cursor-pointer font-semibold underline underline-offset-2 hover:text-amber-950"
                >
                  Classroom settings
                </button>{' '}
                when you&apos;re ready. You can invite students now; they can sign in once it&apos;s on.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by account status">
                {[
                  { value: '', label: 'All', count: scoped.length },
                  ...STATUS_ORDER.flatMap((s) => {
                    const chip = { value: s as string, label: STATUS_LABELS[s], count: counts[s] }
                    // Needs attention sits right after Invited.
                    return s === 'invited'
                      ? [chip, { value: 'needs_attention', label: NEEDS_ATTENTION_LABEL, count: counts.needs_attention }]
                      : [chip]
                  }),
                ].map(
                  (chip) => {
                    const active = status === chip.value
                    const attention = chip.value === 'needs_attention' && chip.count > 0
                    return (
                      <button
                        key={chip.value || 'all'}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setParams({ status: chip.value || null })}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                          active
                            ? 'border-cyan-200 bg-cyan-50 font-medium text-cyan-800'
                            : attention
                              ? 'border-amber-200 bg-amber-50 font-medium text-amber-800 hover:bg-amber-100'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {chip.label}
                        <span className="ml-1.5 font-mono text-xs tabular-nums text-slate-400">{chip.count}</span>
                      </button>
                    )
                  },
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <SearchableSelect
                  value={grade}
                  onChange={(v) => setParams({ grade: v || null })}
                  options={GRADE_OPTIONS}
                  allLabel="All grades"
                  ariaLabel="Filter by grade"
                  className="sm:w-40"
                  triggerClassName="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:ring-cyan-500"
                />
                <SearchableSelect
                  value={classId}
                  onChange={(v) => setParams({ classId: v || null })}
                  options={classOptions}
                  allLabel="All classes"
                  ariaLabel="Filter by class"
                  className="sm:w-52"
                  triggerClassName="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:ring-cyan-500"
                />
                <div className="relative sm:w-64">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search students or emails"
                    aria-label="Search students or emails"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Bulk bar */}
            {selectedRows.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-cyan-100 bg-cyan-50/60 px-4 py-2.5 text-sm">
                <span className="mr-1 font-medium text-cyan-900">{selectedRows.length} selected</span>
                <button
                  type="button"
                  onClick={() => setModal({ kind: 'invite', rows: selectedRows })}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <PaperAirplaneIcon className="h-4 w-4 text-slate-500" />
                  Invite
                </button>
                <button
                  type="button"
                  onClick={() => void bulkResend()}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
                >
                  <ArrowPathIcon className="h-4 w-4 text-slate-500" />
                  {resending ? 'Resending…' : 'Resend'}
                </button>
                <button
                  type="button"
                  onClick={bulkPrint}
                  disabled={printing}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
                >
                  <PrinterIcon className="h-4 w-4 text-slate-500" />
                  {printing ? 'Printing…' : 'Print QR cards'}
                </button>
                <button
                  type="button"
                  onClick={bulkVoid}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-amber-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-amber-50 cursor-pointer"
                >
                  <NoSymbolIcon className="h-4 w-4" />
                  Void QR cards
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium text-slate-500 transition-colors hover:text-slate-800 cursor-pointer"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Clear
                </button>
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : error || !settings ? (
              <EmptyState
                icon={KeyIcon}
                title="Couldn't load student accounts"
                description={error ?? undefined}
                iconClassName="text-rose-300"
                action={
                  <button onClick={() => void load()} className="text-sm font-medium text-cyan-600 hover:text-cyan-700 cursor-pointer">
                    Try again
                  </button>
                }
              />
            ) : shown.length === 0 ? (
              <EmptyState
                icon={KeyIcon}
                title={rows.length === 0 ? 'No students this school year' : 'No matching students'}
                description={
                  rows.length === 0
                    ? 'Add students on the Students page, or pick another school year.'
                    : grade
                      ? `No ${gradeLabel(grade)} students match. Try a different filter.`
                      : 'Try a different search or filter.'
                }
                action={
                  hasFilters ? (
                    <button
                      onClick={() => setParams({ q: null, grade: null, status: null, classId: null })}
                      className="text-sm font-medium text-cyan-600 hover:text-cyan-700 cursor-pointer"
                    >
                      Clear filters
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <StudentAccountsTable
                rows={shown}
                settings={settings}
                selected={selected}
                onToggle={toggle}
                onToggleAll={toggleAll}
                onAction={onAction}
                busyIds={busyIds}
              />
            )}
          </div>
        </div>
      </main>

      {modal?.kind === 'settings' && settings && (
        <ClassroomSettingsModal
          isOpen
          onClose={closeModal}
          settings={settings}
          onSaved={(saved) => {
            setSettings(saved)
            // Eligibility (not eligible / QR grades) follows the settings.
            void load()
          }}
        />
      )}
      {modal?.kind === 'email' && (
        <EditStudentEmailModal isOpen onClose={closeModal} row={modal.row} onSaved={replaceRow} />
      )}
      {modal?.kind === 'invite' && settings && (
        <InviteStudentsModal
          isOpen
          onClose={closeModal}
          rows={modal.rows}
          settings={settings}
          onDone={() => {
            setSelected(new Set())
            void load()
          }}
        />
      )}
      {modal?.kind === 'void' && (
        <VoidQrCardsModal isOpen onClose={closeModal} rows={modal.rows} onDone={() => void load()} />
      )}
      {modal?.kind === 'print' && (
        <PrintQrCardsModal
          isOpen
          onClose={closeModal}
          names={modal.targets.filter((r) => r.qrEligible).map((r) => r.name)}
          withCards={modal.targets.filter((r) => r.qrEligible && r.account?.qr.active).length}
          onConfirm={() => runPrint(modal.targets, modal.bulk)}
        />
      )}
      {modal?.kind === 'view_as' && <ViewAsStudentModal isOpen onClose={closeModal} row={modal.row} />}
      {modal?.kind === 'link' && (
        <LinkStudentAccountModal isOpen onClose={closeModal} row={modal.row} mode={modal.mode} onSaved={replaceRow} />
      )}
      {modal?.kind === 'archive' && (
        <ArchiveStudentAccountModal isOpen onClose={closeModal} row={modal.row} mode={modal.mode} onSaved={replaceRow} />
      )}
      {modal?.kind === 'delete' && (
        <DeleteStudentAccountModal isOpen onClose={closeModal} row={modal.row} onDeleted={() => void load()} />
      )}
      {modal?.kind === 'cancel_invite' && (
        <CancelInviteModal isOpen onClose={closeModal} row={modal.row} onSaved={replaceRow} />
      )}
    </>
  )
}

const StudentAccountsPage = () => (
  <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
    <StudentAccountsContent />
  </Suspense>
)

export default StudentAccountsPage
