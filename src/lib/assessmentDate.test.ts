import { describe, expect, it } from 'vitest'
import { formatAssessmentDate } from './assessmentDate'

describe('formatAssessmentDate', () => {
  it('formats a calendar day without shifting it', () => {
    expect(formatAssessmentDate('2026-10-01')).toBe('Oct 1, 2026')
  })

  it('reads only the day of a midnight timestamp (older payloads)', () => {
    expect(formatAssessmentDate('2026-10-01T00:00:00.000Z')).toBe('Oct 1, 2026')
    expect(formatAssessmentDate('2026-10-01T04:00:00.000Z')).toBe('Oct 1, 2026')
  })

  it('is null when there is no usable date', () => {
    expect(formatAssessmentDate(null)).toBeNull()
    expect(formatAssessmentDate(undefined)).toBeNull()
    expect(formatAssessmentDate('')).toBeNull()
    expect(formatAssessmentDate('not a date')).toBeNull()
  })
})
