'use client'

// Labeled "Print" button with a layout menu (By class / By teacher / By day).
// "By class" and "By teacher" open a second-level picker: the whole set as
// one document, or a single class/teacher as its own PDF. Used in the
// schedule workspace toolbar and as a compact icon action in Schedules rows.

import React, { useEffect, useRef, useState } from 'react'
import { PrinterIcon, ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import {
  openSchedulePdf,
  type SchedulePdfView,
  type SchedulePdfFilter,
} from '@/services/schedulePlannerService'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { ClassGroup, PlannerTeacher } from '@/services/types/schedulePlanner'

const OPTIONS: { view: SchedulePdfView; label: string; hint: string }[] = [
  { view: 'class', label: 'By class', hint: 'One page per class' },
  { view: 'teacher', label: 'By teacher', hint: 'One page per teacher' },
  { view: 'day', label: 'By day', hint: 'One page per day, all classes' },
]

interface PrintMenuProps {
  scheduleId: string
  /** Compact icon-only trigger (Schedules tab rows) instead of the labeled button. */
  iconOnly?: boolean
  /** When given, "By teacher" expands into a per-teacher picker. */
  teachers?: PlannerTeacher[]
  /** When given, "By class" expands into a per-class picker. */
  classGroups?: ClassGroup[]
}

const PrintMenu: React.FC<PrintMenuProps> = ({
  scheduleId,
  iconOnly = false,
  teachers,
  classGroups,
}) => {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  /** Second level of the menu: pick one entity instead of printing them all. */
  const [picker, setPicker] = useState<'teacher' | 'class' | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const showNotification = useNotificationStore((s) => s.showNotification)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setPicker(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const handlePick = async (view: SchedulePdfView, filter?: SchedulePdfFilter) => {
    setOpen(false)
    setPicker(null)
    setBusy(true)
    try {
      await openSchedulePdf(scheduleId, view, filter)
    } catch {
      showNotification('Error exporting PDF', 'error')
    } finally {
      setBusy(false)
    }
  }

  const hasPicker = (view: SchedulePdfView) =>
    (view === 'teacher' && !!teachers?.length) || (view === 'class' && !!classGroups?.length)

  const pickerEntries =
    picker === 'teacher'
      ? (teachers ?? []).map((t) => ({ id: t.plannerTeacherId, name: t.displayName }))
      : (classGroups ?? []).map((g) => ({ id: g.classGroupId, name: g.name }))

  const toggleOpen = () => {
    setPicker(null)
    setOpen((v) => !v)
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      {iconOnly ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleOpen()
          }}
          disabled={busy}
          title="Print / export PDF"
          className="p-1.5 text-gray-400 hover:text-cyan-600 cursor-pointer disabled:opacity-50"
        >
          <PrinterIcon className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={toggleOpen}
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
          {picker ? (
            <>
              <button
                onClick={() => setPicker(null)}
                className="flex items-center gap-1 w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" /> Back
              </button>
              <button
                onClick={() => handlePick(picker)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
              >
                <div className="text-sm font-medium text-gray-800">
                  {picker === 'teacher' ? 'All teachers' : 'All classes'}
                </div>
                <div className="text-xs text-gray-400">One document, a page each</div>
              </button>
              <div className="max-h-64 overflow-y-auto">
                {pickerEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() =>
                      handlePick(
                        picker,
                        picker === 'teacher' ? { teacherId: entry.id } : { classGroupId: entry.id }
                      )
                    }
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer truncate"
                  >
                    {entry.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            OPTIONS.map((o) => (
              <button
                key={o.view}
                onClick={() =>
                  hasPicker(o.view) ? setPicker(o.view as 'teacher' | 'class') : handlePick(o.view)
                }
                className="w-full text-left px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <div className="text-sm font-medium text-gray-800">{o.label}</div>
                <div className="text-xs text-gray-400">
                  {hasPicker(o.view) ? 'All, or pick one' : o.hint}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default PrintMenu
