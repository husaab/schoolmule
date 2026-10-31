// Standard progress comments. A class keeps one sentence per Core Standards
// level and per Work Habits rating (its comment bank, /comment-banks); picking
// a student's level and work habits builds their comment from them. A class
// with nothing saved uses STARTER_COMMENT_BANK.
//
// A comment SchoolMule built is rebuilt when a rating changes; one the teacher
// typed or edited is never replaced (withStandardComment). Nothing is stored
// to tell the two apart: a comment is SchoolMule's while it equals the text the
// ratings build.

import type { CommentBank, CommentBankCutoffs, CoreStandardsKey } from '@/services/types/commentBank'
import { firstNameOf } from '@/lib/classroomText'

/** The four levels, as the progress report stores and prints them. */
export const CORE_STANDARDS_LEVELS: readonly { key: CoreStandardsKey; value: string; label: string }[] = [
  { key: 'exceeding', value: 'Exceeding Common Core Standards', label: 'Exceeding' },
  { key: 'meeting', value: 'Meeting Common Core Standards', label: 'Meeting' },
  { key: 'workingTowards', value: 'Working towards Common Core Standards', label: 'Working towards' },
  { key: 'notMeeting', value: 'Not Meeting Common Core Standards', label: 'Not Meeting' },
]

export const STARTER_COMMENT_BANK: CommentBank = {
  coreStandards: {
    exceeding:
      "{First} is exceeding grade-level expectations in {subject}. {He} shows a thorough understanding of this term's concepts and applies {his} skills with confidence.",
    meeting:
      "{First} is meeting grade-level expectations in {subject}. {He} has a good understanding of this term's concepts and applies them well in most of {his} work.",
    workingTowards:
      "{First} is working towards grade-level expectations in {subject}. {He} understands some of this term's concepts, and regular practice will help {him} strengthen the rest.",
    notMeeting:
      '{First} is not yet meeting grade-level expectations in {subject}. With extra practice and support at school and at home, {he} can build a stronger foundation.',
  },
  workHabits: {
    E: '{He} is well organized, completes {his} work on time and takes pride in {his} assignments.',
    G: '{He} usually completes {his} work on time and stays focused during lessons.',
    S: '{He} would benefit from completing {his} assignments more consistently and on time.',
    N: '{He} needs to complete and hand in {his} assignments on time so that {his} marks reflect what {he} knows.',
  },
  cutoffs: { exceeding: 85, meeting: 70, workingTowards: 60 },
}

export const COMMENT_BANK_SENTENCE_MAX = 600

export interface CommentStudent {
  name: string
  gender?: 'male' | 'female' | null
}

export interface StandardPicks {
  coreStandards?: string | null
  workHabit?: string | null
}

export interface StandardCommentContext {
  bank: CommentBank
  student: CommentStudent
  subject: string
}

const PLACEHOLDER = /\{(First|subject|he|He|him|Him|his|His)\}/g

/**
 * The template with the student's first name, the subject and their pronouns
 * filled in. With no gender on file, he/him become the first name and his
 * becomes their. Anything else in braces is left as written, so a typo shows.
 */
export function fillPlaceholders(template: string, student: CommentStudent, subject: string): string {
  const first = firstNameOf(student.name)
  const pronouns: Record<string, string> =
    student.gender === 'male'
      ? { he: 'he', He: 'He', him: 'him', Him: 'Him', his: 'his', His: 'His' }
      : student.gender === 'female'
        ? { he: 'she', He: 'She', him: 'her', Him: 'Her', his: 'her', His: 'Her' }
        : { he: first, He: first, him: first, Him: first, his: 'their', His: 'Their' }
  return template.replace(PLACEHOLDER, (_match, name: string) =>
    name === 'First' ? first : name === 'subject' ? subject : pronouns[name],
  )
}

