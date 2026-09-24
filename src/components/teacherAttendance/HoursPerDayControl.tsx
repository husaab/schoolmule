'use client'

// How many hours one of this person's work days is worth, with an inline
// editor for admins. Mirrors WorkDaysControl so the two read as a pair.

import React, { useState } from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'
import type { HoursPerDaySource } from '@/services/types/teacherAttendance'
import { formatHours } from './payPeriodFormat'

interface HoursPerDayControlProps {
  hoursPerDay: number
  source: HoursPerDaySource
  onSave: (hours: number) => Promise<void>
  onReset: () => Promise<void>
}

const HoursPerDayControl: React.FC<HoursPerDayControlProps> = ({ hoursPerDay, source, onSave, onReset }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(hoursPerDay))
  const [saving, setSaving] = useState(false)

  const run = async (action: () => Promise<void>) => {
    setSaving(true)
    try {
      await action()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const value = Number(draft)
  const valid = Number.isFinite(value) && value > 0 && value <= 24

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(String(hoursPerDay))
          setEditing(true)
        }}
        title="Edit hours per day"
        className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-slate-100 cursor-pointer"
      >
        <span
          className={`px-2 py-0.5 rounded-md font-medium ${
            source === 'custom' ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {formatHours(hoursPerDay)} h/day
        </span>
        <span className="text-slate-400">{source === 'custom' ? 'set by admin' : 'school default'}</span>
        <PencilIcon className="h-3.5 w-3.5 text-slate-300 group-hover:text-cyan-600" />
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50/50 px-2 py-1.5">
      <input
        type="number"
        min={0.5}
        max={24}
        step={0.25}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-20 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400"
        autoFocus
      />
      <span className="text-xs text-slate-500">hours per day</span>
      <button
        onClick={() => run(() => onSave(Math.round(value * 100) / 100))}
        disabled={saving || !valid}
        className="ml-1 px-2.5 py-0.5 rounded-md bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-700 disabled:opacity-50 cursor-pointer"
      >
        Save
      </button>
      {source === 'custom' && (
        <button
          onClick={() => run(onReset)}
          disabled={saving}
          title="Use the school's default hours per day again"
          className="px-2 py-0.5 rounded-md text-xs text-slate-600 hover:bg-white disabled:opacity-50 cursor-pointer"
        >
          Use school default
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

export default HoursPerDayControl
