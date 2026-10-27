// src/lib/classStats.ts
//
// Who a class's statistics pool: the browser and app side of the backend's
// services/classStats.js. A teacher can leave a student out of a class's
// pooled numbers (the class average, median, rank, the per-assessment class
// averages); the student's own grade never changes.
//
//   'counted'   the class's own figures, the ones every family sees
//   'everyone'  every enrolled student; staff see it beside a counted figure
//
// Pure: copied as-is to the mobile app.

import { computeAssessmentForStudent, type EngineAssessment, type ScoreLookup } from './gradeEngine'
import type { StatsExclusion } from '@/services/types/classStatsExclusion'

export type StatsPool = 'counted' | 'everyone'

/** What one student is left out of; a category's children are already expanded in. */
export interface LeftOut {
  wholeClass: boolean
  assessmentIds: Set<string>
}

/** studentId -> what they're left out of. A category left out covers its children. */
export function leftOutIndex(
  exclusions: StatsExclusion[],
  assessments: Pick<EngineAssessment, 'assessment_id' | 'parent_assessment_id'>[],
): Map<string, LeftOut> {
  const childrenOf = new Map<string, string[]>()
  for (const a of assessments) {
    if (!a.parent_assessment_id) continue
    const list = childrenOf.get(a.parent_assessment_id) ?? []
    list.push(a.assessment_id)
    childrenOf.set(a.parent_assessment_id, list)
  }

  const index = new Map<string, LeftOut>()
  for (const e of exclusions) {
    const ids = new Set<string>()
    if (e.scope === 'assessments') {
      for (const id of e.assessmentIds) {
        ids.add(id)
        for (const child of childrenOf.get(id) ?? []) ids.add(child)
      }
    }
    index.set(e.studentId, { wholeClass: e.scope === 'class', assessmentIds: ids })
  }
  return index
}

/** Whether a student is in the pool for the class, or for one assessment. */
export function inPool(leftOut: LeftOut | undefined, pool: StatsPool, assessmentId: string | null = null): boolean {
  if (pool === 'everyone' || !leftOut) return true
  if (leftOut.wholeClass) return false
  return assessmentId == null || !leftOut.assessmentIds.has(assessmentId)
}

/** How many students are out of the counted pool for the class, or for one assessment. */
export function leftOutCount(
  studentIds: string[],
  index: Map<string, LeftOut>,
  assessmentId: string | null = null,
): number {
  return studentIds.filter((id) => !inPool(index.get(id), 'counted', assessmentId)).length
}

const mean = (values: number[]) => (values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null)

/**
 * The class average over the pool: the mean of the term grades of students in
 * it who have one (unrounded), or null when nobody does.
 */
export function classAverage(
  grades: { studentId: string; pct: number | null }[],
  index: Map<string, LeftOut>,
  pool: StatsPool,
): { average: number | null; n: number } {
  const pcts = grades
    .filter((g) => g.pct != null && inPool(index.get(g.studentId), pool))
    .map((g) => g.pct as number)
  return { average: mean(pcts), n: pcts.length }
}

/**
 * One assessment's class average over the pool: each student's counted result
 * (score/max for a column, the graded roll-up for a category), unrounded.
 */
export function assessmentAverage(
  assessment: EngineAssessment,
  allAssessments: EngineAssessment[],
  students: { studentId: string; lookup: ScoreLookup }[],
  index: Map<string, LeftOut>,
  pool: StatsPool,
): { average: number | null; n: number } {
  const pcts: number[] = []
  for (const s of students) {
    if (!inPool(index.get(s.studentId), pool, assessment.assessment_id)) continue
    const r = computeAssessmentForStudent(assessment, allAssessments, s.lookup)
    if (r.isCounted && r.pct != null) pcts.push(r.pct)
  }
  return { average: mean(pcts), n: pcts.length }
}

/**
 * The PUT that toggles one column for a student, or null to count them
 * everywhere again. A student left out of the whole class has no column to
 * toggle (that is changed in the manager): undefined.
 */
export function toggledColumn(
  current: StatsExclusion | undefined,
  assessmentId: string,
): { scope: 'assessments'; assessmentIds: string[]; note: string | null } | null | undefined {
  if (current?.scope === 'class') return undefined
  const ids = current?.assessmentIds ?? []
  const next = ids.includes(assessmentId) ? ids.filter((id) => id !== assessmentId) : [...ids, assessmentId]
  if (next.length === 0) return null
  return { scope: 'assessments', assessmentIds: next, note: current?.note ?? null }
}
