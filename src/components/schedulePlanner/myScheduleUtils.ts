// Helpers shared by the teacher-facing schedule surfaces (navbar menu,
// dashboard hero, /my-schedule page).

import type {
  FixedBlock,
  MySchedule,
  PublishedSession,
  ScheduleClosure,
} from '@/services/types/schedulePlanner'
import type { GridFixedBlock, GridSession } from './WeeklyGrid'

/** ISO weekday, Monday = 1 … Sunday = 7 (JS getDay() puts Sunday at 0). */
export const isoDayOf = (date: Date): number => (date.getDay() === 0 ? 7 : date.getDay())

/** yyyy-mm-dd in local time, matching the school calendar's date-only values. */
export const toIsoDate = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The closure covering a date, if the school is closed that day. */
export const closureOn = (
  closures: ScheduleClosure[],
  date: Date
): ScheduleClosure | null => {
  const iso = toIsoDate(date)
  return closures.find((c) => c.startDate <= iso && iso <= c.endDate) ?? null
}

/** The Monday-based date for each weekday of the week `weekStart` begins. */
export const dateForDay = (weekStart: string, day: number): Date => {
  const d = new Date(`${weekStart}T00:00:00`)
  d.setDate(d.getDate() + (day - 1))
  return d
}

export const sessionsOn = (sessions: PublishedSession[], day: number): PublishedSession[] =>
  sessions.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startMin - b.startMin)

/** Days the teacher actually teaches, in order. */
export const teachingDays = (sessions: PublishedSession[]): number[] =>
  [...new Set(sessions.map((s) => s.dayOfWeek))].sort((a, b) => a - b)

export const toGridSession = (s: PublishedSession): GridSession => ({
  id: s.sessionId,
  day: s.dayOfWeek,
  startMin: s.startMin,
  endMin: s.endMin,
  title: s.courseName,
  subtitle: s.classGroupName,
  roomName: s.roomName,
})

/**
 * Breaks to draw on a teacher's grid. Whole-school blocks are real breaks for
 * them; class-group blocks (staggered lunches) are context only — the teacher
 * may be teaching the other band through one — so they render as subtle
 * strips, matching the admin workspace's by-teacher view.
 */
export const toGridFixedBlocks = (blocks: FixedBlock[]): GridFixedBlock[] =>
  blocks.map((b) => ({
    day: b.dayOfWeek,
    startMin: b.startMin,
    endMin: b.endMin,
    label: b.label,
    subtle: b.classGroupIds.length > 0,
  }))

/** Vertical bounds of the grid: the school's open hours, else the sessions. */
export const timeBounds = (data: MySchedule): [number, number] => {
  const ranges = data.dayTemplates.flatMap((d) => d.fillableRanges)
  if (ranges.length > 0) {
    return [Math.min(...ranges.map((r) => r.startMin)), Math.max(...ranges.map((r) => r.endMin))]
  }
  if (data.sessions.length > 0) {
    return [
      Math.min(...data.sessions.map((s) => s.startMin)),
      Math.max(...data.sessions.map((s) => s.endMin)),
    ]
  }
  return [480, 930]
}

export const fillableByDay = (data: MySchedule): Record<number, { startMin: number; endMin: number }[]> => {
  const map: Record<number, { startMin: number; endMin: number }[]> = {}
  for (const d of data.dayTemplates) map[d.dayOfWeek] = d.fillableRanges
  return map
}
