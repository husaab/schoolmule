// Pure helpers behind the /school-schedule page: reading filters out of the
// URL, narrowing the published sessions, and shaping them into the columns
// TimetableGrid draws — one per teacher / class / room for a single day, or
// one per weekday for a single teacher / class / room.

import { format } from 'date-fns'
import type { FixedBlock, MySchedule, PublishedSession } from '@/services/types/schedulePlanner'
import type { TimetableBlock, TimetableColumn, TimetableSession } from './TimetableGrid'
import { closureOn, dateForDay, weekDaysFor } from './myScheduleUtils'
import { dayLabel } from './timeUtils'

export type ViewBy = 'teacher' | 'class' | 'room'

export const VIEW_BY_OPTIONS: { key: ViewBy; label: string; singular: string }[] = [
  { key: 'teacher', label: 'Teachers', singular: 'Teacher' },
  { key: 'class', label: 'Classes', singular: 'Class' },
  { key: 'room', label: 'Rooms', singular: 'Room' },
]

export const isViewBy = (value: string): value is ViewBy =>
  VIEW_BY_OPTIONS.some((o) => o.key === value)

/** Sessions without a room still need a column in the room view. */
export const NO_ROOM = 'No room'

export interface ScheduleFilters {
  classes: string[]
  teachers: string[]
  courses: string[]
  query: string
  /** Only the signed-in teacher's own periods. */
  mine: boolean
}

// Multi-selects live in the URL as comma-separated names.
export const parseList = (raw: string): string[] =>
  raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : []

export const joinList = (items: string[]): string | null =>
  items.length > 0 ? items.join(',') : null

export const hasActiveFilters = (f: ScheduleFilters): boolean =>
  f.classes.length > 0 || f.teachers.length > 0 || f.courses.length > 0 || f.query !== '' || f.mine

/** "Grade 2" before "Grade 10", "JK" and "SK" wherever the alphabet puts them. */
export const distinctSorted = (values: string[]): string[] =>
  [...new Set(values)].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  )

export const entityName = (s: PublishedSession, by: ViewBy): string => {
  if (by === 'teacher') return s.teacherName
  if (by === 'class') return s.classGroupName
  return s.roomName || NO_ROOM
}

/** Distinct column subjects for a view, with the roomless bucket last. */
export const entityNames = (sessions: PublishedSession[], by: ViewBy): string[] => {
  const names = distinctSorted(sessions.map((s) => entityName(s, by)))
  return names.includes(NO_ROOM) ? [...names.filter((n) => n !== NO_ROOM), NO_ROOM] : names
}

export const applyFilters = (
  sessions: PublishedSession[],
  f: ScheduleFilters,
  userId: string | null
): PublishedSession[] => {
  const q = f.query.trim().toLowerCase()
  return sessions.filter((s) => {
    if (f.mine && s.teacherUserId !== userId) return false
    if (f.classes.length > 0 && !f.classes.includes(s.classGroupName)) return false
    if (f.teachers.length > 0 && !f.teachers.includes(s.teacherName)) return false
    if (f.courses.length > 0 && !f.courses.includes(s.courseName)) return false
    if (q) {
      const haystack = [s.courseName, s.classGroupName, s.teacherName, s.roomName ?? '']
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

/**
 * What a card says beneath the course, given what the column already names.
 * A teacher's column needn't repeat the teacher; a room's column needn't
 * repeat the room.
 */
const toTimetableSession = (
  s: PublishedSession,
  by: ViewBy,
  userId: string | null
): TimetableSession => ({
  id: s.sessionId,
  startMin: s.startMin,
  endMin: s.endMin,
  course: s.courseName,
  lines:
    by === 'teacher'
      ? [s.classGroupName]
      : by === 'class'
        ? [s.teacherName]
        : [s.classGroupName, s.teacherName],
  room: by === 'room' ? null : s.roomName,
  mine: Boolean(userId) && s.teacherUserId === userId,
})

/**
 * Breaks to draw in a column. A class's column shows the breaks that class
 * actually takes (whole-school ones plus its own staggered lunch) as real
 * bands. Teacher and room columns show whole-school breaks as bands and
 * class-specific ones as faint context strips — the teacher may well be
 * teaching the other band through that lunch.
 */
const blocksFor = (
  blocks: FixedBlock[],
  day: number,
  by: ViewBy,
  classGroupId: string | null | undefined
): TimetableBlock[] => {
  const today = blocks.filter((b) => b.dayOfWeek === day)
  if (by === 'class') {
    return today
      .filter(
        (b) => b.classGroupIds.length === 0 || (classGroupId && b.classGroupIds.includes(classGroupId))
      )
      .map((b) => ({ startMin: b.startMin, endMin: b.endMin, label: b.label }))
  }
  return today.map((b) => ({
    startMin: b.startMin,
    endMin: b.endMin,
    label: b.label,
    subtle: b.classGroupIds.length > 0,
  }))
}

const fillableOn = (data: MySchedule, day: number) =>
  data.dayTemplates.find((d) => d.dayOfWeek === day)?.fillableRanges

/** One day, one column per teacher / class / room that has a period that day. */
export const dayColumns = (
  data: MySchedule,
  sessions: PublishedSession[],
  day: number,
  by: ViewBy,
  userId: string | null,
  isToday: boolean
): TimetableColumn[] => {
  const daySessions = sessions.filter((s) => s.dayOfWeek === day)
  const closure = closureOn(data.closures, dateForDay(data.weekStart, day))
  return entityNames(daySessions, by).map((name) => {
    const own = daySessions.filter((s) => entityName(s, by) === name)
    return {
      key: name,
      label: name,
      sessions: own.map((s) => toTimetableSession(s, by, userId)),
      fixedBlocks: blocksFor(data.fixedBlocks, day, by, own.find((s) => s.classGroupId)?.classGroupId),
      fillableRanges: fillableOn(data, day),
      closure: closure?.title ?? null,
      today: isToday,
    }
  })
}

/** One teacher / class / room, one column per school day of the week. */
export const weekColumns = (
  data: MySchedule,
  sessions: PublishedSession[],
  by: ViewBy,
  focus: string,
  userId: string | null,
  todayIso: number
): TimetableColumn[] => {
  const own = sessions.filter((s) => entityName(s, by) === focus)
  const classGroupId = own.find((s) => s.classGroupId)?.classGroupId
  return weekDaysFor(data).map((day) => {
    const date = dateForDay(data.weekStart, day)
    return {
      key: String(day),
      label: dayLabel(day),
      sublabel: format(date, 'MMM d'),
      sessions: own.filter((s) => s.dayOfWeek === day).map((s) => toTimetableSession(s, by, userId)),
      fixedBlocks: blocksFor(data.fixedBlocks, day, by, classGroupId),
      fillableRanges: fillableOn(data, day),
      closure: closureOn(data.closures, date)?.title ?? null,
      today: day === todayIso,
    }
  })
}
