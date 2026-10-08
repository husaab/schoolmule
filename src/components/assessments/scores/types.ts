// One row of the class score matrix (GET /studentAssessments/class/:id),
// shared by the gradebook page and the score-grid modals.
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
  is_excluded: boolean
}

/** Quick lookups keyed "studentId|assessmentId". */
export function buildScoreLookups(rows: ScoreRow[]) {
  const existing: Record<string, number | null> = {}
  const excluded: Record<string, boolean> = {}
  rows.forEach((row) => {
    const key = `${row.student_id}|${row.assessment_id}`
    existing[key] = row.score
    excluded[key] = row.is_excluded
  })
  return { existing, excluded }
}
