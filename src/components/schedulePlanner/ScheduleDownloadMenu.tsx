'use client'

// Download menu for a teacher's own schedule: a PDF matching the admin print
// output, an .ics for their personal calendar, or the browser's print dialog.

import React, { useEffect, useRef, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'
import { downloadMyScheduleIcs, openMySchedulePdf } from '@/services/schedulePlannerService'
import { useNotificationStore } from '@/store/useNotificationStore'

const ScheduleDownloadMenu: React.FC = () => {
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

  const run = async (action: () => Promise<void>, errorMessage: string) => {
    setOpen(false)
    setBusy(true)
    try {
      await action()
    } catch {
      showNotification(errorMessage, 'error')
    } finally {
      setBusy(false)
    }
  }

  const options = [
    {
      key: 'pdf',
      icon: DocumentArrowDownIcon,
      label: 'Download PDF',
      hint: 'Your week, ready to print',
      onClick: () => run(openMySchedulePdf, 'Error exporting PDF'),
    },
    {
      key: 'ics',
      icon: CalendarDaysIcon,
      label: 'Add to calendar',
      hint: 'An .ics for Google or Apple Calendar',
      onClick: () => run(downloadMyScheduleIcs, 'Error exporting calendar'),
    },
    {
      key: 'print',
      icon: PrinterIcon,
      label: 'Print this page',
      hint: 'Uses your browser',
      onClick: () => {
        setOpen(false)
        window.print()
      },
    },
  ]

  return (
    <div ref={rootRef} className="relative inline-block print:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        {busy ? 'Preparing…' : 'Download'}
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={o.onClick}
              className="flex items-start gap-3 w-full text-left px-3 py-2.5 hover:bg-slate-50 cursor-pointer"
            >
              <o.icon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <span className="block text-sm font-medium text-slate-800">{o.label}</span>
                <span className="block text-xs text-slate-400">{o.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ScheduleDownloadMenu
