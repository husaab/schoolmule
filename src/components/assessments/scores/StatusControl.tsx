'use client'

// The small "…" control in the corner of a score cell. Hover or focus the
// cell to reveal it; on a touch screen (no hover, and Safari never focuses a
// tapped button) it is always shown, and larger. It opens a three-item menu:
// Mark missing (counts as 0), Excuse (never counts) and, when a status is
// set, Clear status. The cell must carry Tailwind's `group` class for the
// reveal to work. A flagged cell's pill can open the same menu (`open`,
// `onOpenChange`, `triggerRef`). The menu opens upward when the grid's scroll
// box has no room for it below, so the bottom row's menu is never cut off.
// The gradebook's grid adds a fourth item (`statsLeftOut`): leave this student
// out of the column's class average, which never changes their own mark.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowPathIcon, CheckIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import type { ScoreStatus } from '@/lib/gradeEngine'

/** The cell's student and the class average of its column. */
export interface StatsLeftOutControl {
  /** 'assessment': left out of this column's average; 'class': of the whole class (changed in the manager); null: counted. */
  state: 'class' | 'assessment' | null
  onToggle: () => void
}

/** A cell's sign that its student is left out of this column's class average. */
export const StatsLeftOutMark: React.FC = () => (
  <span className="absolute bottom-0.5 right-0.5 text-slate-400" title="Left out of this column's class average">
    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5" />
      <path d="M3.2 8.8l5.6-5.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
    <span className="sr-only">Left out of this column&apos;s class average</span>
  </span>
)

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
  /** Controlled open state, for a cell whose own pill also opens the menu. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** That pill: pressing it toggles the menu instead of counting as a press outside. */
  triggerRef?: React.RefObject<HTMLElement | null>
  /** Offers "Leave out of the class average" (the gradebook's grid only). */
  statsLeftOut?: StatsLeftOutControl
}

const itemClass =
  'flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 pointer-coarse:py-2.5 pointer-coarse:text-sm'
const checkItemClass =
  'flex w-full cursor-pointer items-start gap-2.5 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:hover:bg-white pointer-coarse:py-2.5 pointer-coarse:text-sm'

/** The box the menu must fit inside: the nearest ancestor that clips (the grid's scroll box), within the viewport. */
function clipBox(el: HTMLElement): { top: number; bottom: number } {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const style = getComputedStyle(p)
    if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
      const rect = p.getBoundingClientRect()
      return { top: Math.max(rect.top, 0), bottom: Math.min(rect.bottom, window.innerHeight) }
    }
  }
  return { top: 0, bottom: window.innerHeight }
}

const StatusControl: React.FC<StatusControlProps> = ({
  label,
  status,
  busy,
  disabled,
  onSetStatus,
  confirmMissing,
  open: openProp,
  onOpenChange,
  triggerRef,
  statsLeftOut,
}) => {
  const [ownOpen, setOwnOpen] = useState(false)
  const open = openProp ?? ownOpen
  const setOpen = onOpenChange ?? setOwnOpen
  const [confirming, setConfirming] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = () => {
      setOpen(false)
      setConfirming(false)
    }
    // pointerdown, not mousedown: iOS sends no mouse events for a tap on a
    // plain area, so a tap beside the menu would never close it.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || triggerRef?.current?.contains(target)) return
      close()
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen, triggerRef])

  // Measured before paint, so a flipped menu never flashes below first. The
  // flip is a data attribute on the menu itself (its classes read it).
  useLayoutEffect(() => {
    const root = rootRef.current
    const menu = menuRef.current
    if (!open || !root || !menu) return
    const rect = root.getBoundingClientRect()
    const box = clipBox(root)
    const needed = menu.offsetHeight + 4
    const below = box.bottom - rect.bottom
    const above = rect.top - box.top
    menu.dataset.up = String(below < needed && above > below)
  }, [open, confirming])

  const choose = (next: ScoreStatus) => {
    if (next === 'missing' && confirmMissing && !confirming) {
      setConfirming(true)
      return
    }
    setOpen(false)
    setConfirming(false)
    onSetStatus(next)
  }

  const placement = 'mt-1 data-[up=true]:bottom-full data-[up=true]:mb-1 data-[up=true]:mt-0'

  return (
    // stopPropagation: category cells open a modal on click.
    <div ref={rootRef} className="absolute right-0.5 top-0.5 z-10" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Change status for ${label}`}
        title={statsLeftOut ? 'Mark missing, excuse, or leave out of the class average' : 'Mark missing, excuse, or clear'}
        disabled={disabled || busy}
        onClick={() => setOpen(!open)}
        className={`flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-opacity hover:bg-slate-200 disabled:cursor-not-allowed pointer-coarse:h-6 pointer-coarse:w-6 pointer-coarse:bg-slate-200 pointer-coarse:text-slate-600 ${
          busy || open
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100'
        }`}
      >
        {busy ? (
          <ArrowPathIcon className="h-3 w-3 animate-spin pointer-coarse:h-4 pointer-coarse:w-4" />
        ) : (
          <EllipsisHorizontalIcon className="h-3 w-3 pointer-coarse:h-4 pointer-coarse:w-4" />
        )}
      </button>

      {open && confirming && (
        <div
          ref={menuRef}
          role="alertdialog"
          className={`absolute right-0 z-20 w-56 rounded-lg border border-rose-200 bg-white p-3 text-left shadow-lg ${placement}`}
        >
          <p className="text-xs text-slate-700">{confirmMissing}</p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 pointer-coarse:px-3 pointer-coarse:py-2"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 pointer-coarse:px-3 pointer-coarse:py-2"
              onClick={() => choose('missing')}
            >
              Mark missing
            </button>
          </div>
        </div>
      )}

      {open && !confirming && (
        <div
          ref={menuRef}
          role="menu"
          className={`absolute right-0 z-20 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
            statsLeftOut ? 'w-56 pointer-coarse:w-60' : 'w-40 pointer-coarse:w-44'
          } ${placement}`}
        >
          {status !== 'missing' && (
            <button type="button" role="menuitem" className={itemClass} onClick={() => choose('missing')}>
              <span>Mark missing</span>
              <kbd className="font-sans text-[10px] text-slate-400 pointer-coarse:hidden">M</kbd>
            </button>
          )}
          {status !== 'excused' && (
            <button type="button" role="menuitem" className={itemClass} onClick={() => choose('excused')}>
              <span>Excuse</span>
              <kbd className="font-sans text-[10px] text-slate-400 pointer-coarse:hidden">X</kbd>
            </button>
          )}
          {status !== 'graded' && (
            <button type="button" role="menuitem" className={itemClass} onClick={() => choose('graded')}>
              <span>Clear status</span>
              <kbd className="font-sans text-[10px] text-slate-400 pointer-coarse:hidden">⌫</kbd>
            </button>
          )}
          {statsLeftOut && (
            <>
              <div className="my-1 border-t border-slate-100" role="separator" />
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={statsLeftOut.state !== null}
                disabled={statsLeftOut.state === 'class'}
                className={checkItemClass}
                onClick={() => {
                  setOpen(false)
                  statsLeftOut.onToggle()
                }}
              >
                <span
                  className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                    statsLeftOut.state ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {statsLeftOut.state && <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />}
                </span>
                <span>
                  Leave out of the class average
                  <span className="block text-[11px] text-slate-500">
                    {statsLeftOut.state === 'class'
                      ? 'Left out of the whole class. Change it in Who counts.'
                      : 'Their own mark still counts'}
                  </span>
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default StatusControl
