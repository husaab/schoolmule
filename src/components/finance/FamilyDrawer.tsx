'use client'

// Everything about one family's tuition: invoices by month with their lines
// and payments, the students and contacts behind them, notes, and the
// history of how the family was linked. Editable: the header kebab edits or
// deletes the family, the customer chip changes or removes the QuickBooks
// link, and the Students / Contacts / Notes tabs edit in place. Each invoice
// can have its kind overridden.
//
// Slides in from the right at z-[57]/z-[58]: above the Navbar (z-[55]) and
// Sidebar (z-[56]) but below the shared Modal (z-[60]), so the edit, confirm
// and form modals it opens appear on top of it.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  LinkSlashIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  DocumentTextIcon,
  UserGroupIcon,
  UsersIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { Button } from '@/components/shared/modalKit'
import { useNotificationStore } from '@/store/useNotificationStore'
import { deleteFamily, getFamilyDetail, linkFamilyCustomer, setInvoiceKind, unlinkFamilyCustomer } from '@/services/financeService'
import type { FamilyDetail, FamilyInvoice, GridFamily, InvoiceKind, LedgerWarning, PickedCustomer } from '@/services/types/finance'
import { FamilyBadges, WarningList } from './badges'
import FamilyInvoiceCard from './FamilyInvoiceCard'
import ConfirmActionModal, { type ConfirmRequest } from './ConfirmActionModal'
import CustomerPicker from './CustomerPicker'
import FamilyFormModal from './FamilyFormModal'
import MenuButton from '@/components/shared/MenuButton'
import { ContactsTab, NotesTab, StudentsTab } from './FamilyDrawerTabs'
import { DEFAULT_LINK_MODE, LinkModeFields, linkOptions, type LinkModeValue } from './familyUi'
import { errorMessage, financeErrorText, formatDate, formatDateTime, formatMoney, kindLabel, monthLong } from './format'

interface FamilyDrawerProps {
  familyId: string | null
  /** The grid's copy of the family, so the header shows while details load. */
  preview: GridFamily | null
  grantName: string
  /** Bumped by the page after any finance change; the open family reloads. */
  version: number
  onClose: () => void
  /** Something about this family changed: refetch the grid. */
  onChanged: () => void
  /** The family was deleted: close the drawer and refetch. */
  onDeleted: (familyId: string) => void
}

type Tab = 'invoices' | 'students' | 'contacts' | 'notes' | 'history'

const TABS: { key: Tab; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { key: 'invoices', label: 'Invoices', icon: DocumentTextIcon },
  { key: 'students', label: 'Students', icon: UserGroupIcon },
  { key: 'contacts', label: 'Contacts', icon: UsersIcon },
  { key: 'notes', label: 'Notes', icon: ChatBubbleBottomCenterTextIcon },
  { key: 'history', label: 'History', icon: ClockIcon },
]

const sectionLabel = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400'
const secondaryButton =
  'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer'
const chipAction =
  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-cyan-700 transition-colors hover:bg-white cursor-pointer'

// ── Tabs ─────────────────────────────────────────────────────────────────

