'use client'

// Monday to Sunday of the current week from the school calendar: closures,
// PA days, exams and events. The mini calendar in the admin hero answers
// "what day is it", this answers "what is coming".

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { endOfWeek, format, startOfWeek } from 'date-fns'
import Card from '@/components/ui/Card'
import SectionHeader from '@/components/ui/SectionHeader'
import { getEventsByRange } from '@/services/calendarEventService'
import type { CalendarEventCategory, CalendarEventPayload } from '@/services/types/calendarEvent'
import { RowsSkeleton } from './DashboardSkeletons'

interface ThisWeekCardProps {
  school: string
  /** Only admins have a calendar page to link to. */
  isAdmin: boolean
}

const BADGE: Record<CalendarEventCategory, { label: string; className: string }> = {
  event: { label: 'event', className: 'bg-cyan-50 text-cyan-700' },
  exam: { label: 'exam', className: 'bg-violet-50 text-violet-700' },
  holiday: { label: 'holiday', className: 'bg-amber-50 text-amber-700' },
  'pa-day': { label: 'PA day', className: 'bg-amber-50 text-amber-700' },
  other: { label: 'note', className: 'bg-slate-100 text-slate-600' },
}

const day = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`)

const when = (e: CalendarEventPayload): string => {
  const start = day(e.startDate)
  const endIso = e.endDate?.slice(0, 10)
  if (!endIso || endIso === e.startDate.slice(0, 10)) return format(start, 'EEE d')
  return `${format(start, 'EEE d')}–${format(day(endIso), 'EEE d')}`
}

const ThisWeekCard: React.FC<ThisWeekCardProps> = ({ school, isAdmin }) => {
  const [events, setEvents] = useState<CalendarEventPayload[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const now = new Date()
    const from = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const to = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    let cancelled = false
    getEventsByRange(school, from, to)
      .then((res) => {
        if (cancelled) return
        const sorted = [...(res.data ?? [])].sort((a, b) => a.startDate.localeCompare(b.startDate))
        setEvents(sorted)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [school])

  const todayIso = format(new Date(), 'yyyy-MM-dd')

  return (
    <Card>
      <SectionHeader
        title="This week"
        hint={`${format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} – ${format(
          endOfWeek(new Date(), { weekStartsOn: 1 }),
          'MMM d'
        )}`}
        action={
          isAdmin ? (
            <Link
              href="/admin-panel/school-calendar"
              className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-800"
            >
              Calendar
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          ) : undefined
        }
      />
      {error ? (
        <p className="text-sm text-slate-500">Couldn&apos;t load the school calendar.</p>
      ) : events === null ? (
        <RowsSkeleton rows={3} bare />
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">Nothing on the school calendar this week.</p>
      ) : (
        <ul>
          {events.map((e) => {
            const badge = BADGE[e.category] ?? BADGE.other
            const isToday =
              e.startDate.slice(0, 10) <= todayIso && (e.endDate?.slice(0, 10) ?? e.startDate.slice(0, 10)) >= todayIso
            return (
              <li key={e.eventId} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <span className={`w-20 shrink-0 text-xs tabular-nums ${isToday ? 'font-semibold text-cyan-700' : 'text-slate-500'}`}>
                  {when(e)}
                </span>
                <span className="min-w-0 flex-1 text-sm text-slate-800 truncate" title={e.title}>
                  {e.title}
                </span>
                {e.isSchoolClosed ? (
                  <span className="shrink-0 text-[10px] font-medium rounded-full px-2 py-0.5 bg-amber-100 text-amber-800">
                    closed
                  </span>
                ) : (
                  <span className={`shrink-0 text-[10px] font-medium rounded-full px-2 py-0.5 ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export default ThisWeekCard
