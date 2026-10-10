'use client'

// The small "…" control in the corner of a score cell. Hover or focus the
// cell to reveal it; it opens a three-item menu: Mark missing (counts as 0),
// Excuse (never counts) and, when a status is set, Clear status. The cell
// must carry Tailwind's `group` class for the reveal to work.

import React, { useEffect, useRef, useState } from 'react'
import { ArrowPathIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import type { ScoreStatus } from '@/lib/gradeEngine'

interface StatusControlProps {
  /** Accessible name of the cell, e.g. "Student A score for Quiz 1". */
  label: string
  status: ScoreStatus
  /** This cell's round trip is in flight. */
  busy: boolean
  /** Some cell's round trip is in flight, so no second one may start. */
  disabled: boolean
  onSetStatus: (status: ScoreStatus) => void
  /** When set, "Mark missing" asks this question inline before firing (used for whole categories). */
  confirmMissing?: string
}

const itemClass =
  'flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50'

const StatusControl: React.FC<StatusControlProps> = ({ label, status, busy, disabled, onSetStatus, confirmMissing }) => {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = () => {
      setOpen(false)
      setConfirming(false)
    }
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (next: ScoreStatus) => {
    if (next === 'missing' && confirmMissing && !confirming) {
      setConfirming(true)
      return
    }
    setOpen(false)
    setConfirming(false)
    onSetStatus(next)
  }

  return (
    // stopPropagation: category cells open a modal on click.
    <div ref={rootRef} className="absolute right-0.5 top-0.5 z-10" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Change status for ${label}`}
        title="Mark missing, excuse, or clear"
        disabled={disabled && !busy}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-opacity hover:bg-slate-200 disabled:cursor-not-allowed ${
          busy || open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
        }`}
      >
        {busy ? (
          <ArrowPathIcon className="h-3 w-3 animate-spin" />
        ) : (
          <EllipsisHorizontalIcon className="h-3 w-3" />
        )}
      </button>

      {open && confirming && (
        <div
          role="alertdialog"
          className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-rose-200 bg-white p-3 text-left shadow-lg"
        >
          <p className="text-xs text-slate-700">{confirmMissing}</p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700"
              onClick={() => choose('missing')}
            >
              Mark missing
            </button>
          </div>
        </div>
      )}

      {open && !confirming && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {status !== 'missing' && (
            <button type="button" role="menuitem" className={itemClass} onClick={() => choose('missing')}>
              <span>Mark missing</span>
              <kbd className="font-sans text-[10px] text-slate-400">M</kbd>
            </button>
          )}
          {status !== 'excused' && (
            <button type="button" role="menuitem" className={itemClass} onClick={() => choose('excused')}>
              <span>Excuse</span>
              <kbd className="font-sans text-[10px] text-slate-400">X</kbd>
            </button>
          )}
          {status !== 'graded' && (
            <button type="button" role="menuitem" className={itemClass} onClick={() => choose('graded')}>
              <span>Clear status</span>
              <kbd className="font-sans text-[10px] text-slate-400">⌫</kbd>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default StatusControl
