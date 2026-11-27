'use client'

// Take attendance for a list of students on one day: Present, Late or Absent
// per student (picking the mark a student already has clears it), Mark All
// Present, and Save. General Attendance and Class Attendance are this one
// component with a different roster, so they look and behave the same; the
// app's AttendanceTaker is its counterpart.
//
// Only the chosen mark is coloured. An unmarked student's three buttons are
// plain white, so a glance down the list shows who is marked and how.
//
// The day, the search and (on the whole school's roll) the grade filter live
// in the URL (useFilterParams), so the page must render this under a
// <Suspense> boundary.

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/20/solid'
import Avatar from '@/components/avatar/Avatar'
import Spinner from '@/components/Spinner'
import BackLink from '@/components/shared/BackLink'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import StudentNameLink from '@/components/student/profile/StudentNameLink'
import EmptyState from '@/components/ui/EmptyState'
import SearchableSelect from '@/components/ui/SearchableSelect'
import StatTile from '@/components/ui/StatTile'
import { useDebouncedParam, useFilterParams } from '@/hooks/useFilterParams'
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABEL,
  attendanceChanges,
  countChanges,
  countMarks,
  dayFromKey,
  dayKey,
  isDayKey,
  markAll,
  savedFrom,
  shiftDay,
  toggleMark,
  withSavedElsewhere,
  type AttendanceChanges,
  type AttendanceMarks,
  type SavedAttendance,
} from '@/lib/attendanceRoll'
import { guardedLinkTarget } from '@/lib/leaveGuard'
import { onDataChange } from '@/lib/muley/dataChanges'
import { getGradeLabel, getGradeNumericValue, getGradeOptions, type GradeValue } from '@/lib/schoolUtils'
import type { AttendanceStatus } from '@/services/types/attendance'
import type { AvatarSpec } from '@/services/types/profile'
import { useNotificationStore } from '@/store/useNotificationStore'

export interface RollStudent {
  studentId: string
  name: string
  grade: GradeValue | null
  avatar?: AvatarSpec | null
  photoUrl?: string | null
}

interface AttendanceRollProps {
  title: string
  subtitle?: string
  /** A link back to the list this roll was opened from (class attendance). */
  back?: { to: string; label: string }
  /** The students to mark. A new function (a new class, a new school year) reloads them. */
  loadRoster: () => Promise<RollStudent[]>
  /** The marks already saved for a day. */
  loadMarks: (date: string) => Promise<SavedAttendance>
  /** Stores what changed. Throws when it could not be saved. */
  save: (date: string, changes: AttendanceChanges) => Promise<void>
  /** One section per grade, with the grade filter (the whole school's roll). */
  byGrade?: boolean
  /** What a change saved through Muley announces for a day (lib/muley/dataChanges): the day on screen takes it in. */
  changeTopic?: (date: string) => string
}

// ── Looks ───────────────────────────────────────────────────────────────────

const secondaryButton =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'
const primaryButton =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2.5 sm:px-5 text-sm font-semibold text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-cyan-500 disabled:hover:to-teal-500 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2'
const iconButton =
  'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'

const markButton =
  'inline-flex min-w-0 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-sm sm:min-w-[5.75rem] sm:px-3 font-semibold transition-colors cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed sm:py-1.5'
/** Not chosen: the same plain button whatever the status. */
const markOff = 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'
/** Chosen: filled with the status colour. */
const markOn: Record<AttendanceStatus, string> = {
  PRESENT: 'border-emerald-700 bg-emerald-700 text-white shadow-sm',
  LATE: 'border-amber-400 bg-amber-400 text-amber-950 shadow-sm',
  ABSENT: 'border-rose-600 bg-rose-600 text-white shadow-sm',
}
/** A marked student's row carries a light tint of the same colour. */
const rowTone: Record<AttendanceStatus, string> = {
  PRESENT: 'border-emerald-200 bg-emerald-50/60',
  LATE: 'border-amber-200 bg-amber-50/70',
  ABSENT: 'border-rose-200 bg-rose-50/70',
}

const longDay = (key: string): string =>
  dayFromKey(key)?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) ?? key

