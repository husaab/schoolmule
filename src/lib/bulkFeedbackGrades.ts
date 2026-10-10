// The gradebook hands each student's live grade to the bulk feedback and
// progress pages through localStorage (`bulk_feedback_grades_${classId}`).
// A null pct means the student has no graded work yet — never 0.

import type { Coverage } from '@/lib/gradeEngine'

export interface StoredGrade {
  pct: number | null
  coverage: Coverage | null
}

export type StoredGrades = Record<string, StoredGrade>

export const bulkFeedbackGradesKey = (classId: string) => `bulk_feedback_grades_${classId}`

export function writeStoredGrades(classId: string, grades: StoredGrades): void {
  try {
    localStorage.setItem(bulkFeedbackGradesKey(classId), JSON.stringify(grades))
  } catch (error) {
    console.warn('Failed to store grades for feedback pages', error)
  }
}

/** Tolerates the old shape (a bare number per student) from a stale tab. */
export function readStoredGrades(classId: string): StoredGrades {
  try {
    const raw = localStorage.getItem(bulkFeedbackGradesKey(classId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: StoredGrades = {}
    for (const [studentId, value] of Object.entries(parsed)) {
      if (typeof value === 'number') {
        out[studentId] = { pct: value, coverage: null }
      } else if (value && typeof value === 'object') {
        const v = value as Partial<StoredGrade>
        out[studentId] = {
          pct: typeof v.pct === 'number' ? v.pct : null,
          coverage: v.coverage ?? null,
        }
      }
    }
    return out
  } catch {
    console.warn('Failed to parse stored grades')
    return {}
  }
}

/** Label + colour band for a percentage; null/undefined = nothing graded yet. */
export function gradeBand(pct: number | null | undefined): { label: string; color: string } {
  if (pct == null) return { label: 'No grades yet', color: 'text-slate-400' }
  if (pct >= 90) return { label: 'Excellent', color: 'text-emerald-600' }
  if (pct >= 80) return { label: 'Good', color: 'text-blue-600' }
  if (pct >= 70) return { label: 'Satisfactory', color: 'text-amber-600' }
  if (pct >= 60) return { label: 'Needs Improvement', color: 'text-orange-600' }
  return { label: 'Requires Support', color: 'text-red-600' }
}
