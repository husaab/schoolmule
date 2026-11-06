import { describe, expect, it } from 'vitest'
import { addModifiedMarks, assessmentAverage, classAverage, columnAverageFacts, inPool, leftOutIndex, leftOutSummary, statusLine, toggledColumn } from './classStats'
import { buildScoreLookup, type EngineAssessment } from './gradeEngine'
import type { StatsExclusion } from '@/services/types/classStatsExclusion'

// Synthetic ids only.
const CLASS = 'c1'
const exclusion = (studentId: string, overrides: Partial<StatsExclusion> = {}): StatsExclusion => ({
  classId: CLASS,
  studentId,
  scope: 'class',
  assessmentIds: [],
  note: null,
  createdBy: null,
  createdByName: null,
  createdAt: '2026-10-27T12:00:00.000Z',
  ...overrides,
})

const quiz: EngineAssessment = { assessment_id: 'q1', weight_points: 50, max_score: 100 }
const quiz2: EngineAssessment = { assessment_id: 'q2', weight_points: 50, max_score: 100 }
const category: EngineAssessment = { assessment_id: 'cat', weight_points: 50, is_parent: true }
const child: EngineAssessment = { assessment_id: 'k1', weight_points: 10, max_score: 10, parent_assessment_id: 'cat' }

describe('leftOutIndex', () => {
  it('marks a whole-class exclusion', () => {
    const index = leftOutIndex([exclusion('s3')], [quiz])
    expect(index.get('s3')).toEqual({ wholeClass: true, assessmentIds: new Set() })
    expect(index.has('s1')).toBe(false)
  })

  it('expands a category to its children, never a child to its category', () => {
    const index = leftOutIndex(
      [exclusion('s1', { scope: 'assessments', assessmentIds: ['cat'] }), exclusion('s2', { scope: 'assessments', assessmentIds: ['k1'] })],
      [quiz, category, child],
    )
    expect([...index.get('s1')!.assessmentIds].sort()).toEqual(['cat', 'k1'])
    expect([...index.get('s2')!.assessmentIds]).toEqual(['k1'])
  })
})

describe('inPool', () => {
  const index = leftOutIndex([exclusion('s3'), exclusion('s2', { scope: 'assessments', assessmentIds: ['q1'] })], [quiz, quiz2])

  it('everyone counts in the everyone pool', () => {
    expect(inPool(index.get('s3'), 'everyone')).toBe(true)
  })

  it('a whole-class exclusion leaves the class and every column', () => {
    expect(inPool(index.get('s3'), 'counted')).toBe(false)
    expect(inPool(index.get('s3'), 'counted', 'q2')).toBe(false)
  })

  it('a column exclusion leaves only that column', () => {
    expect(inPool(index.get('s2'), 'counted')).toBe(true)
    expect(inPool(index.get('s2'), 'counted', 'q1')).toBe(false)
    expect(inPool(index.get('s2'), 'counted', 'q2')).toBe(true)
  })
})

describe('classAverage', () => {
  const grades = [
    { studentId: 's1', pct: 80 },
    { studentId: 's2', pct: 70 },
    { studentId: 's3', pct: 20 },
    { studentId: 's4', pct: null },
  ]
  const index = leftOutIndex([exclusion('s3')], [quiz])

  it('leaves out the left-out student and skips students with no grade', () => {
    expect(classAverage(grades, index, 'counted')).toEqual({ average: 75, n: 2 })
  })

  it('the everyone figure keeps them', () => {
    expect(classAverage(grades, index, 'everyone')).toEqual({ average: 170 / 3, n: 3 })
  })

  it('is null when nobody in the pool has a grade', () => {
    expect(classAverage([{ studentId: 's3', pct: 20 }], index, 'counted')).toEqual({ average: null, n: 0 })
  })
})

describe('assessmentAverage', () => {
  const students = [
    { studentId: 's1', lookup: buildScoreLookup([{ assessment_id: 'q1', score: 80 }]) },
    { studentId: 's2', lookup: buildScoreLookup([{ assessment_id: 'q1', score: 70 }]) },
    { studentId: 's3', lookup: buildScoreLookup([{ assessment_id: 'q1', score: 20 }]) },
    { studentId: 's4', lookup: buildScoreLookup([{ assessment_id: 'q1', score: null, status: 'excused' }]) },
  ]

  it('averages the counted results of the pool', () => {
    const index = leftOutIndex([exclusion('s3', { scope: 'assessments', assessmentIds: ['q1'] })], [quiz])
    expect(assessmentAverage(quiz, [quiz], students, index, 'counted')).toEqual({ average: 75, n: 2 })
    expect(assessmentAverage(quiz, [quiz], students, index, 'everyone')).toEqual({ average: 170 / 3, n: 3 })
  })
})

