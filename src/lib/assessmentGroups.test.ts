import { describe, expect, it } from 'vitest'
import type { AssessmentPayload } from '@/services/types/assessment'
import { ON_ITS_OWN, canBecomeCategory, countsTowardOptions, moveSummary } from './assessmentGroups'
import { replaceAllMutation } from './assessmentMutation'

const a = (id: string, name: string, o: Partial<AssessmentPayload> = {}): AssessmentPayload => ({
  assessmentId: id,
  classId: 'c1',
  name,
  weightPercent: 0,
  createdAt: '',
  lastModifiedAt: '',
  parentAssessmentId: null,
  isParent: false,
  sortOrder: 0,
  maxScore: 10,
  weightPoints: 10,
  date: null,
  ...o,
})

// Reading 90 (two items of 45), Participating 10 on its own; Writing 0 with one item.
const reading = a('r', 'Reading', { isParent: true, weightPoints: 90, maxScore: null, sortOrder: 1 })
const r1 = a('r1', 'Reading 1', { parentAssessmentId: 'r', weightPoints: 45, sortOrder: 1 })
const r2 = a('r2', 'Reading 2', { parentAssessmentId: 'r', weightPoints: 45, sortOrder: 2 })
const participating = a('p', 'Participating', { weightPoints: 10, sortOrder: 2 })
const writing = a('w', 'Writing', { isParent: true, weightPoints: 20, maxScore: null, sortOrder: 3 })
const w1 = a('w1', 'Essay', { parentAssessmentId: 'w', weightPoints: 20, sortOrder: 1 })
const all = [reading, r1, r2, participating, writing, w1]

describe('countsTowardOptions', () => {
  it('offers "On its own" first, then every category with its points, in list order', () => {
    expect(countsTowardOptions(all)).toEqual([
      { value: ON_ITS_OWN, label: 'On its own' },
      { value: 'r', label: 'Reading (90 pts)' },
      { value: 'w', label: 'Writing (20 pts)' },
    ])
  })

  it('reads points the API sends as text', () => {
    const textPoints = { ...reading, weightPoints: '90.00' as unknown as number }
    expect(countsTowardOptions([textPoints])[1].label).toBe('Reading (90 pts)')
  })
})

describe('canBecomeCategory', () => {
  it('is only for an assessment that counts on its own', () => {
    expect(canBecomeCategory(participating)).toBe(true)
    expect(canBecomeCategory(r1)).toBe(false)
    expect(canBecomeCategory(reading)).toBe(false)
  })
})

describe('moveSummary', () => {
  it('says nothing when the assessment stays where it is', () => {
    expect(moveSummary(all, participating, ON_ITS_OWN)).toBeNull()
    expect(moveSummary(all, r1, 'r')).toBeNull()
  })

  it('moving into a category: it keeps its points and the category grows by them', () => {
    expect(moveSummary(all, participating, 'r')).toBe(
      'Participating keeps its 10 points inside Reading, which goes from 90 to 100 points.',
    )
  })

  it('taking an item out: it counts on its own and its category shrinks', () => {
    expect(moveSummary(all, r1, ON_ITS_OWN)).toBe(
      'Reading 1 counts on its own with its 45 points. Reading goes from 90 to 45 points.',
    )
  })

  it("taking out a category's last item removes the category", () => {
    expect(moveSummary(all, w1, ON_ITS_OWN)).toBe(
      'Essay counts on its own with its 20 points. Writing has nothing else in it, so it is removed.',
    )
  })

  it('moving between categories names both changes', () => {
    expect(moveSummary(all, r2, 'w')).toBe(
      'Reading 2 keeps its 45 points inside Writing, which goes from 20 to 65 points. Reading goes from 90 to 45 points.',
    )
  })
})

describe('replaceAllMutation', () => {
  it('takes the server list as the new truth: every row updated, rows it no longer has deleted', () => {
    const next = [{ ...r1, parentAssessmentId: null }, participating]
    expect(replaceAllMutation([reading, r1, participating], next)).toEqual({ updated: next, deletedIds: ['r'] })
  })
})
