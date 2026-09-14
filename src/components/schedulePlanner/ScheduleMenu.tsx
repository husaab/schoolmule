'use client'

// Navbar calendar button, reachable from anywhere in the app.
//
// Teachers: today's periods at a glance, linking to /my-schedule. Renders
// nothing when they have no sessions, so schools not using the planner see no
// change.
//
// Admins: the whole school — who is in class now and who is up next — linking
// to the whole-school timetable. Always shown, so an unpublished timetable is
// visible as a prompt rather than a missing icon.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { CalendarDaysIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { useMyScheduleStore } from '@/store/useMyScheduleStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import { dayLabel, formatMin } from './timeUtils'
import { SCHOOL_SCHEDULE_PATH, closureOn, isoDayOf, sessionsOn } from './myScheduleUtils'
import { useMinuteOfDay } from './useMinuteOfDay'
import SchoolNowList from './SchoolNowList'

const ScheduleMenu: React.FC = () => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const { data, loaded, load } = useMyScheduleStore()
  const nowMin = useMinuteOfDay()
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    if (!user?.id || user.role === 'PARENT') return
    // Switching the school year changes which schedule is published.
    load(true)
  }, [user?.id, user?.role, selectedYearId, load])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const today = useMemo(() => new Date(), [])
  const todayIso = isoDayOf(today)
  const closure = data ? closureOn(data.closures, today) : null
  const todaySessions = data ? sessionsOn(data.sessions, todayIso) : []

  if (isAdmin ? !loaded : !data || data.sessions.length === 0) return null

  const published = Boolean(data?.schedule)
  const label = isAdmin ? 'School schedule' : 'My schedule'

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        title={label}
        className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <CalendarDaysIcon className="h-6 w-6" />
        {todaySessions.length > 0 && !closure && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-40">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">
              Today · {dayLabel(todayIso)}
              {isAdmin && <span className="font-normal text-slate-500"> — whole school</span>}
            </p>
            {data?.schedule && <p className="text-xs text-slate-500">{data.schedule.name}</p>}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {isAdmin && !published ? (
              <div className="px-3 py-6 text-center">
                <p className="text-sm font-medium text-slate-700">No timetable published yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Publish one in the schedule planner to see who is teaching where.
                </p>
              </div>
            ) : closure ? (
              <div className="m-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-3">
                <p className="text-sm font-semibold text-amber-900">School closed</p>
                <p className="text-xs text-amber-700">{closure.title}</p>
              </div>
            ) : isAdmin ? (
              <SchoolNowList sessions={todaySessions} nowMin={nowMin} compact />
            ) : todaySessions.length === 0 ? (
              <p className="px-3 py-6 text-sm text-slate-400 text-center">
                Nothing scheduled today.
              </p>
            ) : (
              todaySessions.map((s) => (
                <div key={s.sessionId} className="flex items-start gap-3 px-3 py-2 rounded-xl hover:bg-slate-50">
                  <div className="w-16 shrink-0 text-xs text-slate-500 pt-0.5">
                    {formatMin(s.startMin)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.courseName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {s.classGroupName}
                      {s.roomName ? ` · ${s.roomName}` : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            href={
              isAdmin
                ? published
                  ? SCHOOL_SCHEDULE_PATH
                  : '/admin-panel/schedule-planner'
                : '/my-schedule'
            }
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm font-medium text-cyan-700 hover:bg-cyan-50"
          >
            {isAdmin ? (published ? 'View whole-school schedule' : 'Open the schedule planner') : 'View full schedule'}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

export default ScheduleMenu
