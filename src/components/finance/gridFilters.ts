// Pure filtering/sorting for the tuition grid. The page reads these values
// from the URL; nothing here touches React.

import type { GridFamily, Ledger } from '@/services/types/finance'
import { cellFor, compareGrades } from './format'

export type StatusFilter = 'all' | 'unpaid' | 'partial' | 'overdue' | 'paid'
export type FlagKey = 'subsidy' | 'teacher' | 'unlinked' | 'attention'
export type SortKey = 'name' | 'balance' | 'overdue'

export const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'partial', label: 'Partial' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
]

export const FLAG_CHIPS: { key: FlagKey; label: string }[] = [
  { key: 'subsidy', label: 'Subsidy' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'unlinked', label: 'Unlinked' },
  { key: 'attention', label: 'Needs attention' },
]

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'balance', label: 'Balance ↓' },
  { key: 'overdue', label: 'Days overdue ↓' },
]

export interface TuitionFilterState {
  month: string
  status: StatusFilter
  flags: FlagKey[]
  grade: string
  q: string
  sort: SortKey
  /** Only families with something overdue by more than this many days. */
  over: number | null
}

const STATUS_KEYS = new Set<string>(STATUS_TABS.map((t) => t.key))
const FLAG_KEYS = new Set<string>(FLAG_CHIPS.map((c) => c.key))
const SORT_KEYS = new Set<string>(SORT_OPTIONS.map((o) => o.key))

/** URL params → filter state; anything unknown falls back to the default. */
export function parseFilters(get: (key: string) => string, months: string[], asOfMonth: string): TuitionFilterState {
  const month = get('month')
  const status = get('status')
  const sort = get('sort')
  const overRaw = Number(get('over'))
  return {
    month: months.includes(month) ? month : asOfMonth,
    status: STATUS_KEYS.has(status) ? (status as StatusFilter) : 'all',
    flags: get('flags')
      .split(',')
      .filter((f): f is FlagKey => FLAG_KEYS.has(f)),
    grade: get('grade'),
    q: get('q'),
    sort: SORT_KEYS.has(sort) ? (sort as SortKey) : 'name',
    over: get('over') !== '' && Number.isFinite(overRaw) && overRaw >= 0 ? Math.floor(overRaw) : null,
  }
}

/** The oldest overdue invoice across the year, in days. */
export const maxDaysOverdue = (family: GridFamily) =>
  Object.values(family.parent.cells).reduce((max, c) => (c.status === 'overdue' ? Math.max(max, c.daysOverdue) : max), 0)

function matchesSearch(family: GridFamily, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const has = (s: string | null | undefined) => !!s && s.toLowerCase().includes(q)
  if (has(family.name) || has(family.customer?.displayName)) return true
  if (family.students.some((s) => has(s.name))) return true
  if (family.contacts.some((c) => has(c.email) || has(c.name))) return true
  const bare = q.replace(/^#/, '').replace(/^auto\s*#?/, '').trim()
  if (!bare) return false
  const invoices = [...Object.values(family.parent.cells).flatMap((c) => c.invoices), ...family.outOfRange]
  return invoices.some((inv) => (inv.docNumber ?? '').toLowerCase().includes(bare) || inv.id.toLowerCase() === bare)
}

function matchesFlags(family: GridFamily, flags: FlagKey[]): boolean {
  return flags.every((flag) => {
    switch (flag) {
      case 'subsidy':
        return family.isSubsidy
      case 'teacher':
        return family.isTeacher
      case 'unlinked':
        return !family.customer
      case 'attention':
        return family.warnings.length > 0
    }
  })
}

/** Everything but the status tab — the tab counts are computed over this. */
export function filterWithoutStatus(families: GridFamily[], f: TuitionFilterState): GridFamily[] {
  return families.filter(
    (fam) =>
      matchesFlags(fam, f.flags) &&
      (!f.grade || fam.students.some((s) => s.grade === f.grade)) &&
      (f.over === null || maxDaysOverdue(fam) > f.over) &&
      matchesSearch(fam, f.q)
  )
}

export function matchesStatus(family: GridFamily, month: string, status: StatusFilter): boolean {
  return status === 'all' || cellFor(family.parent.cells, month).status === status
}

export function statusCounts(families: GridFamily[], month: string): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = { all: families.length, unpaid: 0, partial: 0, overdue: 0, paid: 0 }
  for (const fam of families) {
    const s = cellFor(fam.parent.cells, month).status
    if (s === 'unpaid' || s === 'partial' || s === 'overdue' || s === 'paid') counts[s] += 1
  }
  return counts
}

export function sortFamilies(families: GridFamily[], sort: SortKey): GridFamily[] {
  const byName = (a: GridFamily, b: GridFamily) => a.name.localeCompare(b.name)
  const list = [...families]
  if (sort === 'balance') list.sort((a, b) => b.parent.totals.balance - a.parent.totals.balance || byName(a, b))
  else if (sort === 'overdue') list.sort((a, b) => maxDaysOverdue(b) - maxDaysOverdue(a) || byName(a, b))
  else list.sort(byName)
  return list
}

export function gradeOptions(families: GridFamily[]): string[] {
  const set = new Set<string>()
  for (const fam of families) for (const s of fam.students) if (s.grade) set.add(s.grade)
  return [...set].sort(compareGrades)
}

/** True when any month has an invoice (voided counts — it's still a record). */
export const hasAnyCell = (ledger: Pick<Ledger, 'cells'>) =>
  Object.values(ledger.cells).some((c) => c.status !== 'none')

export interface VisibleTotals {
  byMonth: Record<string, { invoiced: number; paid: number }>
  balance: number
  invoiced: number
  paid: number
}

export function totalsFor(families: GridFamily[], months: string[]): VisibleTotals {
  const byMonth: VisibleTotals['byMonth'] = {}
  for (const m of months) byMonth[m] = { invoiced: 0, paid: 0 }
  let balance = 0
  let invoiced = 0
  let paid = 0
  for (const fam of families) {
    for (const m of months) {
      const c = cellFor(fam.parent.cells, m)
      byMonth[m].invoiced += c.invoiced
      byMonth[m].paid += c.paid
    }
    balance += fam.parent.totals.balance
    invoiced += fam.parent.totals.invoiced
    paid += fam.parent.totals.paid
  }
  return { byMonth, balance, invoiced, paid }
}
