'use client'

// Custom styled dropdown (matches the StudentPicker look) with optional
// type-to-filter. Used for the subject filter in the control bar.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronUpDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export interface DropdownOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  value: string | null
  options: DropdownOption[]
  /** Shown when nothing is selected (also the "clear" option's label). */
  placeholder: string
  onChange: (value: string | null) => void
  ariaLabel: string
  searchable?: boolean
  widthClass?: string
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  value,
  options,
  placeholder,
  onChange,
  ariaLabel,
  searchable = true,
  widthClass = 'w-44',
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && searchable) inputRef.current?.focus()
  }, [open, searchable])

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder

  // The "clear" row plus the filtered options.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
    return [{ value: '', label: placeholder }, ...base]
  }, [options, query, placeholder])

  const choose = (v: string) => {
    onChange(v || null)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={wrapRef} className={`relative ${widthClass}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-2 bg-slate-50 border rounded-xl text-sm font-medium transition-colors ${
          value
            ? 'border-cyan-300 text-cyan-700 ring-1 ring-cyan-100'
            : 'border-slate-200 text-slate-700 hover:border-slate-300'
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronUpDownIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 max-h-80 overflow-y-auto">
          {searchable && (
            <div className="px-2 pb-1.5 sticky top-0 bg-white">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setHighlighted(0)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      setHighlighted((h) => Math.max(h - 1, 0))
                    } else if (e.key === 'Enter') {
                      e.preventDefault()
                      if (filtered[highlighted]) choose(filtered[highlighted].value)
                    } else if (e.key === 'Escape') {
                      setOpen(false)
                    }
                  }}
                  placeholder={`Search ${ariaLabel.toLowerCase()}…`}
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
          {filtered.map((opt, i) => {
            const isSelected = (opt.value || null) === value
            return (
              <button
                key={opt.value || '__all__'}
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(opt.value)
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition-colors ${
                  i === highlighted ? 'bg-cyan-50' : ''
                } ${opt.value === '' ? 'text-slate-500' : 'text-slate-800'}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <CheckIcon className="w-4 h-4 text-cyan-600 flex-shrink-0" />}
              </button>
            )
          })}
          {filtered.length === 1 && query.trim() && (
            <p className="px-3.5 py-2 text-sm text-slate-400">No matches</p>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterDropdown
