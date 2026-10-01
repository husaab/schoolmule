'use client'

// The five numbers an admin checks first, for the month picked in the tab
// strip (or the school year so far). School-wide: computed over every family,
// not the filtered grid. Colour only where a value can be bad — overdue money
// is rose; totals stay neutral; a month not invoiced yet reads muted.

import React from 'react'
import StatTile from '@/components/ui/StatTile'
import type { PeriodSummary } from '@/services/types/finance'
import { formatDate, formatMoney, monthAbbr, monthLong } from './format'

interface TuitionSummaryProps {
  summary: PeriodSummary | null
  grantName: string
  loading?: boolean
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const percent = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}% of invoiced` : 'Nothing invoiced')
const GRID = 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5'

const TuitionSummary: React.FC<TuitionSummaryProps> = ({ summary: s, grantName, loading = false }) => {
  if (loading || !s) {
    return (
      <div className={GRID}>
        {['Invoiced', 'Collected', 'Still owed', 'Overdue', `${grantName} grant owed`].map((label) => (
          <StatTile key={label} label={label} value="" loading />
        ))}
      </div>
    )
  }

  if (s.kind === 'ytd') {
    return (
      <div className={GRID}>
        <StatTile label="Invoiced so far" value={formatMoney(s.invoiced)} />
        <StatTile label="Collected" value={formatMoney(s.collected)} sub={percent(s.collected, s.invoiced)} />
        <StatTile
          label="Outstanding"
          value={formatMoney(s.outstanding)}
          sub={`${plural(s.familiesWithBalance, 'family', 'families')} with a balance`}
        />
        <StatTile
          label="Overdue"
          value={formatMoney(s.overdue)}
          tone={s.overdue > 0 ? 'bad' : 'good'}
          sub={plural(s.familiesOverdue, 'family', 'families')}
        />
        <StatTile
          label={`${grantName} grant receivable`}
          value={formatMoney(s.grantReceivable)}
          sub={`${plural(s.grantFamilies, 'family', 'families')} with a balance`}
        />
      </div>
    )
  }

  const mon = monthAbbr(s.month)
  if (!s.hasInvoices) {
    return (
      <div className={GRID}>
        <StatTile label={`Invoiced for ${mon}`} value="Not invoiced yet" tone="muted" sub={`${monthLong(s.month)} invoices are created on the 1st`} />
        <StatTile label="Collected" value="—" tone="muted" />
        <StatTile label={`Still owed for ${mon}`} value="—" tone="muted" />
        <StatTile label="Overdue" value="—" tone="muted" />
        <StatTile label={`${grantName} grant owed`} value="—" tone="muted" />
      </div>
    )
  }

  const { unpaid, partial, paid } = s.counts
  return (
    <div className={GRID}>
      <StatTile
        label={`Invoiced for ${mon}`}
        value={formatMoney(s.invoiced)}
        sub={`${plural(s.familiesInvoiced, 'family', 'families')} invoiced`}
      />
      <StatTile label="Collected" value={formatMoney(s.collected)} sub={percent(s.collected, s.invoiced)} />
      <StatTile
        label={`Still owed for ${mon}`}
        value={formatMoney(s.owed)}
        sub={`${unpaid} unpaid · ${partial} partial · ${paid} paid`}
      />
      <StatTile
        label="Overdue"
        value={formatMoney(s.overdue)}
        tone={s.overdue > 0 ? 'bad' : 'good'}
        sub={
          s.familiesOverdue > 0
            ? plural(s.familiesOverdue, 'family', 'families')
            : s.earliestDue
              ? `due ${formatDate(s.earliestDue)}`
              : 'Nothing overdue'
        }
      />
      <StatTile
        label={`${grantName} grant owed`}
        value={formatMoney(s.grantOwed)}
        sub={`${plural(s.grantFamilies, 'family', 'families')} for ${mon}`}
      />
    </div>
  )
}

export default TuitionSummary