function InvoicesTab({
  detail,
  grantName,
  onKindChange,
}: {
  detail: FamilyDetail
  grantName: string
  onKindChange: (qboId: string, kind: InvoiceKind | null) => Promise<void>
}) {
  const groups = useMemo(() => {
    const inYear = new Set(detail.months)
    const byMonth = new Map<string, FamilyInvoice[]>()
    for (const inv of detail.invoices) {
      const key = inYear.has(inv.month) ? inv.month : '__out'
      const list = byMonth.get(key) ?? []
      list.push(inv)
      byMonth.set(key, list)
    }
    const ordered: { key: string; label: string; invoices: FamilyInvoice[] }[] = []
    for (const m of detail.months) {
      const list = byMonth.get(m)
      if (list) ordered.push({ key: m, label: monthLong(m), invoices: list.sort((a, b) => a.txnDate.localeCompare(b.txnDate)) })
    }
    const out = byMonth.get('__out')
    if (out) ordered.push({ key: '__out', label: 'Outside this school year', invoices: out.sort((a, b) => a.txnDate.localeCompare(b.txnDate)) })
    return ordered
  }, [detail])

  const unapplied = detail.payments.filter((p) => !p.deleted && p.unapplied > 0)

  if (groups.length === 0 && unapplied.length === 0) {
    return (
      <EmptyState
        icon={DocumentTextIcon}
        title="No invoices yet"
        description={
          detail.customer
            ? 'Invoices for this family’s QuickBooks customer appear here after the next sync.'
            : 'This family isn’t linked to a QuickBooks customer, so there are no invoices to show.'
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className={`${sectionLabel} mb-2`}>{g.label}</h3>
          <div className="space-y-3">
            {g.invoices.map((inv) => (
              <FamilyInvoiceCard key={inv.qboId} invoice={inv} grantName={grantName} onKindChange={onKindChange} />
            ))}
          </div>
        </section>
      ))}
      {unapplied.length > 0 && (
        <section>
          <h3 className={`${sectionLabel} mb-2`}>Payments not applied to an invoice</h3>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
            {unapplied.map((p) => (
              <li key={p.paymentId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-slate-600">
                  {formatDate(p.date)}
                  {p.method ? ` · ${p.method}` : ''}
                  {p.ref ? ` · Ref ${p.ref}` : ''}
                </span>
                <span className="tabular-nums text-slate-800">
                  {formatMoney(p.unapplied)} <span className="text-xs text-slate-400">of {formatMoney(p.total)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function HistoryTab({ detail }: { detail: FamilyDetail }) {
  const links = [...detail.customerLinks].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
  const audit = [...detail.audit].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <div className="space-y-6">
      <section>
        <h3 className={`${sectionLabel} mb-2`}>QuickBooks customer links</h3>
        {links.length === 0 ? (
          <p className="text-sm text-slate-500">Never linked to a QuickBooks customer.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
            {links.map((l) => (
              <li key={l.linkId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {l.customerName || `Customer ${l.qboCustomerId}`}
                    {l.isSubCustomer && <span className="ml-1.5 text-[11px] font-normal text-slate-400">sub-customer</span>}
                    {!l.customerActive && <span className="ml-1.5 text-[11px] font-normal text-slate-400">inactive in QuickBooks</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(l.effectiveFrom)} – {l.effectiveTo ? formatDate(l.effectiveTo) : 'now'}
                  </p>
                </div>
                {l.current && <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">Current</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className={`${sectionLabel} mb-2`}>Changes</h3>
        {audit.length === 0 ? (
          <p className="text-sm text-slate-500">No changes recorded yet.</p>
        ) : (
          <ol className="space-y-3 border-l border-slate-200 pl-4">
            {audit.map((a) => (
              <li key={a.auditId} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-300" aria-hidden />
                <p className="text-sm text-slate-800">{a.action.replace(/[_.]/g, ' ').replace(/^\w/, (ch) => ch.toUpperCase())}</p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(a.createdAt)}
                  {a.actorName ? ` · ${a.actorName}` : a.actorUserId ? '' : ' · System'}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

// ── Customer link popover ────────────────────────────────────────────────

function LinkCustomerPanel({
  familyId,
  familyName,
  current,
  onDone,
  onCancel,
}: {
  familyId: string
  familyName: string
  current: string | null
  onDone: () => void
  onCancel: () => void
}) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [picked, setPicked] = useState<PickedCustomer | null>(null)
  const [linkMode, setLinkMode] = useState<LinkModeValue>(DEFAULT_LINK_MODE)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const link = async () => {
    if (!picked) return
    setBusy(true)
    setError(null)
    try {
      // With no current link there is nothing to replace; only the date applies.
      await linkFamilyCustomer(familyId, picked.qboId, current ? linkOptions(linkMode) : linkOptions({ ...linkMode, mode: 'switch' }))
      showNotification(
        current && linkMode.mode === 'replace'
          ? `${familyName} now uses ${picked.displayName} for the whole year`
          : `${familyName} linked to ${picked.displayName}`,
        'success'
      )
      onDone()
    } catch (err) {
      setError(financeErrorText(err, 'Could not link the customer'))
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-cyan-100 bg-white p-3 shadow-sm">
      <p className="text-xs font-medium text-slate-600">
        {current ? `Change the QuickBooks customer (now ${current})` : 'Link a QuickBooks customer'}
      </p>
      <CustomerPicker
        value={picked}
        onChange={(c) => {
          setPicked(c)
          // Switching from the new customer's first invoice leaves none of
          // them without a family.
          if (c && current) setLinkMode((m) => ({ ...m, effectiveFrom: c.earliestInvoiceDate ?? '' }))
        }}
        familyId={familyId}
        autoFocus
      />
      {current ? (
        <LinkModeFields
          value={linkMode}
          onChange={setLinkMode}
          currentName={current}
          earliestInvoiceDate={picked?.earliestInvoiceDate ?? null}
        />
      ) : (
        <label className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          Effective from
          <input
            type="date"
            value={linkMode.effectiveFrom}
            onChange={(e) => setLinkMode({ mode: 'switch', effectiveFrom: e.target.value })}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <span className="text-slate-400">blank = from the start of the year</span>
        </label>
      )}
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={link} loading={busy} disabled={!picked}>
          <LinkIcon className="h-4 w-4" />
          Link
        </Button>
      </div>
    </div>
  )
}

// ── Body (remounted per family so tab + data reset) ──────────────────────

function DrawerBody({
  familyId,
  preview,
  grantName,
  version,
  onClose,
  onChanged,
  onDeleted,
}: { familyId: string } & Omit<FamilyDrawerProps, 'familyId'>) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [detail, setDetail] = useState<FamilyDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('invoices')
  const [linking, setLinking] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  // Only the newest response may land: a version bump can overlap a retry.
  const reqId = useRef(0)
  const load = useCallback(async () => {
    const id = ++reqId.current
    try {
      const res = await getFamilyDetail(familyId)
      if (id !== reqId.current) return
      setDetail(res.data)
      setError(null)
    } catch (err) {
      if (id !== reqId.current) return
      setError(errorMessage(err, 'Could not load this family'))
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [familyId])

  // Load on open and after every change the page reports (version bump).
  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [load, version])

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Escape closes the innermost thing: the link panel, else the drawer —
  // never the drawer while one of its modals is open.
  const modalOpen = editOpen || !!confirmRequest
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || modalOpen || e.defaultPrevented) return
      // Escape in a form field or an open picker belongs to that control
      // (e.g. the student combobox, which has no matches to close).
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest('input, textarea, select, [role="listbox"], [role="combobox"]')) return
      if (linking) setLinking(false)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, linking, onClose])

  const retry = () => {
    setLoading(true)
    load()
  }

  const name = detail?.family.name ?? preview?.name ?? 'Family'
  const isSubsidy = detail?.family.isSubsidy ?? preview?.isSubsidy ?? false
  const isTeacher = detail?.family.isTeacher ?? preview?.isTeacher ?? false
  const credit = detail?.ledger?.credit ?? preview?.credit ?? 0
  const totals = detail?.ledger?.parent.totals ?? preview?.parent.totals ?? null
  const currentLink = detail?.customerLinks.find((l) => l.current) ?? null
  const customerName = currentLink?.customerName ?? detail?.customer?.displayName ?? preview?.customer?.displayName ?? null
  const isSub = currentLink?.isSubCustomer ?? preview?.customer?.isSubCustomer ?? false
  const linked = detail ? !!detail.customer || !!currentLink : !!preview?.customer
  const family = detail?.family
  // The family endpoint's ledger never carries the structural warnings the grid
  // adds (UNLINKED, NO_ACTIVE_STUDENTS), so derive them from the detail itself.
  const warnings: LedgerWarning[] = useMemo(
    () =>
      detail
        ? [
            ...(linked ? [] : [{ code: 'UNLINKED' } as LedgerWarning]),
            ...(detail.students.some((st) => !st.isArchived) ? [] : [{ code: 'NO_ACTIVE_STUDENTS' } as LedgerWarning]),
            ...(detail.ledger?.warnings ?? []).filter((w) => w.code !== 'UNLINKED' && w.code !== 'NO_ACTIVE_STUDENTS'),
          ]
        : preview?.warnings ?? [],
    [detail, linked, preview]
  )

  // ── Actions ─────────────────────────────────────────────────────────────
  const askUnlink = () =>
    setConfirmRequest({
      title: 'Unlink QuickBooks customer?',
      subtitle: name,
      icon: LinkSlashIcon,
      tone: 'warning',
      message: `${customerName ?? 'The customer'} will no longer be linked to ${name}.`,
      consequences: {
        title: 'What happens',
        items: [
          'The link closes as of today; it stays in this family’s history.',
          'New invoices for this customer stop showing on the grid until it is linked again.',
          'Nothing in QuickBooks changes.',
        ],
      },
      confirmLabel: 'Unlink',
      onConfirm: async () => {
        await unlinkFamilyCustomer(familyId)
        showNotification(`${name} unlinked from QuickBooks`, 'success')
        onChanged()
      },
    })

  const askDelete = () =>
    setConfirmRequest({
      title: `Delete ${name}?`,
      icon: TrashIcon,
      message: 'This removes the family from SchoolMule for this school year.',
      consequences: {
        title: 'What happens',
        items: [
          'Its contacts and student memberships are removed; the student records stay.',
          'Its QuickBooks customer becomes unlinked and shows under “Needs attention” if it has invoices.',
          'Nothing in QuickBooks changes.',
        ],
      },
      confirmLabel: 'Delete family',
      onConfirm: async () => {
        await deleteFamily(familyId)
        showNotification(`${name} deleted`, 'success')
        onDeleted(familyId)
      },
    })

  const changeKind = useCallback(
    async (qboId: string, kind: InvoiceKind | null) => {
      try {
        const res = await setInvoiceKind(qboId, kind)
        showNotification(
          kind ? `Invoice now counts as ${kindLabel(res.data.kind, grantName)}` : `Invoice reset to ${kindLabel(res.data.kind, grantName)}`,
          'success'
        )
        onChanged()
      } catch (err) {
        showNotification(errorMessage(err, 'Could not change the invoice kind'), 'error')
        throw err
      }
    },
    [grantName, onChanged, showNotification]
  )

  const confirm = useCallback((request: ConfirmRequest) => setConfirmRequest(request), [])

  return (
    <>
      <header className="flex-shrink-0 border-b border-slate-100 bg-gradient-to-br from-cyan-50 via-white to-teal-50 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">{name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <FamilyBadges isSubsidy={isSubsidy} isTeacher={isTeacher} />
              {family?.rosterFamilyNo != null && <span className="text-xs text-slate-500">Family #{family.rosterFamilyNo}</span>}
              {linked ? (
                <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
                  <span className="truncate">{customerName || 'QuickBooks customer'}</span>
                  {isSub && <span className="text-[10px] text-slate-400">sub-customer</span>}
                </span>
              ) : (
                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600 ring-1 ring-inset ring-rose-200/60">Unlinked</span>
              )}
              {detail && !linking && (
                linked ? (
                  <>
                    <button type="button" onClick={() => setLinking(true)} className={chipAction}>
                      <PencilSquareIcon className="h-3.5 w-3.5" />
                      Change
                    </button>
                    <button type="button" onClick={askUnlink} className={`${chipAction} text-rose-600`}>
                      <LinkSlashIcon className="h-3.5 w-3.5" />
                      Unlink
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setLinking(true)} className={chipAction}>
                    <LinkIcon className="h-3.5 w-3.5" />
                    Link customer
                  </button>
                )
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            {detail && (
              <MenuButton
                label="Family options"
                items={[
                  { key: 'edit', label: 'Edit family', icon: PencilSquareIcon, onSelect: () => setEditOpen(true) },
                  { key: 'delete', label: 'Delete family', icon: TrashIcon, danger: true, onSelect: askDelete },
                ]}
              />
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {linking && detail && (
          <LinkCustomerPanel
            familyId={familyId}
            familyName={name}
            current={linked ? customerName ?? 'the current customer' : null}
            onCancel={() => setLinking(false)}
            onDone={() => {
              setLinking(false)
              onChanged()
            }}
          />
        )}

        {totals && (
          <dl className="mt-3 grid grid-cols-3 gap-2 text-xs tabular-nums">
            <div>
              <dt className="text-slate-400">Invoiced</dt>
              <dd className="text-sm font-semibold text-slate-800">{formatMoney(totals.invoiced)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Paid</dt>
              <dd className="text-sm font-semibold text-emerald-700">{formatMoney(totals.paid)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Balance</dt>
              <dd className={`text-sm font-semibold ${totals.balance > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{formatMoney(totals.balance)}</dd>
            </div>
          </dl>
        )}

        {(credit > 0 || family?.expectedMonthlyParent != null || family?.expectedMonthlySubsidy != null) && (
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
            {credit > 0 && <span className="font-medium text-emerald-700">Unapplied credit {formatMoney(credit)}</span>}
            {family?.expectedMonthlyParent != null && <span>Expected {formatMoney(family.expectedMonthlyParent)}/mo from parent</span>}
            {family?.expectedMonthlySubsidy != null && <span>{formatMoney(family.expectedMonthlySubsidy)}/mo subsidy</span>}
          </p>
        )}
        {family?.notes && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{family.notes}</p>}
        {warnings.length > 0 && (
          <div className="mt-3">
            <WarningList warnings={warnings} />
          </div>
        )}

        <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Family details">
          {TABS.map((t) => {
            const on = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.key)}
                className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-5" role="tabpanel">
        {loading && !detail ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error && !detail ? (
          <EmptyState
            icon={ExclamationTriangleIcon}
            iconClassName="text-rose-300"
            title="Could not load this family"
            description={error}
            action={
              <button type="button" onClick={retry} className={secondaryButton}>
                <ArrowPathIcon className="h-4 w-4" />
                Try again
              </button>
            }
          />
        ) : detail ? (
          tab === 'invoices' ? (
            <InvoicesTab detail={detail} grantName={grantName} onKindChange={changeKind} />
          ) : tab === 'students' ? (
            <StudentsTab detail={detail} onChanged={onChanged} confirm={confirm} />
          ) : tab === 'contacts' ? (
            <ContactsTab detail={detail} onChanged={onChanged} confirm={confirm} />
          ) : tab === 'notes' ? (
            <NotesTab key={detail.family.updatedAt} detail={detail} onChanged={onChanged} />
          ) : (
            <HistoryTab detail={detail} />
          )
        ) : null}
      </div>

      <FamilyFormModal isOpen={editOpen} familyId={familyId} onClose={() => setEditOpen(false)} onSaved={() => onChanged()} />
      <ConfirmActionModal request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </>
  )
}

// ── Shell ────────────────────────────────────────────────────────────────

const FamilyDrawer: React.FC<FamilyDrawerProps> = ({ familyId, preview, grantName, version, onClose, onChanged, onDeleted }) => (
  <AnimatePresence>
    {familyId && (
      <>
        <motion.div
          key="family-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[57] bg-slate-900/30 backdrop-blur-[2px]"
        />
        <motion.aside
          key="family-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Family tuition details"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-y-0 right-0 z-[58] flex w-full flex-col bg-white shadow-2xl sm:w-[560px]"
        >
          <DrawerBody
            key={familyId}
            familyId={familyId}
            preview={preview}
            grantName={grantName}
            version={version}
            onClose={onClose}
            onChanged={onChanged}
            onDeleted={onDeleted}
          />
        </motion.aside>
      </>
    )}
  </AnimatePresence>
)

export default FamilyDrawer
