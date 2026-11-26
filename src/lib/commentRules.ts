// src/lib/commentRules.ts
// The school's rules for the comments teachers write on report cards and
// progress reports: word limits, and the review lock.
//
// Limits (grades 1-8). A comment over the maximum is not saved until it is
// shortened. A comment under the minimum saves as a draft and counts as not
// finished. Blank is always allowed.
//
// Lock. The office locks a term's comments (or one class's) to review them;
// teachers can then read but not change them. Whoever holds School setup
// still can.
//
// The server enforces both (409 COMMENTS_LOCKED, 400 COMMENT_TOO_LONG); this
// file is what the pages say and count. Platform-neutral: the app copies it
// verbatim. Pure, unit-tested (commentRules.test.ts).

export type CommentKind = 'report_card' | 'progress_report'

export interface CommentLimits {
  /** Fewest words a finished comment has; null for no minimum. */
  minWords: number | null
  /** Most words a comment may have; null for no maximum. */
  maxWords: number | null
}

export interface CommentRule extends CommentLimits {
  locked: boolean
  /** What locked (or reopened) it: the whole term, or this class on its own. */
  lockScope: 'term' | 'class' | null
}

/** What a class's comment pages work under (GET /report-comments/class/:classId). */
export interface ClassCommentRules {
  reportCard: CommentRule
  progressReport: CommentRule
  /** The signed-in person reviews comments, so a lock doesn't stop them. */
  canEditLocked: boolean
}

/** No limits, not locked: what a page assumes until the rules have loaded. */
export const OPEN_RULE: CommentRule = { minWords: null, maxWords: null, locked: false, lockScope: null }
export const OPEN_RULES: ClassCommentRules = { reportCard: OPEN_RULE, progressReport: OPEN_RULE, canEditLocked: false }

export const COMMENTS_LOCKED = 'COMMENTS_LOCKED'
export const COMMENT_TOO_LONG = 'COMMENT_TOO_LONG'
/** The most words a limit can be set to. */
export const MAX_WORDS_CEILING = 2000

export const KIND_NAME: Record<CommentKind, string> = {
  report_card: 'Report card comments',
  progress_report: 'Progress report comments',
}

// ── Counting ────────────────────────────────────────────────────────────────

// A word is a run of anything that is not whitespace. The whitespace set is
// spelled out so the server (utils/wordCount.js, and its SQL twin) counts the
// same words.
const WORD = /[^ \t\n\r\f\v ]+/g

export function countWords(text: string | null | undefined): number {
  return typeof text === 'string' ? (text.match(WORD) ?? []).length : 0
}

const plural = (n: number, word = 'word') => `${n} ${word}${n === 1 ? '' : 's'}`

export type WordState = 'empty' | 'short' | 'ok' | 'over'

/** Where a comment stands against the limits. */
export function wordState(text: string | null | undefined, limits: CommentLimits): WordState {
  const words = countWords(text)
  if (words === 0) return 'empty'
  if (limits.maxWords !== null && words > limits.maxWords) return 'over'
  if (limits.minWords !== null && words < limits.minWords) return 'short'
  return 'ok'
}

/** Over the maximum. */
export const exceedsMax = (text: string | null | undefined, limits: Pick<CommentLimits, 'maxWords'>): boolean =>
  limits.maxWords !== null && countWords(text) > limits.maxWords

/**
 * Held back: over the maximum and not the comment that is already saved. A
 * comment saved before the limit (or before it was lowered) stays saved, and
 * the ratings beside it still save, until the teacher changes it; then it has
 * to fit. The server draws the same line.
 */
export const heldForLength = (
  text: string | null | undefined,
  saved: string | null | undefined,
  limits: Pick<CommentLimits, 'maxWords'>,
): boolean => exceedsMax(text, limits) && (text ?? '') !== (saved ?? '')

/** Written and within the limits: the comment counts as done. */
export const commentFinished = (text: string | null | undefined, limits: CommentLimits): boolean =>
  wordState(text, limits) === 'ok'

export const hasLimits = (limits: CommentLimits): boolean => limits.minWords !== null || limits.maxWords !== null

/** What the AI comment routes are sent so a draft aims inside the limits: nothing when the school has set none. */
export const aiLimitsPayload = (limits: CommentLimits): Partial<CommentLimits> =>
  hasLimits(limits) ? { minWords: limits.minWords, maxWords: limits.maxWords } : {}

/** The range in a few words: "50 to 120 words", "at least 50 words", "at most 120 words". Null when there is none. */
export function limitRange(limits: CommentLimits): string | null {
  const { minWords: min, maxWords: max } = limits
  if (min !== null && max !== null) return min === max ? `exactly ${plural(min)}` : `${min} to ${plural(max)}`
  if (min !== null) return `at least ${plural(min)}`
  if (max !== null) return `at most ${plural(max)}`
  return null
}

