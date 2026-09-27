'use client'

// Small pieces shared by the family form, the drawer and the linking wizard.

import React, { useId } from 'react'
import { StarIcon } from '@heroicons/react/24/outline'
import type { ContactRelation, MatchReason } from '@/services/types/finance'
import { formatDate } from './format'

export const RELATION_OPTIONS: { value: ContactRelation; label: string }[] = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
]

export const relationLabel = (r: string | null | undefined) =>
  RELATION_OPTIONS.find((o) => o.value === r)?.label ?? (r ? r : null)

const reasonPill = 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset'

const REASON_CLASS: Record<MatchReason, string> = {
  email: 'bg-amber-50 text-amber-800 ring-amber-200/70',
  name: 'bg-slate-100 text-slate-600 ring-slate-200',
  student: 'bg-cyan-50 text-cyan-700 ring-cyan-200/60',
}

const REASON_TITLE: Record<MatchReason, string> = {
  email: 'A parent email matches the QuickBooks customer — the strongest signal',
  name: 'The names look alike',
  student: 'A student’s name appears on this customer’s invoices',
}

/** Why a candidate was suggested. Email matches get a star: they're the ones to trust. */
export const ReasonBadge = ({ reason }: { reason: MatchReason }) => (
  <span className={`${reasonPill} ${REASON_CLASS[reason] ?? REASON_CLASS.name}`} title={REASON_TITLE[reason]}>
    {reason === 'email' && <StarIcon className="h-3 w-3 fill-amber-400 text-amber-500" aria-hidden />}
    {reason}
  </span>
)

/** "$1,400.00" → 1400; blank → null; anything else → NaN (caller validates). */
export function parseAmount(text: string): number | null {
  const t = text.replace(/[$,\s]/g, '')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
}

export const amountText = (n: number | null | undefined) => (n == null ? '' : String(n))

export const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

export const tinyButton =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'

export const tinyDangerButton =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'

export const outlineButton =
  'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'

// ── Changing an existing customer link ───────────────────────────────────

export type LinkMode = 'switch' | 'replace'

export interface LinkModeValue {
  mode: LinkMode
  /** 'YYYY-MM-DD' or '' for today (switch mode only). */
  effectiveFrom: string
}

export const DEFAULT_LINK_MODE: LinkModeValue = { mode: 'switch', effectiveFrom: '' }

/** The options to send with PUT /families/:id/customer. */
export const linkOptions = (v: LinkModeValue) =>
  v.mode === 'replace' ? { replace: true } : v.effectiveFrom ? { effectiveFrom: v.effectiveFrom } : {}

/**
 * How a family moves from its current QuickBooks customer to another: switch
 * from a date (history kept) or replace (the current link was wrong).
 * Only meaningful when the family already has a customer.
 */
export function LinkModeFields({
  value,
  onChange,
  currentName,
  earliestInvoiceDate = null,
}: {
  value: LinkModeValue
  onChange: (v: LinkModeValue) => void
  currentName: string
  /** 'YYYY-MM-DD' of the incoming customer's first invoice, when known. */
  earliestInvoiceDate?: string | null
}) {
  const id = useId()
  const option = (mode: LinkMode, label: string, extra?: React.ReactNode) => (
    <label
      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
        value.mode === mode ? 'border-cyan-200 bg-cyan-50/60' : 'border-slate-200 hover:bg-slate-50'
      }`}
    >
      <input
        type="radio"
        name={`${id}-mode`}
        checked={value.mode === mode}
        onChange={() => onChange({ ...value, mode })}
        className="mt-0.5 h-3.5 w-3.5 border-slate-300 text-cyan-600 focus:ring-cyan-500"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-slate-800">{label}</span>
        {extra}
      </span>
    </label>
  )
  const when = value.effectiveFrom ? formatDate(value.effectiveFrom) : 'today'
  // Switching after the customer's first invoice leaves the earlier ones
  // unclaimed by any family. A blank date means today.
  const switchFrom = value.effectiveFrom || todayIso()
  const leavesGap = value.mode === 'switch' && !!earliestInvoiceDate && switchFrom > earliestInvoiceDate
  return (
    <div className="space-y-1.5">
      {option(
        'switch',
        'Switch from a date (keep history)',
        value.mode === 'switch' && (
          <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <label htmlFor={`${id}-date`}>From</label>
            <input
              id={`${id}-date`}
              type="date"
              value={value.effectiveFrom}
              onChange={(e) => onChange({ ...value, effectiveFrom: e.target.value })}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <span className="text-slate-400">blank = today</span>
          </span>
        )
      )}
      {option('replace', 'Replace — the current link was wrong')}
      {leavesGap && earliestInvoiceDate && (
        <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] leading-snug text-amber-800">
          This customer’s invoices start on {formatDate(earliestInvoiceDate)}. Switching from {when} leaves the invoices before then
          unclaimed — pick {formatDate(earliestInvoiceDate)} or earlier to keep them.
        </p>
      )}
      <p className="text-[11px] leading-snug text-slate-500">
        {earliestInvoiceDate && !leavesGap && value.mode === 'switch' ? `This customer’s invoices start on ${formatDate(earliestInvoiceDate)}. ` : ''}
        {value.mode === 'switch'
          ? `${currentName} stays linked until the day before ${when}; earlier invoices stay with it and both links show in History.`
          : `The ${currentName} link is deleted and the new customer takes over from its start date, so this year’s invoices move across; History records the replacement.`}
      </p>
    </div>
  )
}

/** Today as 'YYYY-MM-DD' in local time. */
export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
