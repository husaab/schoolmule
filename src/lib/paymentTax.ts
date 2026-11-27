// Tax on payments: the tax on a price, what a family pays with it, and how
// tax is worded for families and staff. Pure, so the web and the app share
// it. The server applies the same math and is the authority on every total;
// these only show totals before anything is sent.
//
// A rate is kept in thousandths of a percent (`rateMilli`): 13% is 13000,
// 9.975% is 9975. Money is whole cents. Tax is worked out per line and the
// lines are summed; nothing is rounded at the total.

import type { PaymentFieldConfig, TaxMode } from '@/services/types/registration'
import type { ChargeTax, TaxRate } from '@/services/types/payments'

/** 100%, in thousandths of a percent. */
export const RATE_SCALE = 100000
export const MAX_RATE_NAME = 30
/** The server's words for a rate it won't take. */
export const PERCENT_PROBLEM = 'Enter a rate between 0.001% and 100%'

// The same as paymentField's formatCents, kept here so the two files don't import each other.
const CAD = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })
const money = (cents: number): string => CAD.format((Number(cents) || 0) / 100)

/** Anything but 'included' is 'added', as the server reads it. */
export const taxModeOf = (mode: unknown): TaxMode => (mode === 'included' ? 'included' : 'added')

/**
 * The tax on one price. Added on top: the rate of the price. Included: the
 * part of the price that is tax. No rate, or nothing to tax, is 0.
 */
export function taxFor(amountCents: number, rateMilli: number | null | undefined, mode: TaxMode = 'added'): number {
  const amount = Number(amountCents) || 0
  const rate = Number(rateMilli) || 0
  if (amount <= 0 || rate <= 0) return 0
  return mode === 'included'
    ? amount - Math.round((amount * RATE_SCALE) / (RATE_SCALE + rate))
    : Math.round((amount * rate) / RATE_SCALE)
}

// ─── Rates in words ──────────────────────────────────────────────────

