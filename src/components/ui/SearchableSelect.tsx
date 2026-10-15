'use client'

// A drop-in for a filter <select> whose list is long enough to want typing:
// the "all" option is pinned first, the rest narrow as you type. Single-select;
// an empty string value means "all". Keyboard: ↓ opens, ↑/↓ move, Enter picks,
// Esc closes.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export interface SearchableOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableOption[]
  /** Empty string = the "all" option. */
  value: string
  onChange: (value: string) => void
  allLabel: string
  searchPlaceholder?: string
  /** 'sm' matches the compact h-9 controls used in panels (messages, announcements). */
  size?: 'md' | 'sm'
  className?: string
}

const TRIGGER = {
  md: 'border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 bg-slate-50 focus:ring-cyan-500',
  sm: 'h-9 border border-slate-200 rounded-lg px-2.5 text-slate-700 bg-white focus:ring-cyan-200',
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  allLabel,
  searchPlaceholder = 'Search…',
  size = 'md',
  className = '',
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selected = options.find((o) => o.value === value) ?? null

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
    return q ? matches : [{ value: '', label: allLabel }, ...matches]
  }, [options, query, allLabel])

  // Reset the search on close so the next open starts on the current choice.
  const close = (refocus: boolean) => {
    setOpen(false)
    setQuery('')
    if (refocus) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    setCursor(Math.max(0, visible.findIndex((o) => o.value === value)))
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false)
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

  const choose = (next: string) => {
    onChange(next)
    close(true)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      close(true)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(visible.length - 1, c + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(0, c - 1))
    } else if (e.key === 'Enter' && visible[cursor]) {
      e.preventDefault()
      choose(visible[cursor].value)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close(false) : setOpen(true))}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:border-transparent ${TRIGGER[size]}`}
      >
        <span className="min-w-0 flex-1 truncate text-left">{selected ? selected.label : allLabel}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 min-w-[16rem] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          <label className="relative mb-1.5 block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-sm text-slate-900 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </label>
          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto">
            {visible.length === 0 && (
              <li className="px-2 py-3 text-center text-xs text-slate-400">No matches.</li>
            )}
            {visible.map((option, i) => {
              const on = option.value === value
              return (
                <li key={option.value || '__all'} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onClick={() => choose(option.value)}
                    onMouseEnter={() => setCursor(i)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm cursor-pointer ${
                      i === cursor ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                    } ${option.value === '' ? 'font-medium' : ''}`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center text-cyan-600">
                      {on && <CheckIcon className="h-4 w-4" strokeWidth={2.5} />}
                    </span>
                    <span className="truncate">{option.label}</span>
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

export default SearchableSelect
