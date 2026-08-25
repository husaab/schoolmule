'use client'

// Labeled "Print" button with a layout menu (By class / By teacher / By day).
// Used in the schedule workspace toolbar and as a compact icon action in the
// Schedules tab rows.

import React, { useEffect, useRef, useState } from 'react'
import { PrinterIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { openSchedulePdf, type SchedulePdfView } from '@/services/schedulePlannerService'
import { useNotificationStore } from '@/store/useNotificationStore'

const OPTIONS: { view: SchedulePdfView; label: string; hint: string }[] = [
  { view: 'class', label: 'By class', hint: 'One page per class' },
  { view: 'teacher', label: 'By teacher', hint: 'One page per teacher' },
  { view: 'day', label: 'By day', hint: 'One page per day, all classes' },
]

interface PrintMenuProps {
  scheduleId: string
  /** Compact icon-only trigger (Schedules tab rows) instead of the labeled button. */
  iconOnly?: boolean
}

const PrintMenu: React.FC<PrintMenuProps> = ({ scheduleId, iconOnly = false }) => {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const showNotification = useNotificationStore((s) => s.showNotification)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const handlePick = async (view: SchedulePdfView) => {
    setOpen(false)
    setBusy(true)
    try {
      await openSchedulePdf(scheduleId, view)
    } catch {
      showNotification('Error exporting PDF', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      {iconOnly ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          disabled={busy}
          title="Print / export PDF"
          className="p-1.5 text-gray-400 hover:text-cyan-600 cursor-pointer disabled:opacity-50"
        >
          <PrinterIcon className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer"
        >
          <PrinterIcon className="h-4 w-4" />
          {busy ? 'Preparing…' : 'Print'}
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <div
          className="absolute right-0 z-20 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {OPTIONS.map((o) => (
            <button
              key={o.view}
              onClick={() => handlePick(o.view)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <div className="text-sm font-medium text-gray-800">{o.label}</div>
              <div className="text-xs text-gray-400">{o.hint}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PrintMenu
