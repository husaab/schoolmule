import { describe, expect, it } from 'vitest'
import {
  OPEN_RULE,
  aiLimitsPayload,
  commentFinished,
  countWords,
  exceedsMax,
  hasLimits,
  heldForLength,
  isReadOnly,
  limitConsequences,
  limitRange,
  limitsDraft,
  lockNotice,
  readLimits,
  sameLimits,
  standingDone,
  standingLine,
  wordCountLine,
  wordState,
  type ClassCommentStanding,
  type CommentLimits,
} from './commentRules'

const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ')
const limits = (minWords: number | null, maxWords: number | null): CommentLimits => ({ minWords, maxWords })

describe('countWords', () => {
  it('counts runs of anything that is not whitespace', () => {
    expect(countWords('Amal works hard.')).toBe(3)
    expect(countWords("well-behaved, isn't she?")).toBe(3)
    expect(countWords('reading - and writing')).toBe(4)
  })

  it('is zero for blank or missing text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('  \n\t ')).toBe(0)
    expect(countWords(null)).toBe(0)
    expect(countWords(undefined)).toBe(0)
  })

  it('treats spaces, tabs, line breaks and no-break spaces as gaps', () => {
    expect(countWords('  one two\tthree\nfour\r\nfive six  ')).toBe(6)
  })
})

describe('wordState', () => {
  it('is empty for no words, whatever the limits', () => {
    expect(wordState('', limits(50, 120))).toBe('empty')
    expect(wordState('   ', limits(null, null))).toBe('empty')
  })

  it('is short under the minimum, ok inside the range and over above the maximum', () => {
    const l = limits(5, 10)
    expect(wordState(words(4), l)).toBe('short')
    expect(wordState(words(5), l)).toBe('ok')
    expect(wordState(words(10), l)).toBe('ok')
    expect(wordState(words(11), l)).toBe('over')
  })

  it('has no short without a minimum and no over without a maximum', () => {
    expect(wordState('one', limits(null, 10))).toBe('ok')
    expect(wordState(words(500), limits(5, null))).toBe('ok')
    expect(wordState(words(500), limits(null, null))).toBe('ok')
  })
})

describe('exceedsMax and commentFinished', () => {
  it('holds a comment only when it is over the maximum', () => {
    expect(exceedsMax(words(11), limits(5, 10))).toBe(true)
    expect(exceedsMax(words(10), limits(5, 10))).toBe(false)
    expect(exceedsMax(words(500), limits(5, null))).toBe(false)
    expect(exceedsMax(undefined, limits(null, 10))).toBe(false)
  })

  it('counts a comment as finished when it is written and within the limits', () => {
    expect(commentFinished(words(6), limits(5, 10))).toBe(true)
    expect(commentFinished(words(4), limits(5, 10))).toBe(false)
    expect(commentFinished(words(11), limits(5, 10))).toBe(false)
    expect(commentFinished('', limits(null, null))).toBe(false)
    expect(commentFinished('Done.', limits(null, null))).toBe(true)
  })
})

describe('heldForLength', () => {
  it('holds a changed comment that is over the maximum', () => {
    expect(heldForLength(words(11), words(4), limits(5, 10))).toBe(true)
    expect(heldForLength(words(11), null, limits(5, 10))).toBe(true)
    expect(heldForLength(words(11), words(12), limits(5, 10))).toBe(true)
  })

  it('lets through the saved comment itself, however long, and anything within the maximum', () => {
    expect(heldForLength(words(30), words(30), limits(5, 10))).toBe(false)
    expect(heldForLength(words(10), words(30), limits(5, 10))).toBe(false)
    expect(heldForLength(words(500), null, limits(5, null))).toBe(false)
    expect(heldForLength(null, undefined, limits(null, 10))).toBe(false)
  })
})

describe('saying the limits', () => {
  it('names the range', () => {
    expect(limitRange(limits(50, 120))).toBe('50 to 120 words')
    expect(limitRange(limits(50, null))).toBe('at least 50 words')
    expect(limitRange(limits(null, 120))).toBe('at most 120 words')
    expect(limitRange(limits(1, null))).toBe('at least 1 word')
    expect(limitRange(limits(60, 60))).toBe('exactly 60 words')
    expect(limitRange(limits(null, null))).toBeNull()
    expect(hasLimits(limits(null, null))).toBe(false)
    expect(hasLimits(limits(null, 3))).toBe(true)
  })

  it('sends the AI the limits only when there are some', () => {
    expect(aiLimitsPayload(limits(null, null))).toEqual({})
    expect(aiLimitsPayload(limits(50, null))).toEqual({ minWords: 50, maxWords: null })
    expect(aiLimitsPayload(limits(50, 120))).toEqual({ minWords: 50, maxWords: 120 })
  })

  it('says what happens outside it', () => {
    expect(limitConsequences(limits(50, 120))).toEqual([
      "A comment over 120 words isn't saved until it is shortened.",
      'A comment under 50 words is saved, and counts as not finished.',
    ])
    expect(limitConsequences(limits(null, null))).toEqual([])
  })
})

