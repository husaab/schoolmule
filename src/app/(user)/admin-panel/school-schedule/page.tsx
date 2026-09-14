'use client'

// The admin's read-only view of the published timetable across the whole
// school: today with one column per teacher, or any class's / teacher's week.
// Editing stays in the schedule planner.

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import WeeklyGrid, { type GridColumn } from '@/components/schedulePlanner/WeeklyGrid'
import SchoolNowList from '@/components/schedulePlanner/SchoolNowList'
import { useMyScheduleStore } from '@/store/useMyScheduleStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import { dayLabel } from '@/components/schedulePlanner/timeUtils'
import {
  closureOn,
  fillableByDay,
  isoDayOf,
  sessionsOn,
  timeBounds,
  toGridFixedBlocks,
  toGridSession,
  weekDaysFor,
} from '@/components/schedulePlanner/myScheduleUtils'
import { useMinuteOfDay } from '@/components/schedulePlanner/useMinuteOfDay'
import type { FixedBlock, PublishedSession } from '@/services/types/schedulePlanner'
import { ArrowRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

type Tab = 'today' | 'week'
type WeekView = 'class' | 'teacher'

/** By-class view: the class's name as subtitle would repeat itself, so show the teacher. */
const toClassGridSession = (s: PublishedSession) => ({
  id: s.sessionId,
  day: s.dayOfWeek,
  startMin: s.startMin,
  endMin: s.endMin,
  title: s.courseName,
  subtitle: s.teacherName,
  roomName: s.roomName,
})

/** Breaks that apply to one class: whole-school blocks plus that class's own. */
const blocksForClass = (blocks: FixedBlock[], classGroupId: string | null | undefined) =>
  toGridFixedBlocks(
    blocks.filter(
      (b) => b.classGroupIds.length === 0 || (classGroupId && b.classGroupIds.includes(classGroupId))
    )
  ).map((b) => ({ ...b, subtle: false }))

const Pill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
      active
        ? 'bg-cyan-600 text-white border-cyan-600'
        : 'bg-white text-slate-600 border-slate-300 hover:border-cyan-400'
    }`}
  >
    {children}
  </button>
)

const SchoolSchedulePage: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const { data, loading, loaded, error, load } = useMyScheduleStore()
  const nowMin = useMinuteOfDay()
  const [tab, setTab] = useState<Tab>('today')
  const [weekView, setWeekView] = useState<WeekView>('class')
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    load(true)
  }, [user?.id, selectedYearId, load])

  const today = useMemo(() => new Date(), [])
  const todayIso = isoDayOf(today)
  const sessions = useMemo(() => data?.sessions ?? [], [data])
  const todaySessions = sessionsOn(sessions, todayIso)
  const closure = data ? closureOn(data.closures, today) : null

  const classNames = useMemo(
    () => [...new Set(sessions.map((s) => s.classGroupName))].sort((a, b) => a.localeCompare(b)),
    [sessions]
  )
  const teacherNames = useMemo(
    () => [...new Set(sessions.map((s) => s.teacherName))].sort((a, b) => a.localeCompare(b)),
    [sessions]
  )
  const options = weekView === 'class' ? classNames : teacherNames
  const active = selected && options.includes(selected) ? selected : options[0] ?? null

  const weekDays = useMemo(() => (data ? weekDaysFor(data) : []), [data])

  // Today: one column per teacher with classes today, in name order.
  const todayColumns: GridColumn[] = useMemo(() => {
    if (!data) return []
    const blocks = toGridFixedBlocks(data.fixedBlocks.filter((b) => b.dayOfWeek === todayIso))
    const ranges = data.dayTemplates.find((d) => d.dayOfWeek === todayIso)?.fillableRanges
    return [...new Set(todaySessions.map((s) => s.teacherName))]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        key: name,
        label: name,
        sessions: todaySessions.filter((s) => s.teacherName === name).map(toGridSession),
        fixedBlocks: blocks,
        fillableRanges: ranges,
      }))
  }, [data, todaySessions, todayIso])

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
    if (!data?.schedule || sessions.length === 0) {
      return (
        <div className="text-center py-24">
          <CalendarDaysIcon className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">No timetable has been published for this school year.</p>
          <Link
            href="/admin-panel/schedule-planner"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-700 transition"
          >
            Open the schedule planner
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      )
    }

    const [rangeStartMin, rangeEndMin] = timeBounds(data)

    if (tab === 'today') {
      return (
        <>
          {closure && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">
                School is closed today — {closure.title}
              </p>
              <p className="text-xs text-amber-700">
                The usual {dayLabel(todayIso)} timetable is shown below for reference.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 rounded-2xl border border-slate-200 bg-white p-2 self-start">
              {closure ? (
                <p className="px-3 py-6 text-sm text-slate-400 text-center">No classes — school closed.</p>
              ) : (
                <SchoolNowList sessions={todaySessions} nowMin={nowMin} compact />
              )}
            </div>
            <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-3 overflow-x-auto">
              {todayColumns.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-400">No classes scheduled today.</p>
              ) : (
                <div style={{ minWidth: `${Math.max(todayColumns.length * 130, 480)}px` }}>
                  <WeeklyGrid
                    columns={todayColumns}
                    rangeStartMin={rangeStartMin}
                    rangeEndMin={rangeEndMin}
                    compact
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )
    }

    const weekSessions = sessions.filter((s) =>
      weekView === 'class' ? s.classGroupName === active : s.teacherName === active
    )
    const classGroupId = weekSessions.find((s) => s.classGroupId)?.classGroupId

    return (
      <>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex rounded-xl border border-slate-300 overflow-hidden text-sm">
            {(['class', 'teacher'] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setWeekView(v)
                  setSelected(null)
                }}
                className={`px-3 py-1.5 cursor-pointer ${
                  weekView === v ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'
                }`}
              >
                By {v}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {options.map((name) => (
              <Pill key={name} active={name === active} onClick={() => setSelected(name)}>
                {name}
              </Pill>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 overflow-x-auto">
          <div className="min-w-[720px]">
            <WeeklyGrid
              sessions={weekSessions.map(weekView === 'class' ? toClassGridSession : toGridSession)}
              days={weekDays}
              fixedBlocks={
                weekView === 'class'
                  ? blocksForClass(data.fixedBlocks, classGroupId)
                  : toGridFixedBlocks(data.fixedBlocks)
              }
              fillableRangesByDay={fillableByDay(data)}
              rangeStartMin={rangeStartMin}
              rangeEndMin={rangeEndMin}
            />
          </div>
        </div>
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
              <h1 className="text-2xl font-bold text-slate-900">School Schedule</h1>
              <p className="text-sm text-slate-500">
                {format(today, 'EEEE, MMMM d')}
                {data?.schedule ? ` · ${data.schedule.name}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin-panel/schedule-planner"
                className="text-sm font-medium text-cyan-700 hover:underline print:hidden"
              >
                Edit in planner
              </Link>
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
            </div>
          </div>

          {content()}
        </div>
      </main>
    </>
  )
}

export default SchoolSchedulePage
