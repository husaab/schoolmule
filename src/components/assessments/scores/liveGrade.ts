// Adapters between the gradebook's data shapes and src/lib/gradeEngine.ts.
//
// The engine is the only place grade maths lives. These helpers turn the
// camelCase assessment payloads and the score matrix (plus the teacher's
// unsaved edits) into the rows the engine expects, so every total on screen
// previews exactly what the server will store.

import type { AssessmentPayload } from '@/services/types/assessment'
import type { EngineAssessment, EngineScoreRow } from '@/lib/gradeEngine'
import type { ScoreRow } from './types'

/** Unsaved cell edits keyed "studentId|assessmentId"; '' means cleared. */
export type EditedScores = Record<string, number | ''>

export function toEngineAssessment(a: AssessmentPayload): EngineAssessment {
  return {
    assessment_id: a.assessmentId,
    name: a.name,
    weight_points: a.weightPoints || a.weightPercent || 0,
    max_score: a.maxScore,
    is_parent: a.isParent,
    parent_assessment_id: a.parentAssessmentId ?? null,
  }
}

export function toEngineAssessments(assessments: AssessmentPayload[]): EngineAssessment[] {
  return assessments.map(toEngineAssessment)
}

/** Group the matrix once per render so per-student work stays cheap. */
export function groupRowsByStudent(rows: ScoreRow[]): Record<string, ScoreRow[]> {
  const grouped: Record<string, ScoreRow[]> = {}
  for (const row of rows) {
    ;(grouped[row.student_id] ||= []).push(row)
  }
  return grouped
}

/**
 * One student's saved rows with the teacher's unsaved edits merged over them.
 * A cell edited to '' becomes score null (blank); a typed number is graded.
 * Status changes are saved immediately, so the saved status always wins:
 * an unsaved edit on a cell that is now missing/excused is ignored.
 */
export function liveRowsForStudent(
  studentId: string,
  savedRows: ScoreRow[] | undefined,
  editedScores: EditedScores,
): EngineScoreRow[] {
  const byAssessment = new Map<string, EngineScoreRow>()
  for (const row of savedRows || []) {
    byAssessment.set(row.assessment_id, {
      assessment_id: row.assessment_id,
      score: row.score,
      status: row.status || (row.is_excluded ? 'excused' : 'graded'),
    })
  }
  const prefix = `${studentId}|`
  for (const [key, value] of Object.entries(editedScores)) {
    if (!key.startsWith(prefix)) continue
    const assessmentId = key.slice(prefix.length)
    const current = byAssessment.get(assessmentId)
    const score = value === '' ? null : value
    // A missing/excused flag saved after the edit wins over the stale edit.
    if (current && current.status !== 'graded') continue
    if (current) {
      // Typing a number into a cell makes it graded; the server does the same.
      byAssessment.set(assessmentId, {
        ...current,
        score,
        status: score == null ? current.status : 'graded',
      })
    } else {
      byAssessment.set(assessmentId, { assessment_id: assessmentId, score, status: 'graded' })
    }
  }
  return [...byAssessment.values()]
}
