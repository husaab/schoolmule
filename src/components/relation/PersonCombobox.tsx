'use client'

// Typeahead person picker shared by the relation modals — searches a list of
// people and collapses into a removable chip once one is selected.
// If the in-modal dropdown ever feels cramped, switch to fixed positioning
// from getBoundingClientRect (mini-portal) instead of absolute.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MagnifyingGlassIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface ComboOption {
  id: string
  primary: string
  secondary?: string
}

interface PersonComboboxProps {
  options: ComboOption[]
  selected: ComboOption | null
  onSelect: (opt: ComboOption) => void
  onClear?: () => void
  placeholder: string
  loading?: boolean
  searchKeys?: (opt: ComboOption) => string
}

const PersonCombobox: React.FC<PersonComboboxProps> = ({
  options,
  selected,
  onSelect,
  onClear,
  placeholder,
  loading = false,
  searchKeys,
}) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Inside a scrollable modal the dropdown can open below the fold — reveal it
  useEffect(() => {
    if (open) dropdownRef.current?.scrollIntoView({ block: 'nearest' })
  }, [open])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    const keyOf = searchKeys ?? ((opt: ComboOption) => opt.primary)
    return options.filter((opt) => keyOf(opt).toLowerCase().includes(q))
  }, [options, query, searchKeys])

  const pick = (opt: ComboOption) => {
    onSelect(opt)
    setQuery('')
    setOpen(false)
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-4 h-4 text-cyan-700" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-slate-900 truncate">{selected.primary}</span>
            {selected.secondary && (
              <span className="block text-xs text-slate-500 truncate">{selected.secondary}</span>
            )}
          </span>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selection"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-cyan-100 transition-colors cursor-pointer flex-shrink-0"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setHighlighted(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlighted((h) => Math.min(h + 1, matches.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlighted((h) => Math.max(h - 1, 0))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            pick(matches[highlighted])
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      />

      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 max-h-56 overflow-y-auto"
        >
          {loading ? (
            <p className="px-3.5 py-3 text-sm text-slate-400">Loading…</p>
          ) : matches.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-slate-400">
              {query.trim() ? `No matches for “${query.trim()}”` : 'No options available'}
            </p>
          ) : (
            matches.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(opt)
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors cursor-pointer ${
                  i === highlighted ? 'bg-cyan-50' : ''
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-3.5 h-3.5 text-cyan-700" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-900 truncate">{opt.primary}</span>
                  {opt.secondary && (
                    <span className="block text-xs text-slate-500 truncate">{opt.secondary}</span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default PersonCombobox
