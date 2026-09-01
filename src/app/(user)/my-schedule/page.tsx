'use client'

// A teacher's own published timetable: today as a proportional day column, or
// the whole week. Read-only — the admin owns the schedule in the planner.

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import WeeklyGrid from '@/components/schedulePlanner/WeeklyGrid'
import ScheduleDownloadMenu from '@/components/schedulePlanner/ScheduleDownloadMenu'
import { useMyScheduleStore } from '@/store/useMyScheduleStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import {
  closureOn,
  dateForDay,
  fillableByDay,
  isoDayOf,
  sessionsOn,
  teachingDays,
  timeBounds,
  toGridFixedBlocks,
  toGridSession,
} from '@/components/schedulePlanner/myScheduleUtils'
import { CalendarDaysIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const MySchedulePage: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const { data, loading, loaded, error, load } = useMyScheduleStore()
  const [tab, setTab] = useState<'today' | 'week'>('today')

  useEffect(() => {
    if (!user?.id) return
    load(true)
  }, [user?.id, selectedYearId, load])

  const today = useMemo(() => new Date(), [])
  const todayIso = isoDayOf(today)

  const days = useMemo(() => {
    if (!data) return []
    const taught = teachingDays(data.sessions)
    // Fall back to the school's configured days so a teacher with a light week
    // still sees the full grid rather than two lonely columns.
    const configured = data.dayTemplates
      .filter((d) => d.fillableRanges.length > 0)
      .map((d) => d.dayOfWeek)
      .sort((a, b) => a - b)
    return configured.length > 0 ? configured : taught
  }, [data])

  const closure = data ? closureOn(data.closures, today) : null
  const todaySessions = data ? sessionsOn(data.sessions, todayIso) : []

  const content = () => {
    if (loading && !loaded) {
      return (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      )
    }
    if (error) {
      return <p className="py-24 text-center text-sm text-slate-500">{error}</p>
    }
    if (!data || data.sessions.length === 0) {
      return (
        <div className="text-center py-24">
          <CalendarDaysIcon className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">
            No schedule has been published for you yet.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Once an administrator publishes the school timetable, your periods appear here.
          </p>
        </div>
      )
    }

    const [rangeStartMin, rangeEndMin] = timeBounds(data)
    const gridSessions = data.sessions.map(toGridSession)
    const gridBlocks = toGridFixedBlocks(data.fixedBlocks)

    return (
      <>
        {closure && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              School is closed today — {closure.title}
            </p>
            <p className="text-xs text-amber-700">
              Your usual {dayLabel(todayIso)} periods are shown below for reference.
            </p>
          </div>
        )}

        {tab === 'today' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-2">
              {todaySessions.length === 0 ? (
                <p className="text-sm text-slate-400 py-6">Nothing scheduled today.</p>
              ) : (
                todaySessions.map((s) => (
                  <div
                    key={s.sessionId}
                    className="rounded-xl border border-slate-200 px-4 py-3 bg-white"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold text-slate-900 truncate">{s.courseName}</p>
                      <p className="text-xs text-slate-500 whitespace-nowrap">
                        {formatMin(s.startMin)}–{formatMin(s.endMin)}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{s.classGroupName}</p>
                    {s.roomName && (
                      <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        {s.roomName}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-3">
              <WeeklyGrid
                sessions={gridSessions}
                days={[todayIso]}
                fixedBlocks={gridBlocks}
                fillableRangesByDay={fillableByDay(data)}
                rangeStartMin={rangeStartMin}
                rangeEndMin={rangeEndMin}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-3 overflow-x-auto">
            <div className="min-w-[720px]">
              <WeeklyGrid
                sessions={gridSessions}
                days={days}
                fixedBlocks={gridBlocks}
                fillableRangesByDay={fillableByDay(data)}
                rangeStartMin={rangeStartMin}
                rangeEndMin={rangeEndMin}
              />
            </div>
            {/* Closed days in this week, called out under the grid. */}
            {data.closures.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                {days
                  .map((d) => ({ day: d, closure: closureOn(data.closures, dateForDay(data.weekStart, d)) }))
                  .filter((x) => x.closure)
                  .map((x) => (
                    <li
                      key={x.day}
                      className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-amber-800"
                    >
                      {dayLabel(x.day)} · closed — {x.closure!.title}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="print:hidden">
        <Navbar />
        <Sidebar />
      </div>
      <main className="lg:ml-72 pt-32 lg:pt-28 min-h-screen bg-slate-50 p-4 lg:p-10 print:ml-0 print:pt-0 print:bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Schedule</h1>
              <p className="text-sm text-slate-500">
                {format(today, 'EEEE, MMMM d')}
                {data?.schedule ? ` · ${data.schedule.name}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-slate-300 overflow-hidden text-sm print:hidden">
                {(['today', 'week'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 cursor-pointer capitalize ${
                      tab === t ? 'bg-cyan-600 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {data && data.sessions.length > 0 && <ScheduleDownloadMenu />}
            </div>
          </div>

          {content()}

          <p className="mt-6 text-xs text-slate-400 print:hidden">
            {user?.role === 'ADMIN' ? (
              <>
                Schedules are set in the{' '}
                <Link href="/admin-panel/schedule-planner" className="text-cyan-700 hover:underline">
                  schedule planner
                </Link>
                .
              </>
            ) : (
              'Schedules are set by your school administrator.'
            )}
          </p>
        </div>
      </main>
    </>
  )
}

export default MySchedulePage
