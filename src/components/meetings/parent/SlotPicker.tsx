'use client'

// Pick one of a teacher's open times: day tabs, then the times as chips,
// morning and afternoon apart. Times the family is already busy at (another
// meeting) are left out, so whatever is chosen can be booked.

import React, { useMemo, useState } from 'react'
import type { ParentMeetingEvent, ParentMeetingTeacher, TimeRange } from '@/services/types/meetings'
import { freeTimes, timeLabel, weekdayShort, dayShort } from '@/lib/meetings'

export interface PickedTime {
  dayId: string
  start: number
}

interface Props {
  event: ParentMeetingEvent
  teacher: ParentMeetingTeacher
  value: PickedTime | null
  onChange: (value: PickedTime) => void
  /** Moving a meeting: its own time doesn't block the family. */
  exceptBookingId?: string
}

const SlotPicker: React.FC<Props> = ({ event, teacher, value, onChange, exceptBookingId }) => {
  const view = useMemo(
    () => (exceptBookingId ? { ...event, bookings: event.bookings.filter((b) => b.bookingId !== exceptBookingId) } : event),
    [event, exceptBookingId],
  )
  const days = event.days.filter((d) => d.bookable)
  const counts = days.map((d) => freeTimes(view, teacher, d.dayId).length)
  const firstWithTimes = days[counts.findIndex((n) => n > 0)]?.dayId ?? days[0]?.dayId
  const [dayId, setDayId] = useState<string>(value?.dayId ?? firstWithTimes)
  const times = dayId ? freeTimes(view, teacher, dayId) : []
  const morning = times.filter((t) => t.start < 12 * 60)
  const afternoon = times.filter((t) => t.start >= 12 * 60)

  const chip = (t: TimeRange) => {
    const on = value?.dayId === dayId && value.start === t.start
    return (
      <button
        key={t.start}
        type="button"
        onClick={() => onChange({ dayId, start: t.start })}
        aria-pressed={on}
        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          on ? 'border-amber-500 bg-amber-500 text-white' : 'border-stone-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50'
        }`}
      >
        {timeLabel(t.start).replace(' ', ' ')}
      </button>
    )
  }

  return (
    <div>
      {days.length > 1 && (
        <div className="mb-3 inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1" role="tablist">
          {days.map((d, i) => (
            <button
              key={d.dayId}
              type="button"
              role="tab"
              aria-selected={d.dayId === dayId}
              disabled={counts[i] === 0}
              onClick={() => setDayId(d.dayId)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                d.dayId === dayId ? 'bg-white font-medium text-amber-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {dayShort(d.date)} · {counts[i] === 0 ? 'Full' : `${counts[i]} left`}
            </button>
          ))}
        </div>
      )}
      {times.length === 0 ? (
        <p className="text-sm text-slate-500">No times left on {dayId ? weekdayShort(event.days.find((d) => d.dayId === dayId)!.date) : 'these days'}.</p>
      ) : (
        <div className="space-y-3">
          {morning.length > 0 && <div className="flex flex-wrap gap-2">{morning.map(chip)}</div>}
          {afternoon.length > 0 && <div className="flex flex-wrap gap-2">{afternoon.map(chip)}</div>}
        </div>
      )}
    </div>
  )
}

export default SlotPicker
