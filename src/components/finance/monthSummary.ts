// Pure maths for the tuition summary tiles and the month tab strip. The
// server's `grid.summary` is pinned to the current month; these recompute the
// same school-wide figures (every family, never the filtered set) for any
// month, or for the school year so far. Only type imports, so it stays
// trivially testable on its own.

import type {
  Cell,
  GridFamily,
  Ledger,
  MonthPeriodSummary,
  PeriodStatus,
  PeriodSummary,
  TuitionGrid,
  TuitionPeriod,
  YtdPeriodSummary,
} from '@/services/types/finance'

export const YTD: TuitionPeriod = 'ytd'

const OWED = 0.005
const cents = (n: number) => Math.round(n * 100) / 100
const billed = (c: Cell | undefined): c is Cell => !!c && c.status !== 'none'

/** URL value → period: a known month, 'ytd', or else the current month. */
export function parsePeriod(raw: string, months: string[], asOfMonth: string): TuitionPeriod {
  return raw === YTD || months.includes(raw) ? raw : asOfMonth
}

/**
 * A family's status across the whole year: overdue if any month is overdue;
 * else paid when something was invoiced and nothing is owed; else partial
 * when something was paid; else unpaid when something was invoiced.
 */
export function ytdStatus(ledger: Ledger): PeriodStatus {
  if (Object.values(ledger.cells).some((c) => c.status === 'overdue')) return 'overdue'
  const t = ledger.totals
  if (t.invoiced > 0 && t.balance <= OWED) return 'paid'
  if (t.paid > OWED) return 'partial'
  if (t.invoiced > 0) return 'unpaid'
  return 'none'
}

/** A family's status for the viewed period (voided months count as none). */
export function periodStatus(ledger: Ledger, period: TuitionPeriod): PeriodStatus {
  if (period === YTD) return ytdStatus(ledger)
  const s = ledger.cells[period]?.status ?? 'none'
  return s === 'voided' ? 'none' : s
}

/** Months with at least one invoice (any family, or the grant). */
export function invoicedMonths(grid: Pick<TuitionGrid, 'months' | 'families' | 'grant'>): Set<string> {
  const out = new Set<string>()
  for (const m of grid.months) {
    if (billed(grid.grant.cells[m]) || grid.families.some((f) => billed(f.parent.cells[m]))) out.add(m)
  }
  return out
}

function summarizeMonth(families: GridFamily[], grant: TuitionGrid['grant'], month: string): MonthPeriodSummary {
  let invoiced = 0
  let collected = 0
  let owed = 0
  let overdue = 0
  let familiesInvoiced = 0
  let familiesOverdue = 0
  let hasInvoices = billed(grant.cells[month])
  let earliestDue: string | null = null
  const counts = { unpaid: 0, partial: 0, paid: 0 }
  for (const fam of families) {
    const c = fam.parent.cells[month]
    if (!billed(c)) continue
    hasInvoices = true
    invoiced += c.invoiced
    collected += c.paid
    owed += c.balance
    if (c.invoiced > 0) familiesInvoiced += 1
    if (c.status === 'overdue') {
      overdue += c.balance
      familiesOverdue += 1
    } else if (c.status === 'unpaid' || c.status === 'partial' || c.status === 'paid') {
      counts[c.status] += 1
    }
    for (const inv of c.invoices) {
      if (inv.voided || inv.deleted || !inv.dueDate) continue
      if (earliestDue === null || inv.dueDate < earliestDue) earliestDue = inv.dueDate
    }
  }
  return {
    kind: 'month',
    month,
    hasInvoices,
    invoiced: cents(invoiced),
    collected: cents(collected),
    owed: cents(owed),
    overdue: cents(overdue),
    familiesInvoiced,
    familiesOverdue,
    counts,
    earliestDue,
    grantOwed: cents(grant.cells[month]?.balance ?? 0),
    grantFamilies: grant.byFamily.filter((f) => billed(f.cells[month])).length,
  }
}

function summarizeYtd(families: GridFamily[], grant: TuitionGrid['grant']): YtdPeriodSummary {
  let invoiced = 0
  let collected = 0
  let outstanding = 0
  let overdue = 0
  let familiesWithBalance = 0
  let familiesOverdue = 0
  for (const fam of families) {
    const t = fam.parent.totals
    invoiced += t.invoiced
    collected += t.paid
    outstanding += t.balance
    overdue += t.overdueBalance
    if (t.balance > OWED) familiesWithBalance += 1
    if (t.overdueBalance > OWED) familiesOverdue += 1
  }
  return {
    kind: 'ytd',
    invoiced: cents(invoiced),
    collected: cents(collected),
    outstanding: cents(outstanding),
    familiesWithBalance,
    overdue: cents(overdue),
    familiesOverdue,
    grantReceivable: cents(grant.totals.balance),
    grantFamilies: grant.byFamily.filter((f) => f.totals.balance > OWED).length,
  }
}

/** The summary tiles for a month or the year so far, over every family. */
export function summarizePeriod(grid: Pick<TuitionGrid, 'families' | 'grant'>, period: TuitionPeriod): PeriodSummary {
  return period === YTD ? summarizeYtd(grid.families, grid.grant) : summarizeMonth(grid.families, grid.grant, period)
}
