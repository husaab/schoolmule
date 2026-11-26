import { describe, expect, it } from 'vitest'
import { aiCommentLength } from './aiCommentLength'

const fallback = { sentences: '2-4', maxTokens: 200 }

describe('aiCommentLength', () => {
  it('asks for a few sentences when the school has no limits', () => {
    expect(aiCommentLength({}, fallback)).toEqual({ guideline: 'Keep the comment between 2-4 sentences', maxTokens: 200 })
    expect(aiCommentLength({ minWords: null, maxWords: null }, { sentences: '3-5', maxTokens: 300 })).toEqual({
      guideline: 'Keep the comment between 3-5 sentences',
      maxTokens: 300,
    })
  })

  it('asks for the range and aims at its middle', () => {
    const length = aiCommentLength({ minWords: 50, maxWords: 120 }, fallback)
    expect(length.guideline).toMatch(/between 50 and 120 words/)
    expect(length.guideline).toMatch(/about 85 words/)
    expect(length.maxTokens).toBe(252)
  })

  it('aims above a minimum alone and below a maximum alone', () => {
    expect(aiCommentLength({ minWords: 100 }, fallback).guideline).toMatch(/at least 100 words\. Aim for about 115 words/)
    expect(aiCommentLength({ minWords: 100 }, fallback).maxTokens).toBe(300)
    expect(aiCommentLength({ maxWords: 40 }, fallback).guideline).toMatch(/at most 40 words\. Aim for about 34 words/)
  })

  it('never gives the model less room than it had', () => {
    expect(aiCommentLength({ maxWords: 20 }, fallback).maxTokens).toBe(200)
    expect(aiCommentLength({ minWords: 10, maxWords: 30 }, { sentences: '3-5', maxTokens: 300 }).maxTokens).toBe(300)
  })

  it('caps the room for a very long limit', () => {
    expect(aiCommentLength({ maxWords: 2000 }, fallback).maxTokens).toBe(3000)
  })

  it('ignores anything that is not a whole number of words from 1 to 2000', () => {
    for (const bad of ['50', 0, -3, 1.5, 2001, NaN, true, {}]) {
      expect(aiCommentLength({ minWords: bad, maxWords: bad }, fallback).guideline).toBe('Keep the comment between 2-4 sentences')
    }
  })

  it('keeps the minimum when the maximum is below it', () => {
    expect(aiCommentLength({ minWords: 80, maxWords: 40 }, fallback).guideline).toMatch(/at least 80 words/)
  })
})
