import { describe, expect, it } from 'vitest'
import {
  attendanceChanges,
  countChanges,
  countMarks,
  dayFromKey,
  dayKey,
  isDayKey,
  markAll,
  savedFrom,
  savedFromEntries,
  shiftDay,
  toggleMark,
  withSavedElsewhere,
} from './attendanceRoll'

describe('toggleMark', () => {
  it('sets a mark, changes it, and clears it when picked again', () => {
    const present = toggleMark({}, 's1', 'PRESENT')
    expect(present).toEqual({ s1: 'PRESENT' })
    const late = toggleMark(present, 's1', 'LATE')
    expect(late).toEqual({ s1: 'LATE' })
    expect(toggleMark(late, 's1', 'LATE')).toEqual({ s1: null })
  })

  it('leaves other students and the original object alone', () => {
    const before = { s1: 'ABSENT' as const, s2: 'PRESENT' as const }
    expect(toggleMark(before, 's2', 'LATE')).toEqual({ s1: 'ABSENT', s2: 'LATE' })
    expect(before).toEqual({ s1: 'ABSENT', s2: 'PRESENT' })
  })
})

describe('markAll', () => {
  it('marks only the listed students and keeps everyone else', () => {
    const before = { s1: 'ABSENT' as const, s2: null, s9: 'LATE' as const }
    expect(markAll(before, ['s1', 's2', 's3'], 'PRESENT')).toEqual({
      s1: 'PRESENT',
      s2: 'PRESENT',
      s3: 'PRESENT',
      s9: 'LATE',
    })
    expect(before.s1).toBe('ABSENT')
  })
})

describe('attendanceChanges', () => {
  it('sends nothing when the marks match what is saved', () => {
    const saved = { s1: 'PRESENT' as const, s2: 'ABSENT' as const }
    expect(attendanceChanges({ ...saved }, saved)).toEqual({ entries: [], cleared: [] })
    expect(countChanges({ ...saved }, saved)).toBe(0)
  })

  it('sends new and changed marks, not the ones that stayed the same', () => {
    const saved = { s1: 'PRESENT' as const, s2: 'ABSENT' as const }
    const marks = { s1: 'PRESENT' as const, s2: 'LATE' as const, s3: 'PRESENT' as const }
    expect(attendanceChanges(marks, saved)).toEqual({
      entries: [
        { studentId: 's2', status: 'LATE' },
        { studentId: 's3', status: 'PRESENT' },
      ],
      cleared: [],
    })
  })

  it('lists a student whose saved mark was cleared', () => {
    const saved = { s1: 'PRESENT' as const, s2: 'ABSENT' as const }
    expect(attendanceChanges({ s1: null, s2: 'ABSENT' }, saved)).toEqual({ entries: [], cleared: ['s1'] })
    expect(countChanges({ s1: null, s2: 'ABSENT' }, saved)).toBe(1)
  })

  it('ignores a mark that was set and cleared again before saving', () => {
    expect(attendanceChanges({ s1: null, s2: undefined }, {})).toEqual({ entries: [], cleared: [] })
  })

  it('keeps a saved mark for a student who is not on screen', () => {
    // Saved marks the screen never touched are not in `marks` as null.
    const saved = { gone: 'ABSENT' as const }
    expect(attendanceChanges({ gone: 'ABSENT', s1: 'PRESENT' }, saved)).toEqual({
      entries: [{ studentId: 's1', status: 'PRESENT' }],
      cleared: [],
    })
  })
})

describe('savedFromEntries', () => {
  it("maps the server's list by student", () => {
    expect(savedFromEntries([{ studentId: 's1', status: 'PRESENT' }, { studentId: 's2', status: 'ABSENT' }])).toEqual({ s1: 'PRESENT', s2: 'ABSENT' })
    expect(savedFromEntries([])).toEqual({})
  })
})

describe('savedFrom', () => {
  it('keeps the marks that are set', () => {
    expect(savedFrom({ s1: 'PRESENT', s2: null, s3: undefined, s4: 'LATE' })).toEqual({ s1: 'PRESENT', s4: 'LATE' })
  })

  it('leaves nothing to save once stored', () => {
    const marks = { s1: 'PRESENT' as const, s2: null }
    expect(countChanges(marks, savedFrom(marks))).toBe(0)
  })
})

describe('withSavedElsewhere', () => {
  it('takes what was saved elsewhere, keeping changes made on screen and not saved', () => {
    const saved = { s1: 'PRESENT' as const, s2: 'ABSENT' as const, s3: 'LATE' as const }
    // On screen: s2 changed to Late, s3 cleared, s4 newly marked; s1 untouched.
    const marks = { s1: 'PRESENT' as const, s2: 'LATE' as const, s3: null, s4: 'ABSENT' as const }
    // Saved through Muley meanwhile: s1 Absent, s5 Present.
    const fresh = { s1: 'ABSENT' as const, s2: 'ABSENT' as const, s3: 'LATE' as const, s5: 'PRESENT' as const }

    const next = withSavedElsewhere(marks, saved, fresh)

    expect(next).toEqual({ s1: 'ABSENT', s2: 'LATE', s3: null, s4: 'ABSENT', s5: 'PRESENT' })
    expect(attendanceChanges(next, fresh)).toEqual({ entries: [{ studentId: 's2', status: 'LATE' }, { studentId: 's4', status: 'ABSENT' }], cleared: ['s3'] })
  })

  it('is exactly what is saved when nothing was changed on screen', () => {
    const saved = { s1: 'PRESENT' as const }
    expect(withSavedElsewhere({ ...saved }, saved, { s1: 'LATE', s2: 'ABSENT' })).toEqual({ s1: 'LATE', s2: 'ABSENT' })
  })
})

describe('countMarks', () => {
  it('counts the listed students only', () => {
    const marks = { s1: 'PRESENT' as const, s2: 'LATE' as const, s3: 'ABSENT' as const, s4: null, other: 'ABSENT' as const }
    expect(countMarks(['s1', 's2', 's3', 's4', 's5'], marks)).toEqual({ PRESENT: 1, LATE: 1, ABSENT: 1, unmarked: 2 })
  })

  it('is all zero for an empty list', () => {
    expect(countMarks([], { s1: 'PRESENT' })).toEqual({ PRESENT: 0, LATE: 0, ABSENT: 0, unmarked: 0 })
  })
})

describe('days', () => {
  it('writes a local date as a day key', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(dayKey(new Date(2026, 10, 26, 0, 0))).toBe('2026-11-26')
  })

  it('reads a key back as the same local day', () => {
    const d = dayFromKey('2026-11-26')
    expect(d && [d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 26])
  })

  it('refuses keys that are not real days', () => {
    expect(isDayKey('2026-11-26')).toBe(true)
    expect(isDayKey('2026-02-30')).toBe(false)
    expect(isDayKey('2026-13-01')).toBe(false)
    expect(isDayKey('26-11-2026')).toBe(false)
    expect(isDayKey('')).toBe(false)
  })

  it('steps across months, years and leap days', () => {
    expect(shiftDay('2026-11-30', 1)).toBe('2026-12-01')
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31')
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29')
    expect(shiftDay('2026-03-08', 1)).toBe('2026-03-09')
    expect(shiftDay('2026-11-01', -1)).toBe('2026-10-31')
  })

  it('returns an unreadable key unchanged', () => {
    expect(shiftDay('nope', 1)).toBe('nope')
  })
})
