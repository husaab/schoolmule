'use client'

// The admin panel's search: type to narrow every tool by name, older names
// and what it does (lib/adminTools searchTools). "/" jumps here from
// anywhere on the page, Enter opens the best match, ↓ moves into the
// results, Esc clears.

import React, { useEffect } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useAnyModalOpen } from '@/components/shared/modal'

interface ToolSearchProps {
  value: string
  onChange: (value: string) => void
  /** Enter: open the best match. */
  onSubmit: () => void
  /** ↓: move into the results. */
  onArrowDown: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

const typingInto = (target: EventTarget | null) => {
  const el = target as HTMLElement | null
  return Boolean(el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)))
}

const ToolSearch: React.FC<ToolSearchProps> = ({ value, onChange, onSubmit, onArrowDown, inputRef }) => {
  const modalOpen = useAnyModalOpen()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || modalOpen || typingInto(e.target)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, inputRef])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onArrowDown()
    } else if (e.key === 'Escape') {
      if (value) {
        e.preventDefault()
        onChange('')
      } else e.currentTarget.blur()
    }
  }

  return (
    <div className="relative w-full sm:w-72">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search tools"
        aria-label="Search admin tools"
        aria-controls="admin-tools"
        autoComplete="off"
        spellCheck={false}
        className="peer w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {!value && (
        <kbd
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-px font-sans text-[11px] font-medium text-slate-400 peer-focus:hidden pointer-coarse:hidden"
          aria-hidden
        >
          /
        </kbd>
      )}
    </div>
  )
}

export default ToolSearch
