'use client'

// Link families to QuickBooks customers — and tidy up the loose ends around
// them — in one place. Four tabs: families with no customer (ranked
// suggestions), customers with no family, students with no family, and a
// bulk import from the roster + customer-map files.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { ModalHeader } from '@/components/shared/modalKit'
import PersonCombobox, { type ComboOption } from '@/components/relation/PersonCombobox'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useNotificationStore } from '@/store/useNotificationStore'
import { addFamilyStudent, getFamilySuggestions, linkFamilyCustomer, listFamilies, type LinkCustomerOptions } from '@/services/financeService'
import type {
  FamilySuggestions,
  FamilySummary,
  PickedCustomer,
  StudentWithoutFamily,
  UnlinkedCustomerSuggestion,
  UnlinkedFamilySuggestion,
} from '@/services/types/finance'
import CustomerPicker from './CustomerPicker'
import ImportMappingTab from './ImportMappingTab'
import type { FamilyFormPrefill } from './FamilyFormModal'
import {
  DEFAULT_LINK_MODE,
  LinkModeFields,
  ReasonBadge,
  linkOptions,
  outlineButton,
  tinyButton,
  type LinkModeValue,
} from './familyUi'
import { errorMessage, financeErrorText, formatMoney, gradeShort } from './format'

export type WizardTab = 'families' | 'customers' | 'students' | 'import'

type LinkHandler = (
  familyId: string,
  familyName: string,
  customer: { qboId: string; displayName: string },
  opts?: LinkCustomerOptions
) => Promise<void>

interface LinkingWizardProps {
  isOpen: boolean
  tab: WizardTab
  onTabChange: (tab: WizardTab) => void
  /** Bumped by the page after any finance change; the wizard reloads. */
  version: number
  onClose: () => void
  /** A link, student or import changed data: refetch the grid. */
  onChanged: () => void
  /** Open the family form with these starting values. */
  onCreateFamily: (prefill: FamilyFormPrefill) => void
  /** Close the wizard and show this family's drawer. */
  onOpenFamily: (familyId: string) => void
}

const rowCard = 'rounded-xl border border-slate-100 bg-white p-4 shadow-sm'
const subTag = 'rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500'

/** "Aisha Rahman" → "Rahman family". */
const familyNameFor = (studentName: string) => {
  const parts = studentName.trim().split(/\s+/)
  return `${parts.length > 1 ? parts[parts.length - 1] : parts[0]} family`
}

// ── Rows ─────────────────────────────────────────────────────────────────

