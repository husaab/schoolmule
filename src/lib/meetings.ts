// src/lib/meetings.ts
// Parent–teacher meetings on the page: time labels, and Plan my visit, which
// lines a family's meetings up back to back from the time they arrive.
// Times are minutes from midnight (930 = 3:30 PM); the server computes every
// teacher's open times, so this only ever picks among them.

import type { MeetingHow, MeetingMode, ParentMeetingEvent, ParentMeetingTeacher, TimeRange } from '@/services/types/meetings'
import { cleanPhone } from './phone'

export { cleanPhone, telHref } from './phone'

/** '3:30 PM' */
export function timeLabel(min: number): string {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** '3:30' without the AM/PM. */
export const shortTime = (min: number): string => timeLabel(min).replace(/ [AP]M$/, '')

/** '3:30–7:30 PM', or '9:00 AM–1:00 PM' across noon. */
export function rangeLabel(start: number, end: number): string {
  const a = timeLabel(start)
  const b = timeLabel(end)
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)}–${b}` : `${a}–${b}`
}

const asDate = (date: string) => new Date(`${date}T12:00:00Z`)

/** 'Mon, Nov 30' */
export const dayShort = (date: string): string =>
  asDate(date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })

/** 'Monday, November 30' */
export const dayLong = (date: string): string =>
  asDate(date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' })

/** 'Mon' */
export const weekdayShort = (date: string): string =>
  asDate(date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' })

/** 'Monday' */
export const weekdayLong = (date: string): string =>
  asDate(date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long' })

/** 'Sun, Nov 29, 8:00 PM' for an instant, Toronto time. */
export const instantLabel = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Toronto', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

/** 'Adam & Lina', 'Adam, Lina & Sara' */
export const joinNames = (names: string[]): string =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`

export const overlaps = (a: TimeRange, b: TimeRange) => a.start < b.end && b.start < a.end

// ── In person or a phone call ──────────────────────────────

/** A meeting's how, chosen on a form: the mode, and the number as typed. */
export interface HowChoice {
  mode: MeetingMode
  phone: string
}

/**
 * Where a new booking's choice starts: a phone call when every meeting the
 * family has booked is one (and the school allows it), else in person; the
 * number is the one the server suggests.
 */
export const defaultHow = (event: Pick<ParentMeetingEvent, 'allowPhone' | 'phone' | 'bookings'>): HowChoice => ({
  mode: event.allowPhone && event.bookings.length > 0 && event.bookings.every((b) => b.mode === 'phone') ? 'phone' : 'in_person',
  phone: event.phone ?? '',
})

/** The choice is complete: in person, or a phone call with a real number. */
export const howReady = (how: HowChoice): boolean => how.mode === 'in_person' || cleanPhone(how.phone) !== null

/** What a booking request sends for a choice. */
export const howBody = (how: HowChoice): { mode: MeetingMode; phone: string | null } =>
  how.mode === 'phone' ? { mode: 'phone', phone: cleanPhone(how.phone) } : { mode: 'in_person', phone: null }

/** Did the choice change from how the meeting is booked? */
export const howChanged = (booked: MeetingHow, how: HowChoice): boolean =>
  booked.mode !== how.mode || (how.mode === 'phone' && cleanPhone(how.phone) !== booked.phone)

/**
 * Where a meeting happens, in one line: 'Grade 5 room', 'Phone call · 416-555-0100',
 * or, when the family's own booking says the teacher's number, '… · calls from 905-555-0199'.
 */
export const placeLabel = (b: MeetingHow & { callFrom?: string | null }): string | null =>
  b.mode === 'phone' ? `Phone call · ${b.phone ?? ''}${b.callFrom ? ` · calls from ${b.callFrom}` : ''}` : b.room


/** "Until 8:00 PM the evening before" */
export const cutoffText = (cutoffMin: number | null): string =>
  cutoffMin == null ? 'until the meeting starts' : `until ${timeLabel(cutoffMin)} the evening before`

