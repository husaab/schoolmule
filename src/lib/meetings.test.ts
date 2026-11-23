import { describe, expect, it } from 'vitest'
import { planVisit, rangeLabel, timeLabel, wantsFor, freeTimes, parseTime, toTimeInput, cutoffText, cleanPhone, defaultHow, howReady, howBody, howChanged, placeLabel, telHref } from './meetings'
import type { ParentMeetingEvent, ParentMeetingTeacher } from '@/services/types/meetings'

const H = (h: number, m = 0) => h * 60 + m
const MON = 'mon'
const TUE = 'tue'
const times = (from: number, to: number, len = 10, skip: number[] = []) => {
  const out = []
  for (let t = from; t + len <= to; t += len) if (!skip.includes(t)) out.push({ start: t, end: t + len })
  return out
}

const teacher = (teacherId: string, studentIds: string[], mon: ReturnType<typeof times>, tue: ReturnType<typeof times> = []): ParentMeetingTeacher => ({
  teacherId,
  name: teacherId,
  studentIds,
  subjects: {},
  classIds: {},
  room: null,
  slotMinutes: 10,
  days: [
    { dayId: MON, works: true, total: mon.length, open: mon },
    { dayId: TUE, works: true, total: tue.length, open: tue },
  ],
})

const event = (teachers: ParentMeetingTeacher[], bookings: ParentMeetingEvent['bookings'] = [], siblingsShare = true): ParentMeetingEvent => ({
  eventId: 'e', title: 'Meetings', status: 'open', phase: 'open', slotMinutes: 10, opensAt: null, openedAt: null, cutoffMin: H(20),
  useGradeRoom: true, siblingsShare, teachersEditHours: true, emailInvite: true, emailLastCall: true, lastCallAt: null, allowPhone: true, phone: null,
  lastCallSentAt: null, emailReminder: true, reminderMin: H(18), emailTeacherList: true,
  days: [
    { dayId: MON, date: '2026-11-30', start: H(15, 30), end: H(19, 30), everyone: true, cutoffAt: '', bookable: true, window: null },
    { dayId: TUE, date: '2026-12-01', start: H(9), end: H(13), everyone: true, cutoffAt: '', bookable: true, window: null },
  ],
  children: [],
  teachers,
  bookings,
})

describe('labels', () => {
  it('reads times like the designs', () => {
    expect(timeLabel(H(15, 30))).toBe('3:30 PM')
    expect(timeLabel(H(0, 5))).toBe('12:05 AM')
    expect(rangeLabel(H(15, 30), H(19, 30))).toBe('3:30–7:30 PM')
    expect(rangeLabel(H(9), H(13))).toBe('9:00 AM–1:00 PM')
    expect(parseTime('16:40')).toBe(H(16, 40))
    expect(parseTime('25:00')).toBeNull()
    expect(toTimeInput(H(9, 5))).toBe('09:05')
    expect(cutoffText(H(20))).toBe('until 8:00 PM the evening before')
    expect(cutoffText(null)).toBe('until the meeting starts')
  })
})

describe('planVisit', () => {
  it('lines meetings up back to back from the arrival time, around what is already booked', () => {
    const e = event(
      [
        teacher('saleh', ['adam'], times(H(15, 30), H(17))),
        teacher('rahman', ['adam', 'lina'], times(H(15, 30), H(17))),
        teacher('khalil', ['lina'], times(H(15, 30), H(17))),
      ],
      [{ bookingId: 'b1', teacherId: 'saleh', teacherName: 'saleh', dayId: MON, start: H(16), end: H(16, 10), studentIds: ['adam'], mode: 'in_person', phone: null, room: null, canChange: true, byOffice: false }],
    )
    const wants = wantsFor(e, ['adam', 'lina'])
    expect(wants).toEqual([{ teacherId: 'rahman', studentIds: ['adam', 'lina'] }, { teacherId: 'khalil', studentIds: ['lina'] }])
    const plan = planVisit(e, wants, MON, H(16))
    expect(plan.added.map((m) => [m.teacherId, timeLabel(m.start)])).toEqual([['rahman', '4:10 PM'], ['khalil', '4:20 PM']])
    expect(plan.meetings.map((m) => m.teacherId)).toEqual(['saleh', 'rahman', 'khalil'])
    expect(plan.span).toEqual({ start: H(16), end: H(16, 30) })
  })

  it('waits out a break, and offers another day to a teacher who is full', () => {
    const e = event([
      teacher('hassan', ['adam'], times(H(15, 30), H(19, 30), 10, [H(16, 40), H(16, 50)]).filter((s) => s.start >= H(16, 40))),
      teacher('dubois', ['adam'], [], times(H(9), H(10))),
    ])
    const plan = planVisit(e, wantsFor(e, ['adam']), MON, H(16, 35))
    expect(plan.added.map((m) => timeLabel(m.start))).toEqual(['5:00 PM'])
    expect(plan.unplaced).toEqual([{ teacherId: 'dubois', studentIds: ['adam'], alternative: expect.objectContaining({ dayId: TUE, start: H(9) }) }])
  })

  it('gives the scarce teacher the time when two are free at once', () => {
    const e = event([
      teacher('many', ['adam'], times(H(16), H(18))),
      teacher('few', ['adam'], [{ start: H(16), end: H(16, 10) }]),
    ])
    const plan = planVisit(e, wantsFor(e, ['adam']), MON, H(16))
    expect(plan.added.map((m) => [m.teacherId, timeLabel(m.start)])).toEqual([['few', '4:00 PM'], ['many', '4:10 PM']])
  })

  it('books siblings separately when the school does, never at the same time', () => {
    const e = event([teacher('farouk', ['adam', 'lina'], times(H(16), H(17)))], [], false)
    const wants = wantsFor(e, ['adam', 'lina'])
    expect(wants).toHaveLength(2)
    const plan = planVisit(e, wants, MON, H(16))
    expect(plan.added.map((m) => timeLabel(m.start))).toEqual(['4:00 PM', '4:10 PM'])
    expect(freeTimes(e, e.teachers[0], MON, plan.added).map((s) => s.start)).not.toContain(H(16))
  })
})

