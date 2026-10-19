// src/lib/quizPlayer.ts
// Taking a quiz (the Student-Quiz board, S5): one question per screen, the
// answers kept as the student picks and types (autosaved by the page), Back /
// Next and the numbered dots, a confirm before Turn in, and the done screen.
// Also the quiz's place on the item page (Start quiz / Continue / waiting /
// results) and the results list once the grade is out. Pure, so it is
// unit-tested (quizPlayer.test.ts); the components render what these decide.
//
// The student never has the answer key: right answers come only inside the
// results, and only when the teacher shows them.

import type {
  QuestionKind,
  QuizAnswerValue,
  QuizRelease,
  StudentAnswerInput,
  StudentQuestion,
  StudentQuiz,
} from '@/services/types/quiz'
import type { WorkStatus } from '@/services/types/studentPortal'

/** The answers on screen, by question id (null or absent: nothing yet). */
export type AnswerMap = Record<string, QuizAnswerValue | null>

const field = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined

/** Whether an answer counts as answered: a pick, at least one pick, or words (not just spaces). */
export function isAnswered(q: Pick<StudentQuestion, 'kind'>, answer: QuizAnswerValue | null | undefined): boolean {
  if (!answer) return false
  switch (q.kind) {
    case 'one': {
      const choice = field(answer, 'choice')
      return typeof choice === 'string' && choice !== ''
    }
    case 'many': {
      const choices = field(answer, 'choices')
      return Array.isArray(choices) && choices.length > 0
    }
    default: {
      const text = field(answer, 'text')
      return typeof text === 'string' && text.trim() !== ''
    }
  }
}

export const answeredCount = (questions: Pick<StudentQuestion, 'questionId' | 'kind'>[], answers: AnswerMap): number =>
  questions.filter((q) => isAnswered(q, answers[q.questionId])).length

/** An answer as the server keeps it: nothing picked or typed is null (the saved answer is cleared). */
function normalized(answer: QuizAnswerValue | null | undefined): QuizAnswerValue | null {
  if (!answer) return null
  const choice = field(answer, 'choice')
  if (choice !== undefined) return typeof choice === 'string' && choice !== '' ? { choice } : null
  const choices = field(answer, 'choices')
  if (choices !== undefined) return Array.isArray(choices) && choices.length > 0 ? { choices: choices as string[] } : null
  const text = field(answer, 'text')
  return typeof text === 'string' && text.trim() !== '' ? { text } : null
}

/** PUT …/quiz-answers: each answer in the map (the ones that changed), a cleared one as null. */
export const toAnswerPayload = (answers: AnswerMap): StudentAnswerInput[] =>
  Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer: normalized(answer) }))

// ---------------------------------------------------------------------------
// The player

export type PlayerStage = 'question' | 'review' | 'done'

export interface PlayerState {
  questions: StudentQuestion[]
  index: number
  stage: PlayerStage
  answers: AnswerMap
}

export type PlayerAction =
  | { type: 'pick'; questionId: string; optionId: string }
  | { type: 'text'; questionId: string; value: string }
  | { type: 'go'; index: number }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'review' }
  | { type: 'submitted' }
  /** The quiz as it now stands (a reload after a refused answer): answers to removed questions or choices go. */
  | { type: 'questions'; questions: StudentQuestion[] }
  /** "Clear my answer". */
  | { type: 'clear'; questionId: string }

export const initPlayer = (questions: StudentQuestion[], answers: AnswerMap = {}): PlayerState => ({
  questions,
  index: 0,
  stage: 'question',
  answers: { ...answers },
})

const clamp = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))

/**
 * One step of the player. pick: one answer replaces, several toggles (kept in
 * choice order); text: as typed; go: a dot (from the review too); next: the
 * last question leads to the review; back: from the review to the last
 * question. Nothing changes once it is turned in.
 */
