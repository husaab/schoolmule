import { describe, expect, it } from 'vitest'
import type { AssessmentScoreCell, StudentData } from '@/services/types/analytics'
import type { ProfileTerm } from '@/services/types/studentProfile'
import {
  attendanceExceptions,
  attendanceMonths,
  cellPct,
  formatDay,
  formatStamp,
  groupByTerm,
  orderAssessments,
  ordinal,
  parseTab,
  profileTabsFor,
  recentMarks,
  relationLabel,
  subjectTermGrid,
  termDelta,
} from './studentProfile'

const cell = (over: Partial<AssessmentScoreCell>): AssessmentScoreCell => ({
  assessmentId: Math.random().toString(36),
  name: 'Quiz',
  date: null,
  score: null,
  maxScore: 10,
  isExcluded: false,
  status: 'blank',
  isParent: false,
  parentAssessmentId: null,
  ...over,
})

const term = (over: Partial<ProfileTerm>): ProfileTerm => ({
  termId: 't1',
  name: 'Term 1',
  startDate: '2025-09-01',
  endDate: '2025-12-31',
  isActive: false,
  avg: null,
  subjects: [],
  attendance: { presentDays: 0, lateDays: 0, absentDays: 0, totalDays: 0, pct: null },
  ...over,
})

describe('parseTab', () => {
  it('falls back to overview for unknown tabs', () => {
    expect(parseTab('grades')).toBe('grades')
    expect(parseTab('nope')).toBe('overview')
    expect(parseTab('')).toBe('overview')
  })

  it('sends ?profileTab=grades to Overview for a viewer without analytics', () => {
    const tabs = profileTabsFor({ grades: false })
    expect(tabs.map((t) => t.key)).toEqual(['overview', 'attendance', 'reports', 'messages'])
    expect(parseTab('grades', tabs)).toBe('overview')
    expect(parseTab('attendance', tabs)).toBe('attendance')
    expect(profileTabsFor({ grades: true }).map((t) => t.key)).toContain('grades')
  })
})

describe('cellPct', () => {
  it('scores graded cells, zeroes missing ones and leaves the rest blank', () => {
    expect(cellPct(cell({ status: 'graded', score: 7, maxScore: 8 }))).toBe(87.5)
    expect(cellPct(cell({ status: 'missing' }))).toBe(0)
    expect(cellPct(cell({ status: 'blank' }))).toBeNull()
    expect(cellPct(cell({ status: 'excused', score: 5 }))).toBeNull()
    expect(cellPct(cell({ status: 'graded', score: 5, maxScore: 0 }))).toBeNull()
  })
})

describe('orderAssessments', () => {
  it('puts each category directly above its children', () => {
    const quiz = cell({ assessmentId: 'q', name: 'Quiz' })
    const childA = cell({ assessmentId: 'a', parentAssessmentId: 'cat' })
    const cat = cell({ assessmentId: 'cat', isParent: true })
    const childB = cell({ assessmentId: 'b', parentAssessmentId: 'cat' })
    const orphan = cell({ assessmentId: 'o', parentAssessmentId: 'gone' })
    const ordered = orderAssessments([childA, quiz, cat, childB, orphan])
    expect(ordered.map((r) => [r.cell.assessmentId, r.depth])).toEqual([
      ['q', 0],
      ['cat', 0],
      ['a', 1],
      ['b', 1],
      ['o', 0],
    ])
  })
})

describe('recentMarks', () => {
  const detail = {
    classes: [
      {
        classId: 'c1',
        subject: 'Math',
        assessmentScores: [
          cell({ name: 'Old', date: '2025-10-01', status: 'graded', score: 5 }),
          cell({ name: 'Blank', date: '2025-12-01', status: 'blank' }),
          cell({ name: 'Category', date: '2025-12-02', status: 'graded', isParent: true }),
        ],
      },
      {
        classId: 'c2',
        subject: 'Science',
        assessmentScores: [
          cell({ name: 'Missing', date: '2025-11-15T00:00:00.000Z', status: 'missing' }),
          cell({ name: 'Undated', status: 'graded', score: 9 }),
        ],
      },
    ],
  } as unknown as StudentData

  it('lists leaf marks with evidence, newest first, undated last', () => {
    const marks = recentMarks(detail)
    expect(marks.map((m) => [m.name, m.date, m.pct])).toEqual([
      ['Missing', '2025-11-15', 0],
      ['Old', '2025-10-01', 50],
      ['Undated', null, 90],
    ])
  })

  it('honours the limit and a missing detail', () => {
    expect(recentMarks(detail, 1)).toHaveLength(1)
    expect(recentMarks(null)).toEqual([])
  })
})

