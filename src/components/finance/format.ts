// Presentation helpers shared by the tuition page, grid, popover and drawer.
//
// Month chips (MonthCell) show what matters for their status: the amount paid
// for a paid month, what is still owed for unpaid / partial / overdue months,
// the struck-through invoiced amount for a voided month, and "—" for none.

import { isApiError } from '@/services/apiClient'
import type { Cell, CellStatus, InvoiceKind, LedgerWarning } from '@/services/types/finance'

const WHOLE = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
const CENTS = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** CAD, no cents when whole: $1,400 · $1,150.50. */
export function formatMoney(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  const rounded = Math.round(n * 100) / 100
  return Number.isInteger(rounded) ? WHOLE.format(rounded) : CENTS.format(rounded)
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function splitMonth(month: string): [number, number] | null {
  const m = /^(\d{4})-(\d{2})/.exec(month)
  return m ? [Number(m[1]), Number(m[2])] : null
}

/** '2026-09' → 'Sep 26' (grid column headers). */
export function monthShort(month: string): string {
  const p = splitMonth(month)
  return p ? `${MONTHS_SHORT[p[1] - 1]} ${String(p[0]).slice(2)}` : month
}

/** '2026-09' → 'September 2026'. */
export function monthLong(month: string): string {
  const p = splitMonth(month)
  return p ? `${MONTHS_LONG[p[1] - 1]} ${p[0]}` : month
}

/** '2026-09' → 'Sep 2026'. */
export function monthMedium(month: string): string {
  const p = splitMonth(month)
  return p ? `${MONTHS_SHORT[p[1] - 1]} ${p[0]}` : month
}

/** '2026-09-01' (or an ISO timestamp) → 'Sep 1, 2026'. Dates are calendar
 *  dates, so the day is read straight from the string — no timezone shift. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!m) return value
  return `${MONTHS_SHORT[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`
}

/** An ISO timestamp → 'Sep 1, 2026, 3:04 PM' in local time. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** "3 min ago" — relative time reads better than a timestamp for freshness. */
export function relativeTime(iso: string, now: number): string {
  const seconds = Math.floor((now - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

/** A blank doc number means QuickBooks generated the invoice from a template. */
export const invoiceLabel = (docNumber: string | null, qboId: string) =>
  docNumber && docNumber.trim() ? `#${docNumber}` : `auto #${qboId}`

export const qboInvoiceUrl = (qboId: string) =>
  `https://app.qbo.intuit.com/app/invoice?txnId=${encodeURIComponent(qboId)}`

// ── Grades ───────────────────────────────────────────────────────────────

/** JK and SK first, then 1–8, then anything unexpected alphabetically. */
export function gradeSortKey(grade: string): number {
  const g = grade.trim().toUpperCase().replace(/^GRADE\s*/, '')
  if (g === 'JK') return -2
  if (g === 'SK') return -1
  const n = Number(g)
  return Number.isFinite(n) ? n : 100
}

export const compareGrades = (a: string, b: string) =>
  gradeSortKey(a) - gradeSortKey(b) || a.localeCompare(b)

/** '4' → 'Gr 4'; 'JK' stays 'JK'. */
export function gradeShort(grade: string): string {
  const g = grade.trim().replace(/^grade\s*/i, '')
  return /^\d+$/.test(g) ? `Gr ${g}` : g
}

// ── Cell status ──────────────────────────────────────────────────────────

export const NONE_CELL: Cell = { status: 'none', invoiced: 0, paid: 0, balance: 0, daysOverdue: 0, invoices: [], payments: [] }

export const cellFor = (cells: Record<string, Cell>, month: string): Cell => cells[month] ?? NONE_CELL

export const STATUS_LABEL: Record<CellStatus, string> = {
  none: 'No invoice',
  voided: 'Voided',
  paid: 'Paid',
  partial: 'Partial',
  unpaid: 'Unpaid',
  overdue: 'Overdue',
}

export function statusText(cell: Cell): string {
  if (cell.status === 'overdue') return cell.daysOverdue > 0 ? `Overdue +${cell.daysOverdue}d` : 'Overdue'
  if (cell.status === 'none') return '—'
  return STATUS_LABEL[cell.status]
}

// Whole class strings so Tailwind can see them.
export const STATUS_CHIP: Record<CellStatus, string> = {
  none: 'border border-dashed border-slate-200 bg-transparent text-slate-300',
  voided: 'border border-slate-200 bg-slate-50 text-slate-400 line-through',
  paid: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  partial: 'border border-amber-200 bg-amber-50 text-amber-800',
  unpaid: 'border border-slate-200 bg-slate-100 text-slate-700',
  overdue: 'border border-rose-200 bg-rose-50 text-rose-700',
}

// ── Invoice kinds ────────────────────────────────────────────────────────

/** 'Al-Ma'arif Subsidy (grant)' → 'Al-Ma'arif'. The grant pseudo-row's label
 *  carries the school's configured grant name. */
export function grantNameFrom(label: string | null | undefined): string {
  if (!label) return 'Subsidy'
  const trimmed = label.replace(/\s*Subsidy\s*\(grant\)\s*$/i, '').trim()
  return trimmed || 'Subsidy'
}

export function kindLabel(kind: InvoiceKind | string, grantName: string): string {
  switch (kind) {
    case 'parent':
      return 'Parent'
    case 'subsidy_grant':
      return `${grantName} grant`
    case 'subsidy_school':
      return 'School-applied'
    default:
      return 'Other'
  }
}

export const KIND_BADGE: Record<string, string> = {
  parent: 'bg-slate-100 text-slate-700 ring-slate-200',
  subsidy_grant: 'bg-cyan-50 text-cyan-700 ring-cyan-200/60',
  subsidy_school: 'bg-teal-50 text-teal-700 ring-teal-200/60',
  other: 'bg-violet-50 text-violet-700 ring-violet-200/60',
}

// ── Warnings ─────────────────────────────────────────────────────────────

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** A ledger warning in plain language. */
export function warningText(w: LedgerWarning): string {
  const when = w.month ? `${monthMedium(w.month)}: ` : ''
  switch (w.code) {
    case 'UNLINKED':
      return 'Not linked to a QuickBooks customer yet'
    case 'NO_ACTIVE_STUDENTS':
      return 'No active students in this family'
    case 'MISDATED_PAYMENT': {
      // The payment's date falls outside the school year (likely a typo'd
      // year). Not the same as a payment dated before its invoice — that is
      // the per-payment `dateBeforeInvoice` flag shown in the cell popover.
      const detail = typeof w.detail === 'string' ? w.detail : null
      return `${when}a payment is dated ${detail ? formatDate(detail) + ' ' : ''}— outside this school year`
    }
    case 'UNEXPLAINED_PAID': {
      const amount = num(w.amount)
      return `${when}${amount !== null ? formatMoney(amount) + ' ' : ''}marked paid without a matching payment`
    }
    case 'TWO_PARENT_INVOICES_IN_MONTH':
      return `${when}more than one parent invoice this month`
    case 'AMOUNT_DIFFERS': {
      const expected = num(w.expected)
      const actual = num(w.actual)
      return expected !== null && actual !== null
        ? `${when}invoiced ${formatMoney(actual)}, expected ${formatMoney(expected)}`
        : `${when}invoiced amount differs from the expected amount`
    }
    case 'OTHER_KIND_INVOICE':
      return `${when}an invoice that isn't tuition or subsidy`
    default:
      return `${when}${String((w as { code: string }).code).toLowerCase().replace(/_/g, ' ')}`
  }
}

export const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback

/** Finance conflict codes the backend sends with 409s, each with a short
 *  heading put in front of the server's own explanation. */
const CONFLICT_TITLE: Record<string, string> = {
  CUSTOMER_LINKED: 'That QuickBooks customer is already linked to another family',
  STUDENT_IN_FAMILY: 'That student is already in another family',
  LINK_OVERLAP: 'Those dates overlap another family’s link to this customer',
}

/** The conflict code of a failed finance request, read from the ApiError. */
export const conflictCode = (err: unknown): string | null =>
  isApiError(err) && err.status === 409 ? err.code : null

/**
 * An error for inline display. Known 409 codes get a plain heading; the
 * server's message (which names the other family or the earliest allowed
 * date) follows it unless it says the same thing.
 */
export function financeErrorText(err: unknown, fallback: string): string {
  const message = errorMessage(err, fallback)
  const code = conflictCode(err)
  const title = code ? CONFLICT_TITLE[code] : undefined
  if (!title || message.toLowerCase().includes(title.toLowerCase())) return message
  return message && message !== fallback ? `${title}. ${message}` : `${title}.`
}
