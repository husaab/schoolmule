// src/lib/attendanceRoll.ts
// The rules of taking attendance for a list of students on one day, shared by
// General Attendance and Class Attendance (components/attendance/AttendanceRoll)
// and by the app's AttendanceTaker. A mark is Present, Late or Absent; picking
// the mark a student already has clears it. A save sends only what changed
// since the day was loaded: the new and changed marks, and the students whose
// saved mark was cleared (the server removes those). Pure, unit-tested
// (attendanceRoll.test.ts).

import type { AttendanceEntry, AttendanceStatus } from '@/services/types/attendance'

/** What is on screen: a student's mark, or null/absent when unmarked. */
export type AttendanceMarks = Record<string, AttendanceStatus | null | undefined>
/** What the server holds for the day. */
export type SavedAttendance = Record<string, AttendanceStatus>

export interface AttendanceChanges {
  /** Marks that are new or differ from what is saved. */
  entries: AttendanceEntry[]
  /** Students whose saved mark was cleared. */
  cleared: string[]
}

export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = ['PRESENT', 'LATE', 'ABSENT']

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'Present',
  LATE: 'Late',
  ABSENT: 'Absent',
}

/** Picks a mark for one student; picking the mark they already have clears it. */
export function toggleMark(marks: AttendanceMarks, studentId: string, status: AttendanceStatus): AttendanceMarks {
  return { ...marks, [studentId]: marks[studentId] === status ? null : status }
}

/** Gives every listed student the same mark and leaves everyone else as they were. */
export function markAll(marks: AttendanceMarks, studentIds: readonly string[], status: AttendanceStatus): AttendanceMarks {
  const next = { ...marks }
  for (const id of studentIds) next[id] = status
  return next
}

/** What a save has to send to turn `saved` into `marks`. */
export function attendanceChanges(marks: AttendanceMarks, saved: SavedAttendance): AttendanceChanges {
  const entries: AttendanceEntry[] = []
  const cleared: string[] = []
  for (const [studentId, status] of Object.entries(marks)) {
    if (status) {
      if (saved[studentId] !== status) entries.push({ studentId, status })
    } else if (saved[studentId]) {
      cleared.push(studentId)
    }
  }
  return { entries, cleared }
}

/** How many students a save would touch. Zero means there is nothing to save. */
export function countChanges(marks: AttendanceMarks, saved: SavedAttendance): number {
  const { entries, cleared } = attendanceChanges(marks, saved)
  return entries.length + cleared.length
}

/** The saved marks of a day as the server lists them, by student. */
export function savedFromEntries(entries: readonly AttendanceEntry[]): SavedAttendance {
  const saved: SavedAttendance = {}
  for (const { studentId, status } of entries) saved[studentId] = status
  return saved
}

/** The saved state once `marks` has been stored: every mark that is set. */
export function savedFrom(marks: AttendanceMarks): SavedAttendance {
  const saved: SavedAttendance = {}
  for (const [studentId, status] of Object.entries(marks)) if (status) saved[studentId] = status
  return saved
}

export interface AttendanceCounts {
  PRESENT: number
  LATE: number
  ABSENT: number
  unmarked: number
}

/** Present, late, absent and unmarked among the listed students. */
export function countMarks(studentIds: readonly string[], marks: AttendanceMarks): AttendanceCounts {
  const counts: AttendanceCounts = { PRESENT: 0, LATE: 0, ABSENT: 0, unmarked: 0 }
  for (const id of studentIds) {
    const status = marks[id]
    if (status) counts[status] += 1
    else counts.unmarked += 1
  }
  return counts
}

// ── Days ────────────────────────────────────────────────────────────────────
// A day is a "yyyy-MM-dd" key in the person's own time zone. Keys are read at
// noon so a day never slips to its neighbour across a time zone or a clock
// change.

const pad = (n: number) => String(n).padStart(2, '0')

/** The "yyyy-MM-dd" key of a date, in local time. */
export const dayKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** The local date a day key names (at noon), or null when it is not a real day. */
export function dayFromKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  const d = new Date(`${key}T12:00:00`)
  return Number.isNaN(d.getTime()) || dayKey(d) !== key ? null : d
}

export const isDayKey = (key: string): boolean => dayFromKey(key) !== null

/** The day `n` days after `key` (before it when negative). An unreadable key comes back unchanged. */
export function shiftDay(key: string, n: number): string {
  const d = dayFromKey(key)
  if (!d) return key
  d.setDate(d.getDate() + n)
  return dayKey(d)
}