describe('slotsFor', () => {
  it('matches the server: 22 times on Monday around Maghrib, realigned after a break', async () => {
    const { slotsFor } = await import('./meetings')
    expect(slotsFor(H(15, 30), H(19, 30), 10, [{ start: H(16, 40), end: H(17) }])).toHaveLength(22)
    expect(slotsFor(H(10, 50), H(12), 15, [{ start: H(11), end: H(11, 20) }]).map((s) => s.start)).toEqual([H(11, 20), H(11, 35)])
  })
})

describe('in person or a phone call', () => {
  it('checks a number as the server does', () => {
    expect(cleanPhone(' 416  555-0100 ')).toBe('416 555-0100')
    expect(cleanPhone('+1 (416) 555-0100 ext. 12')).toBe('+1 (416) 555-0100 ext. 12')
    expect(cleanPhone('555-01')).toBeNull()
    expect(cleanPhone('call my cell')).toBeNull()
    expect(cleanPhone(null)).toBeNull()
  })
  it('is ready in person, or by phone with a number', () => {
    expect(howReady({ mode: 'in_person', phone: '' })).toBe(true)
    expect(howReady({ mode: 'phone', phone: '' })).toBe(false)
    expect(howReady({ mode: 'phone', phone: '416-555-0100' })).toBe(true)
    expect(howBody({ mode: 'in_person', phone: '416-555-0100' })).toEqual({ mode: 'in_person', phone: null })
    expect(howBody({ mode: 'phone', phone: ' 416-555-0100 ' })).toEqual({ mode: 'phone', phone: '416-555-0100' })
  })
  it('knows when a booked meeting changes how it happens', () => {
    const booked = { mode: 'phone' as const, phone: '416-555-0100', room: null }
    expect(howChanged(booked, { mode: 'phone', phone: '416-555-0100 ' })).toBe(false)
    expect(howChanged(booked, { mode: 'phone', phone: '647-555-0199' })).toBe(true)
    expect(howChanged(booked, { mode: 'in_person', phone: '' })).toBe(true)
  })
  it('starts a new booking the way the family has booked so far', () => {
    const b = (mode: 'in_person' | 'phone') => ({ mode, phone: mode === 'phone' ? '416-555-0100' : null }) as ParentMeetingEvent['bookings'][number]
    expect(defaultHow({ allowPhone: true, phone: '416-555-0100', bookings: [] })).toEqual({ mode: 'in_person', phone: '416-555-0100' })
    expect(defaultHow({ allowPhone: true, phone: null, bookings: [b('phone')] })).toEqual({ mode: 'phone', phone: '' })
    expect(defaultHow({ allowPhone: true, phone: null, bookings: [b('phone'), b('in_person')] }).mode).toBe('in_person')
    expect(defaultHow({ allowPhone: false, phone: null, bookings: [b('phone')] }).mode).toBe('in_person')
  })
  it('labels where it happens, and dials the number', () => {
    expect(placeLabel({ mode: 'in_person', phone: null, room: 'Grade 5 room' })).toBe('Grade 5 room')
    expect(placeLabel({ mode: 'phone', phone: '416-555-0100', room: null })).toBe('Phone call · 416-555-0100')
    expect(placeLabel({ mode: 'phone', phone: '416-555-0100', room: null, callFrom: '905-555-0199' })).toBe('Phone call · 416-555-0100 · calls from 905-555-0199')
    expect(telHref('+1 (416) 555-0100 ext. 12')).toBe('tel:+14165550100')
  })
})

describe('the office sidebar link', () => {
  const summary = (eventId: string, lastDay: string | null, status: 'draft' | 'open' = 'draft') =>
    ({ eventId, lastDay, firstDay: lastDay, status }) as unknown as import('@/services/types/meetings').MeetingEventSummary
  it('shows while an event has days ahead (or none yet), and goes straight to a single event', async () => {
    const { currentOfficeEvents, officeMeetingsHref, torontoToday } = await import('@/store/useMeetingsStore')
    expect(torontoToday(new Date('2026-11-23T03:00:00Z'))).toBe('2026-11-22')
    const events = [summary('a', '2026-12-01'), summary('b', '2026-06-01'), summary('c', null)]
    expect(currentOfficeEvents(events, '2026-11-23').map((e) => e.eventId)).toEqual(['a', 'c'])
    expect(currentOfficeEvents(events, '2026-12-02').map((e) => e.eventId)).toEqual(['c'])
    expect(officeMeetingsHref([summary('a', '2026-12-01')])).toBe('/admin-panel/parent-teacher-meetings/a')
    expect(officeMeetingsHref(events)).toBe('/admin-panel/parent-teacher-meetings')
  })
})