/** The level a mark falls in (its stored value), or null with no mark. */
export function suggestCoreStandards(pct: number | null | undefined, cutoffs: CommentBankCutoffs): string | null {
  if (typeof pct !== 'number' || !Number.isFinite(pct)) return null
  const key: CoreStandardsKey =
    pct >= cutoffs.exceeding ? 'exceeding' : pct >= cutoffs.meeting ? 'meeting' : pct >= cutoffs.workingTowards ? 'workingTowards' : 'notMeeting'
  return CORE_STANDARDS_LEVELS.find((l) => l.key === key)!.value
}

const isWorkHabit = (value: string | null | undefined): value is keyof CommentBank['workHabits'] =>
  value === 'E' || value === 'G' || value === 'S' || value === 'N'

/** The level's sentence, then the work habits sentence when rated; '' without a level. */
export function buildStandardComment(picks: StandardPicks, ctx: StandardCommentContext): string {
  const level = CORE_STANDARDS_LEVELS.find((l) => l.value === picks.coreStandards)
  if (!level) return ''
  const parts = [ctx.bank.coreStandards[level.key]]
  if (isWorkHabit(picks.workHabit)) parts.push(ctx.bank.workHabits[picks.workHabit])
  return parts.map((t) => fillPlaceholders(t, ctx.student, ctx.subject)).join(' ')
}

/** True when the comment is exactly what the ratings build (and they build something). */
export function isStandardComment(comment: string | null | undefined, picks: StandardPicks, ctx: StandardCommentContext): boolean {
  const text = buildStandardComment(picks, ctx)
  return text !== '' && comment === text
}

/**
 * What the comment box offers for these ratings: 'fill' an empty comment
 * (nothing to replace), 'rebuild' one that isn't the built text (after a
 * confirm), or null when the ratings build nothing or it already matches.
 */
export function standardCommentAction(
  comment: string | null | undefined,
  picks: StandardPicks,
  ctx: StandardCommentContext,
): 'fill' | 'rebuild' | null {
  const text = buildStandardComment(picks, ctx)
  if (text === '') return null
  const current = comment ?? ''
  if (current.trim() === '') return 'fill'
  return current === text ? null : 'rebuild'
}

/**
 * `after` with its comment rebuilt from its ratings, when the comment before
 * the change was empty or still SchoolMule's text; otherwise `after` unchanged.
 */
export function withStandardComment<T extends StandardPicks & { comment?: string | null }>(
  before: T,
  after: T,
  ctx: StandardCommentContext,
): T {
  const current = before.comment ?? ''
  const untouched = current.trim() === '' || current === buildStandardComment(before, ctx)
  if (!untouched) return after
  const next = buildStandardComment(after, ctx)
  if (next === '' && current === '') return after
  return { ...after, comment: next }
}

const SENTENCE_KEYS = {
  coreStandards: ['exceeding', 'meeting', 'workingTowards', 'notMeeting'],
  workHabits: ['E', 'G', 'S', 'N'],
} as const

/** Why the bank can't be saved (the server's words), or null. */
export function commentBankProblem(bank: CommentBank): string | null {
  const sentences = [
    ...SENTENCE_KEYS.coreStandards.map((k) => bank.coreStandards[k]),
    ...SENTENCE_KEYS.workHabits.map((k) => bank.workHabits[k]),
  ].map((s) => (s ?? '').trim())
  if (sentences.some((s) => s === '')) return 'Every standard comment needs text.'
  if (sentences.some((s) => s.length > COMMENT_BANK_SENTENCE_MAX)) {
    return `Each standard comment can be up to ${COMMENT_BANK_SENTENCE_MAX} characters.`
  }
  const { exceeding, meeting, workingTowards } = bank.cutoffs
  const inRange = (n: number) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100
  if (![exceeding, meeting, workingTowards].every(inRange) || !(exceeding > meeting && meeting > workingTowards)) {
    return 'Cut-offs must go Exceeding, then Meeting, then Working towards, from high to low, between 0 and 100.'
  }
  return null
}
