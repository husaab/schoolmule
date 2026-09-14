'use client'

// A staff member's work days on the Staff Attendance page: which weekdays they
// work, where that came from, and an inline editor for admins. Part-time staff
// are only assumed present on these days.

import React, { useState } from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'
import type { WorkDaysSource } from '@/services/types/teacherAttendance'

const WEEKDAYS = [
  { iso: 1, label: 'Mon' },
  { iso: 2, label: 'Tue' },
  { iso: 3, label: 'Wed' },
  { iso: 4, label: 'Thu' },
  { iso: 5, label: 'Fri' },
]

const SOURCE_LABEL: Record<WorkDaysSource, string> = {
  custom: 'set by admin',
  planner: 'from schedule planner',
  default: 'all school days',
}

/** "Mon–Fri", or "Wed, Fri" for a partial week. */
export const formatWorkDays = (days: number[]): string => {
  const weekdays = WEEKDAYS.filter((d) => days.includes(d.iso))
  if (weekdays.length === 5 && days.length === 5) return 'Mon–Fri'
  return weekdays.map((d) => d.label).join(', ') || 'No weekdays'
}

interface WorkDaysControlProps {
  workDays: number[]
  source: WorkDaysSource
  onSave: (days: number[]) => Promise<void>
  onReset: () => Promise<void>
}

const WorkDaysControl: React.FC<WorkDaysControlProps> = ({ workDays, source, onSave, onReset }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<number[]>(workDays)
  const [saving, setSaving] = useState(false)

  const partTime = WEEKDAYS.some((d) => !workDays.includes(d.iso))

  const run = async (action: () => Promise<void>) => {
    setSaving(true)
    try {
      await action()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(workDays)
          setEditing(true)
        }}
        title="Edit work days"
        className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-slate-100 cursor-pointer"
      >
        <span
          className={`px-2 py-0.5 rounded-md font-medium ${
            partTime ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Works {formatWorkDays(workDays)}
        </span>
        <span className="text-slate-400">{SOURCE_LABEL[source]}</span>
        <PencilIcon className="h-3.5 w-3.5 text-slate-300 group-hover:text-cyan-600" />
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50/50 px-2 py-1.5">
      {WEEKDAYS.map((d) => {
        const on = draft.includes(d.iso)
        return (
          <button
            key={d.iso}
            onClick={() =>
              setDraft((prev) => (on ? prev.filter((x) => x !== d.iso) : [...prev, d.iso].sort()))
            }
            className={`px-2 py-0.5 rounded-md text-xs font-medium border cursor-pointer ${
              on ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-500 border-slate-300'
            }`}
          >
            {d.label}
          </button>
        )
      })}
      <button
        onClick={() => run(() => onSave(draft))}
        disabled={saving || draft.length === 0}
        className="ml-1 px-2.5 py-0.5 rounded-md bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-700 disabled:opacity-50 cursor-pointer"
      >
        Save
      </button>
      {source === 'custom' && (
        <button
          onClick={() => run(onReset)}
          disabled={saving}
          title="Use the schedule planner's working days again"
          className="px-2 py-0.5 rounded-md text-xs text-slate-600 hover:bg-white disabled:opacity-50 cursor-pointer"
        >
          Reset to planner
        </button>
      )}
      <button
        onClick={() => setEditing(false)}
        disabled={saving}
        className="px-2 py-0.5 rounded-md text-xs text-slate-500 hover:bg-white cursor-pointer"
      >
        Cancel
      </button>
    </div>
  )
}

export default WorkDaysControl