const messageOf = (err: unknown, fallback: string): string => (err instanceof Error && err.message ? err.message : fallback)

// ── One student ─────────────────────────────────────────────────────────────

interface StudentRowProps {
  student: RollStudent
  status: AttendanceStatus | null
  disabled: boolean
  showGrade: boolean
  onPick: (studentId: string, status: AttendanceStatus) => void
}

const StudentRow = memo(function StudentRow({ student, status, disabled, showGrade, onPick }: StudentRowProps) {
  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-4 ${
        status ? rowTone[status] : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar student name={student.name} avatar={student.avatar} photoUrl={student.photoUrl} size={36} />
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">
            <StudentNameLink studentId={student.studentId}>{student.name}</StudentNameLink>
          </p>
          {showGrade && student.grade !== null && (
            <p className="text-sm text-slate-500">Grade {getGradeLabel(student.grade)}</p>
          )}
        </div>
      </div>
      <div role="group" aria-label={`Attendance for ${student.name}`} className="grid grid-cols-3 gap-2 sm:flex sm:flex-shrink-0">
        {ATTENDANCE_STATUSES.map((option) => {
          const on = status === option
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onPick(student.studentId, option)}
              className={`${markButton} ${on ? markOn[option] : markOff}`}
            >
              {on && <CheckIcon className="h-4 w-4 flex-shrink-0" aria-hidden />}
              {ATTENDANCE_STATUS_LABEL[option]}
            </button>
          )
        })}
      </div>
    </li>
  )
})

// ── The roll ────────────────────────────────────────────────────────────────

/** What was loaded, and what it was loaded with: a stale answer never shows. */
interface LoadedRoster {
  loader: AttendanceRollProps['loadRoster']
  students: RollStudent[]
}
interface LoadedDay {
  loader: AttendanceRollProps['loadMarks']
  date: string
  saved: SavedAttendance
  marks: AttendanceMarks
}
interface LoadFailure {
  loader: unknown
  date?: string
  attempt: number
}
type Leaving = { date: string } | { href: string }

