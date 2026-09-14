'use client'

// A multi-select for the schedule toolbar: a button that names the facet
// and how many values are chosen, opening a checklist. Kept deliberately
// small — the facets here are a dozen grades or twenty teachers, not
// thousands of rows.

import React, { useEffect, useRef, useState } from 'react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface FilterMenuProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

const FilterMenu: React.FC<FilterMenuProps> = ({ label, options, selected, onChange }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])

  const active = selected.length > 0
  const visible = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
          active
            ? 'border-cyan-300 bg-cyan-50 text-cyan-800 font-medium'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
        }`}
      >
        {label}
        {active && (
          <span className="rounded-full bg-cyan-600 px-1.5 text-[11px] font-semibold leading-4 text-white">
            {selected.length}
          </span>
        )}
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          {options.length > 8 && (
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Find a ${label.toLowerCase().replace(/s$/, '')}`}
              className="mb-2 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          )}
          <ul role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto">
            {visible.length === 0 && (
              <li className="px-2 py-3 text-center text-xs text-slate-400">Nothing matches.</li>
            )}
            {visible.map((option) => {
              const checked = selected.includes(option)
              return (
                <li key={option} role="option" aria-selected={checked}>
                  <button
                    type="button"
                    onClick={() => toggle(option)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {checked && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="truncate">{option}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {active && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-cyan-700 hover:bg-cyan-50 cursor-pointer"
            >
              Clear {label.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterMenu
