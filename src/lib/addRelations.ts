// Adding one parent to several students at once. Each student is its own
// POST /parent-students, so one can be refused (already linked, say) while the
// others go through; the caller keeps the refused ones on screen to fix.

import type { ParentStudentPayload, ParentStudentResponse } from '@/services/types/parentStudent'

export interface RelationFailure<S> {
  student: S
  message: string
}

export interface AddRelationsResult<S> {
  added: { student: S; relation: ParentStudentPayload }[]
  failed: RelationFailure<S>[]
}

/** Never rejects: a student whose request fails lands in `failed`. */
export async function addRelationForEach<S>(
  students: S[],
  create: (student: S) => Promise<ParentStudentResponse>
): Promise<AddRelationsResult<S>> {
  const result: AddRelationsResult<S> = { added: [], failed: [] }
  for (const student of students) {
    try {
      const res = await create(student)
      if (res.status === 'success' && res.data) result.added.push({ student, relation: res.data })
      else result.failed.push({ student, message: res.message || 'Failed to add relation' })
    } catch (err) {
      result.failed.push({ student, message: err instanceof Error ? err.message : 'Error creating relation' })
    }
  }
  return result
}

export const addRelationsSummary = (
  addedCount: number,
  failed: RelationFailure<{ name: string }>[]
): string => {
  if (failed.length === 0) return addedCount === 1 ? 'Relation added' : `${addedCount} relations added`
  // A lone student is the one on screen; the reason is all there is to say.
  if (addedCount === 0 && failed.length === 1) return failed[0].message

  const namesByReason = new Map<string, string[]>()
  for (const { student, message } of failed) {
    namesByReason.set(message, [...(namesByReason.get(message) ?? []), student.name])
  }
  const reasons = [...namesByReason].map(([message, names]) => `${names.join(', ')}: ${message}`).join('. ')
  return addedCount > 0 ? `Added ${addedCount} of ${addedCount + failed.length}. ${reasons}` : reasons
}
