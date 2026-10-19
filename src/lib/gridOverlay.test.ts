import { describe, expect, it } from 'vitest'
import type { GridOverlay } from '@/services/types/grading'
import {
  applySavedScores,
  categoryDot,
  draftCount,
  draftCounts,
  EMPTY_OVERLAY,
  indexOverlay,
  isTurnInColumn,
  notPostedLabel,
  overlayCell,
  withoutDraftColumns,
} from './gridOverlay'

const data: GridOverlay = {
  items: [
    { assessmentId: 'hw1', itemId: 'i1', kind: 'assignment', submissionMode: 'file' },
    { assessmentId: 'q1', itemId: 'i2', kind: 'quiz', submissionMode: 'none' },
  ],
  cells: [
    { studentId: 's1', assessmentId: 'hw1', state: 'draft', draftScore: 8, draftStatus: 'graded', isLate: false },
    { studentId: 's2', assessmentId: 'hw1', state: 'turned_in', draftScore: null, draftStatus: null, isLate: true },
    { studentId: 's3', assessmentId: 'hw1', state: 'missing_derived', draftScore: null, draftStatus: null, isLate: false },
    { studentId: 's4', assessmentId: 'hw1', state: 'draft', draftScore: null, draftStatus: 'missing', isLate: false },
    { studentId: 's1', assessmentId: 'q1', state: 'draft', draftScore: 4, draftStatus: 'excused', isLate: false },
  ],
}
const index = indexOverlay(data)
const blank = { saved: null, status: 'graded' as const }

describe('indexOverlay', () => {
  it('knows the turn-in columns and each cell by student and column', () => {
    expect(isTurnInColumn(index, 'hw1')).toBe(true)
    expect(isTurnInColumn(index, 'plain')).toBe(false)
    expect(index.cells['s2|hw1'].state).toBe('turned_in')
    expect(indexOverlay(null)).toEqual(EMPTY_OVERLAY)
  })

  it('counts each column’s drafts (what "Publish N" publishes)', () => {
    expect(draftCount(index, 'hw1')).toBe(2)
    expect(draftCount(index, 'q1')).toBe(1)
    expect(draftCount(index, 'plain')).toBe(0)
    expect(draftCounts(index)).toEqual({ hw1: 2, q1: 1 })
  })

  it("counts only drafts the server says Publish would publish (an unchanged draft isn't counted)", () => {
    const flagged = indexOverlay({
      items: data.items,
      cells: [
        { studentId: 's1', assessmentId: 'hw1', state: 'draft', draftScore: 8, draftStatus: 'graded', isLate: false, needsPublish: true },
        // The same 9 the student already sees: Publish skips it.
        { studentId: 's2', assessmentId: 'hw1', state: 'draft', draftScore: 9, draftStatus: 'graded', isLate: false, needsPublish: false },
        // No flag (an older server, or a draft just typed): counted.
        { studentId: 's3', assessmentId: 'hw1', state: 'draft', draftScore: 7, draftStatus: 'graded', isLate: false },
        { studentId: 's4', assessmentId: 'hw1', state: 'turned_in', draftScore: null, draftStatus: null, isLate: false, needsPublish: true },
      ],
    })
    expect(draftCount(flagged, 'hw1')).toBe(2)
    expect(draftCounts(flagged)).toEqual({ hw1: 2 })
  })
})

