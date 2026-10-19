// src/lib/quizReview.ts
// The teacher's review of one student's quiz in the grading view: each
// answer beside the key, the machine's points, and the teacher's points
// (an override) with a note. Totals follow the server's attemptTotals:
// effective points are the teacher's when set, else the machine's; a written
// answer with neither still needs review. Pure, so it is unit-tested
// (quizReview.test.ts).

import type { GradeStatus } from '@/services/types/grading'
import type { Question, QuizTotals, SubmissionQuiz, TeacherQuizAnswer } from '@/services/types/quiz'

const round2 = (n: number) => Math.round(n * 100) / 100
const fmt = (n: number) => String(round2(n))
const letterAt = (index: number) => String.fromCharCode(65 + index)

const field = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined

/**
 * earned / possible and whether anything is left to grade by hand. `typed`
 * holds the points boxes as they stand (answer id → points, null = empty: the
 * machine's points), so the totals move as the teacher types.
 */
export function reviewTotals(answers: TeacherQuizAnswer[], typed: Record<string, number | null>): QuizTotals {
  let earned = 0
  let possible = 0
  let needsReview = false
  for (const a of answers) {
    possible += a.points
    let p: number | null
    if (!a.answerId) p = a.kind === 'long' ? null : 0
    else {
      const teacher = Object.prototype.hasOwnProperty.call(typed, a.answerId) ? typed[a.answerId] : a.teacherPoints
      p = teacher != null ? teacher : a.autoPoints
    }
    if (p == null) needsReview = true
    else earned += p
  }
  return { earned: round2(earned), possible: round2(possible), needsReview }
}

/** The teacher has changed the points on this answer (an empty box would give the machine's back). */
export const hasOverride = (a: Pick<TeacherQuizAnswer, 'teacherPoints'>, typed: number | null | undefined): boolean =>
  typed !== undefined ? typed !== null : a.teacherPoints !== null

/**
 * Where the student's score in the column comes from: 'auto' (the quiz's
 * points), 'teacher' (typed in the score box or the grid: it wins over the
 * quiz's points, T23 fix round 1), or 'none' (no score, or Missing /
 * Excused). The server's flag says which: the grading row's (fresh after
 * every grade save), else the quiz detail's.
 */
export type QuizScoreSource = 'auto' | 'teacher' | 'none'

export function quizScoreSource(
  setByTeacher: { row?: boolean; quiz?: Pick<SubmissionQuiz, 'scoreSetByTeacher'> | null },
  current: { score: number | null; status: GradeStatus | null },
): QuizScoreSource {
  if (current.status === 'missing' || current.status === 'excused' || current.score === null) return 'none'
  return (setByTeacher.row ?? setByTeacher.quiz?.scoreSetByTeacher ?? false) ? 'teacher' : 'auto'
}

/** "6.5 / 8" */
export const totalsLine = (t: QuizTotals): string => `${fmt(t.earned)} / ${fmt(t.possible)}`

/** A points box: { value } (null when empty), or { error } to show under it. */
export function parseOverride(text: string, max: number): { value: number | null } | { error: string } {
  const raw = text.trim()
  if (raw === '') return { value: null }
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(raw)) return { error: 'Type a number' }
  const n = Number(raw)
  if (!Number.isFinite(n)) return { error: 'Type a number' }
  if (n < 0 || n > max) return { error: `From 0 to ${fmt(max)}` }
  return { value: round2(n) }
}

/** Under the points box: what leaving it empty means (a written answer: whether it is graded yet). */
export function overrideHint(a: Pick<TeacherQuizAnswer, 'kind' | 'autoPoints'>, given = false): string {
  if (a.kind === 'long' || a.autoPoints == null) return given ? 'Graded by you.' : 'Give it points to finish grading.'
  return `Empty: the automatic ${fmt(a.autoPoints)} ${a.autoPoints === 1 ? 'point stands' : 'points stand'}.`
}

const optionText = (question: Question | undefined, id: string): string => {
  const at = question?.options.findIndex((o) => o.id === id) ?? -1
  if (question && at >= 0) return question.options[at].text
  // The question isn't loaded (or the choice was removed since): the letter is all there is.
  return `Choice ${id.toUpperCase()}`
}

/** The student's answer in words; null when there is none. */
export function reviewAnswerText(a: Pick<TeacherQuizAnswer, 'kind' | 'answer'>, question: Question | undefined): string | null {
  if (!a.answer) return null
  if (a.kind === 'one') {
    const choice = field(a.answer, 'choice')
    return typeof choice === 'string' && choice ? optionText(question, choice) : null
  }
  if (a.kind === 'many') {
    const choices = field(a.answer, 'choices')
    return Array.isArray(choices) && choices.length > 0 ? (choices as string[]).map((id) => optionText(question, id)).join(', ') : null
  }
  const text = field(a.answer, 'text')
  return typeof text === 'string' && text.trim() ? text.trim() : null
}

/** The key in words: the right choices, or the accepted short answers; null for a written answer. */
export function keyText(a: Pick<TeacherQuizAnswer, 'kind' | 'correct' | 'accepted'>, question: Question | undefined): string | null {
  if (a.kind === 'short') return a.accepted.length > 0 ? a.accepted.join(', ') : null
  if (a.kind === 'long') return null
  return a.correct.length > 0 ? a.correct.map((id) => optionText(question, id)).join(', ') : null
}

export interface ChoiceMark {
  id: string
  letter: string
  text: string
  picked: boolean
  right: boolean
}

/** Every choice of a one/many question, marked as picked and as right ([] without the question). */
export function choiceMarks(a: Pick<TeacherQuizAnswer, 'answer' | 'correct'>, question: Question | undefined): ChoiceMark[] {
  if (!question) return []
  const choice = field(a.answer, 'choice')
  const choices = field(a.answer, 'choices')
  const picked = new Set<string>(typeof choice === 'string' ? [choice] : Array.isArray(choices) ? (choices as string[]) : [])
  return question.options.map((o, i) => ({ id: o.id, letter: letterAt(i), text: o.text, picked: picked.has(o.id), right: a.correct.includes(o.id) }))
}
