// The AI comment routes' instruction for naming the student: their first name
// and the pronouns on their record, so the model never guesses he or she from
// the name.

import { firstNameOf } from '@/lib/classroomText'

export function pronounGuidance(studentName: string, gender: 'male' | 'female' | null | undefined): string {
  const first = firstNameOf(studentName)
  if (gender === 'male') return `- Refer to the student as "${first}" (first name only) and use he/him/his pronouns.`
  if (gender === 'female') return `- Refer to the student as "${first}" (first name only) and use she/her pronouns.`
  return `- Refer to the student as "${first}" (first name only). Their gender is not recorded: do not use he or she; repeat the first name or write around pronouns.`
}