describe('overlayCell', () => {
  it('a draft shows its value (or flag), marked as a draft', () => {
    expect(overlayCell(index, 's1', 'hw1', blank, false)).toEqual({
      saved: 8,
      status: 'graded',
      draft: true,
      turnedIn: false,
      derivedMissing: false,
      isLate: false,
    })
    expect(overlayCell(index, 's4', 'hw1', blank, false)).toMatchObject({ saved: null, status: 'missing', draft: true })
    expect(overlayCell(index, 's1', 'q1', blank, false)).toMatchObject({ saved: 4, status: 'excused', draft: true })
  })

  it('turned in with no draft reads In; past due reads as a missing dot, not a 0', () => {
    expect(overlayCell(index, 's2', 'hw1', blank, false)).toMatchObject({ saved: null, draft: false, turnedIn: true, isLate: true })
    expect(overlayCell(index, 's3', 'hw1', blank, false)).toMatchObject({ saved: null, status: 'graded', derivedMissing: true })
  })

  it('any unpublished value on a turn-in column is a draft, whatever the audience', () => {
    expect(overlayCell(index, 's9', 'hw1', { saved: 7, status: 'graded' }, false)).toMatchObject({ saved: 7, draft: true })
    expect(overlayCell(index, 's9', 'hw1', { saved: null, status: 'missing' }, false)).toMatchObject({ draft: true })
    // Published: the gradebook's value is live.
    expect(overlayCell(index, 's9', 'hw1', { saved: 7, status: 'graded' }, true)).toMatchObject({ saved: 7, draft: false })
    // A blank cell is not a draft.
    expect(overlayCell(index, 's9', 'hw1', blank, false)).toMatchObject({ draft: false })
  })

  it('a plain column is the gradebook as it is', () => {
    expect(overlayCell(index, 's1', 'plain', { saved: 5, status: 'graded' }, false)).toEqual({
      saved: 5,
      status: 'graded',
      draft: false,
      turnedIn: false,
      derivedMissing: false,
      isLate: false,
    })
  })
})

describe('applySavedScores', () => {
  it('a saved draft lands in the overlay at once', () => {
    const next = applySavedScores(index, {
      data: [],
      drafts: [{ student_id: 's2', assessment_id: 'hw1', draft_score: '9.50', draft_status: 'graded' }],
    })
    expect(next.cells['s2|hw1']).toMatchObject({ state: 'draft', draftScore: 9.5, draftStatus: 'graded', isLate: true })
    expect(draftCount(next, 'hw1')).toBe(3)
    // The original is untouched.
    expect(index.cells['s2|hw1'].state).toBe('turned_in')
  })

  it('a cleared draft stops being one', () => {
    const next = applySavedScores(index, {
      data: [],
      drafts: [{ student_id: 's1', assessment_id: 'hw1', draft_score: null, draft_status: null }],
    })
    expect(next.cells['s1|hw1']).toBeUndefined()
    expect(draftCount(next, 'hw1')).toBe(1)
  })

  it('a live grade on a turn-in column clears its In / missing marks', () => {
    const next = applySavedScores(index, {
      data: [
        { student_id: 's2', assessment_id: 'hw1', score: 7, status: 'graded' },
        { student_id: 's3', assessment_id: 'hw1', score: null, status: 'missing' },
      ],
    })
    expect(next.cells['s2|hw1']).toBeUndefined()
    expect(next.cells['s3|hw1']).toBeUndefined()
  })

  it('nothing for a turn-in column leaves the overlay as it was', () => {
    expect(applySavedScores(index, { data: [{ student_id: 's1', assessment_id: 'plain', score: 3, status: 'graded' }] })).toBe(index)
    expect(applySavedScores(index, undefined)).toBe(index)
  })
})

describe('category dot', () => {
  it('rose when anything inside is missing, confirmed or past due', () => {
    expect(categoryDot(index, 's3', ['hw1'], false)).toBe('missing')
    expect(categoryDot(index, 's4', ['hw1'], false)).toBe('missing')
    expect(categoryDot(index, 's9', ['hw1'], true)).toBe('missing')
  })

  it('cyan when something inside is turned in or a draft', () => {
    expect(categoryDot(index, 's2', ['hw1'], false)).toBe('waiting')
    expect(categoryDot(index, 's1', ['hw1', 'q1'], false)).toBe('waiting')
  })

  it('none otherwise', () => {
    expect(categoryDot(index, 's9', ['hw1'], false)).toBeNull()
    expect(categoryDot(EMPTY_OVERLAY, 's1', ['hw1'], false)).toBeNull()
  })
})

describe('live totals', () => {
  it('leave out values typed into a column that keeps drafts', () => {
    const local = { 's1|hw1': 9, 's1|plain': 4, 's2|q1': null }
    expect(withoutDraftColumns(local, (id) => id === 'hw1' || id === 'q1')).toEqual({ 's1|plain': 4 })
  })
})

describe('columns whose classwork is not posted', () => {
  it('says so in the header', () => {
    expect(notPostedLabel('draft')).toBe('Draft · not posted')
    expect(notPostedLabel('scheduled')).toBe('Scheduled · not posted')
    expect(notPostedLabel('posted')).toBeNull()
    expect(notPostedLabel(undefined)).toBeNull()
  })
})
