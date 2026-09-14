'use client'

// Labeled "Download" button with a format switch (PDF / PNG / Word) above a
// layout menu (By class / By teacher / By day). "By class" and "By teacher"
// open a second-level picker: the whole set as one document, or a single
// class/teacher on its own. Used in the schedule workspace toolbar and as a
// compact icon action in Schedules rows.

import React, { useEffect, useRef, useState } from 'react'
import { ArrowDownTrayIcon, ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import {
  exportSchedule,
  type ScheduleExportFormat,
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

const FORMATS: { format: ScheduleExportFormat; label: string; allHint: string }[] = [
  { format: 'pdf', label: 'PDF', allHint: 'One document, a page each' },
  { format: 'png', label: 'PNG', allHint: 'A .zip with an image each' },
  { format: 'docx', label: 'Word', allHint: 'One document, a table each' },
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
  const [format, setFormat] = useState<ScheduleExportFormat>('pdf')
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

  const formatInfo = FORMATS.find((f) => f.format === format)!

  /** `name` is the single class/teacher picked, used for the downloaded file's name. */
  const handlePick = async (view: SchedulePdfView, filter?: SchedulePdfFilter, name?: string) => {
    setOpen(false)
    setPicker(null)
    setBusy(true)
    try {
      await exportSchedule(scheduleId, format, view, filter, name ? `schedule_${name}` : `schedule_by_${view}`)
    } catch {
      showNotification(`Error exporting ${formatInfo.label}`, 'error')
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
          title="Download as PDF, PNG or Word"
          className="p-1.5 text-gray-400 hover:text-cyan-600 cursor-pointer disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={toggleOpen}
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          {busy ? 'Preparing…' : 'Download'}
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <div
          className="absolute right-0 z-20 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-0.5 mx-2 mt-1 mb-1.5 p-0.5 rounded-md bg-gray-100" role="radiogroup" aria-label="File format">
            {FORMATS.map((f) => (
              <button
                key={f.format}
                role="radio"
                aria-checked={format === f.format}
                onClick={() => setFormat(f.format)}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium cursor-pointer transition ${
                  format === f.format ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
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
                <div className="text-xs text-gray-400">{formatInfo.allHint}</div>
              </button>
              <div className="max-h-64 overflow-y-auto">
                {pickerEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() =>
                      handlePick(
                        picker,
                        picker === 'teacher' ? { teacherId: entry.id } : { classGroupId: entry.id },
                        entry.name
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
