// src/components/classes/items/ScheduleMenu.tsx
// The item form's main action with its split menu (the Teacher-Assign
// board): Assign / Post / Save, and beside it "Schedule…" (a Toronto date and
// time, which must be in the future), "Save draft" and "Discard draft", or
// whatever the item's state calls for.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { isoToTorontoParts, torontoToIso } from '@/lib/itemForm'

export interface ScheduleMenuItem {
  key: string
  label: string
  onSelect: () => void
  tone?: 'default' | 'danger'
}

interface ScheduleMenuProps {
  primaryLabel: string
  onPrimary: () => void
  /** "Schedule…" (or "Change schedule…") in the menu; omit to offer no schedule. */
  scheduleLabel?: string
  onSchedule?: (publishAt: string) => void
  /** The schedule the picker starts on (an ISO time). */
  initialSchedule?: string | null
  items?: ScheduleMenuItem[]
  busy?: boolean
  disabled?: boolean
}

const MENU_ITEM =
  'flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500'

const INPUT =
  'w-full rounded-[10px] border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500'

/** Tomorrow at 7:30 am, Toronto: where a fresh schedule picker starts. */
function defaultSchedule(): { date: string; time: string } {
  const tomorrow = isoToTorontoParts(new Date(Date.now() + 86_400_000).toISOString())
  return { date: tomorrow.date, time: '07:30' }
}

export default function ScheduleMenu({
  primaryLabel,
  onPrimary,
  scheduleLabel,
  onSchedule,
  initialSchedule,
  items = [],
  busy = false,
  disabled = false,
}: ScheduleMenuProps) {
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [when, setWhen] = useState(() => (initialSchedule ? isoToTorontoParts(initialSchedule) : defaultSchedule()))
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const hasMenu = items.length > 0 || Boolean(onSchedule)

  const close = useCallback(() => {
    setOpen(false)
    setPicking(false)
    setError(null)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, close])

  const schedule = () => {
    const iso = torontoToIso(when.date, when.time)
    if (!iso || Date.parse(iso) <= Date.now()) {
      setError('Pick a date and time in the future')
      return
    }
    close()
    onSchedule?.(iso)
  }

  const off = disabled || busy

  return (
    <div ref={ref} className="relative flex">
      <button
        type="button"
        onClick={onPrimary}
        disabled={off}
        className={`inline-flex cursor-pointer items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-[15px] font-medium text-white shadow-sm transition-colors hover:from-cyan-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60 ${
          hasMenu ? 'rounded-l-xl' : 'rounded-xl'
        }`}
      >
        {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
        {primaryLabel}
      </button>
      {hasMenu && (
        <button
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          disabled={off}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Schedule or save draft"
          className="inline-flex cursor-pointer items-center rounded-r-xl border-l border-white/40 bg-teal-500 px-3 text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ChevronDownIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      )}

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-30 w-[min(300px,calc(100vw-32px))] rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
        >
          {onSchedule && !picking && (
            <button type="button" role="menuitem" onClick={() => setPicking(true)} className={`${MENU_ITEM} text-slate-700 hover:bg-slate-50`}>
              {scheduleLabel ?? 'Schedule…'}
            </button>
          )}
          {picking && (
            <div className="flex flex-col gap-2.5 p-2.5">
              <span className="text-[13px] font-medium text-slate-700">Post it on</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  aria-label="Date"
                  value={when.date}
                  onChange={(e) => setWhen((w) => ({ ...w, date: e.target.value }))}
                  className={INPUT}
                />
                <input
                  type="time"
                  aria-label="Time"
                  value={when.time}
                  onChange={(e) => setWhen((w) => ({ ...w, time: e.target.value }))}
                  className={INPUT}
                />
              </div>
              <span className="text-xs text-slate-500">Toronto time</span>
              {error && <p className="text-xs text-rose-700">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPicking(false)}
                  className="cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={schedule}
                  className="cursor-pointer rounded-[10px] bg-cyan-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-cyan-700"
                >
                  Schedule
                </button>
              </div>
            </div>
          )}
          {!picking &&
            items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  close()
                  item.onSelect()
                }}
                className={`${MENU_ITEM} ${item.tone === 'danger' ? 'text-rose-700 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                {item.label}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