describe('termDelta', () => {
  const terms = [term({ termId: 't1', avg: 80 }), term({ termId: 't2', avg: 84.5 }), term({ termId: 't3', avg: null })]
  it('compares against the previous term', () => {
    expect(termDelta(terms, 't2')).toBe(4.5)
  })
  it('is null for the first term or without both averages', () => {
    expect(termDelta(terms, 't1')).toBeNull()
    expect(termDelta(terms, 't3')).toBeNull()
    expect(termDelta(terms, 'missing')).toBeNull()
  })
})

describe('subjectTermGrid', () => {
  it('matches subjects across terms and averages duplicates', () => {
    const grid = subjectTermGrid([
      term({ termId: 't1', subjects: [{ subject: 'Math', pct: 80 }, { subject: 'Science', pct: null }] }),
      term({ termId: 't2', subjects: [{ subject: 'Math ', pct: 90 }, { subject: 'Math', pct: 70 }] }),
    ])
    expect(grid).toEqual([
      { subject: 'Math', byTerm: { t1: 80, t2: 80 } },
      { subject: 'Science', byTerm: { t1: null, t2: null } },
    ])
  })
})

describe('attendanceMonths', () => {
  it('builds Mon–Fri weeks for every month of the school year', () => {
    const months = attendanceMonths(
      [{ date: '2025-09-02', status: 'ABSENT' }],
      [{ startDate: '2025-09-02', endDate: '2025-10-31' }]
    )
    expect(months.map((m) => m.label)).toEqual(['September 2025', 'October 2025'])
    const sept = months[0]
    // Sep 1 2025 is a Monday: the first week starts on day 1, no padding.
    expect(sept.weeks[0].map((c) => c?.day)).toEqual([1, 2, 3, 4, 5])
    expect(sept.weeks[0][0]).toMatchObject({ date: '2025-09-01', outside: true, status: null })
    expect(sept.weeks[0][1]).toMatchObject({ date: '2025-09-02', outside: false, status: 'ABSENT' })
    // Oct 1 2025 is a Wednesday: two pads before it.
    expect(months[1].weeks[0].slice(0, 3).map((c) => c?.day ?? null)).toEqual([null, null, 1])
    expect(months.every((m) => m.weeks.every((w) => w.length === 5))).toBe(true)
  })

  it('widens the range to recorded days outside the terms', () => {
    const months = attendanceMonths([{ date: '2025-08-29', status: 'PRESENT' }], [{ startDate: '2025-09-02', endDate: '2025-09-30' }])
    expect(months.map((m) => m.key)).toEqual(['2025-08', '2025-09'])
  })

  it('crosses the year boundary and handles no data', () => {
    const months = attendanceMonths([], [{ startDate: '2025-12-01', endDate: '2026-01-15' }])
    expect(months.map((m) => m.key)).toEqual(['2025-12', '2026-01'])
    expect(attendanceMonths([], [])).toEqual([])
  })
})

describe('small formatters', () => {
  it('lists absences and lates newest first', () => {
    expect(
      attendanceExceptions([
        { date: '2025-09-01', status: 'ABSENT' },
        { date: '2025-09-02', status: 'PRESENT' },
        { date: '2025-09-03', status: 'LATE' },
      ]).map((d) => d.date)
    ).toEqual(['2025-09-03', '2025-09-01'])
  })

  it('groups by term in first-seen order', () => {
    expect(groupByTerm([{ term: 'T2' }, { term: 'T1' }, { term: 'T2' }]).map((g) => [g.term, g.items.length])).toEqual([
      ['T2', 2],
      ['T1', 1],
    ])
  })

  it('labels relations', () => {
    expect(relationLabel('MOTHER')).toBe('Mother')
    expect(relationLabel(null)).toBe('Guardian')
  })
})

describe('dates', () => {
  it('keeps calendar dates on their day whatever the timezone', () => {
    const opts = { month: 'numeric', day: 'numeric', year: 'numeric' } as const
    const local = new Date(2025, 9, 1).toLocaleDateString(undefined, opts)
    expect(formatDay('2025-10-01', opts)).toBe(local)
    expect(formatDay('2025-10-01T00:00:00.000Z', opts)).toBe(local)
    expect(formatDay(null)).toBe('—')
    expect(formatDay('soon')).toBe('—')
  })

  it('formats timestamps and rejects junk', () => {
    expect(formatStamp('nope')).toBe('—')
    expect(formatStamp(null)).toBe('—')
    expect(formatStamp('2026-01-02T12:00:00Z')).not.toBe('—')
  })
})

describe('ordinal', () => {
  it('suffixes like English', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 100, 101, 111].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '100th', '101st', '111th',
    ])
  })
})