export default function AttendanceRoll({ title, subtitle, back, loadRoster, loadMarks, save, byGrade = false, changeTopic }: AttendanceRollProps) {
  const router = useRouter()
  const filters = useFilterParams()
  const { get, setParams } = filters
  const showNotification = useNotificationStore((s) => s.showNotification)

  // The day lives in the URL (?date=yyyy-MM-dd; today is left out).
  const today = dayKey(new Date())
  const urlDate = get('date')
  const date = isDayKey(urlDate) ? urlDate : today
  const [search, setSearch] = useDebouncedParam(filters, 'q')
  const gradeFilter = byGrade ? get('grade') : ''

  // ── Loading ───────────────────────────────────────────────────────────────
  const [roster, setRoster] = useState<LoadedRoster | null>(null)
  const [rosterFailure, setRosterFailure] = useState<LoadFailure | null>(null)
  const [rosterAttempt, setRosterAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    loadRoster().then(
      (students) => !cancelled && setRoster({ loader: loadRoster, students }),
      () => !cancelled && setRosterFailure({ loader: loadRoster, attempt: rosterAttempt }),
    )
    return () => {
      cancelled = true
    }
  }, [loadRoster, rosterAttempt])

  const [day, setDay] = useState<LoadedDay | null>(null)
  const [dayFailure, setDayFailure] = useState<LoadFailure | null>(null)
  const [dayAttempt, setDayAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    loadMarks(date).then(
      (saved) => !cancelled && setDay({ loader: loadMarks, date, saved, marks: { ...saved } }),
      () => !cancelled && setDayFailure({ loader: loadMarks, date, attempt: dayAttempt }),
    )
    return () => {
      cancelled = true
    }
  }, [loadMarks, date, dayAttempt])

  // Attendance for this day saved (or undone) through Muley, in the panel
  // beside the roll: read the day again, keeping anything marked and not saved.
  useEffect(() => {
    if (!changeTopic) return
    const topic = changeTopic(date)
    return onDataChange((topics) => {
      if (!topics.includes(topic)) return
      loadMarks(date).then(
        (fresh) =>
          setDay((d) =>
            d && d.loader === loadMarks && d.date === date ? { ...d, saved: fresh, marks: withSavedElsewhere(d.marks, d.saved, fresh) } : d,
          ),
        () => {
          // The marks on screen stay; the next visit to the day reads them again.
        },
      )
    })
  }, [changeTopic, date, loadMarks])

  const students = roster?.loader === loadRoster ? roster.students : null
  const rosterError = !students && rosterFailure?.loader === loadRoster && rosterFailure.attempt === rosterAttempt
  // Marks can be changed and saved only once this day's own marks are on screen.
  const ready = day !== null && day.loader === loadMarks && day.date === date
  const dayError = !ready && dayFailure?.loader === loadMarks && dayFailure.date === date && dayFailure.attempt === dayAttempt
  const marks = useMemo<AttendanceMarks>(() => (ready && day ? day.marks : {}), [ready, day])
  const saved = useMemo<SavedAttendance>(() => (ready && day ? day.saved : {}), [ready, day])

  // ── The list ──────────────────────────────────────────────────────────────
  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (students ?? [])
      .filter((s) => !needle || s.name.toLowerCase().includes(needle))
      .filter((s) => gradeFilter === '' || String(s.grade) === gradeFilter)
      .sort((a, b) => getGradeNumericValue(a.grade) - getGradeNumericValue(b.grade) || a.name.localeCompare(b.name))
  }, [students, search, gradeFilter])
  const shownIds = useMemo(() => shown.map((s) => s.studentId), [shown])

  const sections = useMemo(() => {
    if (!byGrade) return [{ key: 'all', label: '', students: shown }]
    const groups: { key: string; label: string; students: RollStudent[] }[] = []
    for (const student of shown) {
      const key = String(student.grade)
      const last = groups[groups.length - 1]
      if (last && last.key === key) last.students.push(student)
      else groups.push({ key, label: student.grade === null ? 'No grade' : `Grade ${getGradeLabel(student.grade)}`, students: [student] })
    }
    return groups
  }, [shown, byGrade])

  const counts = countMarks(shownIds, marks)
  const filtering = search.trim() !== '' || gradeFilter !== ''
  const unsaved = countChanges(marks, saved)
  const dirty = unsaved > 0

  // ── Marking ───────────────────────────────────────────────────────────────
  const pick = useCallback((studentId: string, status: AttendanceStatus) => {
    setDay((d) => (d ? { ...d, marks: toggleMark(d.marks, studentId, status) } : d))
  }, [])

  const markAllPresent = () => {
    if (!ready || shownIds.length === 0) return
    setDay((d) => (d ? { ...d, marks: markAll(d.marks, shownIds, 'PRESENT') } : d))
    showNotification(
      filtering
        ? `${shownIds.length} ${shownIds.length === 1 ? 'student' : 'students'} marked as present`
        : 'All students marked as present',
      'success',
    )
  }

  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (!ready || !day || saving) return
    const sent = day.marks
    const changes = attendanceChanges(sent, day.saved)
    if (changes.entries.length === 0 && changes.cleared.length === 0) return
    setSaving(true)
    try {
      await save(date, changes)
      // Anything marked while the save was on its way stays unsaved.
      setDay((d) => (d && d.loader === loadMarks && d.date === date ? { ...d, saved: savedFrom(sent) } : d))
      showNotification('Attendance saved successfully', 'success')
    } catch (err) {
      showNotification(messageOf(err, 'Failed to save attendance'), 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Leaving with unsaved marks ────────────────────────────────────────────
  const [leaving, setLeaving] = useState<Leaving | null>(null)
  const goToDate = (next: string) => {
    // Drop the day on screen so its unsaved marks can't come back if it is reopened before it reloads.
    setDay(null)
    setDayFailure(null)
    setParams({ date: next !== today ? next : null })
  }
  const changeDate = (next: string) => {
    if (!isDayKey(next) || next === date || saving) return
    if (dirty) setLeaving({ date: next })
    else goToDate(next)
  }
  const discardAndLeave = () => {
    const to = leaving
    setLeaving(null)
    if (!to) return
    if ('date' in to) goToDate(to.date)
    else router.push(to.href)
  }

  useEffect(() => {
    if (!dirty) return
    // An in-app link to another page asks first. A link that stays on this
    // page (a student's profile opens over it) keeps the marks, so it is let through.
    const onClick = (e: globalThis.MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!(a instanceof HTMLAnchorElement)) return
      const to = guardedLinkTarget(
        {
          href: a.href,
          target: a.getAttribute('target'),
          download: a.hasAttribute('download'),
          button: e.button,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          handled: a.dataset.leaveHandled === 'true',
        },
        window.location,
      )
      if (!to || a.pathname === window.location.pathname) return
      e.preventDefault()
      e.stopPropagation()
      setLeaving({ href: to })
    }
    // Closing or reloading the tab: the browser asks.
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    // On window, in the capture phase: before Next's own link handling sees the click.
    window.addEventListener('click', onClick, true)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [dirty])

  // ── Render ────────────────────────────────────────────────────────────────
  const total = students?.length ?? 0
  // The counts mean something only once both the students and the day's marks are in.
  const tilesLoading = !rosterError && !dayError && (!students || !ready)
  const tile = (n: number): string | number => (students && ready ? n : '–')
  const saveNote = !ready
    ? ''
    : dirty
      ? `${unsaved} unsaved ${unsaved === 1 ? 'change' : 'changes'}`
      : Object.keys(saved).length > 0
        ? 'All marks saved'
        : 'Nothing marked yet'

  return (
    <>
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          {back && (
            <BackLink
              to={back.to}
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-800"
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              {back.label}
            </BackLink>
          )}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
            </div>
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Previous day" disabled={saving} onClick={() => changeDate(shiftDay(date, -1))} className={iconButton}>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden />
                </button>
                <input
                  type="date"
                  aria-label="Attendance date"
                  value={date}
                  disabled={saving}
                  onChange={(e) => changeDate(e.target.value)}
                  className="h-10 min-w-0 flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-transparent focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                />
                <button type="button" aria-label="Next day" disabled={saving} onClick={() => changeDate(shiftDay(date, 1))} className={iconButton}>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden />
                </button>
                {date !== today && (
                  <button type="button" disabled={saving} onClick={() => changeDate(today)} className={`${secondaryButton} h-10`}>
                    Today
                  </button>
                )}
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 sm:justify-end">
                <CalendarDaysIcon className="h-4 w-4 text-slate-400" aria-hidden />
                {longDay(date)}
                {date === today ? (
                  <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700">Today</span>
                ) : (
                  // The roll can reopen on the day it was last left on: say plainly that it is not today.
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {date < today ? 'Past day' : 'Future day'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Counts */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile dense label="Present" value={tile(counts.PRESENT)} tone={ready && counts.PRESENT > 0 ? 'good' : 'neutral'} loading={tilesLoading} />
            <StatTile dense label="Late" value={tile(counts.LATE)} tone={ready && counts.LATE > 0 ? 'warn' : 'neutral'} loading={tilesLoading} />
            <StatTile dense label="Absent" value={tile(counts.ABSENT)} tone={ready && counts.ABSENT > 0 ? 'bad' : 'neutral'} loading={tilesLoading} />
            <StatTile dense label="Unmarked" value={tile(counts.unmarked)} loading={tilesLoading} />
          </div>
        </div>

        {/* Roll */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          {/* Pinned from tablet width up; on a phone it would take too much of the screen. */}
          <div className="rounded-t-2xl border-b border-slate-100 bg-white px-4 py-4 sm:sticky sm:top-20 sm:z-10 sm:px-6">
            <div className={`grid grid-cols-1 gap-3 ${byGrade ? 'sm:grid-cols-2' : ''}`}>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  aria-label="Search students"
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              {byGrade && (
                <SearchableSelect
                  value={gradeFilter}
                  onChange={(v) => setParams({ grade: v })}
                  options={getGradeOptions().map((g) => ({ value: String(g.value), label: `Grade ${g.label}` }))}
                  allLabel="All Grades"
                  ariaLabel="Filter by Grade"
                  searchPlaceholder="Search grades…"
                />
              )}
            </div>
            {filtering && students && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  Showing {shown.length} of {total} students
                </span>
                <button
                  type="button"
                  onClick={() => setParams({ q: null, grade: null })}
                  className="cursor-pointer text-sm font-medium text-cyan-600 hover:text-cyan-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6">
            {dayError && (
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-sm text-rose-900">
                  <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" aria-hidden />
                  <span>This day&apos;s attendance couldn&apos;t be loaded, so marks can&apos;t be changed yet.</span>
                </p>
                <button type="button" onClick={() => setDayAttempt((n) => n + 1)} className={secondaryButton}>
                  Try again
                </button>
              </div>
            )}

            {rosterError ? (
              <EmptyState
                icon={ExclamationTriangleIcon}
                iconClassName="text-rose-400"
                title="The students couldn't be loaded"
                description="Check your connection and try again."
                action={
                  <button type="button" onClick={() => setRosterAttempt((n) => n + 1)} className={secondaryButton}>
                    Try again
                  </button>
                }
              />
            ) : !students ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : total === 0 ? (
              <EmptyState
                icon={UserGroupIcon}
                title="No students yet"
                description={byGrade ? 'Students appear here once they are added to the school.' : 'Students appear here once they are enrolled in this class.'}
              />
            ) : shown.length === 0 ? (
              <EmptyState
                icon={MagnifyingGlassIcon}
                title="No students match"
                description="Try another name or grade."
                action={
                  <button type="button" onClick={() => setParams({ q: null, grade: null })} className={secondaryButton}>
                    Clear filters
                  </button>
                }
              />
            ) : (
              <div className={`space-y-5 transition-opacity ${ready ? '' : 'opacity-60'}`} aria-busy={!ready}>
                {sections.map((section) => {
                  const marked = byGrade ? section.students.filter((s) => marks[s.studentId]).length : 0
                  return (
                    <section key={section.key} className="space-y-2">
                      {byGrade && (
                        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-white shadow-sm sm:px-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                              <ClipboardDocumentCheckIcon className="h-5 w-5" aria-hidden />
                            </div>
                            <h2 className="text-lg font-semibold">{section.label}</h2>
                          </div>
                          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-sm tabular-nums">
                            {marked} of {section.students.length} marked
                          </span>
                        </div>
                      )}
                      <ul className="space-y-2">
                        {section.students.map((student) => (
                          <StudentRow
                            key={student.studentId}
                            student={student}
                            status={marks[student.studentId] ?? null}
                            disabled={!ready}
                            showGrade={!byGrade}
                            onPick={pick}
                          />
                        ))}
                      </ul>
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions, always in reach */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:p-4 lg:left-72">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p
            className={`flex items-center gap-1.5 text-sm ${dirty ? 'font-medium text-amber-700' : 'text-slate-500'}`}
            role="status"
          >
            {dirty ? (
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
            ) : (
              ready && Object.keys(saved).length > 0 && <CheckCircleIcon className="h-4 w-4 text-emerald-600" aria-hidden />
            )}
            {saveNote}
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={markAllPresent}
              disabled={!ready || saving || shownIds.length === 0}
              className={`${secondaryButton} flex-1 py-2.5 sm:flex-none`}
            >
              <CheckCircleIcon className="hidden h-5 w-5 text-emerald-600 sm:block" aria-hidden />
              Mark All Present
            </button>
            <button type="button" onClick={submit} disabled={!ready || !dirty || saving} className={`${primaryButton} flex-1 sm:flex-none`}>
              <ClipboardDocumentCheckIcon className="hidden h-5 w-5 sm:block" aria-hidden />
              {saving ? 'Saving…' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={leaving !== null} onClose={() => setLeaving(null)} size="md">
        <ModalHeader title="Discard changes?" subtitle={longDay(date)} icon={ExclamationTriangleIcon} tone="warning" />
        <ModalBody>
          <ConfirmBody tone="warning">
            {unsaved === 1 ? '1 change' : `${unsaved} changes`} to this day&apos;s attendance {unsaved === 1 ? "hasn't" : "haven't"} been saved.
            Leaving now loses {unsaved === 1 ? 'it' : 'them'}.
          </ConfirmBody>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => setLeaving(null)}>
            Keep editing
          </Button>
          <Button type="button" variant="warning" onClick={discardAndLeave}>
            Discard changes
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
