'use client'

import React, { Suspense, useEffect, useState } from 'react'
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { getParentCalendar } from '@/services/parentPortalService'
import { CalendarEventPayload, CalendarEventCategory } from '@/services/types/calendarEvent'
import ParentPageShell from '@/components/parent/ParentPageShell'
import CalendarMonthGrid from '@/components/calendar/CalendarMonthGrid'
import Modal from '@/components/shared/modal'
import Spinner from '@/components/Spinner'
import { useFilterParams } from '@/hooks/useFilterParams'

const CATEGORY_LABELS: Record<CalendarEventCategory, string> = {
  event: 'Event',
  holiday: 'Holiday',
  'pa-day': 'PA Day',
  exam: 'Exam',
  other: 'Other',
}

const CATEGORY_CHIPS: Record<CalendarEventCategory, string> = {
  event: 'bg-cyan-100 text-cyan-800',
  holiday: 'bg-emerald-100 text-emerald-800',
  'pa-day': 'bg-amber-100 text-amber-800',
  exam: 'bg-violet-100 text-violet-800',
  other: 'bg-slate-100 text-slate-700',
}

const pad = (n: number) => String(n).padStart(2, '0')

const formatDate = (iso: string) =>
  new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

/** A whole number from the query string, or the fallback when absent or malformed. */
const intParam = (raw: string, fallback: number, min: number, max: number): number => {
  const n = parseInt(raw, 10)
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback
}

const ParentCalendarContent: React.FC = () => {
  const now = new Date()
  const todayYear = now.getFullYear()
  const todayMonth = now.getMonth() + 1 // 1-12
  // The month on screen lives in the URL (?year=&month=), omitted when it is
  // today's, so Back, refresh and the sidebar's filter memory all restore it.
  const { get, setParams } = useFilterParams()
  const year = intParam(get('year'), todayYear, 1970, 9999)
  const month = intParam(get('month'), todayMonth, 1, 12)
  const showMonth = (y: number, m: number) =>
    setParams({ year: y === todayYear ? null : String(y), month: m === todayMonth ? null : String(m) })
  const [events, setEvents] = useState<CalendarEventPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventPayload | null>(null)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId) // events are year-scoped server-side

  useEffect(() => {
    setLoading(true)
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    getParentCalendar({
      from: `${year}-${pad(month)}-01`,
      to: `${year}-${pad(month)}-${pad(daysInMonth)}`,
    })
      .then((res) => setEvents(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [year, month, selectedYearId])

  const changeMonth = (delta: number) => {
    const k = year * 12 + (month - 1) + delta
    showMonth(Math.floor(k / 12), (k % 12) + 1)
  }

  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-CA', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-lg text-slate-500 hover:bg-stone-100 cursor-pointer transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => showMonth(todayYear, todayMonth)}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-stone-100 cursor-pointer transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-lg text-slate-500 hover:bg-stone-100 cursor-pointer transition-colors"
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <CalendarMonthGrid
          year={year}
          month={month}
          events={events}
          onDayClick={() => {}}
          onEventClick={setSelectedEvent}
        />
      )}

      {/* Read-only event detail */}
      <Modal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
      >
        {selectedEvent && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_CHIPS[selectedEvent.category] || CATEGORY_CHIPS.other}`}
              >
                {CATEGORY_LABELS[selectedEvent.category] || 'Other'}
              </span>
              {selectedEvent.isSchoolClosed && (
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                  School closed
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                When
              </p>
              <p className="text-sm text-slate-700">
                {formatDate(selectedEvent.startDate)}
                {selectedEvent.endDate &&
                  selectedEvent.endDate.slice(0, 10) !== selectedEvent.startDate.slice(0, 10) &&
                  ` – ${formatDate(selectedEvent.endDate)}`}
              </p>
            </div>
            {selectedEvent.notes && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                  Notes
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedEvent.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

const ParentCalendarPage: React.FC = () => (
  <ParentPageShell
    title="School Calendar"
    subtitle="Holidays, PA days, exams and events — school-wide, for all your children."
    badge={{ icon: CalendarDaysIcon, label: 'Calendar' }}
  >
    <Suspense fallback={<div className="h-[520px] rounded-2xl border border-stone-200/70 bg-white" />}>
      <ParentCalendarContent />
    </Suspense>
  </ParentPageShell>
)

export default ParentCalendarPage
