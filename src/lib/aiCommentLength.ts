// src/lib/aiCommentLength.ts
// How long an AI-written comment should be. Without limits the routes ask
// for a few sentences, as they always have. When the school has set word
// limits for the document (lib/commentRules.ts), the model is asked to stay
// inside them and is given room to. The page still counts what comes back:
// a draft over the maximum is shown, flagged, and not saved until shortened.
// Pure, unit-tested (aiCommentLength.test.ts).

import { MAX_WORDS_CEILING } from './commentRules'

export interface AiCommentLength {
  /** The prompt's length guideline (without the leading "- "). */
  guideline: string
  maxTokens: number
}

const readWords = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_WORDS_CEILING ? value : null

// English prose runs a little over a token a word; leave room so a comment
// near the maximum is never cut off mid-sentence.
const tokensFor = (words: number) => Math.min(3000, Math.ceil(words * 1.6) + 60)

export function aiCommentLength(
  limits: { minWords?: unknown; maxWords?: unknown },
  fallback: { sentences: string; maxTokens: number },
): AiCommentLength {
  const min = readWords(limits.minWords)
  const rawMax = readWords(limits.maxWords)
  // A maximum below the minimum is not a range: keep the minimum.
  const max = min !== null && rawMax !== null && rawMax < min ? null : rawMax

  if (min === null && max === null) {
    return { guideline: `Keep the comment between ${fallback.sentences} sentences`, maxTokens: fallback.maxTokens }
  }
  if (min !== null && max !== null) {
    const aim = Math.round((min + max) / 2)
    return {
      guideline: `The comment must be between ${min} and ${max} words. Aim for about ${aim} words, and count them: staying inside this range matters more than the number of sentences`,
      maxTokens: Math.max(fallback.maxTokens, tokensFor(max)),
    }
  }
  if (min !== null) {
    return {
      guideline: `The comment must be at least ${min} words. Aim for about ${Math.ceil(min * 1.15)} words, and count them`,
      maxTokens: Math.max(fallback.maxTokens, tokensFor(Math.ceil(min * 1.5))),
    }
  }
  return {
    guideline: `The comment must be at most ${max} words. Aim for about ${Math.max(1, Math.floor((max as number) * 0.85))} words, and count them`,
    maxTokens: Math.max(fallback.maxTokens, tokensFor(max as number)),
  }
}
