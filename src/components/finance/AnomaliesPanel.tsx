'use client'

// Everything on the tuition page that needs a human: QuickBooks customers
// with invoices but no family, students with no family, invoices that aren't
// tuition or subsidy, links to customers that went inactive or vanished, and
// families whose ledger raised warnings. Each row leads to where it's fixed.

import React, { forwardRef } from 'react'
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { StaleLink, TuitionAnomalies } from '@/services/types/finance'
import type { WizardTab } from './LinkingWizard'
import { formatDate, formatMoney, gradeShort, invoiceLabel, warningText } from './format'

interface AnomaliesPanelProps {
  anomalies: TuitionAnomalies | null
  error: string | null
  open: boolean
  onToggle: () => void
  onRetry: () => void
  onOpenWizard: (tab: WizardTab) => void
  onOpenFamily: (familyId: string) => void
}

const PREVIEW = 6

const STALE_TEXT: Record<StaleLink['reason'], string> = {
  inactive: 'customer is inactive in QuickBooks',
  deleted: 'customer was deleted in QuickBooks',
  missing: 'customer is missing from the QuickBooks data',
}

const rowButton =
  'shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-50 cursor-pointer'

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string
  count: number
  action?: { label: string; onClick: () => void }
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <section className="rounded-xl border border-amber-100 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-amber-50 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-800">
          {title} <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-[11px] tabular-nums text-amber-800">{count}</span>
        </h3>
        {action && (
          <button type="button" onClick={action.onClick} className={rowButton}>
            {action.label}
          </button>
        )}
      </header>
      <ul className="divide-y divide-slate-50">{children}</ul>
    </section>
  )
}

const More = ({ total, onClick, label }: { total: number; onClick: () => void; label: string }) =>
  total > PREVIEW ? (
    <li className="px-4 py-2">
      <button type="button" onClick={onClick} className="text-xs font-medium text-cyan-700 hover:underline cursor-pointer">
        {label} ({total - PREVIEW} more)
      </button>
    </li>
  ) : null