/** A rate as a percent box shows it, without trailing zeros: 13000 → "13", 9975 → "9.975". */
export function percentInput(rateMilli: number): string {
  const milli = Math.round(Number(rateMilli) || 0)
  if (milli <= 0) return '0'
  const whole = Math.floor(milli / 1000)
  const fraction = String(milli % 1000).padStart(3, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : String(whole)
}

/** "13%", "9.975%", "12.5%". */
export const percentLabel = (rateMilli: number): string => `${percentInput(rateMilli)}%`

/**
 * What a person types into a percent box, as thousandths of a percent:
 * "13" → 13000, "9.975" → 9975, "13 %" → 13000. More than 0, at most 100, at
 * most three decimals; anything else is null.
 */
export function parsePercent(text: string | number | null | undefined): number | null {
  const clean = String(text ?? '').replace(/[%\s]/g, '')
  const match = /^(\d*)(?:\.(\d{0,3}))?$/.exec(clean)
  if (!match || (!match[1] && !match[2])) return null
  const milli = Number(match[1] || 0) * 1000 + Number((match[2] || '').padEnd(3, '0'))
  if (!Number.isFinite(milli) || milli <= 0 || milli > RATE_SCALE) return null
  return milli
}

type RateWords = { name: string; rateMilli: number; archived?: boolean }

/** "HST 13%", "HST 13% (removed)" for a rate the school has since removed, "No tax" for none. */
export function rateLabel(rate: RateWords | null | undefined): string {
  if (!rate) return 'No tax'
  return `${rate.name} ${percentLabel(rate.rateMilli)}${rate.archived ? ' (removed)' : ''}`
}

/** A tax row's label, the way Stripe and the receipts name it: "HST (13%)". */
export const taxLineLabel = (tax: { name: string; rateMilli: number }): string => `${tax.name} (${percentLabel(tax.rateMilli)})`

export interface RateDraft {
  name: string
  percentText: string
}

/** What to fix before a rate can be saved, or null. Mirrors the server; it decides. */
export function taxRateProblem(
  draft: RateDraft,
  rates: Pick<TaxRate, 'taxRateId' | 'name' | 'archived'>[] = [],
  editingId: string | null = null,
): string | null {
  const name = draft.name.trim()
  if (!name) return 'Give the rate a name, like HST'
  if (name.length > MAX_RATE_NAME) return `Keep the name to ${MAX_RATE_NAME} characters`
  if (parsePercent(draft.percentText) === null) return PERCENT_PROBLEM
  const twin = rates.find((r) => !r.archived && r.taxRateId !== editingId && r.name.trim().toLowerCase() === name.toLowerCase())
  return twin ? `You already have a rate called ${twin.name}` : null
}

/** What goes to the server as `percent`: the rate as typed, cleaned ("13", "9.975"). */
export const percentForServer = (text: string): string | null => {
  const milli = parsePercent(text)
  return milli === null ? null : percentInput(milli)
}

export interface RateChoice {
  /** A taxRateId, or '' for no tax. */
  value: string
  label: string
}

/**
 * A tax picker's options: "No tax", then the school's live rates. A removed
 * rate shows only when it is the one already chosen, as "HST 13% (removed)".
 * `chosenTax` names that rate when the list doesn't have it.
 */
export function rateChoices(
  rates: (Pick<TaxRate, 'taxRateId' | 'name' | 'rateMilli'> & { archived?: boolean })[],
  chosenId?: string | null,
  chosenTax?: { name: string; rateMilli: number } | null,
): RateChoice[] {
  const live = rates.filter((r) => !r.archived)
  const choices: RateChoice[] = [{ value: '', label: 'No tax' }, ...live.map((r) => ({ value: r.taxRateId, label: rateLabel(r) }))]
  if (chosenId && !live.some((r) => r.taxRateId === chosenId)) {
    const known = rates.find((r) => r.taxRateId === chosenId) ?? chosenTax
    choices.push({ value: chosenId, label: known ? rateLabel({ name: known.name, rateMilli: known.rateMilli, archived: true }) : 'A removed rate' })
  }
  return choices
}

// ─── Totals ──────────────────────────────────────────────────────────

export interface PriceWithTax {
  /** The prices as typed, summed. */
  subtotalCents: number
  /** One entry per rate, largest first. Empty when nothing is taxed. */
  taxes: ChargeTax[]
  /** The tax that goes on top of the subtotal (0 when tax is included). */
  taxAddedCents: number
  /** What the family pays. */
  totalCents: number
}

export interface TaxedLine {
  amountCents: number
  tax?: { name: string; rateMilli: number } | null
}

const largestFirst = (a: ChargeTax, b: ChargeTax) => b.cents - a.cents || a.name.localeCompare(b.name) || b.rateMilli - a.rateMilli

/** Lines priced as typed, with their tax worked out one line at a time and summed by rate. */
export function linesWithTax(lines: TaxedLine[], mode: TaxMode = 'added'): PriceWithTax {
  const byRate = new Map<string, ChargeTax>()
  let subtotalCents = 0
  for (const line of lines) {
    subtotalCents += line.amountCents
    if (!line.tax) continue
    const cents = taxFor(line.amountCents, line.tax.rateMilli, mode)
    if (cents <= 0) continue
    const key = `${line.tax.name}\u0000${line.tax.rateMilli}`
    const entry = byRate.get(key) ?? { name: line.tax.name, rateMilli: line.tax.rateMilli, cents: 0, included: mode === 'included' }
    entry.cents += cents
    byRate.set(key, entry)
  }
  const taxes = [...byRate.values()].sort(largestFirst)
  const taxAddedCents = mode === 'added' ? taxes.reduce((sum, t) => sum + t.cents, 0) : 0
  return { subtotalCents, taxes, taxAddedCents, totalCents: subtotalCents + taxAddedCents }
}

/** What a family pays for what they ticked on a payment field; required items always count. */
export function priceWithTax(config: PaymentFieldConfig | null | undefined, pickedIds: string[] = []): PriceWithTax {
  const picked = new Set(pickedIds)
  const lines = (config?.items ?? []).filter((i) => i.required || picked.has(i.id))
  return linesWithTax(lines, taxModeOf(config?.taxMode))
}

/** Whether any item on a payment field names a tax rate. */
export const fieldHasTax = (config: PaymentFieldConfig | null | undefined): boolean =>
  (config?.items ?? []).some((i) => Boolean(i.taxRateId || i.tax))

// ─── Showing tax ─────────────────────────────────────────────────────

const andList = (parts: string[]): string =>
  parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`

const shown = (taxes: ChargeTax[] | null | undefined) => (taxes ?? []).filter((t) => t.cents > 0)

/** The taxes' names once each: "HST", "GST and PST". */
export const taxNames = (taxes: ChargeTax[] | null | undefined): string =>
  andList([...new Set(shown(taxes).map((t) => t.name))])

/** Added tax as a sum: "$3.25 HST", "$1.25 GST + $2.00 PST". */
export const addedTaxParts = (taxes: ChargeTax[] | null | undefined): string =>
  shown(taxes).filter((t) => !t.included).map((t) => `${money(t.cents)} ${t.name}`).join(' + ')

/** "Includes $2.88 HST", "Includes $1.10 GST and $1.75 PST", or null when no tax is in the prices. */
export function includedNote(taxes: ChargeTax[] | null | undefined): string | null {
  const parts = shown(taxes).filter((t) => t.included).map((t) => `${money(t.cents)} ${t.name}`)
  return parts.length ? `Includes ${andList(parts)}` : null
}

export interface TaxBreakdown {
  /** Whether there is any tax to show. Without it, show the total alone, as for any untaxed payment. */
  hasTax: boolean
  /** The total less the added tax: the "Subtotal" row. */
  subtotalCents: number
  /** One row per added rate, "HST (13%)". Empty when no tax is added. */
  addedRows: { label: string; cents: number }[]
  /** One line under the total for tax already in the prices. */
  includedNote: string | null
  totalCents: number
}

/**
 * How a total's tax shows under its items: when tax is added, Subtotal, a row
 * per rate, then Total; when included, a line under the total. `totalCents`
 * is what the family owes, with any added tax.
 */
export function taxBreakdown(totalCents: number, taxes: ChargeTax[] | null | undefined): TaxBreakdown {
  const list = shown(taxes)
  const added = list.filter((t) => !t.included)
  const addedCents = added.reduce((sum, t) => sum + t.cents, 0)
  return {
    hasTax: list.length > 0,
    subtotalCents: totalCents - addedCents,
    addedRows: added.map((t) => ({ label: taxLineLabel(t), cents: t.cents })),
    includedNote: includedNote(list),
    totalCents,
  }
}

/**
 * Whether the ledger shows its Tax column and filter: once the school has a
 * rate, or when a payment on screen has tax (a rate since removed). A school
 * that never set up tax sees the ledger as before.
 */
export const ledgerShowsTax = (rateCount: number, rows: { taxCents?: number | null }[] | null | undefined): boolean =>
  rateCount > 0 || (rows ?? []).some((r) => (r.taxCents ?? 0) > 0)
