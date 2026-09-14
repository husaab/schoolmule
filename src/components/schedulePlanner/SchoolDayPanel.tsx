'use client'

// The admin's dashboard hero: the whole school today — how many teachers are
// in class right now, who they are and where, and who is up next — with the
// month's calendar alongside, so "is Friday a PA day?" is answered on the same
// card. The teacher equivalent is DayRibbon; both read the same schedule store.

import React, { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { useMyScheduleStore } from '@/store/useMyScheduleStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import SchoolNowList from './SchoolNowList'
import MiniCalendar from '@/components/calendar/MiniCalendar'
import {
  SCHOOL_SCHEDULE_PATH,
  closureOn,
  isoDayOf,
  periodsAround,
  sessionsOn,
} from './myScheduleUtils'
import { useMinuteOfDay } from './useMinuteOfDay'

const SchoolDayPanel: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const { data, load, loaded } = useMyScheduleStore()
  const nowMin = useMinuteOfDay()

  useEffect(() => {
    if (!user?.id) return
    load(true)
  }, [user?.id, selectedYearId, load])

  const today = useMemo(() => new Date(), [])
  const todayIso = isoDayOf(today)
  const sessions = data ? sessionsOn(data.sessions, todayIso) : []
  const closure = data ? closureOn(data.closures, today) : null

  if (!loaded) return null

  if (!data?.schedule) {
    return (
      <Card className="mb-6 !bg-gradient-to-br from-cyan-50/80 via-white to-teal-50/60 border-cyan-200/60">
        <EmptyState
          icon={CalendarDaysIcon}
          iconClassName="text-cyan-500"
          title="No school timetable published yet"
          description="Build the timetable in the schedule planner and publish it — you'll see who is teaching where, live, right here."
          action={
            <Link
              href="/admin-panel/schedule-planner"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-700 transition"
            >
              Open the schedule planner
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          }
        />
      </Card>
    )
  }

  const teachersToday = new Set(sessions.map((s) => s.teacherName)).size
  const inClassNow = closure ? 0 : periodsAround(sessions, nowMin).now.length

  return (
    <Card className="mb-6" flush>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 lg:px-6 pt-5 lg:pt-6">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">School today</h2>
          <p className="text-xs text-slate-500 mt-0.5">{data.schedule.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!closure && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1 text-xs font-medium text-cyan-800">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                {inClassNow} in class now
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {teachersToday} teacher{teachersToday === 1 ? '' : 's'} teaching today
              </span>
            </>
          )}
          <Link
            href={SCHOOL_SCHEDULE_PATH}
            className="flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-800 ml-1"
          >
            Whole-school schedule
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Who is where on the left; the month on the right, where the card used to run out of things to say. */}
      <div className="grid grid-cols-1 gap-4 px-3 pb-4 pt-2 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-6 lg:px-4">
        <div className="min-w-0">
          {closure ? (
            <div className="m-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">School is closed today</p>
              <p className="text-xs text-amber-700 mt-0.5">{closure.title}</p>
            </div>
          ) : (
            <SchoolNowList sessions={sessions} nowMin={nowMin} />
          )}
        </div>
        {user.school && (
          <div className="border-t border-slate-100 px-2 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-2">
            <MiniCalendar school={user.school} />
          </div>
        )}
      </div>
    </Card>
  )
}

export default SchoolDayPanel
