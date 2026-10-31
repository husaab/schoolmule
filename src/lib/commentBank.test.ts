import { describe, expect, it } from 'vitest'
import {
  STARTER_COMMENT_BANK,
  buildStandardComment,
  commentBankProblem,
  fillPlaceholders,
  isStandardComment,
  suggestCoreStandards,
  withStandardComment,
  type StandardCommentContext,
} from './commentBank'

const adam = { name: 'Adam Rahman', gender: 'male' as const }
const ctx: StandardCommentContext = { bank: STARTER_COMMENT_BANK, student: adam, subject: 'Math' }
const cutoffs = STARTER_COMMENT_BANK.cutoffs

const MEETING = 'Meeting Common Core Standards'
const meetingSentence = fillPlaceholders(STARTER_COMMENT_BANK.coreStandards.meeting, adam, 'Math')
const built = (coreStandards: string, workHabit?: string) => buildStandardComment({ coreStandards, workHabit }, ctx)

describe('fillPlaceholders', () => {
  it('fills name, subject and male pronouns', () => {
    expect(fillPlaceholders('{First} {he} {He} {him} {Him} {his} {His} {subject}', adam, 'Math')).toBe(
      'Adam he He him Him his His Math',
    )
  })

  it('fills female pronouns', () => {
    expect(fillPlaceholders('{First} {he} {He} {him} {Him} {his} {His} {subject}', { name: 'Layla M', gender: 'female' }, 'Math')).toBe(
      'Layla she She her Her her Her Math',
    )
  })

  it('uses the first name and "their" when no gender is on file', () => {
    expect(fillPlaceholders('{He} needs {his} work; help {him}.', { name: 'Omar K', gender: null }, 'Math')).toBe(
      'Omar needs their work; help Omar.',
    )
    expect(fillPlaceholders('{His} work.', { name: 'Omar K' }, 'Math')).toBe('Their work.')
  })

  it('uses the first word of a compound name', () => {
    expect(fillPlaceholders('{First}', { name: 'Fatima Zahra Ahmed' }, 'Math')).toBe('Fatima')
  })

  it('leaves unknown or mis-typed placeholders as written', () => {
    expect(fillPlaceholders('{first} {Name} {First}', adam, 'Math')).toBe('{first} {Name} Adam')
  })
})

describe('suggestCoreStandards', () => {
  it.each([
    [91.6, 'Exceeding Common Core Standards'],
    [85, 'Exceeding Common Core Standards'],
    [84.9, 'Meeting Common Core Standards'],
    [70, 'Meeting Common Core Standards'],
    [64, 'Working towards Common Core Standards'],
    [59.9, 'Not Meeting Common Core Standards'],
  ])('suggests the level for %s%% from the cut-offs', (pct, level) => {
    expect(suggestCoreStandards(pct, cutoffs)).toBe(level)
  })

  it('suggests nothing without a mark', () => {
    expect(suggestCoreStandards(null, cutoffs)).toBeNull()
    expect(suggestCoreStandards(undefined, cutoffs)).toBeNull()
  })
})

describe('buildStandardComment', () => {
  it('joins the level and work habits sentences', () => {
    expect(built('Exceeding Common Core Standards', 'N')).toBe(
      "Adam is exceeding grade-level expectations in Math. He shows a thorough understanding of this term's concepts and applies his skills with confidence. He needs to complete and hand in his assignments on time so that his marks reflect what he knows.",
    )
  })

  it('is just the level sentence without work habits', () => {
    expect(built(MEETING)).toBe(meetingSentence)
  })

  it('builds nothing from work habits alone', () => {
    expect(buildStandardComment({ workHabit: 'G' }, ctx)).toBe('')
  })

  it('builds nothing from an unknown level', () => {
    expect(built('Something else')).toBe('')
  })
})

describe('withStandardComment', () => {
  it('fills an empty comment', () => {
    const after = withStandardComment({ comment: undefined }, { coreStandards: MEETING }, ctx)
    expect(after.comment).toBe(meetingSentence)
  })

  it('rebuilds its own text when a rating changes', () => {
    const before = { coreStandards: MEETING, workHabit: 'G', comment: built(MEETING, 'G') }
    const after = withStandardComment(before, { ...before, workHabit: 'S' }, ctx)
    expect(after.comment).toBe(built(MEETING, 'S'))
  })

  it("keeps a comment the teacher wrote", () => {
    const before = { coreStandards: MEETING, workHabit: 'G', comment: 'My own words.' }
    const after = withStandardComment(before, { ...before, coreStandards: 'Exceeding Common Core Standards' }, ctx)
    expect(after.comment).toBe('My own words.')
  })

  it("clears SchoolMule's own comment when the level is cleared", () => {
    const before = { coreStandards: MEETING, workHabit: 'G', comment: built(MEETING, 'G') }
    const after = withStandardComment(before, { ...before, coreStandards: '' }, ctx)
    expect(after.comment).toBe('')
  })

  it('leaves an empty comment untouched by a work habits pick alone', () => {
    const after = withStandardComment({ comment: '' }, { workHabit: 'G', comment: '' }, ctx)
    expect(after.comment).toBe('')
  })
})

describe('isStandardComment', () => {
  it('is true for the built text', () => {
    expect(isStandardComment(built(MEETING, 'G'), { coreStandards: MEETING, workHabit: 'G' }, ctx)).toBe(true)
  })

  it('is false for edited text', () => {
    expect(isStandardComment(`${built(MEETING, 'G')} More.`, { coreStandards: MEETING, workHabit: 'G' }, ctx)).toBe(false)
  })

  it('is false when nothing is built', () => {
    expect(isStandardComment('', { workHabit: 'G' }, ctx)).toBe(false)
  })
})

describe('commentBankProblem', () => {
  const withBank = (over: Partial<typeof STARTER_COMMENT_BANK>) => ({ ...STARTER_COMMENT_BANK, ...over })

  it('accepts the starter set', () => {
    expect(commentBankProblem(STARTER_COMMENT_BANK)).toBeNull()
  })

  it('refuses an empty sentence', () => {
    expect(commentBankProblem(withBank({ coreStandards: { ...STARTER_COMMENT_BANK.coreStandards, meeting: '   ' } }))).toBe(
      'Every standard comment needs text.',
    )
  })

  it('refuses a sentence over 600 characters', () => {
    expect(commentBankProblem(withBank({ workHabits: { ...STARTER_COMMENT_BANK.workHabits, E: 'a'.repeat(601) } }))).toBe(
      'Each standard comment can be up to 600 characters.',
    )
  })

  it.each([
    [{ exceeding: 70, meeting: 85, workingTowards: 60 }],
    [{ exceeding: 101, meeting: 70, workingTowards: 60 }],
    [{ exceeding: 85, meeting: 70, workingTowards: Number.NaN }],
  ])('refuses cut-offs %o', (bad) => {
    expect(commentBankProblem(withBank({ cutoffs: bad }))).toBe(
      'Cut-offs must go Exceeding, then Meeting, then Working towards, from high to low, between 0 and 100.',
    )
  })
})
