'use client'

// The detail behind one month cell: which invoice(s), when they were issued
// and due, what was paid and when. Rendered in a portal with fixed
// positioning so the grid's scroll container can't clip it.

import React from 'react'
import { createPortal } from 'react-dom'
import { ArrowTopRightOnSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { Cell } from '@/services/types/finance'
import { KindBadge } from './badges'
import { STATUS_CHIP, formatDate, formatMoney, invoiceLabel, monthLong, qboInvoiceUrl, statusText } from './format'

export interface AnchorRect {
  top: number
  bottom: number
  left: number
  width: number
}

interface CellPopoverProps {
  id: string
  cell: Cell
  month: string
  grantName: string
  anchor: AnchorRect
  onMouseEnter: () => void
  onMouseLeave: () => void
  /** Pinned popovers are dialogs that hold focus; previews are tooltips. */
  pinned: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Close; `returnFocus` sends focus back to the chip. */
  onRequestClose: (returnFocus?: boolean) => void
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

const WIDTH = 300
const GAP = 6
const EST_HEIGHT = 280

const CellPopover: React.FC<CellPopoverProps> = ({
  id,
  cell,
  month,
  grantName,
  anchor,
  onMouseEnter,
  onMouseLeave,
  pinned,
  containerRef,
  onRequestClose,
}) => {
  const vw = typeof window === 'undefined' ? 1024 : window.innerWidth
  const vh = typeof window === 'undefined' ? 768 : window.innerHeight
  const left = Math.min(Math.max(anchor.left + anchor.width / 2 - WIDTH / 2, 8), vw - WIDTH - 8)
  const placeAbove = anchor.bottom + GAP + EST_HEIGHT > vh && anchor.top > vh - anchor.bottom
  const style: React.CSSProperties = placeAbove
    ? { left, bottom: vh - anchor.top + GAP, width: WIDTH }
    : { left, top: anchor.bottom + GAP, width: WIDTH }

  // The portal sits at the end of <body>, so tabbing past either end of a
  // pinned popover would leave the page; hand focus back to the chip instead.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!pinned || e.key !== 'Tab') return
    const container = containerRef.current
    if (!container) return
    const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
    const active = document.activeElement
    const first = items[0]
    const last = items[items.length - 1]
    if (items.length === 0 || (!e.shiftKey && active === last) || (e.shiftKey && (active === first || active === container))) {
      e.preventDefault()
      onRequestClose(true)
    }
  }

  const invoices = cell.invoices
  const payments = [...cell.payments].sort((a, b) => a.date.localeCompare(b.date))

  return createPortal(
    <div
      id={id}
      ref={containerRef}
      role={pinned ? 'dialog' : 'tooltip'}
      aria-label={pinned ? `${monthLong(month)} invoice details` : undefined}
      tabIndex={pinned ? -1 : undefined}
      onKeyDown={handleKeyDown}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-[70] max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-left shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{monthLong(month)}</p>
        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${STATUS_CHIP[cell.status]}`}>{statusText(cell)}</span>
      </div>

      {invoices.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">No invoice this month.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {invoices.map((inv) => (
            <li key={inv.id} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-sm font-medium text-slate-800 ${inv.voided ? 'line-through' : ''}`}>
                  {invoiceLabel(inv.docNumber, inv.id)}
                </span>
                {inv.kind !== 'parent' && <KindBadge kind={inv.kind} grantName={grantName} />}
                {inv.voided && <span className="text-[11px] font-medium text-slate-400">Voided</span>}
                {inv.deleted && <span className="text-[11px] font-medium text-rose-500">Deleted in QuickBooks</span>}
              </div>
              {inv.familyName && <p className="mt-0.5 text-xs text-slate-500">{inv.familyName}</p>}
              <p className="mt-1 text-xs text-slate-500">
                Issued {formatDate(inv.txnDate)}
                {inv.dueDate ? ` · Due ${formatDate(inv.dueDate)}` : ''}
              </p>
              <dl className="mt-1.5 grid grid-cols-2 gap-x-3 text-xs tabular-nums">
                <dt className="text-slate-500">Total</dt>
                <dd className="text-right text-slate-800">{formatMoney(inv.total)}</dd>
                <dt className="text-slate-500">Balance</dt>
                <dd className={`text-right ${inv.balance > 0 && !inv.voided ? 'text-rose-600' : 'text-slate-800'}`}>{formatMoney(inv.balance)}</dd>
              </dl>
              <a
                href={qboInvoiceUrl(inv.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800"
              >
                Open in QuickBooks
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {invoices.length > 0 && (
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
          {[
            { label: 'Invoiced', value: cell.invoiced, tone: 'text-slate-800' },
            { label: 'Paid', value: cell.paid, tone: 'text-emerald-700' },
            { label: 'Balance', value: cell.balance, tone: cell.balance > 0 ? 'text-rose-600' : 'text-slate-800' },
          ].map((f) => (
            <div key={f.label}>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{f.label}</dt>
              <dd className={`text-sm font-semibold tabular-nums ${f.tone}`}>{formatMoney(f.value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {payments.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Payments</p>
          <ul className="mt-1.5 space-y-1">
            {payments.map((p) => (
              <li key={`${p.paymentId}-${p.invoiceId}`} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1 text-slate-600">
                  {formatDate(p.date)}
                  {p.dateBeforeInvoice && (
                    <span className="inline-flex items-center gap-0.5 text-amber-600" title="Dated before the invoice it pays">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Dated before the invoice it pays</span>
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-slate-800">{formatMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>,
    document.body
  )
}

export default CellPopover
