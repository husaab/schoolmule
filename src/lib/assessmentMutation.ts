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
