'use client'

// Which staff member the page is about. A searchable list rather than a bare
// <select>: "All staff" is pinned first, and a school with forty names can be
// narrowed by typing. Single-select; the choice lives in the page URL.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline'

export interface StaffOption {
  id: string
  name: string
}

interface StaffPickerProps {
  options: StaffOption[]
  /** Empty string = everyone. */
  value: string
  onChange: (id: string) => void
  className?: string
}

const StaffPicker: React.FC<StaffPickerProps> = ({ options, value, onChange, className = '' }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = options.find((o) => o.id === value) ?? null

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options
    // "All staff" stays first unless the person is clearly typing a name.
    return q ? matches : [{ id: '', name: 'All staff' }, ...matches]
  }, [options, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setCursor(Math.max(0, visible.findIndex((o) => o.id === value)))
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
    // Only when opening: the cursor should land on the current choice once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    setCursor(0)
  }, [query])

  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  const choose = (id: string) => {
    onChange(id)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(visible.length - 1, c + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(0, c - 1))
    } else if (e.key === 'Enter' && visible[cursor]) {
      e.preventDefault()
      choose(visible[cursor].id)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 active:scale-[0.98] ${
          selected
            ? 'border-cyan-300 bg-cyan-50 font-medium text-cyan-800'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
        }`}
      >
        <UsersIcon className="h-4 w-4 shrink-0 opacity-70" />
        <span className="min-w-0 flex-1 truncate text-left">{selected ? selected.name : 'All staff'}</span>
        <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          <label className="relative mb-1.5 block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a staff member"
              aria-label="Find a staff member"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-sm focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </label>
          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto">
            {visible.length === 0 && (
              <li className="px-2 py-3 text-center text-xs text-slate-400">No one matches.</li>
            )}
            {visible.map((option, i) => {
              const on = option.id === value
              return (
                <li key={option.id || '__all'} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onClick={() => choose(option.id)}
                    onMouseEnter={() => setCursor(i)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm cursor-pointer ${
                      i === cursor ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                    } ${option.id === '' ? 'font-medium' : ''}`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center text-cyan-600">
                      {on && <CheckIcon className="h-4 w-4" strokeWidth={2.5} />}
                    </span>
                    <span className="truncate">{option.name}</span>
                    {option.id === '' && (
                      <span className="ml-auto font-mono text-[11px] tabular-nums text-slate-400">{options.length}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default StaffPicker
