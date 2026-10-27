import { describe, expect, it } from 'vitest'
import { assessmentAverage, classAverage, inPool, leftOutCount, leftOutIndex, toggledColumn } from './classStats'
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

  it('counts who is left out', () => {
    expect(leftOutCount(['s1', 's2', 's3'], index)).toBe(1)
    expect(leftOutCount(['s1', 's2', 's3'], index, 'q1')).toBe(2)
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
