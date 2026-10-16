import { describe, it, expect } from 'vitest'
import { commentChange, feedbackEntry, REPORT_CARD_FIELDS, PROGRESS_FIELDS, sameFeedback, withFeedbackField } from './commentAutosave'

const ids = { studentId: 's1', classId: 'c1', term: 'Term 1' }

describe('feedbackEntry', () => {
  it('is the entry Save All sent: saved fields, omitted when nothing is saved', () => {
    expect(feedbackEntry(ids, REPORT_CARD_FIELDS, { workHabits: 'G', behavior: null, comment: 'Kind to others.' })).toEqual({
      ...ids,
      workHabits: 'G',
      behavior: undefined,
      comment: 'Kind to others.',
    })
    expect(JSON.stringify(feedbackEntry(ids, REPORT_CARD_FIELDS, undefined))).toBe(
      JSON.stringify({ studentId: 's1', classId: 'c1', term: 'Term 1' }),
    )
  })

  it('covers the four progress report fields', () => {
    expect(
      feedbackEntry(ids, PROGRESS_FIELDS, { coreStandards: 'Meeting Common Core Standards', workHabit: null, behavior: 'E', comment: null }),
    ).toEqual({ ...ids, coreStandards: 'Meeting Common Core Standards', workHabit: undefined, behavior: 'E', comment: undefined })
  })
})

describe('withFeedbackField', () => {
  it('sets one field and keeps the rest (an emptied field is sent as "")', () => {
    const saved = feedbackEntry(ids, REPORT_CARD_FIELDS, { workHabits: 'G', behavior: 'S', comment: 'Old.' })
    const edited = withFeedbackField(withFeedbackField(saved, 'comment', 'New.'), 'behavior', '')
    expect(edited).toEqual({ ...ids, workHabits: 'G', behavior: '', comment: 'New.' })
    expect(saved.comment).toBe('Old.')
  })
})

describe('sameFeedback', () => {
  const same = sameFeedback(REPORT_CARD_FIELDS)
  const saved = feedbackEntry(ids, REPORT_CARD_FIELDS, { workHabits: 'G', behavior: null, comment: 'Hi.' })

  it('a student typed back to the saved text is unchanged', () => {
    expect(same(withFeedbackField(withFeedbackField(saved, 'comment', 'Hi!'), 'comment', 'Hi.'), saved)).toBe(true)
    expect(same(withFeedbackField(saved, 'behavior', ''), saved)).toBe(true) // '' and nothing are both empty
  })

  it('any field that differs is a change', () => {
    expect(same(withFeedbackField(saved, 'comment', 'Hi. '), saved)).toBe(false)
    expect(same(withFeedbackField(saved, 'workHabits', 'E'), saved)).toBe(false)
  })
})

describe('commentChange: comments queue only once the saved ones have loaded', () => {
  const saved = feedbackEntry(ids, REPORT_CARD_FIELDS, { workHabits: 'G', behavior: 'S', comment: 'Kind.' })

  it('builds the student entry from the saved one when the saved comments loaded', () => {
    expect(commentChange({ term: 'Term 1', savedLoaded: true, saved, local: null }, 'comment', 'Kind and patient.')).toEqual({
      entry: { ...ids, workHabits: 'G', behavior: 'S', comment: 'Kind and patient.' },
      saved,
    })
  })

  it('keeps building on what was typed and not yet saved', () => {
    const local = withFeedbackField(saved, 'behavior', 'E')
    expect(commentChange({ term: 'Term 1', savedLoaded: true, saved, local }, 'comment', 'Great.')?.entry).toEqual({
      ...ids, workHabits: 'G', behavior: 'E', comment: 'Great.',
    })
  })

  it('refuses while the saved comments failed to load (the upsert would null the fields it was never sent)', () => {
    const empty = feedbackEntry(ids, REPORT_CARD_FIELDS, undefined)
    expect(commentChange({ term: 'Term 1', savedLoaded: false, saved: empty, local: null }, 'comment', 'New.')).toBeNull()
  })

  it('refuses for a class without a term', () => {
    expect(commentChange({ term: '', savedLoaded: true, saved, local: null }, 'comment', 'New.')).toBeNull()
  })
})
