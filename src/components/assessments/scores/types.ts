// One row of the class score matrix (GET /studentAssessments/classes/:id/scores),
// shared by the gradebook page and the score-grid modals.

import type { ScoreStatus } from '@/lib/gradeEngine'

export type { ScoreStatus }

export interface ScoreRow {
  student_id: string
  student_name: string
  assessment_id: string
  assessment_name: string
  weight_percent: number
  weight_points: number
  max_score: number
  is_parent: boolean
  parent_assessment_id: string | null
  score: number | null
  /** 'graded' with a null score is a blank cell: not yet graded, no weight. */
  status: ScoreStatus
  /** Kept for compatibility; always equal to status === 'excused'. */
  is_excluded: boolean
}

/** Quick lookups keyed "studentId|assessmentId". */
export function buildScoreLookups(rows: ScoreRow[]) {
  const existing: Record<string, number | null> = {}
  const excluded: Record<string, boolean> = {}
  const status: Record<string, ScoreStatus> = {}
  rows.forEach((row) => {
    const key = `${row.student_id}|${row.assessment_id}`
    existing[key] = row.score
    status[key] = row.status || (row.is_excluded ? 'excused' : 'graded')
    excluded[key] = status[key] === 'excused'
  })
  return { existing, excluded, status }
}
