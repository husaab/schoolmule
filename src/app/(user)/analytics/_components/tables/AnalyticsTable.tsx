'use client'

// Generic sortable / searchable / CSV-exportable data table for the
// analytics page. Deliberately lightweight — no table library.

import React, { useMemo, useRef, useState } from 'react'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  /** Numeric columns right-align and sort numerically. */
  numeric?: boolean
  /** Hide on small screens. */
  lowPriority?: boolean
  /** Custom cell renderer; falls back to String(value). */
  render?: (row: T) => React.ReactNode
  /** Value accessor for sorting/search/CSV when key isn't a direct field. */
  accessor?: (row: T) => string | number | null
}

interface AnalyticsTableProps<T> {
  title?: string
  subtitle?: string
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  searchable?: boolean
  /** Enables the CSV export button with this filename (no extension). */
  exportFilename?: string
  onRowClick?: (row: T) => void
  emptyMessage?: string
  /** Initial sort */
  defaultSort?: { key: string; dir: 'asc' | 'desc' }
  /** Cap visible rows with a "show all" toggle for very long tables. */
  initialLimit?: number
  headerExtra?: React.ReactNode
}

function getValue<T>(row: T, col: Column<T>): string | number | null {
  if (col.accessor) return col.accessor(row)
  const v = (row as Record<string, unknown>)[col.key]
  if (v == null) return null
  return v as string | number
}

export default function AnalyticsTable<T>({
  title,
  subtitle,
  columns,
  data,
  rowKey,
  searchable = true,
  exportFilename,
  onRowClick,
  emptyMessage = 'No data for this selection',
  defaultSort,
  initialLimit,
  headerExtra,
}: AnalyticsTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSort?.dir ?? 'desc')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 300)
  }

  const handleSort = (col: Column<T>) => {
    if (col.sortable === false) return
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir(col.numeric ? 'desc' : 'asc')
    }
  }

  const processed = useMemo(() => {
    let rows = data
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase()
      rows = rows.filter((row) =>
        columns.some((col) => {
          const v = getValue(row, col)
          return v != null && String(v).toLowerCase().includes(q)
        })
      )
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey)
      if (col) {
        rows = [...rows].sort((a, b) => {
          const va = getValue(a, col)
          const vb = getValue(b, col)
          // Nulls always sink to the bottom regardless of direction.
          if (va == null && vb == null) return 0
          if (va == null) return 1
          if (vb == null) return -1
          const cmp = col.numeric
            ? Number(va) - Number(vb)
            : String(va).localeCompare(String(vb))
          return sortDir === 'asc' ? cmp : -cmp
        })
      }
    }
    return rows
  }, [data, columns, debouncedQuery, sortKey, sortDir])

  const visible = initialLimit && !showAll ? processed.slice(0, initialLimit) : processed

  const exportCsv = () => {
    const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',')
    const body = processed
      .map((row) =>
        columns
          .map((c) => {
            const v = getValue(row, c)
            return `"${String(v ?? '').replace(/"/g, '""')}"`
          })
          .join(',')
      )
      .join('\n')
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportFilename || 'analytics-export'}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {(title || searchable || exportFilename || headerExtra) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-5 pb-3">
          <div className="flex-1 min-w-0">
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerExtra}
          {searchable && (
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search…"
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          )}
          {exportFilename && (
            <button
              onClick={exportCsv}
              aria-label="Export table as CSV"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              CSV
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50 ${
                    col.numeric ? 'text-right' : 'text-left'
                  } ${col.sortable === false ? '' : 'cursor-pointer select-none hover:text-slate-800'} ${
                    col.lowPriority ? 'hidden sm:table-cell' : ''
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key &&
                      (sortDir === 'asc' ? (
                        <ChevronUpIcon className="w-3 h-3" />
                      ) : (
                        <ChevronDownIcon className="w-3 h-3" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-slate-50 odd:bg-white even:bg-slate-50/50 ${
                    onRowClick ? 'cursor-pointer hover:bg-cyan-50/40 transition-colors' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 whitespace-nowrap ${
                        col.numeric ? 'text-right tabular-nums' : 'text-left'
                      } ${col.lowPriority ? 'hidden sm:table-cell' : ''} text-slate-700`}
                    >
                      {col.render ? col.render(row) : (getValue(row, col) ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {initialLimit && processed.length > initialLimit && (
        <div className="p-3 text-center border-t border-slate-50">
          <button
            onClick={() => setShowAll((s) => !s)}
            className="text-sm font-medium text-cyan-600 hover:text-cyan-700"
          >
            {showAll ? 'Show fewer' : `Show all ${processed.length} rows`}
          </button>
        </div>
      )}
    </div>
  )
}
