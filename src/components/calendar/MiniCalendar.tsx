'use client'

// A month at a glance for the dashboard: the days, a dot on each that has
// something in the school calendar (amber when the school is closed), and
// what is coming up next. It answers "is Friday a PA day?" without leaving
// the dashboard; the full calendar stays at /admin-panel/school-calendar.

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { addMonths, format } from 'date-fns'
import { getEventsByRange } from '@/services/calendarEventService'
import type { CalendarEventPayload } from '@/services/types/calendarEvent'

interface MiniCalendarProps {
  school: string
  /** Where the "Open calendar" link goes. */
  calendarHref?: string
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const pad = (n: number) => String(n).padStart(2, '0')
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

const eventCoversDate = (event: CalendarEventPayload, isoDate: string) => {
  const start = event.startDate.slice(0, 10)
  const end = (event.endDate || event.startDate).slice(0, 10)
  return isoDate >= start && isoDate <= end
}

/** "Sep 18" or "Sep 18 – 22" for a range. */
const eventDates = (event: CalendarEventPayload) => {
  const start = new Date(`${event.startDate.slice(0, 10)}T00:00:00`)
  const endIso = event.endDate?.slice(0, 10)
  if (!endIso || endIso === event.startDate.slice(0, 10)) return format(start, 'MMM d')
  const end = new Date(`${endIso}T00:00:00`)
  return start.getMonth() === end.getMonth()
    ? `${format(start, 'MMM d')} – ${format(end, 'd')}`
    : `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({
  school,
  calendarHref = '/admin-panel/school-calendar',
}) => {
  const today = useMemo(() => new Date(), [])
  const todayIso = isoOf(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState<CalendarEventPayload[]>([])

  const year = cursor.getFullYear()
  const month = cursor.getMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDow = new Date(year, month - 1, 1).getDay()

  useEffect(() => {
    if (!school) return
    let cancelled = false
    getEventsByRange(school, isoOf(year, month, 1), isoOf(year, month, daysInMonth))
      .then((res) => {
        if (!cancelled) setEvents(res.data ?? [])
      })
      .catch(() => {
        // A calendar that fails to load is an empty month, not a broken dashboard.
        if (!cancelled) setEvents([])
      })
    return () => {
      cancelled = true
    }
  }, [school, year, month, daysInMonth])

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // What is next: events in view that have not finished yet, soonest first.
  const upcoming = events
    .filter((e) => (e.endDate || e.startDate).slice(0, 10) >= todayIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3)

  const isThisMonth = year === today.getFullYear() && month === today.getMonth() + 1

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-slate-900">{format(cursor, 'MMMM yyyy')}</p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="Previous month"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          {!isThisMonth && (
            <button
              type="button"
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="rounded-lg px-1.5 py-0.5 text-[11px] font-medium text-cyan-700 transition hover:bg-cyan-50 cursor-pointer"
            >
              Today
            </button>
          )}
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="Next month"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-7 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="py-1 text-[10px] font-semibold text-slate-400">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={i} />
          const iso = isoOf(year, month, day)
          const dayEvents = events.filter((e) => eventCoversDate(e, iso))
          const closed = dayEvents.some((e) => e.isSchoolClosed)
          const isToday = iso === todayIso
          const weekend = (i % 7 === 0) || (i % 7 === 6)
          return (
            <span
              key={i}
              title={dayEvents.map((e) => e.title).join(', ') || undefined}
              className="flex flex-col items-center py-0.5"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs tabular-nums ${
                  isToday
                    ? 'bg-cyan-600 font-semibold text-white'
                    : closed
                      ? 'bg-amber-50 font-medium text-amber-900'
                      : weekend
                        ? 'text-slate-400'
                        : 'text-slate-700'
                }`}
              >
                {day}
              </span>
              <span
                className={`mt-0.5 h-1 w-1 rounded-full ${
                  dayEvents.length === 0 ? 'bg-transparent' : closed ? 'bg-amber-500' : 'bg-cyan-500'
                }`}
                aria-hidden
              />
            </span>
          )
        })}
      </div>

      <div className="mt-3 flex-1 border-t border-slate-100 pt-3">
        {upcoming.length === 0 ? (
          <p className="text-xs text-slate-400">Nothing on the calendar {isThisMonth ? 'for the rest of' : 'in'} {format(cursor, 'MMMM')}.</p>
        ) : (
          <ul className="space-y-1.5">
            {upcoming.map((e) => (
              <li key={e.eventId} className="flex items-start gap-2 text-xs">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${e.isSchoolClosed ? 'bg-amber-500' : 'bg-cyan-500'}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{e.title}</span>
                <span className="shrink-0 tabular-nums text-slate-500">{eventDates(e)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href={calendarHref}
        className="mt-3 inline-flex items-center gap-1 self-start text-xs font-medium text-cyan-700 hover:text-cyan-800"
      >
        Open calendar
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

export default MiniCalendar