/** The minutes from midnight of a 'H:MM' value; null when it doesn't parse. */
export function parseTime(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** '15:30' for an <input type="time">. */
export const toTimeInput = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

// ── One family's view ─────────────────────────────────────

/**
 * What a family still has to book with one teacher: the children of theirs
 * the teacher meets and hasn't met yet. With siblings sharing (the default),
 * that's one meeting covering them all.
 */
export function unbookedWith(event: ParentMeetingEvent, teacher: ParentMeetingTeacher): string[] {
  return teacher.studentIds.filter(
    (id) => !event.bookings.some((b) => b.teacherId === teacher.teacherId && b.studentIds.includes(id)),
  )
}

/** The family's booked times on a day, as ranges. */
export const busyOn = (event: ParentMeetingEvent, dayId: string): TimeRange[] =>
  event.bookings.filter((b) => b.dayId === dayId).map(({ start, end }) => ({ start, end }))

/** A teacher's open times on a day the family is free for. */
export function freeTimes(event: ParentMeetingEvent, teacher: ParentMeetingTeacher, dayId: string, extraBusy: TimeRange[] = []): TimeRange[] {
  const busy = [...busyOn(event, dayId), ...extraBusy]
  return (teacher.days.find((d) => d.dayId === dayId)?.open || []).filter((s) => !busy.some((b) => overlaps(b, s)))
}

// ── Plan my visit ─────────────────────────────────────────

export interface PlanWant {
  teacherId: string
  studentIds: string[]
}

export interface PlannedMeeting extends TimeRange {
  teacherId: string
  dayId: string
  studentIds: string[]
  /** Already booked (shown in the visit, not booked again). */
  bookingId?: string
}

export interface PlanResult {
  dayId: string
  /** The day's meetings in time order: the ones already booked and the new ones. */
  meetings: PlannedMeeting[]
  /** New meetings to book. */
  added: PlannedMeeting[]
  /** Teachers with nothing that day; `alternative` is their first free time on another day. */
  unplaced: (PlanWant & { alternative: PlannedMeeting | null })[]
  span: TimeRange | null
}

/**
 * Back to back from `arriveAt`: each round takes the teacher whose next free
 * time comes first (a tie goes to the teacher with fewer free times that day,
 * so the scarce ones aren't squeezed out), then carries on from the end of
 * that meeting. A teacher with no free time that day is offered their first
 * free time on another bookable day.
 */
export function planVisit(event: ParentMeetingEvent, wants: PlanWant[], dayId: string, arriveAt: number): PlanResult {
  const byId = new Map(event.teachers.map((t) => [t.teacherId, t]))
  const added: PlannedMeeting[] = []
  const remaining = wants.filter((w) => byId.has(w.teacherId) && w.studentIds.length)
  const unplaced: PlanResult['unplaced'] = []
  let cursor = arriveAt

  while (remaining.length) {
    let pick: { i: number; slot: TimeRange; options: number } | null = null
    remaining.forEach((w, i) => {
      const free = freeTimes(event, byId.get(w.teacherId)!, dayId, added)
      const next = free.find((s) => s.start >= cursor)
      if (!next) return
      if (!pick || next.start < pick.slot.start || (next.start === pick.slot.start && free.length < pick.options)) {
        pick = { i, slot: next, options: free.length }
      }
    })
    if (!pick) break
    const { i, slot } = pick as { i: number; slot: TimeRange }
    const [w] = remaining.splice(i, 1)
    added.push({ teacherId: w.teacherId, dayId, studentIds: w.studentIds, start: slot.start, end: slot.end })
    cursor = slot.end
  }

  for (const w of remaining) {
    const teacher = byId.get(w.teacherId)!
    let alternative: PlannedMeeting | null = null
    for (const d of event.days) {
      if (d.dayId === dayId || !d.bookable) continue
      const free = freeTimes(event, teacher, d.dayId)
      if (free.length) {
        alternative = { teacherId: w.teacherId, dayId: d.dayId, studentIds: w.studentIds, ...free[0] }
        break
      }
    }
    unplaced.push({ ...w, alternative })
  }

  const existing: PlannedMeeting[] = event.bookings
    .filter((b) => b.dayId === dayId)
    .map((b) => ({ teacherId: b.teacherId, dayId, studentIds: b.studentIds, start: b.start, end: b.end, bookingId: b.bookingId }))
  const meetings = [...existing, ...added].sort((a, b) => a.start - b.start)
  return {
    dayId,
    meetings,
    added,
    unplaced,
    span: meetings.length ? { start: meetings[0].start, end: meetings[meetings.length - 1].end } : null,
  }
}

/**
 * Who a family still has to book, one want per teacher (siblings together
 * when the school shares meetings, else one per child).
 */
export function wantsFor(event: ParentMeetingEvent, studentIds: string[]): PlanWant[] {
  const out: PlanWant[] = []
  for (const t of event.teachers) {
    const kids = unbookedWith(event, t).filter((id) => studentIds.includes(id))
    if (!kids.length) continue
    if (event.siblingsShare) out.push({ teacherId: t.teacherId, studentIds: kids })
    else kids.forEach((id) => out.push({ teacherId: t.teacherId, studentIds: [id] }))
  }
  return out
}

// ── A teacher's times (the server's services/meetings/slots.js) ──

/**
 * The times from `start` to `end`, `length` long, around `breaks`: a time
 * that would overlap a break starts again at the break's end. The same rule
 * the server books by, used here to preview how many times hours give.
 */
export function slotsFor(start: number, end: number, length: number, breaks: TimeRange[] = []): TimeRange[] {
  const out: TimeRange[] = []
  if (!(length > 0) || !(end > start)) return out
  const sorted = [...breaks].sort((a, b) => a.start - b.start)
  let t = start
  while (t + length <= end) {
    const hit = sorted.find((b) => b.start < t + length && b.end > t)
    if (hit) {
      t = hit.end
      continue
    }
    out.push({ start: t, end: t + length })
    t += length
  }
  return out
}

/** The list a 409 BOOKED_TIMES carries, for showing which families stand in the way. */
export function bookedTimesFrom(err: unknown): string[] {
  const data = (err as { data?: { bookings?: { label: string }[] } } | null)?.data
  return Array.isArray(data?.bookings) ? data!.bookings!.map((b) => b.label) : []
}