export function quizReducer(state: PlayerState, action: PlayerAction): PlayerState {
  if (state.stage === 'done') return state
  const last = state.questions.length - 1
  switch (action.type) {
    case 'pick': {
      const q = state.questions.find((x) => x.questionId === action.questionId)
      if (!q || (q.kind !== 'one' && q.kind !== 'many') || !q.options.some((o) => o.id === action.optionId)) return state
      if (q.kind === 'one') return { ...state, answers: { ...state.answers, [q.questionId]: { choice: action.optionId } } }
      const had = field(state.answers[q.questionId], 'choices')
      const picked = Array.isArray(had) ? (had as string[]) : []
      const next = picked.includes(action.optionId) ? picked.filter((c) => c !== action.optionId) : [...picked, action.optionId]
      const ordered = q.options.map((o) => o.id).filter((id) => next.includes(id))
      return { ...state, answers: { ...state.answers, [q.questionId]: { choices: ordered } } }
    }
    case 'text':
      if (!state.questions.some((x) => x.questionId === action.questionId)) return state
      return { ...state, answers: { ...state.answers, [action.questionId]: { text: action.value } } }
    case 'go':
      if (last < 0) return state
      return { ...state, stage: 'question', index: clamp(action.index, state.questions.length) }
    case 'next':
      if (state.stage === 'review') return state
      return state.index >= last ? { ...state, stage: 'review' } : { ...state, index: state.index + 1 }
    case 'back':
      if (state.stage === 'review') return { ...state, stage: 'question', index: Math.max(0, last) }
      return { ...state, index: Math.max(0, state.index - 1) }
    case 'review':
      return { ...state, stage: 'review' }
    case 'submitted':
      return { ...state, stage: 'done' }
    case 'clear':
      if (!state.questions.some((x) => x.questionId === action.questionId)) return state
      return { ...state, answers: { ...state.answers, [action.questionId]: null } }
    case 'questions': {
      const byId = new Map(action.questions.map((q) => [q.questionId, q]))
      const answers: AnswerMap = {}
      for (const [questionId, answer] of Object.entries(state.answers)) {
        const q = byId.get(questionId)
        if (!q) continue
        answers[questionId] = keptAnswer(q, answer)
      }
      const count = action.questions.length
      return { ...state, questions: action.questions, answers, index: count === 0 ? 0 : clamp(state.index, count) }
    }
    default:
      return state
  }
}

/** An answer against the question as it now stands: a pick of a choice that is gone is dropped. */
function keptAnswer(q: StudentQuestion, answer: QuizAnswerValue | null): QuizAnswerValue | null {
  if (!answer) return answer
  const ids = new Set(q.options.map((o) => o.id))
  const choice = field(answer, 'choice')
  if (q.kind === 'one') return typeof choice === 'string' && ids.has(choice) ? { choice } : null
  const choices = field(answer, 'choices')
  if (q.kind === 'many') {
    if (!Array.isArray(choices)) return null
    const kept = (choices as string[]).filter((c) => ids.has(c))
    return kept.length === choices.length ? answer : { choices: kept }
  }
  return typeof field(answer, 'text') === 'string' ? answer : null
}

/** The bar under the header: question by question, full on the review. */
export function progressPct(state: PlayerState): number {
  const n = state.questions.length
  if (n === 0) return 0
  if (state.stage !== 'question') return 100
  return ((state.index + 1) / n) * 100
}

/** "Review & turn in" on the last question, else "Next". */
export const nextLabel = (state: PlayerState): string =>
  state.index >= state.questions.length - 1 ? 'Review & turn in' : 'Next'

// ---------------------------------------------------------------------------
// Words

const fmt = (n: number) => String(Math.round(n * 100) / 100)

/** "1 point", "2 points", "0.5 points". */
export const pointsWord = (n: number): string => `${fmt(n)} ${n === 1 ? 'point' : 'points'}`

/** "Science · 8 points · one try" */
export const playerSubline = (subject: string, totalPoints: number): string => `${subject} · ${pointsWord(totalPoints)} · one try`

/** "Question 1 of 4 · 2 points" */
export const questionLine = (index: number, count: number, points: number): string =>
  `Question ${index + 1} of ${count} · ${pointsWord(points)}`

/** The bold part of "You answered 3 of 4 questions." */
export const confirmCounts = (answered: number, count: number): string =>
  `${answered} of ${count} ${count === 1 ? 'question' : 'questions'}`

export interface DoneCopy {
  title: string
  body: string
  /** "4 / 5": only when the submit itself released the results (a quiz set to release right after submit). */
  score: string | null
}

/**
 * The done screen: thanks by first name, then what happens next. Only a
 * Publish after the submission releases results (T23 fix round 1): a quiz the
 * teacher publishes by hand (the default) says "Turned in" and who grades it
 * first, never a score; a quiz set to release right after submit shows the
 * score the submit came back with (`results`), or, if it isn't there, where
 * it will show.
 */
