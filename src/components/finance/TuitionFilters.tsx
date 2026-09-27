'use client'

// The grid's toolbar. Every control writes to the URL (via onChange), so
// Back/refresh/share restore the same view. Typed values (search, days
// overdue) are debounced so the URL isn't rewritten on every keystroke.

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import SearchInput from '@/components/teacherAttendance/SearchInput'
import { gradeShort, monthMedium } from './format'
import {
  FLAG_CHIPS,
  SORT_OPTIONS,
  STATUS_TABS,
  type FlagKey,
  type StatusFilter,
  type TuitionFilterState,
} from './gridFilters'

type Patch = Record<string, string | null>

interface TuitionFiltersProps {
  filters: TuitionFilterState
  months: string[]
  asOfMonth: string
  grades: string[]
  counts: Record<StatusFilter, number>
  onChange: (patch: Patch) => void
}

const control =
  'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer'

/** Local draft of a URL value, committed after a pause in typing. Follows the
 *  URL when it changes from elsewhere (e.g. Back), cancelling any pending
 *  commit. The latest `commit` is always used, so a commit never writes a
 *  stale copy of the other params. */
function useDebouncedValue(value: string, commit: (v: string) => void, delay = 300) {
  const [draft, setDraft] = useState(value)
  const [seen, setSeen] = useState(value)
  const [pushed, setPushed] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<string | null>(null)
  const commitRef = useRef(commit)

  useEffect(() => {
    commitRef.current = commit
  })

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    pending.current = null
  }, [])

  // Adjust during render (not in an effect) when the URL moves on its own…
  const [externalChanges, setExternalChanges] = useState(0)
  if (value !== seen) {
    setSeen(value)
    if (value !== pushed) {
      setDraft(value)
      setPushed(value)
      setExternalChanges((n) => n + 1)
    }
  }

  // …and drop a pending commit that would overwrite that outside change.
  useEffect(() => {
    if (externalChanges > 0) cancel()
  }, [externalChanges, cancel])

  useEffect(() => cancel, [cancel])

  const update = (next: string) => {
    setDraft(next)
    if (timer.current) clearTimeout(timer.current)
    pending.current = next
    timer.current = setTimeout(() => {
      timer.current = null
      pending.current = null
      setPushed(next)
      commitRef.current(next)
    }, delay)
  }

  /** Take the uncommitted draft (if any) so another change can include it. */
  const take = (): string | null => {
    const v = pending.current
    if (v === null) return null
    cancel()
    setPushed(v)
    return v
  }

  /** Throw away anything pending and show `v`. */
  const reset = (v: string) => {
    cancel()
    setDraft(v)
    setPushed(v)
  }

  return { draft, update, take, reset }
}

const TuitionFilters: React.FC<TuitionFiltersProps> = ({ filters, months, asOfMonth, grades, counts, onChange: commitChange }) => {
  const qToParam = (v: string) => (v.trim() ? v : null)
  const overToParam = (v: string) => (/^\d+$/.test(v.trim()) ? v.trim() : null)
  const search = useDebouncedValue(filters.q, (v) => commitChange({ q: qToParam(v) }))
  const overDays = useDebouncedValue(filters.over === null ? '' : String(filters.over), (v) => commitChange({ over: overToParam(v) }))

  // Any other control flushes half-typed search / days into the same URL
  // update, so neither a pending commit nor this change clobbers the other.
  const onChange = (patch: Patch) => {
    const extra: Patch = {}
    const q = search.take()
    if (q !== null) extra.q = qToParam(q)
    const o = overDays.take()
    if (o !== null) extra.over = overToParam(o)
    commitChange({ ...extra, ...patch })
  }

  const clearAll = () => {
    search.reset('')
    overDays.reset('')
    commitChange({ month: null, status: null, flags: null, grade: null, q: null, over: null, sort: null })
  }

  const toggleFlag = (flag: FlagKey) => {
    const next = filters.flags.includes(flag) ? filters.flags.filter((f) => f !== flag) : [...filters.flags, flag]
    onChange({ flags: next.length ? next.join(',') : null })
  }

  const isFiltered =
    filters.status !== 'all' ||
    filters.flags.length > 0 ||
    !!filters.grade ||
    !!filters.q ||
    filters.over !== null ||
    filters.month !== asOfMonth ||
    filters.sort !== 'name'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="sr-only sm:not-sr-only">Month</span>
          <select
            value={filters.month}
            onChange={(e) => onChange({ month: e.target.value === asOfMonth ? null : e.target.value })}
            className={control}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthMedium(m)}
                {m === asOfMonth ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Payment status this month">
          {STATUS_TABS.map((t) => {
            const on = filters.status === t.key
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onChange({ status: t.key === 'all' ? null : t.key })}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
                <span className={`rounded-md px-1.5 text-[11px] tabular-nums ${on ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-200/70 text-slate-500'}`}>
                  {counts[t.key]}
                </span>
              </button>
            )
          })}
        </div>

        <SearchInput
          placeholder="Search family, student, email, invoice #"
          value={search.draft}
          onChange={(e) => search.update(e.target.value)}
          className="min-w-0 flex-1 sm:min-w-[260px]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FLAG_CHIPS.map((c) => {
          const on = filters.flags.includes(c.key)
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggleFlag(c.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                on ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          )
        })}

        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          Overdue &gt;
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={overDays.draft}
            onChange={(e) => overDays.update(e.target.value)}
            placeholder="0"
            aria-label="Only families overdue by more than this many days"
            className={`${control} w-16 cursor-text tabular-nums`}
          />
          days
        </label>

        <select
          value={filters.grade}
          onChange={(e) => onChange({ grade: e.target.value || null })}
          aria-label="Grade"
          className={control}
        >
          <option value="">All grades</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              {/^\d+$/.test(g.trim()) ? `Grade ${g}` : gradeShort(g)}
            </option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value === 'name' ? null : e.target.value })}
          aria-label="Sort"
          className={control}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              Sort: {o.label}
            </option>
          ))}
        </select>

        {isFiltered && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

export default TuitionFilters
