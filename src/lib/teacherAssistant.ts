// src/lib/teacherAssistant.ts
// The JK/SK gradebook's teacher-assistant picker. The assistant is a
// co-teacher of the student's Kindergarten class (Class → Settings →
// Teachers): the class's only co-teacher by default, or the one picked for
// this student and term, or nobody. Picking saves at once. Pure: copied
// verbatim into the app.

import type { TeacherAssistantInfo, TeacherAssistantPayload } from '@/services/types/kindergartenStaff'

/** Select values: the class default, nobody, or a co-teacher's user id. '' = nothing chosen yet. */
export const DEFAULT_CHOICE = 'default'
export const NO_ASSISTANT = 'none'

export interface AssistantOption {
  value: string
  label: string
}

const defaultPerson = (info: TeacherAssistantInfo) =>
  info.defaultUserId ? info.choices.find((c) => c.userId === info.defaultUserId) ?? null : null

/** The options, in order: the class default (when there is one), the other co-teachers, nobody. */
export function assistantOptions(info: TeacherAssistantInfo): AssistantOption[] {
  const fallback = defaultPerson(info)
  const options: AssistantOption[] = []
  if (fallback) options.push({ value: DEFAULT_CHOICE, label: `${fallback.name} (the class's teacher assistant)` })
  for (const c of info.choices) if (c.userId !== fallback?.userId) options.push({ value: c.userId, label: c.name })
  options.push({ value: NO_ASSISTANT, label: 'No teacher assistant' })
  return options
}

/** The select's value for the saved choice ('' when the class has several co-teachers and none was picked). */
export function assistantValue(info: TeacherAssistantInfo): string {
  const { selection } = info
  if (selection === 'none') return NO_ASSISTANT
  const fallback = defaultPerson(info) ? DEFAULT_CHOICE : ''
  if (selection === 'default') return fallback
  if (selection.userId === info.defaultUserId) return DEFAULT_CHOICE
  // A pick who has left the class (the server prints the default then).
  return info.choices.some((c) => c.userId === selection.userId) ? selection.userId : fallback
}

/** The request for a select value; null for '' (nothing to save). */
export function assistantPayload(
  value: string,
  who: { studentId: string; term: string },
): TeacherAssistantPayload | null {
  if (!value) return null
  if (value === DEFAULT_CHOICE) return { ...who, mode: 'default', assistantUserId: null }
  if (value === NO_ASSISTANT) return { ...who, mode: 'none', assistantUserId: null }
  return { ...who, mode: 'user', assistantUserId: value }
}

/** Can a teacher choose at all? Not when the class has no co-teachers (or there is no Kindergarten class). */
export const canChooseAssistant = (info: TeacherAssistantInfo) => info.choices.length > 0

/** The line under the picker. */
export function assistantNote(info: TeacherAssistantInfo): string {
  if (!info.classId) return 'No Kindergarten class was found for this student this year, so no teacher assistant prints.'
  if (!canChooseAssistant(info)) return 'This class has no other teachers, so no teacher assistant prints.'
  if (info.effective) return `${info.effective.name} prints as the teacher assistant, with their saved signature.`
  if (info.selection === 'none') return 'No teacher assistant prints for this student this term.'
  return 'The class has more than one other teacher: choose who prints as the teacher assistant.'
}
