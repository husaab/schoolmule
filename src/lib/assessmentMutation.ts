// Reconcile an assessment list with the result of an add/edit/delete, the
// same way everywhere an assessment can be changed (Assessments tab, the
// standalone column modal).

import type { AssessmentPayload } from '@/services/types/assessment'

export interface AssessmentMutationResult {
  updated: AssessmentPayload[]
  deletedIds: string[]
}

export function mergeAssessmentMutation(
  prev: AssessmentPayload[],
  { updated, deletedIds }: AssessmentMutationResult
): AssessmentPayload[] {
  // Deleting a category takes its children with it.
  const next = prev.filter(
    (a) =>
      !deletedIds.includes(a.assessmentId) &&
      !(a.parentAssessmentId && deletedIds.includes(a.parentAssessmentId))
  )
  updated.forEach((u) => {
    const i = next.findIndex((a) => a.assessmentId === u.assessmentId)
    if (i >= 0) next[i] = u
    else next.push(u)
  })
  return next
}

/**
 * A move or a new category answers with the class's whole list: every row in
 * it is updated, and a row it no longer has (an emptied category) is deleted.
 */
export function replaceAllMutation(prev: AssessmentPayload[], next: AssessmentPayload[]): AssessmentMutationResult {
  const kept = new Set(next.map((a) => a.assessmentId))
  return { updated: next, deletedIds: prev.filter((a) => !kept.has(a.assessmentId)).map((a) => a.assessmentId) }
}
