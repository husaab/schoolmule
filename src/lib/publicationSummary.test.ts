import { describe, it, expect } from 'vitest'
import { publicationLabel, publicationTitle, summarizePublication, type PublicationSummary } from './publicationSummary'

const summary = (published: number, total: number, isCategory = true): PublicationSummary => ({
  published,
  total,
  isCategory,
  state: published === 0 ? 'none' : published === total ? 'all' : 'partial',
})

describe('publicationLabel', () => {
  it('says "published", never "sent", in a column header', () => {
    expect(publicationLabel(summary(0, 4), 'short')).toBe('Not published')
    expect(publicationLabel(summary(1, 4), 'short')).toBe('1 of 4 published')
    expect(publicationLabel(summary(4, 4), 'short')).toBe('Published')
    expect(publicationLabel(summary(1, 1, false), 'short')).toBe('Published')
  })

  it('reads as a sentence in a window chip', () => {
    expect(publicationLabel(summary(0, 4), 'long')).toBe('Not published yet')
    expect(publicationLabel(summary(2, 5), 'long')).toBe('2 of 5 published')
    expect(publicationLabel(summary(5, 5), 'long')).toBe('All 5 published')
    expect(publicationLabel(summary(1, 1, false), 'long')).toBe('Published')
  })
})

describe('publicationTitle', () => {
  it('names students as well as parents', () => {
    expect(publicationTitle(summary(0, 4))).toBe('Students and parents can’t see these grades yet')
    expect(publicationTitle(summary(1, 4))).toBe('1 of 4 assessments are published to students and parents. Click to manage.')
    expect(publicationTitle(summary(4, 4))).toBe('Published to students and parents. Click to manage or unpublish.')
  })
})

describe('summarizePublication', () => {
  it('judges a category by its children', () => {
    const all = [
      { assessmentId: 'cat', isParent: true, parentAssessmentId: null },
      { assessmentId: 'a', isParent: false, parentAssessmentId: 'cat' },
      { assessmentId: 'b', isParent: false, parentAssessmentId: 'cat' },
    ]
    expect(summarizePublication(all[0], all, { a: { isPublished: true } })).toEqual({
      published: 1,
      total: 2,
      state: 'partial',
      isCategory: true,
    })
  })
})
