// src/components/observe/DataTable.tsx
'use client'
import { ReactNode, useMemo, useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'

export interface Column<T> { key: string; header: string; render: (row: T) => ReactNode; sortValue?: (row: T) => number | string | null; align?: 'left' | 'right'; width?: string }

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  empty?: string
  dense?: boolean
}

export default function DataTable<T>({ columns, rows, rowKey, onRowClick, initialSort, empty = 'Nothing here', dense }: Props<T>) {
  const [sort, setSort] = useState(initialSort ?? null)
  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const sv = col.sortValue
    return [...rows].sort((a, b) => {
      const x = sv(a), y = sv(b)
      if (x === y) return 0
      if (x === null || x === undefined) return 1
      if (y === null || y === undefined) return -1
      const r = x < y ? -1 : 1
      return sort.dir === 'asc' ? r : -r
    })
  }, [rows, sort, columns])

  const toggle = (c: Column<T>) => {
    if (!c.sortValue) return
    setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: 'desc' }))
  }
  const pad = dense ? 'px-3 py-1.5' : 'px-3 py-2.5'

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width }} className={`${pad} font-semibold text-left first:pl-5 last:pr-5 ${c.align === 'right' ? 'text-right' : ''} ${c.sortValue ? 'cursor-pointer select-none hover:text-slate-300' : ''}`} onClick={() => toggle(c)}>
                <span className="inline-flex items-center gap-1">
                  {c.header}
                  {sort?.key === c.key && (sort.dir === 'asc' ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={columns.length} className="px-5 py-8 text-center text-xs text-slate-500">{empty}</td></tr>
          )}
          {sorted.map((r) => (
            <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={`border-t border-white/[0.04] ${onRowClick ? 'cursor-pointer hover:bg-white/[0.03]' : ''}`}>
              {columns.map((c) => (
                <td key={c.key} className={`${pad} first:pl-5 last:pr-5 align-middle ${c.align === 'right' ? 'text-right' : ''}`}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
