'use client'

// The app's dropdown for filters and pickers (class, student, teacher, subject,
// grade, term…), in place of a native <select>. Single-select. With `allLabel`,
// an "all" row (value '') is pinned first; without it a choice is required and
// `placeholder` shows until one is made. The search box appears once the list
// is long enough to want typing. Keyboard: ↓ opens, ↑/↓ move, Enter picks,
// Esc closes. The list renders in a body portal (fixed, flipped upward when
// there's no room below) so modals and overflow-hidden cards never clip it.

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  /** Label of the pinned "all" row (value ''). Omit when a choice is required. */
  allLabel?: string
  /** Trigger text while nothing is chosen (no allLabel). */
  placeholder?: string
  searchPlaceholder?: string
  /** Accessible name for the trigger when there's no visible <label>. */
  ariaLabel?: string
  disabled?: boolean
  /** Show the search box once there are at least this many options. */
  searchThreshold?: number
  /** 'sm' matches the compact h-9 controls used in panels (messages, announcements). */
  size?: 'md' | 'sm'
  className?: string
  /** Replaces the size preset's trigger styling. */
  triggerClassName?: string
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
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  ariaLabel,
  disabled = false,
  searchThreshold = 8,
  size = 'md',
  className = '',
  triggerClassName,
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<React.CSSProperties | null>(null)
  // Hover moves the highlight but must not scroll the list under the pointer.
  const hoverRef = useRef(false)

  const selected = options.find((o) => o.value === value) ?? null
  const searchable = options.length >= searchThreshold
  const triggerText = selected ? selected.label : allLabel ?? placeholder

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
    return q || allLabel === undefined ? matches : [{ value: '', label: allLabel }, ...matches]
  }, [options, query, allLabel])

  // Reset the search on close so the next open starts on the current choice.
  const close = (refocus: boolean) => {
    setOpen(false)
    setQuery('')
    setPos(null)
    if (refocus) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    setCursor(Math.max(0, visible.findIndex((o) => o.value === value)))
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!rootRef.current?.contains(t) && !panelRef.current?.contains(t)) close(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
    // Only when opening: the cursor should land on the current choice once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Anchor the portal panel to the trigger; follow scrolls/resizes while open.
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect()
      if (!r) return
      const width = Math.max(r.width, 256)
      const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8))
      const below = window.innerHeight - r.bottom
      const up = below < 320 && r.top > below
      setPos(up ? { left, width, bottom: window.innerHeight - r.top + 8 } : { left, width, top: r.bottom + 8 })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    setCursor(0)
  }, [query])

  useEffect(() => {
    if (hoverRef.current) {
      hoverRef.current = false
      return
    }
    const el = listRef.current?.children[cursor] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  // Tabbing out (focus leaves both the trigger and the portal panel) closes.
  const onBlur = (e: React.FocusEvent) => {
    const next = e.relatedTarget as Node | null
    if (open && next && !rootRef.current?.contains(next) && !panelRef.current?.contains(next)) close(false)
  }

  const choose = (next: string) => {
    onChange(next)
    close(true)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' && !disabled) {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      // Close only the list, not a surrounding modal.
      e.stopPropagation()
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
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown} onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close(false) : setOpen(true))}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex w-full items-center gap-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${triggerClassName ?? TRIGGER[size]}`}
      >
        <span className={`min-w-0 flex-1 truncate text-left ${!selected && allLabel === undefined ? 'text-slate-400' : ''}`}>{triggerText}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', ...pos }}
          className="z-[100] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          {searchable && (
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
          )}
          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto">
            {visible.length === 0 && (
              <li className="px-2 py-3 text-center text-xs text-slate-400">No matches.</li>
            )}
            {visible.map((option, i) => {
              const on = option.value === value
              return (
                <li key={option.value === '' ? '__all' : option.value} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onClick={() => choose(option.value)}
                    onMouseEnter={() => {
                      hoverRef.current = true
                      setCursor(i)
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm cursor-pointer ${
                      i === cursor ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                    } ${option.value === '' && allLabel !== undefined ? 'font-medium' : ''}`}
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
        </div>,
        document.body,
      )}
    </div>
  )
}

export default SearchableSelect
