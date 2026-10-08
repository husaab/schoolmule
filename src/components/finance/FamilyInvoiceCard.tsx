'use client'

import React, { useState } from 'react'
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, ArrowUturnLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import type { FamilyInvoice, InvoiceKind } from '@/services/types/finance'
import { KindBadge } from './badges'
import MenuButton, { type MenuItem } from '@/components/shared/MenuButton'
import { formatDate, formatMoney, invoiceLabel, kindLabel, qboInvoiceUrl } from './format'

const tag = 'rounded-md px-1.5 py-0.5 text-[11px] font-medium'

const KINDS: InvoiceKind[] = ['parent', 'subsidy_grant', 'subsidy_school', 'other']

interface FamilyInvoiceCardProps {
  invoice: FamilyInvoice
  grantName: string
  /** Override the invoice's kind (null resets it to automatic). Rejects on failure. */
  onKindChange?: (qboId: string, kind: InvoiceKind | null) => Promise<void>
}

/** "Kind" menu: pick how the invoice counts, or reset to what the rules decided. */
function KindMenu({
  invoice: inv,
  grantName,
  onKindChange,
}: {
  invoice: FamilyInvoice
  grantName: string
  onKindChange: (qboId: string, kind: InvoiceKind | null) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const change = async (kind: InvoiceKind | null) => {
    setBusy(true)
    try {
      await onKindChange(inv.qboId, kind)
    } catch {
      // The caller reports the error.
    } finally {
      setBusy(false)
    }
  }
  const items: MenuItem[] = [
    ...KINDS.map((k) => ({
      key: k,
      label: kindLabel(k, grantName),
      checked: inv.kind === k,
      onSelect: () => {
        if (inv.kind !== k || !inv.kindOverride) change(k)
      },
    })),
    {
      key: 'reset',
      label: `Reset to auto (${kindLabel(inv.kindAuto, grantName)})`,
      icon: ArrowUturnLeftIcon,
      disabled: !inv.kindOverride,
      onSelect: () => change(null),
    },
  ]
  return (
    <MenuButton
      items={items}
      label="Change invoice kind"
      heading="Counts as"
      align="left"
      triggerClassName="inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      trigger={
        <>
          {busy ? <ArrowPathIcon className="h-3 w-3 animate-spin" /> : null}
          Kind
          <ChevronDownIcon className="h-3 w-3" />
        </>
      }
    />
  )
}

const FamilyInvoiceCard: React.FC<FamilyInvoiceCardProps> = ({ invoice: inv, grantName, onKindChange }) => {
  const paid = Math.max(0, Math.round((inv.total - inv.balance) * 100) / 100)
  const muted = inv.isVoided || inv.deleted
  return (
    <article className={`rounded-xl border border-slate-100 bg-white p-4 shadow-sm ${muted ? 'opacity-70' : ''}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className={`text-sm font-semibold text-slate-900 ${inv.isVoided ? 'line-through' : ''}`}>{invoiceLabel(inv.docNumber, inv.qboId)}</h4>
            <KindBadge kind={inv.kind} grantName={grantName} />
            {inv.kindOverride && (
              <span className={`${tag} bg-amber-50 text-amber-700`} title={`Set manually — the automatic kind is ${kindLabel(inv.kindAuto, grantName)}`}>
                Overridden
              </span>
            )}
            {onKindChange && <KindMenu invoice={inv} grantName={grantName} onKindChange={onKindChange} />}
            {inv.isVoided && <span className={`${tag} bg-slate-100 text-slate-500`}>Voided</span>}
            {inv.deleted && <span className={`${tag} bg-rose-50 text-rose-600`}>Deleted in QuickBooks</span>}
            {inv.isRecurring && <span className={`${tag} bg-slate-50 text-slate-500`}>Recurring</span>}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Issued {formatDate(inv.txnDate)}
            {inv.dueDate ? ` · Due ${formatDate(inv.dueDate)}` : ''}
            {inv.emailStatus ? ` · Email: ${inv.emailStatus.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}` : ''}
          </p>
        </div>
        <a
          href={qboInvoiceUrl(inv.qboId)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50"
        >
          Open in QuickBooks
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </a>
      </header>

      {inv.lines.length > 0 && (
        <table className="mt-3 w-full text-xs">
          <tbody className="divide-y divide-slate-50">
            {inv.lines.map((l) => (
              <tr key={l.lineNum}>
                <td className="py-1.5 pr-3 text-slate-700">
                  {l.itemName || l.description || 'Line item'}
                  {l.itemName && l.description && l.description !== l.itemName && (
                    <span className="block text-[11px] text-slate-400">{l.description}</span>
                  )}
                  {l.studentHint && <span className="block text-[11px] text-slate-400">For {l.studentHint}</span>}
                </td>
                <td className={`py-1.5 text-right tabular-nums ${l.amount < 0 ? 'text-emerald-700' : 'text-slate-800'}`}>{formatMoney(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {inv.payments.length > 0 && (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Payments applied</p>
          <ul className="mt-1 space-y-1">
            {inv.payments.map((p) => (
              <li key={p.paymentId} className={`flex items-center justify-between gap-2 text-xs ${p.deleted ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                <span>
                  {formatDate(p.date)}
                  {p.method ? ` · ${p.method}` : ''}
                  {p.ref ? ` · Ref ${p.ref}` : ''}
                </span>
                <span className="tabular-nums text-slate-800">{formatMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs tabular-nums">
        <div>
          <dt className="text-slate-400">Total</dt>
          <dd className="font-semibold text-slate-800">{formatMoney(inv.total)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Paid</dt>
          <dd className="font-semibold text-emerald-700">{formatMoney(paid)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Balance</dt>
          <dd className={`font-semibold ${inv.balance > 0 && !muted ? 'text-rose-600' : 'text-slate-800'}`}>{formatMoney(inv.balance)}</dd>
        </div>
      </dl>

      {inv.privateNote && <p className="mt-2 text-xs italic text-slate-500">Note: {inv.privateNote}</p>}
    </article>
  )
}

export default FamilyInvoiceCard
