'use client'

// The whole school's published timetable, for teachers and admins alike:
// one day with a column per teacher, class or room, or one teacher's,
// class's or room's week. Read-only — editing stays in the schedule
// planner. Filters live in the URL so a link to "Grade 4 on Tuesday" is
// shareable and survives a refresh.

import React, { Suspense, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import TimetableGrid from '@/components/schedulePlanner/TimetableGrid'
import ScheduleAgendaList from '@/components/schedulePlanner/ScheduleAgendaList'
import SchoolNowStrip from '@/components/schedulePlanner/SchoolNowStrip'
import FilterMenu from '@/components/schedulePlanner/FilterMenu'
import { useSchoolScheduleStore } from '@/store/useSchoolScheduleStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import { useFilterParams } from '@/hooks/useFilterParams'
import { useMinuteOfDay } from '@/components/schedulePlanner/useMinuteOfDay'
import { dayLabel } from '@/components/schedulePlanner/timeUtils'
import {
  closureOn,
  dateForDay,
  isoDayOf,
  sessionsOn,
  timeBounds,
  weekDaysFor,
} from '@/components/schedulePlanner/myScheduleUtils'
import {
  VIEW_BY_OPTIONS,
  applyFilters,
  dayColumns,
  distinctSorted,
  entityName,
  entityNames,
  hasActiveFilters,
  isViewBy,
  joinList,
  parseList,
  weekColumns,
  type ScheduleFilters,
  type ViewBy,
} from '@/components/schedulePlanner/schoolScheduleViews'
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const WEEK = 'week'

function SchoolScheduleContent() {
  const user = useUserStore((s) => s.user)
  const isAdmin = user.role === 'ADMIN'
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const { data, loading, loaded, error, load } = useSchoolScheduleStore()
  const nowMin = useMinuteOfDay()
  const { get, setParams } = useFilterParams()

  useEffect(() => {
    if (!user.id) return
    load(true)
  }, [user.id, selectedYearId, load])

  const today = useMemo(() => new Date(), [])
  const todayIso = isoDayOf(today)
  const sessions = useMemo(() => data?.sessions ?? [], [data])
  const weekDays = useMemo(() => (data ? weekDaysFor(data) : []), [data])

  // ─── URL state ───────────────────────────────────────────────────────────
  const dayParam = get('day')
  const isWeek = dayParam === WEEK
  const day = (() => {
    const n = Number(dayParam)
    if (weekDays.includes(n)) return n
    return weekDays.includes(todayIso) ? todayIso : weekDays[0] ?? todayIso
  })()
  const byParam = get('by')
  const by: ViewBy = isViewBy(byParam) ? byParam : 'teacher'
  const filters: ScheduleFilters = useMemo(
    () => ({
      classes: parseList(get('classes')),
      teachers: parseList(get('teachers')),
      courses: parseList(get('courses')),
      query: get('q'),
      mine: get('mine') === '1',
    }),
    [get]
  )
  const filtersActive = hasActiveFilters(filters)
  const clearFilters = () =>
    setParams({ classes: null, teachers: null, courses: null, q: null, mine: null })

  // ─── Derived data ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => applyFilters(sessions, filters, user.id), [sessions, filters, user.id])
  const classOptions = useMemo(() => distinctSorted(sessions.map((s) => s.classGroupName)), [sessions])
  const teacherOptions = useMemo(() => distinctSorted(sessions.map((s) => s.teacherName)), [sessions])
  const courseOptions = useMemo(() => distinctSorted(sessions.map((s) => s.courseName)), [sessions])
  const myName = useMemo(
    () => sessions.find((s) => user.id && s.teacherUserId === user.id)?.teacherName ?? null,
    [sessions, user.id]
  )

  // Week view: which teacher / class / room. A teacher lands on their own week.
  const focusOptions = useMemo(() => entityNames(filtered, by), [filtered, by])
  const focusParam = get('focus')
  const focus = focusOptions.includes(focusParam)
    ? focusParam
    : by === 'teacher' && myName && focusOptions.includes(myName)
      ? myName
      : focusOptions[0] ?? null

  const columns = useMemo(() => {
    if (!data) return []
    if (isWeek) return focus ? weekColumns(data, filtered, by, focus, user.id, todayIso) : []
    return dayColumns(data, filtered, day, by, user.id, day === todayIso)
  }, [data, filtered, isWeek, focus, by, day, user.id, todayIso])

  const isToday = !isWeek && day === todayIso
  const selectedDate = data ? dateForDay(data.weekStart, day) : today
  const closure = data && !isWeek ? closureOn(data.closures, selectedDate) : null
  const daySessions = useMemo(() => sessionsOn(filtered, day), [filtered, day])
  // The phone list shows the same thing the grid would.
  const agendaSessions = isWeek && focus ? filtered.filter((s) => entityName(s, by) === focus) : daySessions

  const viewLabel = VIEW_BY_OPTIONS.find((o) => o.key === by)!

  // ─── Render ───────────────────────────────────────────────────────────────
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
        <Card>
          <EmptyState
            icon={CalendarDaysIcon}
            title="No timetable has been published for this school year."
            description={
              isAdmin
                ? 'Publish a schedule from the planner and it appears here for every teacher.'
                : 'Once an administrator publishes the school timetable, it appears here.'
            }
            action={
              isAdmin ? (
                <Link
                  href="/admin-panel/schedule-planner"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
                >
                  Open the schedule planner
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              ) : undefined
            }
          />
        </Card>
      )
    }

    const [rangeStartMin, rangeEndMin] = timeBounds(data)

    return (
      <div className="space-y-4">
        {/* ─── Toolbar ─────────────────────────────────────────────────────── */}
        <Card flush className="px-4 py-3 lg:px-5 print:hidden">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {/* Which day */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {weekDays.map((d) => {
                const date = dateForDay(data.weekStart, d)
                const closed = closureOn(data.closures, date)
                const active = !isWeek && d === day
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setParams({ day: d === todayIso ? null : String(d) })}
                    title={closed ? `${dayLabel(d)} · closed — ${closed.title}` : dayLabel(d)}
                    className={`relative flex flex-col items-center rounded-xl border px-3 py-1.5 leading-tight transition cursor-pointer ${
                      active
                        ? 'border-cyan-600 bg-cyan-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{dayLabel(d, true)}</span>
                    <span className={`tabular-nums text-[11px] ${active ? 'text-cyan-100' : 'text-slate-400'}`}>
                      {format(date, 'd')}
                    </span>
                    {closed && (
                      <span
                        className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${active ? 'bg-amber-300' : 'bg-amber-500'}`}
                        aria-hidden
                      />
                    )}
                  </button>
                )
              })}
              <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden />
              <button
                type="button"
                onClick={() => setParams({ day: WEEK })}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition cursor-pointer ${
                  isWeek
                    ? 'border-cyan-600 bg-cyan-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'
                }`}
              >
                Week
              </button>
            </div>

            {/* Columns by what */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{isWeek ? 'Week of' : 'Columns'}</span>
              <div className="flex overflow-hidden rounded-xl border border-slate-200 text-sm">
                {VIEW_BY_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setParams({ by: o.key === 'teacher' ? null : o.key, focus: null })}
                    className={`px-3 py-1.5 transition cursor-pointer ${
                      by === o.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isWeek ? o.singular : o.label}
                  </button>
                ))}
              </div>
              {isWeek && (
                <select
                  value={focus ?? ''}
                  onChange={(e) => setParams({ focus: e.target.value })}
                  aria-label={`Which ${viewLabel.singular.toLowerCase()}`}
                  className="max-w-[16rem] rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  {focusOptions.length === 0 && <option value="">Nothing matches</option>}
                  {focusOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <FilterMenu
              label="Classes"
              options={classOptions}
              selected={filters.classes}
              onChange={(v) => setParams({ classes: joinList(v) })}
            />
            <FilterMenu
              label="Teachers"
              options={teacherOptions}
              selected={filters.teachers}
              onChange={(v) => setParams({ teachers: joinList(v) })}
            />
            <FilterMenu
              label="Subjects"
              options={courseOptions}
              selected={filters.courses}
              onChange={(v) => setParams({ courses: joinList(v) })}
            />
            {myName && (
              <button
                type="button"
                onClick={() => setParams({ mine: filters.mine ? null : '1' })}
                aria-pressed={filters.mine}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition cursor-pointer ${
                  filters.mine
                    ? 'border-cyan-300 bg-cyan-50 font-medium text-cyan-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <UserCircleIcon className="h-4 w-4" />
                My classes
              </button>
            )}
            <label className="relative flex-1 min-w-[12rem] max-w-xs">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={filters.query}
                onChange={(e) => setParams({ q: e.target.value })}
                placeholder="Search a subject, class, teacher or room"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>
            <p className="ml-auto text-xs text-slate-500">
              {filtersActive ? (
                <>
                  <span className="tabular-nums font-medium text-slate-700">{filtered.length}</span> of{' '}
                  <span className="tabular-nums">{sessions.length}</span> periods
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="ml-2 inline-flex items-center gap-0.5 font-medium text-cyan-700 hover:underline cursor-pointer"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <span className="tabular-nums font-medium text-slate-700">{sessions.length}</span> periods a
                  week
                </>
              )}
            </p>
          </div>
        </Card>

        {/* ─── Live context, today only ─────────────────────────────────────── */}
        {closure && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              School is closed {isToday ? 'today' : `on ${dayLabel(day)}`} — {closure.title}
            </p>
            <p className="text-xs text-amber-700">
              The usual {dayLabel(day)} timetable is shown below for reference.
            </p>
          </div>
        )}
        {isToday && !closure && daySessions.length > 0 && (
          <SchoolNowStrip sessions={daySessions} nowMin={nowMin} />
        )}

        {/* ─── The timetable ────────────────────────────────────────────────── */}
        <Card flush className="hidden overflow-hidden md:block print:block">
          {columns.length === 0 ? (
            <EmptyState
              icon={MagnifyingGlassIcon}
              title={
                filtersActive
                  ? 'No periods match these filters.'
                  : `Nothing is scheduled ${isWeek ? 'this week' : `on ${dayLabel(day)}`}.`
              }
              description={filtersActive ? 'Loosen a filter or clear them all to see the whole school.' : undefined}
              action={
                filtersActive ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 cursor-pointer"
                  >
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <TimetableGrid
              columns={columns}
              rangeStartMin={rangeStartMin}
              rangeEndMin={rangeEndMin}
              nowMin={nowMin}
              className="max-h-[calc(100vh-9.5rem)] print:max-h-none print:overflow-visible"
            />
          )}
        </Card>

        {/* ─── Phone fallback: the same periods as a list ────────────────────── */}
        <Card flush className="md:hidden print:hidden">
          {isWeek ? (
            weekDays.map((d) => {
              const date = dateForDay(data.weekStart, d)
              const closed = closureOn(data.closures, date)
              return (
                <section key={d} className="border-b border-slate-100 last:border-b-0">
                  <h2 className="flex items-baseline justify-between px-4 pt-4 pb-1">
                    <span className="font-display text-sm font-semibold text-slate-900">
                      {dayLabel(d)}
                      <span className="ml-1.5 tabular-nums text-xs font-normal text-slate-400">{format(date, 'MMM d')}</span>
                    </span>
                    {closed && <span className="text-xs font-medium text-amber-700">Closed · {closed.title}</span>}
                  </h2>
                  <ScheduleAgendaList
                    sessions={agendaSessions.filter((s) => s.dayOfWeek === d)}
                    nowMin={d === todayIso ? nowMin : null}
                    userId={user.id}
                    emptyText="Nothing scheduled."
                  />
                </section>
              )
            })
          ) : (
            <ScheduleAgendaList
              sessions={agendaSessions}
              nowMin={isToday ? nowMin : null}
              userId={user.id}
              emptyText={filtersActive ? 'No periods match these filters.' : `Nothing scheduled on ${dayLabel(day)}.`}
            />
          )}
        </Card>

        {/* Legend: what the marks on the grid mean */}
        <ul className="hidden flex-wrap items-center gap-x-5 gap-y-1 px-1 text-xs text-slate-500 md:flex">
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm border border-slate-300/70 bg-slate-200/60" aria-hidden />
            Break
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm bg-slate-100" aria-hidden />
            Outside school hours
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm border border-amber-200 bg-amber-50" aria-hidden />
            Closed
          </li>
          {myName && (
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-sm bg-white ring-2 ring-cyan-500" aria-hidden />
              Your period
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 bg-cyan-600" aria-hidden />
            Now
          </li>
        </ul>
      </div>
    )
  }

  return (
    <>
      {/* A timetable is wider than it is tall; only this page asks for landscape. */}
      <style>{'@page { size: landscape; margin: 10mm; }'}</style>
      <div className="print:hidden">
        <Navbar />
        <Sidebar />
      </div>
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50 print:ml-0 print:pt-0 print:bg-white">
        <div className="p-4 lg:p-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900">
                School Schedule
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {isWeek
                  ? `Week of ${data ? format(new Date(`${data.weekStart}T00:00:00`), 'MMMM d') : format(today, 'MMMM d')}`
                  : format(selectedDate, 'EEEE, MMMM d')}
                {data?.schedule ? ` · ${data.schedule.name}` : ''}
                {isWeek && focus ? ` · ${focus}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              {data?.schedule && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 md:inline-flex cursor-pointer"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Print
                </button>
              )}
              {isAdmin && (
                <Link
                  href="/admin-panel/schedule-planner"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
                >
                  Edit in planner
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          {content()}
        </div>
      </main>
    </>
  )
}

// useFilterParams reads the query string, which needs a Suspense boundary
// for the static build.
export default function SchoolSchedulePage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      <SchoolScheduleContent />
    </Suspense>
  )
}
