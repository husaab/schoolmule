'use client'

// The tuition page's one month control: a tab per school-year month plus
// "Year to date". It drives the summary tiles, the status tabs and the
// highlighted grid column. The current month carries a NOW marker; months
// with no invoices yet stay selectable but read muted.

import React from 'react'
import type { TuitionPeriod } from '@/services/types/finance'
import { monthAbbr, monthLong } from './format'
import { YTD } from './monthSummary'

interface MonthTabsProps {
  months: string[]
  asOfMonth: string
  selected: TuitionPeriod
  /** Months that have at least one invoice. */
  invoiced: Set<string>
  onSelect: (period: TuitionPeriod) => void
}

const TAB =
  'flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'
const ON = 'bg-white text-slate-900 shadow-sm'

const MonthTabs: React.FC<MonthTabsProps> = ({ months, asOfMonth, selected, invoiced, onSelect }) => (
  <div className="max-w-full overflow-x-auto" role="group" aria-label="Month to view">
    <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
      {months.map((m) => {
        const on = selected === m
        const now = m === asOfMonth
        const empty = !invoiced.has(m)
        return (
          <button
            key={m}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(m)}
            title={`${monthLong(m)}${empty ? ' — not invoiced yet' : ''}`}
            className={`${TAB} ${on ? ON : empty ? 'text-slate-400 hover:text-slate-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {monthAbbr(m)}
            {now && (
              <span className={`rounded px-1 text-[9px] font-bold tracking-wider ${on ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-100/70 text-cyan-700'}`}>
                NOW
              </span>
            )}
          </button>
        )
      })}
      <span className="my-2 w-px shrink-0 bg-slate-200" aria-hidden />
      <button
        type="button"
        aria-pressed={selected === YTD}
        onClick={() => onSelect(YTD)}
        className={`${TAB} ${selected === YTD ? ON : 'text-slate-600 hover:text-slate-900'}`}
      >
        Year to date
      </button>
    </div>
  </div>
)

export default MonthTabs