function UnlinkedFamilyRow({
  family,
  onLink,
  onOpen,
}: {
  family: UnlinkedFamilySuggestion
  onLink: LinkHandler
  onOpen: (familyId: string) => void
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const [picked, setPicked] = useState<PickedCustomer | null>(null)

  const link = async (c: { qboId: string; displayName: string }) => {
    setBusy(c.qboId)
    setError(null)
    try {
      await onLink(family.familyId, family.name, c)
    } catch (err) {
      setError(financeErrorText(err, 'Could not link'))
      setBusy(null)
    }
  }

  const candidates = [...family.candidates].sort((a, b) => b.score - a.score)

  return (
    <li className={rowCard}>
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onOpen(family.familyId)} className="text-left text-sm font-semibold text-slate-900 hover:text-cyan-700 cursor-pointer">
          {family.name}
        </button>
        {!manual && (
          <button type="button" onClick={() => setManual(true)} className={tinyButton}>
            <MagnifyingGlassIcon className="h-3.5 w-3.5" />
            Choose a customer
          </button>
        )}
      </div>

      {candidates.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {candidates.map((c) => (
            <li key={c.qboId} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                <ReasonBadge reason={c.reason} />
                <span className="truncate text-sm text-slate-800">{c.displayName}</span>
                {c.isSubCustomer && <span className={subTag}>sub-customer</span>}
                {!c.active && <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">inactive</span>}
              </span>
              <button type="button" onClick={() => link(c)} disabled={busy !== null} className={outlineButton}>
                {busy === c.qboId ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
                Link
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !manual && <p className="mt-1 text-xs text-slate-500">No likely customer found — choose one by hand.</p>
      )}

      {manual && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <CustomerPicker value={picked} onChange={setPicked} familyId={family.familyId} autoFocus />
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={!picked || busy !== null}
              onClick={() => picked && link(picked)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2 text-xs font-medium text-white shadow-sm hover:from-cyan-600 hover:to-teal-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Link
            </button>
            <button
              type="button"
              onClick={() => {
                setManual(false)
                setPicked(null)
              }}
              className={outlineButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </li>
  )
}

function UnlinkedCustomerRow({
  customer,
  onLink,
  onCreate,
  currentCustomerOf,
}: {
  customer: UnlinkedCustomerSuggestion
  onLink: LinkHandler
  onCreate: (customer: UnlinkedCustomerSuggestion) => void
  /** The display name of the family's current customer, if it has one. */
  currentCustomerOf: (familyId: string) => string | null
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // A family that already has a customer needs a switch-or-replace choice first.
  const [pending, setPending] = useState<{ familyId: string; name: string; current: string } | null>(null)
  const [linkMode, setLinkMode] = useState<LinkModeValue>(DEFAULT_LINK_MODE)

  const link = async (familyId: string, familyName: string, opts?: LinkCustomerOptions) => {
    setBusy(familyId)
    setError(null)
    try {
      await onLink(familyId, familyName, customer, opts)
    } catch (err) {
      setError(financeErrorText(err, 'Could not link'))
      setBusy(null)
    }
  }

  const choose = (familyId: string, familyName: string) => {
    const current = currentCustomerOf(familyId)
    if (current) {
      // Default to switching from the customer's first invoice, so none of
      // its invoices are left without a family.
      setLinkMode({ mode: 'switch', effectiveFrom: customer.earliestInvoiceDate ?? '' })
      setError(null)
      setPending({ familyId, name: familyName, current })
    } else {
      link(familyId, familyName)
    }
  }

  const candidates = [...customer.candidates].sort((a, b) => b.score - a.score)

  return (
    <li className={rowCard}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-900">
            {customer.displayName}
            {customer.isSubCustomer && <span className={subTag}>sub-customer</span>}
            {!customer.active && <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">inactive</span>}
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-slate-500">
            {customer.invoiceCount} {customer.invoiceCount === 1 ? 'invoice' : 'invoices'} this year · {formatMoney(customer.invoiceTotal)} invoiced ·{' '}
            <span className={customer.openBalance > 0 ? 'font-medium text-rose-600' : ''}>{formatMoney(customer.openBalance)} open</span>
          </p>
        </div>
        <button type="button" onClick={() => onCreate(customer)} className={outlineButton}>
          <PlusIcon className="h-3.5 w-3.5" />
          Create family from customer
        </button>
      </div>
      {candidates.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {candidates.map((f) => (
            <li key={f.familyId} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <ReasonBadge reason={f.reason} />
                <span className="truncate text-sm text-slate-800">{f.name}</span>
              </span>
              <button type="button" onClick={() => choose(f.familyId, f.name)} disabled={busy !== null} className={outlineButton}>
                {busy === f.familyId ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
                Link to {f.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {pending && (
        <div className="mt-3 space-y-2 rounded-xl border border-cyan-100 bg-white p-3">
          <p className="text-xs font-medium text-slate-700">
            {pending.name} is linked to {pending.current}. How should {customer.displayName} take over?
          </p>
          <LinkModeFields
            value={linkMode}
            onChange={setLinkMode}
            currentName={pending.current}
            earliestInvoiceDate={customer.earliestInvoiceDate}
          />
          <div className="flex justify-end gap-1.5">
            <button type="button" onClick={() => setPending(null)} disabled={busy !== null} className={outlineButton}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => link(pending.familyId, pending.name, linkOptions(linkMode))}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:from-cyan-600 hover:to-teal-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === pending.familyId ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
              {linkMode.mode === 'replace' ? 'Replace link' : 'Switch customer'}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </li>
  )
}

function StudentRow({
  student,
  familyOptions,
  familiesLoading,
  onAdd,
  onCreate,
}: {
  student: StudentWithoutFamily
  familyOptions: ComboOption[]
  familiesLoading: boolean
  onAdd: (familyId: string, familyName: string, student: StudentWithoutFamily) => Promise<void>
  onCreate: (student: StudentWithoutFamily) => void
}) {
  const [selected, setSelected] = useState<ComboOption | null>(
    student.suggestedFamilyId ? { id: student.suggestedFamilyId, primary: student.suggestedFamilyName ?? 'Suggested family', secondary: 'Suggested' } : null
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = async () => {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await onAdd(selected.id, selected.primary, student)
    } catch (err) {
      setError(financeErrorText(err, 'Could not add the student'))
      setBusy(false)
    }
  }

  const emails = [student.motherEmail, student.fatherEmail].filter(Boolean)

  return (
    <li className={rowCard}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {student.name} <span className="ml-1 text-xs font-normal text-slate-500">{gradeShort(student.grade)}</span>
          </p>
          {emails.length > 0 && <p className="mt-0.5 truncate text-xs text-slate-500">{emails.join(' · ')}</p>}
        </div>
        <button type="button" onClick={() => onCreate(student)} className={outlineButton}>
          <PlusIcon className="h-3.5 w-3.5" />
          Create family
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <PersonCombobox
            options={familyOptions}
            selected={selected}
            onSelect={setSelected}
            onClear={() => setSelected(null)}
            placeholder="Add to family…"
            loading={familiesLoading}
            searchKeys={(o) => `${o.primary} ${o.secondary ?? ''}`}
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!selected || busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2.5 text-xs font-medium text-white shadow-sm hover:from-cyan-600 hover:to-teal-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : <UserIcon className="h-3.5 w-3.5" />}
          Add to family
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </li>
  )
}

// ── Wizard ───────────────────────────────────────────────────────────────

function WizardBody({ tab, onTabChange, version, onChanged, onCreateFamily, onOpenFamily }: Omit<LinkingWizardProps, 'isOpen' | 'onClose'>) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [data, setData] = useState<FamilySuggestions | null>(null)
  const [families, setFamilies] = useState<FamilySummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    const [sug, fams] = await Promise.allSettled([getFamilySuggestions(), listFamilies()])
    setFamilies(fams.status === 'fulfilled' ? fams.value.data.families : [])
    if (sug.status === 'fulfilled') {
      setData(sug.value.data)
      setError(null)
    } else {
      setError(errorMessage(sug.reason, 'Could not load suggestions'))
    }
  }, [])

  // Load on open and again whenever the page reports a change (version
  // bump). Deferred a tick so a burst of bumps costs one request.
  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [load, version])

  const handleLink = useCallback(
    async (familyId: string, familyName: string, customer: { qboId: string; displayName: string }, opts?: LinkCustomerOptions) => {
      await linkFamilyCustomer(familyId, customer.qboId, opts)
      showNotification(`${familyName} linked to ${customer.displayName}`, 'success')
      onChanged()
    },
    [onChanged, showNotification]
  )

  const handleAddStudent = useCallback(
    async (familyId: string, familyName: string, student: StudentWithoutFamily) => {
      await addFamilyStudent(familyId, student.studentId)
      showNotification(`${student.name} added to ${familyName}`, 'success')
      onChanged()
    },
    [onChanged, showNotification]
  )

  const familyOptions: ComboOption[] = useMemo(
    () =>
      (families ?? [])
        .map((f) => ({
          id: f.familyId,
          primary: f.name,
          secondary: [
            `${f.students.length} ${f.students.length === 1 ? 'student' : 'students'}`,
            f.customer ? f.customer.displayName : 'unlinked',
          ].join(' · '),
        }))
        .sort((a, b) => a.primary.localeCompare(b.primary)),
    [families]
  )

  const currentCustomerOf = useCallback(
    (familyId: string) => families?.find((f) => f.familyId === familyId)?.customer?.displayName ?? null,
    [families]
  )

  const q = query.trim().toLowerCase()
  const match = (...texts: (string | null | undefined)[]) => !q || texts.some((t) => t?.toLowerCase().includes(q))

  const unlinkedFamilies = data?.unlinkedFamilies ?? []
  const unlinkedCustomers = data?.unlinkedCustomers ?? []
  const students = data?.studentsWithoutFamily ?? []

  const tabs: { key: WizardTab; label: string; count: number | null; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'families', label: 'Unlinked families', count: data ? unlinkedFamilies.length : null, icon: UserGroupIcon },
    { key: 'customers', label: 'Customers without a family', count: data ? unlinkedCustomers.length : null, icon: BuildingLibraryIcon },
    { key: 'students', label: 'Students without a family', count: data ? students.length : null, icon: UserIcon },
    { key: 'import', label: 'Import mapping file', count: null, icon: ArrowUpTrayIcon },
  ]

  const listBody = () => {
    if (error && !data) {
      return (
        <EmptyState
          icon={ExclamationTriangleIcon}
          iconClassName="text-rose-300"
          title="Could not load suggestions"
          description={error}
          action={
            <button type="button" onClick={() => load()} className={outlineButton}>
              Try again
            </button>
          }
        />
      )
    }
    if (!data) {
      return (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )
    }

    const clean = (title: string, description: string) => (
      <EmptyState icon={CheckCircleIcon} iconClassName="text-emerald-400" title={title} description={description} />
    )
    const noMatch = <p className="py-8 text-center text-sm text-slate-500">Nothing matches “{query.trim()}”.</p>

    if (tab === 'families') {
      if (unlinkedFamilies.length === 0) return clean('Every family is linked', 'Each family has a QuickBooks customer.')
      const rows = unlinkedFamilies.filter((f) => match(f.name, ...f.candidates.map((c) => c.displayName)))
      if (rows.length === 0) return noMatch
      return (
        <ul className="space-y-3">
          {rows.map((f) => (
            <UnlinkedFamilyRow key={f.familyId} family={f} onLink={handleLink} onOpen={onOpenFamily} />
          ))}
        </ul>
      )
    }
    if (tab === 'customers') {
      if (unlinkedCustomers.length === 0) return clean('No stray customers', 'Every QuickBooks customer with invoices belongs to a family.')
      const rows = unlinkedCustomers.filter((c) => match(c.displayName, ...c.candidates.map((f) => f.name)))
      if (rows.length === 0) return noMatch
      return (
        <ul className="space-y-3">
          {rows.map((c) => (
            <UnlinkedCustomerRow
              key={c.qboId}
              customer={c}
              onLink={handleLink}
              currentCustomerOf={currentCustomerOf}
              onCreate={(cust) =>
                onCreateFamily({
                  name: cust.displayName,
                  customer: { qboId: cust.qboId, displayName: cust.displayName, isSubCustomer: cust.isSubCustomer, active: cust.active },
                })
              }
            />
          ))}
        </ul>
      )
    }
    if (students.length === 0) return clean('Every student has a family', 'All of this year’s students belong to a family.')
    const rows = students.filter((s) => match(s.name, s.motherEmail, s.fatherEmail, s.suggestedFamilyName))
    if (rows.length === 0) return noMatch
    return (
      <ul className="space-y-3">
        {rows.map((s) => (
          <StudentRow
            key={s.studentId}
            student={s}
            familyOptions={familyOptions}
            familiesLoading={families === null}
            onAdd={handleAddStudent}
            onCreate={(st) =>
              onCreateFamily({
                name: familyNameFor(st.name),
                students: [{ studentId: st.studentId, name: st.name, grade: st.grade }],
                contacts: [
                  ...(st.motherEmail ? [{ email: st.motherEmail, relation: 'mother', isPrimary: true }] : []),
                  ...(st.fatherEmail ? [{ email: st.fatherEmail, relation: 'father', isPrimary: !st.motherEmail }] : []),
                ],
              })
            }
          />
        ))}
      </ul>
    )
  }

  return (
    <>
      <ModalHeader title="Link families" subtitle="Match families to QuickBooks customers and gather every student into a family" icon={LinkIcon} />
      <div className="border-b border-slate-100 bg-white px-6 py-3">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Linking steps">
          {tabs.map((t) => {
            const on = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onTabChange(t.key)}
                className={`flex shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.count !== null && (
                  <span
                    className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                      t.count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {tab !== 'import' && data && (
          <div className="relative mt-3">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter this list…"
              aria-label="Filter this list"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        )}
      </div>
      <div className="bg-slate-50 px-6 py-5" role="tabpanel">
        {/* Kept mounted so pasted files survive a look at another tab. */}
        <div className={tab === 'import' ? '' : 'hidden'}>
          <ImportMappingTab onApplied={onChanged} />
        </div>
        {tab !== 'import' && listBody()}
      </div>
    </>
  )
}

const LinkingWizard: React.FC<LinkingWizardProps> = ({ isOpen, onClose, ...rest }) => (
  <Modal isOpen={isOpen} onClose={onClose} size="4xl">
    <WizardBody {...rest} />
  </Modal>
)

export default LinkingWizard
