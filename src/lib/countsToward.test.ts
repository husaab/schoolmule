import { describe, it, expect } from 'vitest'
import { countsSummary, scoreExample, suggestedWeight, validateCategoryForm, weightNote } from './countsToward'
import { WEIGHT_MESSAGE } from './itemForm'

const CAT = 'aaaaaaaa-0000-4000-8000-000000000001'
const midterm = (childCount: number, weightPoints = 20) => ({ assessmentId: CAT, name: 'Midterm', weightPoints, childCount })

describe('scoreExample', () => {
  it('shows a good score on the scale as a percent', () => {
    expect(scoreExample(30)).toBe('24/30 is 80%')
    expect(scoreExample(7)).toBe('6/7 is 86%')
    expect(scoreExample(7.5)).toBe('6/7.5 is 80%')
  })
  it('a tiny scale uses full marks', () => expect(scoreExample(3)).toBe('3/3 is 100%'))
  it('is nothing for what is not a scale', () => {
    expect(scoreExample(0)).toBeNull()
    expect(scoreExample(0.004)).toBeNull()
    expect(scoreExample(NaN)).toBeNull()
  })
})

describe('countsSummary', () => {
  it('keeps "out of" (the scale) apart from the share of the final grade', () => {
    expect(countsSummary({ mode: 'category', category: midterm(2), maxScore: '30', weightPoints: '' })).toEqual([
      'Scores are entered out of 30, so 24/30 is 80%.',
      'Midterm is worth 20% of the final grade. This will be its 3rd assessment, so it carries about 6.67% and the others shrink to make room. Change the split in Grades → Assessments & categories.',
    ])
  })

  it('the first assessment of a category carries all of it', () => {
    expect(countsSummary({ mode: 'category', category: midterm(0), maxScore: '', weightPoints: '' })).toEqual([
      'Midterm is worth 20% of the final grade. This will be its first assessment, so it carries all 20%.',
    ])
  })

  it('counts places properly: 2nd, 11th, 22nd', () => {
    const place = (n: number) => countsSummary({ mode: 'category', category: midterm(n - 1), maxScore: '', weightPoints: '' })[0]
    expect(place(2)).toContain('its 2nd assessment, so it carries about 10%')
    expect(place(11)).toContain('its 11th assessment')
    expect(place(22)).toContain('its 22nd assessment')
  })

  it('an assessment already in the category says its own share, not a new one', () => {
    expect(
      countsSummary({ mode: 'category', category: midterm(3), maxScore: '30', weightPoints: '', current: { categoryId: CAT, weightPoints: 5 } })[1],
    ).toBe('Midterm is worth 20% of the final grade, shared by its 3 assessments. This one carries 5%. Change the split in Grades → Assessments & categories.')
    expect(
      countsSummary({ mode: 'category', category: midterm(1), maxScore: '', weightPoints: '', current: { categoryId: CAT, weightPoints: 20 } }),
    ).toEqual(['Midterm is worth 20% of the final grade. This one carries 20%.'])
  })

  it('moving in from another category is a new place', () => {
    expect(
      countsSummary({ mode: 'category', category: midterm(1), maxScore: '', weightPoints: '', current: { categoryId: 'other', weightPoints: 5 } })[0],
    ).toContain('This will be its 2nd assessment')
  })

  it('a category with no share says nothing in it counts', () => {
    expect(countsSummary({ mode: 'category', category: midterm(0, 0), maxScore: '', weightPoints: '' })).toEqual([
      'Midterm has no share of the final grade yet, so nothing in it counts. Give it one in Grades → Assessments & categories.',
    ])
  })

  it('on its own says its worth once there is one', () => {
    expect(countsSummary({ mode: 'standalone', category: null, maxScore: '30', weightPoints: '15' })).toEqual([
      'Scores are entered out of 30, so 24/30 is 80%.',
      'It counts on its own, for 15% of the final grade.',
    ])
    expect(countsSummary({ mode: 'standalone', category: null, maxScore: '', weightPoints: '' })).toEqual([])
  })

  it('a quiz says nothing about its out of; an ungraded item says nothing at all', () => {
    expect(countsSummary({ mode: 'category', category: midterm(0), maxScore: '8', weightPoints: '', ownMax: true })).toHaveLength(1)
    expect(countsSummary({ mode: 'none', category: null, maxScore: '10', weightPoints: '' })).toEqual([])
    expect(countsSummary({ mode: 'existing', category: null, maxScore: '10', weightPoints: '' })).toEqual([])
  })
})

describe('weightNote', () => {
  it('says what is left before anything is typed', () => {
    expect(weightNote(65, '')).toEqual({ text: "35% of the final grade isn't assigned yet.", over: false })
    expect(weightNote(0, '')).toEqual({ text: 'Nothing is assigned yet. Everything in the class should add up to 100%.', over: false })
    expect(weightNote(100, '')).toEqual({ text: 'The class already adds up to 100%.', over: false })
    expect(weightNote(110, '').over).toBe(true)
  })
  it('says where the class lands with what is typed', () => {
    expect(weightNote(65, '20')).toEqual({ text: 'Leaves 15% of the final grade unassigned.', over: false })
    expect(weightNote(65, '35')).toEqual({ text: 'That brings the class to exactly 100%.', over: false })
    expect(weightNote(65, '40')).toEqual({
      text: 'With this the class adds up to 105%. It should add up to 100%: rebalance in Grades → Assessments & categories.',
      over: true,
    })
  })
  it('floating point never invents a remainder', () => {
    expect(weightNote(33.33, '66.67').text).toBe('That brings the class to exactly 100%.')
  })
})

describe('suggestedWeight', () => {
  it('offers what is left, only when part of the class is taken and part is free', () => {
    expect(suggestedWeight(65)).toBe('35')
    expect(suggestedWeight(87.5)).toBe('12.5')
    expect(suggestedWeight(0)).toBe('')
    expect(suggestedWeight(100)).toBe('')
    expect(suggestedWeight(120)).toBe('')
  })
})

describe('validateCategoryForm', () => {
  it('needs a name and a worth', () => {
    expect(validateCategoryForm({ name: ' Tests ', weightPoints: '40' })).toEqual({})
    expect(validateCategoryForm({ name: '  ', weightPoints: '' })).toEqual({ name: 'Give the category a name', weightPoints: WEIGHT_MESSAGE })
    expect(validateCategoryForm({ name: 'x'.repeat(201), weightPoints: '101' })).toEqual({
      name: 'Keep the name to 200 characters',
      weightPoints: WEIGHT_MESSAGE,
    })
  })
})