describe('toggledColumn', () => {
  it('adds the first column', () => {
    expect(toggledColumn(undefined, 'q1')).toEqual({ scope: 'assessments', assessmentIds: ['q1'], note: null })
  })

  it('adds and removes columns, keeping the note', () => {
    const current = exclusion('s1', { scope: 'assessments', assessmentIds: ['q1'], note: 'Scribe' })
    expect(toggledColumn(current, 'q2')).toEqual({ scope: 'assessments', assessmentIds: ['q1', 'q2'], note: 'Scribe' })
    expect(toggledColumn({ ...current, assessmentIds: ['q1', 'q2'] }, 'q1')).toEqual({ scope: 'assessments', assessmentIds: ['q2'], note: 'Scribe' })
  })

  it('removing the last column counts them again (null)', () => {
    expect(toggledColumn(exclusion('s1', { scope: 'assessments', assessmentIds: ['q1'] }), 'q1')).toBeNull()
  })

  it('has nothing to toggle for a student left out of the whole class', () => {
    expect(toggledColumn(exclusion('s1'), 'q1')).toBeUndefined()
  })
})

describe('leftOutSummary and statusLine', () => {
  const names = new Map([['q1', 'Quiz 1'], ['q2', 'Quiz 2']])

  it('counts the whole class and some assessments separately', () => {
    expect(leftOutSummary([])).toBe('Everyone counts')
    expect(leftOutSummary([exclusion('s1'), exclusion('s2', { scope: 'assessments', assessmentIds: ['q1'] })])).toBe(
      '1 left out · 1 left out of some assessments',
    )
  })

  it("says what a student is left out of, with the note", () => {
    expect(statusLine(undefined, false, names)).toBe('Counted')
    expect(statusLine(exclusion('s1', { note: 'ESL newcomer' }), false, names)).toBe('Left out of the class average · ESL newcomer')
    expect(statusLine(exclusion('s1', { scope: 'assessments', assessmentIds: ['q1'] }), false, names)).toBe('Left out of the average for Quiz 1')
    expect(statusLine(exclusion('s1', { scope: 'assessments', assessmentIds: ['q1', 'q2'] }), false, names)).toBe('Left out of 2 assessment averages')
    expect(statusLine(undefined, true, names)).toBe('Pick the assessments to leave them out of')
  })
})

describe('columnAverageFacts', () => {
  const row = (studentId: string, pct: number, modified = false) => ({ studentId, pct, modified })
  const leftOut = (...ids: string[]) => new Map(ids.map((id) => [id, { wholeClass: true, assessmentIds: new Set<string>() }]))

  it('leaves a modified mark out without calling it left out', () => {
    expect(columnAverageFacts([row('s1', 40, true), row('s2', 80), row('s3', 60)], new Map(), 'a1')).toEqual({
      average: 70,
      leftOutCount: 0,
      everyoneAverage: null,
    })
  })

  it('counts only the teacher\'s choices, and with everyone keeps the modified mark out', () => {
    expect(columnAverageFacts([row('s1', 40, true), row('s2', 80), row('s3', 60)], leftOut('s3'), 'a1')).toEqual({
      average: 80,
      leftOutCount: 1,
      everyoneAverage: 70,
    })
  })

  it('counts a student who is both left out and modified once, as nothing to bring back', () => {
    expect(columnAverageFacts([row('s1', 40, true), row('s2', 80)], leftOut('s1'), 'a1')).toEqual({
      average: 80,
      leftOutCount: 0,
      everyoneAverage: null,
    })
  })

  it('has no average when every mark is modified', () => {
    expect(columnAverageFacts([row('s1', 40, true)], new Map(), 'a1')).toEqual({ average: null, leftOutCount: 0, everyoneAverage: null })
  })

  it('reads a left-out column by its id', () => {
    const one = new Map([['s2', { wholeClass: false, assessmentIds: new Set(['a1']) }]])
    expect(columnAverageFacts([row('s1', 50), row('s2', 90)], one, 'a1')).toEqual({ average: 50, leftOutCount: 1, everyoneAverage: 70 })
    expect(columnAverageFacts([row('s1', 50), row('s2', 90)], one, 'a2')).toEqual({ average: 70, leftOutCount: 0, everyoneAverage: null })
  })
})

describe('addModifiedMarks', () => {
  const assessments = [
    { assessment_id: 'cat', parent_assessment_id: null },
    { assessment_id: 'kid', parent_assessment_id: 'cat' },
    { assessment_id: 'alone', parent_assessment_id: null },
  ]

  it('keeps the mark out of its column and its category, not the class', () => {
    const index = addModifiedMarks(new Map(), [{ studentId: 's1', assessmentId: 'kid' }], assessments)
    const entry = index.get('s1')
    expect(inPool(entry, 'counted', 'kid')).toBe(false)
    expect(inPool(entry, 'counted', 'cat')).toBe(false)
    expect(inPool(entry, 'counted', 'alone')).toBe(true)
    expect(inPool(entry, 'counted')).toBe(true)
    expect(inPool(entry, 'everyone', 'kid')).toBe(true)
  })

  it('keeps a teacher leaving the student out of the whole class', () => {
    const start = new Map([['s1', { wholeClass: true, assessmentIds: new Set<string>() }]])
    const index = addModifiedMarks(start, [{ studentId: 's1', assessmentId: 'alone' }], assessments)
    expect(index.get('s1')?.wholeClass).toBe(true)
    expect(start.get('s1')?.assessmentIds.size).toBe(0)
  })
})