/** What happens outside the range, in a sentence each. Empty when there are no limits. */
export function limitConsequences(limits: CommentLimits): string[] {
  const lines: string[] = []
  if (limits.maxWords !== null) lines.push(`A comment over ${plural(limits.maxWords)} isn't saved until it is shortened.`)
  if (limits.minWords !== null) lines.push(`A comment under ${plural(limits.minWords)} is saved, and counts as not finished.`)
  return lines
}

/**
 * The line under a comment box: how many words, and what is needed. `saved`
 * is the comment as saved: one over the limit that is still the saved text was
 * written before the limit, so it is saved, and is asked to be shortened.
 */
export function wordCountLine(
  text: string | null | undefined,
  limits: CommentLimits,
  saved?: string | null,
): { state: WordState; text: string } {
  const words = countWords(text)
  const state = wordState(text, limits)
  const range = limitRange(limits)
  if (state === 'over') {
    const over = `${plural(words)}: ${plural(words - (limits.maxWords as number))} over the limit of ${limits.maxWords}.`
    return heldForLength(text, saved, limits)
      ? { state, text: `${over} Not saved until it is shortened.` }
      : { state, text: `${over} It was saved before the limit: please shorten it.` }
  }
  if (state === 'short') {
    return { state, text: `${plural(words)}: ${plural((limits.minWords as number) - words, 'more word')} to reach the minimum of ${limits.minWords}.` }
  }
  if (state === 'empty') return { state, text: range ? `No comment yet. Limit: ${range}.` : '' }
  return { state, text: range ? `${plural(words)}. Limit: ${range}.` : plural(words) }
}

// ── The lock ────────────────────────────────────────────────────────────────

/** The page is read-only for this person: locked, and they don't review. */
export const isReadOnly = (rule: CommentRule, canEditLocked: boolean): boolean => rule.locked && !canEditLocked

/** The notice over a locked page, worded for who is reading it. Null when it is open. */
export function lockNotice(kind: CommentKind, rule: CommentRule, canEditLocked: boolean): { title: string; body: string } | null {
  if (!rule.locked) return null
  const what = KIND_NAME[kind]
  const where = rule.lockScope === 'class' ? 'for this class' : 'for this term'
  if (canEditLocked) {
    return {
      title: `${what} are locked ${where}`,
      body: 'Teachers can read them but not change them. You can still edit, and reopen them from Report templates → Comments.',
    }
  }
  return {
    title: `${what} are locked ${where}`,
    body: "The school is reviewing them, so they can't be changed right now. If something needs fixing, ask the office to reopen this class.",
  }
}

// ── Setting the limits (the admin form) ─────────────────────────────────────

export interface LimitsDraft {
  minWords: string
  maxWords: string
}

export const limitsDraft = (limits: CommentLimits): LimitsDraft => ({
  minWords: limits.minWords === null ? '' : String(limits.minWords),
  maxWords: limits.maxWords === null ? '' : String(limits.maxWords),
})

const readEnd = (raw: string): number | null | 'bad' => {
  const text = raw.trim()
  if (text === '') return null
  if (!/^\d+$/.test(text)) return 'bad'
  const n = Number(text)
  return n >= 1 && n <= MAX_WORDS_CEILING ? n : 'bad'
}

/** What was typed, as limits to save, or what is wrong with it. Blank means no limit. */
export function readLimits(draft: LimitsDraft): { value: CommentLimits } | { error: string } {
  const min = readEnd(draft.minWords)
  const max = readEnd(draft.maxWords)
  if (min === 'bad' || max === 'bad') return { error: `Use whole numbers from 1 to ${MAX_WORDS_CEILING}, or leave a box blank for no limit.` }
  if (min !== null && max !== null && min > max) return { error: "The minimum can't be more than the maximum." }
  return { value: { minWords: min, maxWords: max } }
}

export const sameLimits = (a: CommentLimits, b: CommentLimits): boolean => a.minWords === b.minWords && a.maxWords === b.maxWords

// ── A class in the review list ──────────────────────────────────────────────

export interface ClassCommentStanding {
  locked: boolean
  /** This class's own exception to its term, if it has one. */
  exception: 'locked' | 'open' | null
  students: number
  /** Null for JK and SK: their comments are not counted by class. */
  written: number | null
  tooShort: number | null
  tooLong: number | null
}

/** "22 of 24 written · 2 under the minimum · 1 over the maximum", or null where nothing is counted. */
export function standingLine(s: ClassCommentStanding): string | null {
  if (s.written === null) return null
  if (s.students === 0) return 'No students'
  const parts = [`${s.written} of ${s.students} written`]
  if (s.tooShort) parts.push(`${s.tooShort} under the minimum`)
  if (s.tooLong) parts.push(`${s.tooLong} over the maximum`)
  return parts.join(' · ')
}

/** Everyone has a comment and none is outside the limits. */
export const standingDone = (s: ClassCommentStanding): boolean =>
  s.written !== null && s.students > 0 && s.written === s.students && !s.tooShort && !s.tooLong
