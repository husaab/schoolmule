'use client'

// The five numbers an admin checks first. Colour only where a value can be
// bad: overdue money is rose, loose ends are amber; totals stay neutral.

import React from 'react'
import StatTile from '@/components/ui/StatTile'
import type { GridSummary } from '@/services/types/finance'
import { formatMoney, monthMedium } from './format'

interface TuitionSummaryProps {
  summary: GridSummary | null
  asOfMonth: string | null
  grantLabel: string | null
  loading?: boolean
  /** Opens and scrolls to the "Needs attention" panel. */
  onAttentionClick?: () => void
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const TuitionSummary: React.FC<TuitionSummaryProps> = ({ summary, asOfMonth, grantLabel, loading = false, onAttentionClick }) => {
  const s = summary
  const attentionCount = s ? s.unlinkedCustomersWithInvoices + s.studentsWithoutFamily : 0
  const attentionTile = (
    <StatTile
      label="Needs attention"
      value={attentionCount}
      tone={attentionCount > 0 ? 'warn' : 'neutral'}
      sub={
        s
          ? `${plural(s.unlinkedCustomersWithInvoices, 'unlinked customer', 'unlinked customers')} · ${plural(
              s.studentsWithoutFamily,
              'student',
              'students'
            )} without a family`
          : undefined
      }
      loading={loading || !s}
    />
  )
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <StatTile
        label={asOfMonth ? `Collected for ${monthMedium(asOfMonth)}` : 'Collected this month'}
        value={formatMoney(s?.collectedThisMonth)}
        loading={loading || !s}
      />
      <StatTile
        label="Outstanding"
        value={formatMoney(s?.outstanding)}
        sub={s ? `${plural(s.familiesUnpaidThisMonth, 'family', 'families')} unpaid this month` : undefined}
        loading={loading || !s}
      />
      <StatTile
        label="Overdue"
        value={formatMoney(s?.overdueTotal)}
        tone={s && s.overdueTotal > 0 ? 'bad' : s ? 'good' : 'neutral'}
        sub={s ? plural(s.familiesOverdue, 'family', 'families') : undefined}
        loading={loading || !s}
      />
      <StatTile
        label="Subsidy receivable"
        value={formatMoney(s?.subsidyReceivable)}
        sub={grantLabel ?? undefined}
        loading={loading || !s}
      />
      {onAttentionClick && attentionCount > 0 ? (
        <button
          type="button"
          onClick={onAttentionClick}
          title="Show what needs attention"
          className="block h-full w-full rounded-2xl text-left transition-shadow hover:ring-2 hover:ring-amber-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          {attentionTile}
        </button>
      ) : (
        attentionTile
      )}
    </div>
  )
}

export default TuitionSummary
