import { describe, expect, it } from 'vitest'
import {
  EMPTY_DETAILS,
  REPORT_CARD_DETAILS,
  aiDetailsPayload,
  countDetails,
  detailSuggestions,
  detailsPromptSection,
  fromWireDetails,
  parseDetails,
  serializeDetails,
  shouldConfirmAiReplace,
  suggestAchievement,
  suggestCompletion,
  toWireDetails,
} from './reportCardDetails'

describe('the list', () => {
  it('has 14 items: 6 for the subject, then 8 learning skills and work habits', () => {
    expect(REPORT_CARD_DETAILS).toHaveLength(14)
    expect(REPORT_CARD_DETAILS.map((i) => i.group)).toEqual([...Array(6).fill('subject'), ...Array(8).fill('skills')])
    expect(REPORT_CARD_DETAILS.map((i) => i.key)).toEqual([
      'achievement',
      'understanding',
      'application',
      'completion',
      'participation',
      'progress',
      'responsibility',
      'organization',
      'independentWork',
      'collaboration',
      'initiative',
      'selfRegulation',
      'focus',
      'effort',
    ])
  })

  it("uses Maryam's wording and unique option keys per item", () => {
    for (const item of REPORT_CARD_DETAILS) {
      expect(new Set(item.options.map((o) => o.key)).size).toBe(item.options.length)
    }
    const achievement = REPORT_CARD_DETAILS.find((i) => i.key === 'achievement')!
    expect(achievement.options.map((o) => o.label)).toEqual(['Excellent', 'Very good', 'Good', 'Satisfactory', 'Developing', 'Needs significant support'])
    const effort = REPORT_CARD_DETAILS.find((i) => i.key === 'effort')!
    expect(effort.label).toBe('Effort')
    expect(effort.options.map((o) => o.label)).toEqual([
      'Consistently gives best effort',
      'Usually puts in good effort',
      'Effort varies',
      'Needs encouragement to complete tasks',
    ])
  })
})

describe('suggestions', () => {
  it('suggests overall achievement from the mark', () => {
    expect(suggestAchievement(90)).toBe('excellent')
    expect(suggestAchievement(89.9)).toBe('veryGood')
    expect(suggestAchievement(80)).toBe('veryGood')
    expect(suggestAchievement(70)).toBe('good')
    expect(suggestAchievement(60)).toBe('satisfactory')
    expect(suggestAchievement(50)).toBe('developing')
    expect(suggestAchievement(49.9)).toBe('needsSignificantSupport')
    expect(suggestAchievement(null)).toBeNull()
    expect(suggestAchievement(undefined)).toBeNull()
  })

  it('suggests completion of work from the share of missing assessments', () => {
    expect(suggestCompletion({ missing: 0, total: 12 })).toBe('consistent')
    expect(suggestCompletion({ missing: 1, total: 12 })).toBe('usual')
    expect(suggestCompletion({ missing: 1, total: 10 })).toBe('usual')
    expect(suggestCompletion({ missing: 2, total: 12 })).toBe('sometimesIncomplete')
    expect(suggestCompletion({ missing: 0, total: 0 })).toBeNull()
    expect(suggestCompletion(null)).toBeNull()
    expect(suggestCompletion(undefined)).toBeNull()
  })

  it('suggests only those two', () => {
    expect(detailSuggestions(78.3, { missing: 1, total: 12 })).toEqual({ achievement: 'good', completion: 'usual' })
    expect(detailSuggestions(null, null)).toEqual({})
  })
})

describe('saving and reading', () => {
  it('serializes nothing picked as empty', () => {
    expect(serializeDetails(EMPTY_DETAILS)).toBe('')
    expect(serializeDetails({ picks: {}, note: '' })).toBe('')
  })

  it('round-trips, in list order whatever order the picks were made', () => {
    const d = { picks: { effort: 'best', understanding: 'most' }, note: 'Strong at mental math.' }
    const text = serializeDetails(d)
    expect(text).toBe('{"picks":{"understanding":"most","effort":"best"},"note":"Strong at mental math."}')
    expect(parseDetails(text)).toEqual({ picks: { understanding: 'most', effort: 'best' }, note: 'Strong at mental math.' })
  })

  it('drops unknown items and options, and survives bad saved text', () => {
    expect(serializeDetails({ picks: { bogus: 'x', focus: 'nope', effort: 'best' }, note: '' })).toBe('{"picks":{"effort":"best"},"note":""}')
    expect(parseDetails('not json')).toEqual(EMPTY_DETAILS)
    expect(parseDetails(null)).toEqual(EMPTY_DETAILS)
    const read = parseDetails('{"picks":{"focus":"gone","effort":"best"},"note":"x"}')
    expect(read).toEqual({ picks: { effort: 'best' }, note: 'x' })
    expect(countDetails(read)).toBe(1)
  })

  it('converts to and from what the server stores', () => {
    expect(toWireDetails(undefined)).toBeUndefined()
    expect(toWireDetails('')).toBeNull()
    expect(toWireDetails('{"picks":{"effort":"best"},"note":""}')).toEqual({ picks: { effort: 'best' }, note: '' })
    expect(fromWireDetails(null)).toBeNull()
    expect(fromWireDetails(undefined)).toBeNull()
    expect(fromWireDetails({ picks: {}, note: '' })).toBeNull()
    expect(fromWireDetails({ picks: { effort: 'best' } })).toBe('{"picks":{"effort":"best"},"note":""}')
  })
})

describe('what the AI gets', () => {
  it('sends only what was picked, with the note trimmed', () => {
    expect(aiDetailsPayload(EMPTY_DETAILS)).toEqual({})
    expect(aiDetailsPayload({ picks: {}, note: '   ' })).toEqual({})
    expect(aiDetailsPayload({ picks: { effort: 'best' }, note: ' Kind. ' })).toEqual({ details: { effort: 'best' }, note: 'Kind.' })
  })

  it('writes the observations section, leaving out empty groups', () => {
    expect(detailsPromptSection(EMPTY_DETAILS, 'Math')).toBe('')
    expect(
      detailsPromptSection({ picks: { understanding: 'most', focus: 'occasionallyDistracted' }, note: 'Strong at mental math.' }, 'Math'),
    ).toBe(
      "What the teacher observed in Math:\n- Understanding of concepts: Understands most concepts\nLearning skills and work habits:\n- Focus: Occasionally distracted\nTeacher's note: Strong at mental math.",
    )
    expect(detailsPromptSection({ picks: { effort: 'best' }, note: '' }, 'Math')).toBe('Learning skills and work habits:\n- Effort: Consistently gives best effort')
    expect(detailsPromptSection({ picks: {}, note: 'Kind.' }, 'Math')).toBe("Teacher's note: Kind.")
  })
})

describe('replacing a comment with an AI draft', () => {
  it("asks only when the comment isn't empty and isn't the AI's own untouched draft", () => {
    expect(shouldConfirmAiReplace('', null)).toBe(false)
    expect(shouldConfirmAiReplace('   ', undefined)).toBe(false)
    expect(shouldConfirmAiReplace(null, null)).toBe(false)
    expect(shouldConfirmAiReplace('Mine.', null)).toBe(true)
    expect(shouldConfirmAiReplace('Draft.', 'Draft.')).toBe(false)
    expect(shouldConfirmAiReplace('Draft. Edited', 'Draft.')).toBe(true)
  })
})
