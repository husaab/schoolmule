import { describe, expect, it } from 'vitest'
import type { TeacherAssistantInfo } from '@/services/types/kindergartenStaff'
import {
  DEFAULT_CHOICE,
  NO_ASSISTANT,
  assistantNote,
  assistantOptions,
  assistantPayload,
  assistantValue,
  canChooseAssistant,
} from './teacherAssistant'

const A = { userId: 'a', name: 'Teacher A' }
const B = { userId: 'b', name: 'Teacher B' }
const info = (over: Partial<TeacherAssistantInfo> = {}): TeacherAssistantInfo => ({
  teacher: { userId: 'lead', name: 'Lead Teacher' },
  classId: 'class-k',
  choices: [A],
  defaultUserId: 'a',
  selection: 'default',
  effective: A,
  canManageClass: false,
  ...over,
})

describe('teacher assistant picker', () => {
  it('one co-teacher: the class default first, then nobody', () => {
    expect(assistantOptions(info())).toEqual([
      { value: DEFAULT_CHOICE, label: "Teacher A (the class's teacher assistant)" },
      { value: NO_ASSISTANT, label: 'No teacher assistant' },
    ])
    expect(assistantValue(info())).toBe(DEFAULT_CHOICE)
    expect(assistantNote(info())).toBe('Teacher A prints as the teacher assistant, with their saved signature.')
  })

  it('several co-teachers: no default, each teacher, then nobody; nothing chosen yet', () => {
    const several = info({ choices: [A, B], defaultUserId: null, effective: null })
    expect(assistantOptions(several).map((o) => o.value)).toEqual(['a', 'b', NO_ASSISTANT])
    expect(assistantValue(several)).toBe('')
    expect(assistantNote(several)).toMatch(/choose who prints/)
    expect(assistantValue({ ...several, selection: { userId: 'b' }, effective: B })).toBe('b')
  })

  it('a pick of the default teacher shows as the default; none as none', () => {
    expect(assistantValue(info({ selection: { userId: 'a' } }))).toBe(DEFAULT_CHOICE)
    expect(assistantValue(info({ selection: 'none', effective: null }))).toBe(NO_ASSISTANT)
    expect(assistantNote(info({ selection: 'none', effective: null }))).toBe('No teacher assistant prints for this student this term.')
  })

  it('a pick who has left the class shows the default (or nothing chosen), never a blank select', () => {
    expect(assistantValue(info({ selection: { userId: 'gone' } }))).toBe(DEFAULT_CHOICE)
    expect(assistantValue(info({ choices: [A, B], defaultUserId: null, selection: { userId: 'gone' }, effective: null }))).toBe('')
  })

  it('no co-teachers, or no Kindergarten class: nothing to choose', () => {
    const none = info({ choices: [], defaultUserId: null, effective: null })
    expect(canChooseAssistant(none)).toBe(false)
    expect(assistantNote(none)).toBe('This class has no other teachers, so no teacher assistant prints.')
    expect(assistantNote({ ...none, classId: null })).toMatch(/No Kindergarten class/)
  })

  it('turns a select value into the request', () => {
    const who = { studentId: 's1', term: 'Term 1' }
    expect(assistantPayload('', who)).toBeNull()
    expect(assistantPayload(DEFAULT_CHOICE, who)).toEqual({ ...who, mode: 'default', assistantUserId: null })
    expect(assistantPayload(NO_ASSISTANT, who)).toEqual({ ...who, mode: 'none', assistantUserId: null })
    expect(assistantPayload('b', who)).toEqual({ ...who, mode: 'user', assistantUserId: 'b' })
  })
})