const AnomaliesPanel = forwardRef<HTMLDivElement, AnomaliesPanelProps>(function AnomaliesPanel(
  { anomalies, error, open, onToggle, onRetry, onOpenWizard, onOpenFamily },
  ref
) {
  if (!anomalies) {
    if (!error) return null
    return (
      <div ref={ref} id="anomalies" className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-3">
        <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-500" />
        <p className="flex-1 text-sm text-amber-900">Couldn’t load the “needs attention” list. {error}</p>
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline cursor-pointer">
          <ArrowPathIcon className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    )
  }

  const a = anomalies
  const total =
    a.unlinkedCustomers.length + a.studentsWithoutFamily.length + a.otherKindInvoices.length + a.staleLinks.length + a.warningsByFamily.length
  if (total === 0) return null

  const parts = [
    a.unlinkedCustomers.length ? `${a.unlinkedCustomers.length} unlinked ${a.unlinkedCustomers.length === 1 ? 'customer' : 'customers'}` : null,
    a.studentsWithoutFamily.length
      ? `${a.studentsWithoutFamily.length} ${a.studentsWithoutFamily.length === 1 ? 'student' : 'students'} without a family`
      : null,
    a.otherKindInvoices.length ? `${a.otherKindInvoices.length} “other” ${a.otherKindInvoices.length === 1 ? 'invoice' : 'invoices'}` : null,
    a.staleLinks.length ? `${a.staleLinks.length} stale ${a.staleLinks.length === 1 ? 'link' : 'links'}` : null,
    a.warningsByFamily.length
      ? `${a.warningsByFamily.length} ${a.warningsByFamily.length === 1 ? 'family' : 'families'} with warnings`
      : null,
  ].filter(Boolean)

  const customers = [...a.unlinkedCustomers].sort((x, y) => y.openBalance - x.openBalance || x.displayName.localeCompare(y.displayName))

  return (
    <div ref={ref} id="anomalies" className="scroll-mt-24 rounded-2xl border border-amber-100 bg-amber-50/60">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-5 py-3 text-left cursor-pointer">
        <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-500" />
        <span className="flex-1 text-sm text-amber-900">
          <span className="font-semibold">Needs attention</span> <span className="text-amber-800/80">· {parts.join(' · ')}</span>
        </span>
        {open ? <ChevronDownIcon className="h-4 w-4 text-amber-700" /> : <ChevronRightIcon className="h-4 w-4 text-amber-700" />}
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-3 border-t border-amber-100 px-5 py-4 lg:grid-cols-2">
          <Section
            title="QuickBooks customers with invoices but no family"
            count={customers.length}
            action={{ label: 'Link…', onClick: () => onOpenWizard('customers') }}
          >
            {customers.slice(0, PREVIEW).map((c) => (
              <li key={c.qboId} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-slate-800">{c.displayName}</span>
                  <span className="block text-[11px] tabular-nums text-slate-500">
                    {c.invoiceCount} {c.invoiceCount === 1 ? 'invoice' : 'invoices'} · {formatMoney(c.invoiceTotal)} ·{' '}
                    <span className={c.openBalance > 0 ? 'text-rose-600' : ''}>{formatMoney(c.openBalance)} open</span>
                  </span>
                </span>
                <button type="button" onClick={() => onOpenWizard('customers')} className={rowButton}>
                  Link
                </button>
              </li>
            ))}
            <More total={customers.length} onClick={() => onOpenWizard('customers')} label="See all" />
          </Section>

          <Section
            title="Students without a family"
            count={a.studentsWithoutFamily.length}
            action={{ label: 'Assign…', onClick: () => onOpenWizard('students') }}
          >
            {a.studentsWithoutFamily.slice(0, PREVIEW).map((s) => (
              <li key={s.studentId} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="truncate text-sm text-slate-800">
                  {s.name} <span className="text-xs text-slate-500">{gradeShort(s.grade)}</span>
                </span>
                <button type="button" onClick={() => onOpenWizard('students')} className={rowButton}>
                  Assign
                </button>
              </li>
            ))}
            <More total={a.studentsWithoutFamily.length} onClick={() => onOpenWizard('students')} label="See all" />
          </Section>

          <Section title="Invoices that aren’t tuition or subsidy" count={a.otherKindInvoices.length}>
            {a.otherKindInvoices.map((inv) => (
              <li key={inv.qboId} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-slate-800">
                    {invoiceLabel(inv.docNumber, inv.qboId)} · {inv.familyName ?? inv.customerName ?? `Customer ${inv.customerQboId}`}
                  </span>
                  <span className="block text-[11px] tabular-nums text-slate-500">
                    {formatDate(inv.txnDate)} · {formatMoney(inv.total)}
                    {inv.balance > 0 ? ` · ${formatMoney(inv.balance)} open` : ''}
                  </span>
                </span>
                {inv.familyId ? (
                  <button type="button" onClick={() => onOpenFamily(inv.familyId as string)} className={rowButton}>
                    Set kind
                  </button>
                ) : (
                  <button type="button" onClick={() => onOpenWizard('customers')} className={rowButton}>
                    Link customer
                  </button>
                )}
              </li>
            ))}
          </Section>

          <Section title="Links to customers that changed in QuickBooks" count={a.staleLinks.length}>
            {a.staleLinks.map((l) => (
              <li key={`${l.familyId}-${l.qboCustomerId}`} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-slate-800">{l.familyName}</span>
                  <span className="block text-[11px] text-slate-500">
                    {l.customerName ?? `Customer ${l.qboCustomerId}`} — {STALE_TEXT[l.reason] ?? l.reason}
                  </span>
                </span>
                <button type="button" onClick={() => onOpenFamily(l.familyId)} className={rowButton}>
                  Review
                </button>
              </li>
            ))}
          </Section>

          <Section title="Families with warnings" count={a.warningsByFamily.length}>
            {a.warningsByFamily.map((f) => (
              <li key={f.familyId} className="flex items-start justify-between gap-3 px-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-slate-800">{f.name}</span>
                  <span className="block text-[11px] text-slate-500">
                    {f.warnings.slice(0, 2).map(warningText).join(' · ')}
                    {f.warnings.length > 2 ? ` · +${f.warnings.length - 2} more` : ''}
                  </span>
                </span>
                <button type="button" onClick={() => onOpenFamily(f.familyId)} className={rowButton}>
                  Open
                </button>
              </li>
            ))}
          </Section>
        </div>
      )}
    </div>
  )
})

export default AnomaliesPanel