describe('wordCountLine', () => {
  const l = limits(5, 10)

  it('says how far over and that it is not saved', () => {
    expect(wordCountLine(words(12), l)).toEqual({
      state: 'over',
      text: '12 words: 2 words over the limit of 10. Not saved until it is shortened.',
    })
    expect(wordCountLine(words(11), l).text).toBe('11 words: 1 word over the limit of 10. Not saved until it is shortened.')
  })

  it('asks for a comment saved before the limit to be shortened, without saying it is unsaved', () => {
    expect(wordCountLine(words(12), l, words(12))).toEqual({
      state: 'over',
      text: '12 words: 2 words over the limit of 10. It was saved before the limit: please shorten it.',
    })
    // Changed since: now it has to fit.
    expect(wordCountLine(words(11), l, words(12)).text).toMatch(/Not saved until it is shortened\.$/)
  })

  it('says how many more are needed', () => {
    expect(wordCountLine(words(2), l)).toEqual({ state: 'short', text: '2 words: 3 more words to reach the minimum of 5.' })
    expect(wordCountLine(words(4), l).text).toBe('4 words: 1 more word to reach the minimum of 5.')
    expect(wordCountLine('One', l).text).toBe('1 word: 4 more words to reach the minimum of 5.')
  })

  it('shows the count with the limit when it is fine, and the limit when nothing is written', () => {
    expect(wordCountLine(words(7), l)).toEqual({ state: 'ok', text: '7 words. Limit: 5 to 10 words.' })
    expect(wordCountLine('', l)).toEqual({ state: 'empty', text: 'No comment yet. Limit: 5 to 10 words.' })
  })

  it('is just the count without limits, and nothing for an empty box', () => {
    expect(wordCountLine(words(7), limits(null, null))).toEqual({ state: 'ok', text: '7 words' })
    expect(wordCountLine('', limits(null, null))).toEqual({ state: 'empty', text: '' })
  })
})

describe('the lock', () => {
  const termLock = { ...OPEN_RULE, locked: true, lockScope: 'term' as const }
  const classLock = { ...OPEN_RULE, locked: true, lockScope: 'class' as const }

  it('is read-only for a teacher and not for a reviewer', () => {
    expect(isReadOnly(termLock, false)).toBe(true)
    expect(isReadOnly(termLock, true)).toBe(false)
    expect(isReadOnly(OPEN_RULE, false)).toBe(false)
  })

  it('has no notice while open', () => {
    expect(lockNotice('report_card', OPEN_RULE, false)).toBeNull()
  })

  it('tells a teacher why, and whom to ask', () => {
    const n = lockNotice('report_card', termLock, false)
    expect(n?.title).toBe('Report card comments are locked for this term')
    expect(n?.body).toMatch(/reviewing them/)
    expect(n?.body).toMatch(/ask the office/)
    expect(lockNotice('progress_report', classLock, false)?.title).toBe('Progress report comments are locked for this class')
  })

  it('tells a reviewer they can still edit, and where to reopen', () => {
    const n = lockNotice('progress_report', termLock, true)
    expect(n?.body).toMatch(/You can still edit/)
    expect(n?.body).toMatch(/Report templates → Comments/)
  })
})

describe('the limits form', () => {
  it('reads blanks as no limit and numbers as limits', () => {
    expect(readLimits({ minWords: '', maxWords: '' })).toEqual({ value: limits(null, null) })
    expect(readLimits({ minWords: ' 50 ', maxWords: '120' })).toEqual({ value: limits(50, 120) })
    expect(readLimits({ minWords: '60', maxWords: '60' })).toEqual({ value: limits(60, 60) })
  })

  it('refuses anything but whole numbers from 1 to 2000', () => {
    for (const bad of ['0', '-5', '1.5', 'ten', '2001', '5 0']) {
      expect(readLimits({ minWords: bad, maxWords: '' })).toHaveProperty('error')
      expect(readLimits({ minWords: '', maxWords: bad })).toHaveProperty('error')
    }
  })

  it('refuses a minimum above the maximum', () => {
    expect(readLimits({ minWords: '121', maxWords: '120' })).toEqual({ error: "The minimum can't be more than the maximum." })
  })

  it('round-trips saved limits through the form', () => {
    expect(limitsDraft(limits(50, null))).toEqual({ minWords: '50', maxWords: '' })
    const read = readLimits(limitsDraft(limits(50, 120)))
    expect('value' in read && sameLimits(read.value, limits(50, 120))).toBe(true)
    expect(sameLimits(limits(50, 120), limits(50, null))).toBe(false)
  })
})

describe('a class in the review list', () => {
  const standing = (over: Partial<ClassCommentStanding>): ClassCommentStanding => ({
    locked: false, exception: null, students: 24, written: 24, tooShort: 0, tooLong: 0, ...over,
  })

  it('says how many are written and how many are outside the limits', () => {
    expect(standingLine(standing({}))).toBe('24 of 24 written')
    expect(standingLine(standing({ written: 22, tooShort: 2, tooLong: 1 }))).toBe('22 of 24 written · 2 under the minimum · 1 over the maximum')
    expect(standingLine(standing({ students: 0, written: 0 }))).toBe('No students')
    expect(standingLine(standing({ written: null, tooShort: null, tooLong: null }))).toBeNull()
  })

  it('is done only when every comment is written and within the limits', () => {
    expect(standingDone(standing({}))).toBe(true)
    expect(standingDone(standing({ written: 23 }))).toBe(false)
    expect(standingDone(standing({ tooShort: 1 }))).toBe(false)
    expect(standingDone(standing({ tooLong: 1 }))).toBe(false)
    expect(standingDone(standing({ students: 0, written: 0 }))).toBe(false)
    expect(standingDone(standing({ written: null }))).toBe(false)
  })
})
