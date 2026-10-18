import { describe, expect, it } from 'vitest'
import { rowNote } from './rowNotes'

describe('the note under an assessment row', () => {
  it('says what a saved Missing or Excused status means for the grade', () => {
    expect(rowNote('missing', false)).toEqual({ text: 'Missing — counts as 0 until a score is entered', tone: 'rose' })
    expect(rowNote('excused', false)).toEqual({ text: 'Excused — this assessment never counts toward the grade', tone: 'gray' })
  })

  it('has no note for a graded row that is not a draft', () => {
    expect(rowNote('graded', false)).toBeNull()
  })

  it('says a graded draft only counts once published', () => {
    expect(rowNote('graded', true)).toEqual({ text: 'Draft — only you see it, and it counts once it is published', tone: 'slate' })
  })

  it('never says a draft Missing already counts as 0, or a draft Excused never counts, beside the draft line', () => {
    for (const status of ['missing', 'excused'] as const) {
      const note = rowNote(status, true)
      expect(note).not.toBeNull()
      // One note, in the future tense, naming the draft: no "counts as 0 until", no "never counts".
      expect(note?.text).toContain('(draft)')
      expect(note?.text).toContain('once it is published')
      expect(note?.text).not.toMatch(/until a score is entered|never counts/)
    }
    expect(rowNote('missing', true)?.text).toBe('Missing (draft) — only you see it. It counts as 0 once it is published')
    expect(rowNote('excused', true)?.text).toBe('Excused (draft) — only you see it. It will not count toward the grade once it is published')
  })
})
