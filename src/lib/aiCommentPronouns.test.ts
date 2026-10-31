import { describe, expect, it } from 'vitest'
import { pronounGuidance } from './aiCommentPronouns'

describe('pronounGuidance', () => {
  it('names the first name and he/him/his for a boy', () => {
    expect(pronounGuidance('Adam Rahman', 'male')).toBe(
      '- Refer to the student as "Adam" (first name only) and use he/him/his pronouns.',
    )
  })

  it('names the first name and she/her for a girl', () => {
    expect(pronounGuidance('Layla M', 'female')).toBe('- Refer to the student as "Layla" (first name only) and use she/her pronouns.')
  })

  it('avoids he and she when no gender is recorded', () => {
    const expected =
      '- Refer to the student as "Omar" (first name only). Their gender is not recorded: do not use he or she; repeat the first name or write around pronouns.'
    expect(pronounGuidance('Omar K', null)).toBe(expected)
    expect(pronounGuidance('Omar K', undefined)).toBe(expected)
  })
})
