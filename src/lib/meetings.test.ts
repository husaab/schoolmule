import { describe, expect, it } from 'vitest'
import { planVisit, rangeLabel, timeLabel, wantsFor, freeTimes, parseTime, toTimeInput, cutoffText } from './meetings'
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
  useGradeRoom: true, siblingsShare, teachersEditHours: true, emailInvite: true, emailLastCall: true, lastCallAt: null,
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
      [{ bookingId: 'b1', teacherId: 'saleh', teacherName: 'saleh', dayId: MON, start: H(16), end: H(16, 10), studentIds: ['adam'], room: null, canChange: true, byOffice: false }],
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