export function doneCopy(opts: {
  first: string
  teacher: string | null
  writtenCount: number
  release: QuizRelease
  results?: Pick<NonNullable<StudentQuiz['results']>, 'earned' | 'possible' | 'score'> | null
}): DoneCopy {
  const title = opts.first ? `Turned in. Nice work, ${opts.first}!` : 'Turned in. Nice work!'
  if (opts.release === 'on_submit' && opts.results) {
    const score = opts.results.score ?? opts.results.earned
    return { title, body: 'Here is your score. Your answers are below.', score: `${fmt(score)} / ${fmt(opts.results.possible)}` }
  }
  if (opts.release === 'on_submit' && opts.writtenCount === 0) {
    return { title, body: "Your score shows on the quiz's page as soon as it's ready.", score: null }
  }
  const who = opts.teacher ?? 'Your teacher'
  const first =
    opts.writtenCount === 1
      ? `${who} reads the written answer first.`
      : opts.writtenCount > 1
        ? `${who} reads the written answers first.`
        : `${who} looks it over first.`
  return { title, body: `${first} You'll see your score and feedback once it's graded.`, score: null }
}

/** Above the results: a score the teacher set by hand (it can differ from the points below); null otherwise. */
export function resultsScoreLine(results: NonNullable<StudentQuiz['results']>, teacher: string | null): string | null {
  if (!results.scoreSetByTeacher || results.score === null) return null
  return `${teacher ?? 'Your teacher'} set your score: ${fmt(results.score)} / ${fmt(results.possible)}. The points below are the quiz's own.`
}

// ---------------------------------------------------------------------------
// A save the server will never take

const NOT_SAVED = 'Your last answers were not saved.'
const CLOSED_FALLBACK = 'This quiz is closed. Ask your teacher.'
const SUBMITTED_FALLBACK = "You've already turned in this quiz."

/**
 * A refused autosave that will be refused every time (409 ALREADY_SUBMITTED:
 * turned in from another tab or device; 409 ITEM_CLOSED: closed, excused or
 * graded): the page says why and shows the quiz as it now stands. Null: an
 * ordinary failure (a server error, no connection) the student can retry.
 */
export function quizSaveVerdict(err: unknown): { message: string } | null {
  const code = field(err, 'code')
  if (code !== 'ALREADY_SUBMITTED' && code !== 'ITEM_CLOSED') return null
  const said = field(err, 'message')
  const reason = typeof said === 'string' && said.trim() ? said.trim() : code === 'ITEM_CLOSED' ? CLOSED_FALLBACK : SUBMITTED_FALLBACK
  return { message: `${reason} ${NOT_SAVED}` }
}

/**
 * A 400 on an answer: the quiz will never take it as it is (a question or a
 * choice the teacher removed, a type that changed, an answer too long).
 * Retrying it can't help; the student changes it or clears it.
 */
export const isRejectedSave = (err: unknown): boolean => field(err, 'status') === 400

export interface OneByOne {
  /** Saved. */
  saved: string[]
  /** Refused for good (400), by question, with the server's words. */
  rejected: Record<string, string>
  /** Failed for another reason (no connection, a server error): kept for Retry. */
  failed: AnswerMap
  message: string
  /** Turned in elsewhere or closed: nothing more can be saved. */
  settled: { message: string } | null
}

/**
 * A save of several answers was refused with a 400: send them one at a time
 * to find the one the quiz won't take, so the others still save and only that
 * one is shown to the student.
 */
export async function saveOneByOne(
  answers: AnswerMap,
  send: (questionId: string, answer: QuizAnswerValue | null) => Promise<unknown>,
): Promise<OneByOne> {
  const out: OneByOne = { saved: [], rejected: {}, failed: {}, message: '', settled: null }
  for (const [questionId, answer] of Object.entries(answers)) {
    try {
      await send(questionId, answer)
      out.saved.push(questionId)
    } catch (err) {
      const settled = quizSaveVerdict(err)
      if (settled) {
        out.settled = settled
        break
      }
      const message = err instanceof Error && err.message ? err.message : "This answer couldn't be saved."
      if (isRejectedSave(err)) out.rejected[questionId] = message
      else {
        out.failed[questionId] = answer
        out.message = message
      }
    }
  }
  return out
}

/** What the question says under a refused answer: the server's words, then what to do. */
export const rejectedLine = (message: string): string =>
  `This answer didn't save: ${message} Your teacher may have changed this question since the quiz opened. Change your answer, or clear it.`

