// The payment field: building its price list, what a family's choice costs,
// and how a payment's state is worded. Pure, so the web and the app share it.
// The server applies the same rules (services/payments/paymentField.js) and
// always works out the total itself.

import type { ChargeStatus, LastPayment, PaymentFieldConfig, PaymentItem, PaymentState } from '@/services/types/registration'
import { addedTaxParts, includedNote, priceWithTax, taxNames } from './paymentTax'

export const MAX_ITEMS = 20
export const MIN_ITEM_CENTS = 50
export const MAX_ITEM_CENTS = 1000000

const CAD = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })

/** Integer cents as dollars, always with two decimals: 2397 → "$23.97". */
export function formatCents(cents: number): string {
  return CAD.format((Number(cents) || 0) / 100)
}

/** An id the server accepts ([A-Za-z0-9_-]), made without crypto so it works in the app too. */
export function newItemId(): string {
  return `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function newPaymentItem(over: Partial<PaymentItem> = {}): PaymentItem {
  return { id: newItemId(), label: '', amountCents: 0, required: true, ...over }
}

export function defaultPaymentConfig(): PaymentFieldConfig {
  return { items: [newPaymentItem()], allowOffline: false, accountingCode: null }
}

/** "25", "25.5", "$1,200.00" → cents; anything else → null. */
export function parseDollars(text: string): number | null {
  const clean = String(text ?? '').replace(/[$,\s]/g, '')
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null
  return Math.round(Number(clean) * 100)
}

/** Cents as the price box shows them: 2500 → "25.00", 0 → "". */
export function centsToInput(cents: number): string {
  return cents > 0 ? (cents / 100).toFixed(2) : ''
}

/** What is wrong with a price list, in the server's words, or null. */
export function paymentConfigProblem(config: PaymentFieldConfig | null | undefined): string | null {
  const items = config?.items ?? []
  if (items.length === 0) return 'A payment field needs at least one item with a price'
  if (items.length > MAX_ITEMS) return `A payment field can list up to ${MAX_ITEMS} items`
  for (const [i, item] of items.entries()) {
    const label = item.label.trim()
    if (!label) return `Item ${i + 1} needs a name`
    if (!Number.isInteger(item.amountCents) || item.amountCents < MIN_ITEM_CENTS || item.amountCents > MAX_ITEM_CENTS) {
      return `“${label}” needs a price between ${formatCents(MIN_ITEM_CENTS)} and ${formatCents(MAX_ITEM_CENTS)}`
    }
  }
  return null
}

/** The price range a family can be charged, with any added tax: required items, up to every item. */
export function priceRange(config: PaymentFieldConfig | null | undefined): { min: number; max: number } {
  const items = config?.items ?? []
  return {
    min: priceWithTax(config, []).totalCents,
    max: priceWithTax(config, items.map((i) => i.id)).totalCents,
  }
}

/**
 * "Parents pay $25.00", "Parents pay $25.00 to $31.00", "Optional, up to $6.00".
 * With tax: "Parents pay $28.25 ($25.00 + $3.25 HST)", "Parents pay $28.25 to
 * $35.03 with HST", "Parents pay $25.00 (includes $2.88 HST)".
 */
export function priceSummary(config: PaymentFieldConfig | null | undefined): string {
  const { min, max } = priceRange(config)
  if (max === 0) return 'No items yet'
  const all = priceWithTax(config, (config?.items ?? []).map((i) => i.id))
  if (all.taxes.length === 0) {
    if (min === 0) return `Optional, up to ${formatCents(max)}`
    return min === max ? `Parents pay ${formatCents(min)}` : `Parents pay ${formatCents(min)} to ${formatCents(max)}`
  }
  const included = all.taxes.every((t) => t.included)
  const names = taxNames(all.taxes)
  if (min === 0) return `Optional, up to ${formatCents(max)}${included ? ` (prices include ${names})` : ` with ${names}`}`
  if (min === max) {
    const note = includedNote(all.taxes)
    return included && note
      ? `Parents pay ${formatCents(all.totalCents)} (${note.charAt(0).toLowerCase()}${note.slice(1)})`
      : `Parents pay ${formatCents(all.totalCents)} (${formatCents(all.subtotalCents)} + ${addedTaxParts(all.taxes)})`
  }
  return `Parents pay ${formatCents(min)} to ${formatCents(max)}${included ? ` (prices include ${names})` : ` with ${names}`}`
}

/** The family's total for what they ticked, with any added tax; required items always count. */
export function selectionTotal(config: PaymentFieldConfig | null | undefined, picked: string[]): number {
  return priceWithTax(config, picked).totalCents
}

// ─── Cash for a student who never submitted the form ─────────────────

/** What to fix before the office records a payment for a student, or null. The server decides. */
export function officePaymentProblem(draft: { studentId: string | null; totalCents: number; amountCents: number | null }): string | null {
  if (!draft.studentId) return 'Choose the student this payment is for.'
  if (draft.totalCents <= 0) return 'Tick what the family is paying for.'
  if (!draft.amountCents || draft.amountCents <= 0) return 'Enter the amount received.'
  if (draft.amountCents > draft.totalCents) return `That’s more than the ${formatCents(draft.totalCents)} owed.`
  return null
}

/**
 * The payment the student already has on this form, when the server refused
 * a second one (409 ALREADY_ON_FORM, `data.chargeId`); otherwise null. Reads
 * the error apiClient throws (its `code` and `data`) without importing it.
 */
export function alreadyOnFormChargeId(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null
  const { code, data } = err as { code?: unknown; data?: unknown }
  if (code !== 'ALREADY_ON_FORM' || !data || typeof data !== 'object') return null
  const chargeId = (data as { chargeId?: unknown }).chargeId
  return typeof chargeId === 'string' && chargeId ? chargeId : null
}

// ─── Wording a payment's state ────────────────────────────────────────

export type PaymentTone = 'good' | 'warning' | 'neutral' | 'danger' | 'info' | 'muted'

const STATUS: Record<ChargeStatus, { label: string; tone: PaymentTone }> = {
  unpaid: { label: 'Unpaid', tone: 'neutral' },
  partially_paid: { label: 'Part paid', tone: 'warning' },
  paid: { label: 'Paid', tone: 'good' },
  partially_refunded: { label: 'Part refunded', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'danger' },
  waived: { label: 'Waived', tone: 'muted' },
  settled: { label: 'Settled', tone: 'good' },
}

export function paymentStatus(status: ChargeStatus, { offline = false, disputed = false } = {}): { label: string; tone: PaymentTone } {
  if (disputed) return { label: 'Disputed', tone: 'danger' }
  if (status === 'unpaid' && offline) return { label: 'Paying at office', tone: 'info' }
  return STATUS[status] ?? { label: status, tone: 'neutral' }
}

/** Whether a dispute is still open (Stripe's statuses). */
export const isOpenDispute = (status: string | null | undefined) => Boolean(status && !['won', 'lost', 'closed', 'warning_closed'].includes(status))

const BRANDS: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover', jcb: 'JCB', unionpay: 'UnionPay', diners: 'Diners', interac: 'Interac' }
const WALLETS: Record<string, string> = { apple_pay: 'Apple Pay', google_pay: 'Google Pay', link: 'Link' }

/** "Visa 4242", "Apple Pay", "Cash", "Cheque", "At the office". */
export function paidWith(p: Pick<LastPayment, 'kind' | 'cardBrand' | 'cardLast4' | 'wallet'> | null | undefined): string {
  if (!p) return ''
  if (p.kind === 'cash') return 'Cash'
  if (p.kind === 'cheque') return 'Cheque'
  if (p.kind === 'other') return 'At the office'
  if (p.wallet && WALLETS[p.wallet]) return WALLETS[p.wallet]
  const brand = (p.cardBrand && BRANDS[p.cardBrand]) || 'Card'
  return p.cardLast4 ? `${brand} ${p.cardLast4}` : brand
}

const KINDS: Record<string, string> = { card: 'Card', cash: 'Cash', cheque: 'Cheque', other: 'Other', waiver: 'Waived', refund: 'Refund' }
export const paymentKindLabel = (kind: string) => KINDS[kind] ?? kind

/** The submissions list's payment filter, worded for who is looking. */
export function paymentFilterOptions(finance: boolean): { value: PaymentState | ''; label: string }[] {
  const base: { value: PaymentState | ''; label: string }[] = [
    { value: '', label: 'Any payment' },
    { value: 'open', label: 'Unpaid' },
  ]
  return finance
    ? [...base, { value: 'paid', label: 'Paid' }, { value: 'waived', label: 'Waived' }, { value: 'refunded', label: 'Refunded' }, { value: 'none', label: 'Nothing to pay' }]
    : [...base, { value: 'settled', label: 'Paid or settled' }, { value: 'refunded', label: 'Refunded' }, { value: 'none', label: 'Nothing to pay' }]
}