/** Refusals for questions still in the quiz (a removed question's refusal goes with it). */
export function reconcileRejected(rejected: Record<string, string>, questions: Pick<StudentQuestion, 'questionId'>[]): Record<string, string> {
  const ids = new Set(questions.map((q) => q.questionId))
  return Object.fromEntries(Object.entries(rejected).filter(([id]) => ids.has(id)))
}

/** Turn in waits while an answer is refused: the first such question, and what to do. Null when nothing blocks. */
export function turnInBlock(rejected: Record<string, string>, questions: Pick<StudentQuestion, 'questionId'>[]): { index: number; message: string } | null {
  const index = questions.findIndex((q) => rejected[q.questionId] !== undefined)
  if (index < 0) return null
  return {
    index,
    message: `Question ${index + 1}'s answer didn't save: ${rejected[questions[index].questionId]} Change it or clear it, then turn in.`,
  }
}

// ---------------------------------------------------------------------------
// The quiz on the item page

export type QuizIntroState = 'start' | 'continue' | 'waiting' | 'results' | 'closed' | 'excused' | 'graded' | 'empty'

/**
 * Where the student stands: results once graded; turned in and waiting;
 * excused; graded by hand without an attempt; closed (past due with no late
 * work); no questions yet; started (Continue) or not (Start quiz).
 */
export function quizIntroState(work: { status: WorkStatus; canEdit: boolean }, quiz: StudentQuiz): QuizIntroState {
  if (quiz.results) return 'results'
  if (quiz.attempt?.submittedAt) return 'waiting'
  if (work.status === 'excused') return 'excused'
  if (work.status === 'graded') return 'graded'
  if (!work.canEdit) return 'closed'
  if (quiz.questions.length === 0) return 'empty'
  return quiz.attempt ? 'continue' : 'start'
}

// ---------------------------------------------------------------------------
// The results

/** An answer in words: the picked choices' text, or what was typed; null when there is none. */
export function answerText(q: Pick<StudentQuestion, 'kind' | 'options'>, answer: QuizAnswerValue | null | undefined): string | null {
  if (!answer) return null
  const textOf = (id: string) => q.options.find((o) => o.id === id)?.text ?? null
  if (q.kind === 'one') {
    const choice = field(answer, 'choice')
    return typeof choice === 'string' ? textOf(choice) : null
  }
  if (q.kind === 'many') {
    const choices = field(answer, 'choices')
    if (!Array.isArray(choices) || choices.length === 0) return null
    return (choices as string[]).map(textOf).filter(Boolean).join(', ') || null
  }
  const text = field(answer, 'text')
  return typeof text === 'string' && text.trim() !== '' ? text.trim() : null
}

/** The right answer in words (choices' text, or the accepted short answers); null when not shown. */
export function correctText(q: Pick<StudentQuestion, 'kind' | 'options'>, correct: string[] | undefined): string | null {
  if (!correct || correct.length === 0) return null
  if (q.kind === 'short') return correct.join(', ')
  if (q.kind === 'long') return null
  return correct.map((id) => q.options.find((o) => o.id === id)?.text).filter(Boolean).join(', ') || null
}

export interface ResultRow {
  questionId: string
  n: number
  kind: QuestionKind
  prompt: string
  answer: string | null
  /** Earned; null while a written answer has no points. */
  points: number | null
  possible: number
  right: string | null
  note: string | null
  tone: 'full' | 'part' | 'none' | 'pending'
}

/** One row per question, in the student's order. */
export function resultRows(quiz: StudentQuiz): ResultRow[] {
  const per = new Map((quiz.results?.perQuestion ?? []).map((r) => [r.questionId, r]))
  return quiz.questions.map((q, i) => {
    const r = per.get(q.questionId)
    const points = r?.points ?? null
    const tone: ResultRow['tone'] =
      points === null ? 'pending' : points >= q.points ? 'full' : points > 0 ? 'part' : 'none'
    return {
      questionId: q.questionId,
      n: i + 1,
      kind: q.kind,
      prompt: q.prompt,
      answer: answerText(q, quiz.attempt?.answers[q.questionId]),
      points,
      possible: q.points,
      right: correctText(q, r?.correct),
      note: r?.note ?? null,
      tone,
    }
  })
}

/**
 * The Saved pill's words while the quiz refused some answers for good (T24 N3):
 * it never says "Saved" with a refused answer on screen. Null when none is refused.
 */
export function refusedAnswersLabel(rejected: Record<string, string> | null | undefined): string | null {
  const n = Object.keys(rejected ?? {}).length
  if (n === 0) return null
  return n === 1 ? '1 answer not saved' : `${n} answers not saved`
}
