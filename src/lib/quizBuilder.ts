// src/lib/quizBuilder.ts
// The quiz builder's rules (the Teacher-Quiz board): what a question holds
// while the teacher writes it, the checks a save needs (the server's
// validateQuestions, written beside each question instead of as a failed
// save), the totals and the "release on submit" rule, and what an autosave
// sends. Pure, so it is unit-tested (quizBuilder.test.ts).
//
// Autosave sends the whole list (PUT …/questions upserts by id and deletes the
// rest), so a half-written question must never block or delete the others:
// - a question that is ready goes as it stands;
// - a saved question that isn't ready (its prompt cleared) goes as it was last
//   saved, so it is neither lost nor half-saved;
// - a new question that isn't ready waits until it is.
// Empty choices and empty accepted answers are left out of what is sent.

import { dayLabel } from '@/lib/classStream'
import { timeText } from '@/lib/classroomText'
import type { ItemGradebook, ItemStatus } from '@/services/types/classwork'
import type { QuestionInput, Question, QuestionKind, QuizOption, StudentQuestion } from '@/services/types/quiz'

export const MAX_QUESTIONS = 50
export const PROMPT_MAX = 1000
export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 8
export const OPTION_TEXT_MAX = 300
export const MAX_ACCEPTED = 10
export const ACCEPTED_MAX = 300
export const POINTS_MAX = 100
export const OPTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

export const QUESTION_KINDS: readonly QuestionKind[] = ['one', 'many', 'short', 'long']

/** The type select and the Add a question bar, in board order. */
export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  one: 'One answer',
  many: 'Several answers',
  short: 'Short text',
  long: 'Written answer',
}

/** What the student reads under a question (the server's own hints). */
export const STUDENT_HINTS: Partial<Record<QuestionKind, string>> = {
  many: 'Pick all that apply.',
  long: 'Your teacher grades this one.',
}

/** A question as the builder holds it while the teacher writes it. */
export interface DraftQuestion {
  /** Stable for the question's life on this page: React's key, and what a save's answer is matched by. */
  key: string
  /** Null until the first save that sends it comes back. */
  questionId: string | null
  kind: QuestionKind
  prompt: string
  imagePath: string | null
  imageUrl: string | null
  /** Kept when the type changes, so switching back loses nothing; only one/many send them. */
  options: QuizOption[]
  correct: string[]
  /** Short text; an empty one is an answer still being typed. */
  accepted: string[]
  /** Null while the points box is empty. */
  points: number | null
  partialCredit: boolean
}

let keyCounter = 0
/** A key for a question that has no id yet. */
export const newQuestionKey = (): string => `new-${(keyCounter += 1)}`

const isChoice = (kind: QuestionKind) => kind === 'one' || kind === 'many'
const blankOptions = (): QuizOption[] => OPTION_IDS.slice(0, 4).map((id) => ({ id, text: '' }))
const round2 = (n: number) => Math.round(n * 100) / 100
const letterAt = (index: number) => String.fromCharCode(65 + index)

/** A new question: one/many get choices a–d, short one empty accepted answer; 1 point. */
export function newQuestion(kind: QuestionKind, key: string = newQuestionKey()): DraftQuestion {
  return {
    key,
    questionId: null,
    kind,
    prompt: '',
    imagePath: null,
    imageUrl: null,
    options: isChoice(kind) ? blankOptions() : [],
    correct: [],
    accepted: kind === 'short' ? [''] : [],
    points: 1,
    partialCredit: false,
  }
}

/** A saved question, ready to edit. */
export function draftFromQuestion(q: Question): DraftQuestion {
  return {
    key: q.questionId,
    questionId: q.questionId,
    kind: q.kind,
    prompt: q.prompt,
    imagePath: q.imagePath ?? null,
    imageUrl: q.imageUrl ?? null,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    correct: [...q.correct],
    accepted: q.accepted.length > 0 ? [...q.accepted] : q.kind === 'short' ? [''] : [],
    points: q.points,
    partialCredit: q.partialCredit,
  }
}

// ---------------------------------------------------------------------------
// Checks (the server's validateQuestions)

export interface QuizIssues {
  /** About the quiz as a whole (no questions, too many). */
  quiz: string | null
  /** What each question still needs, by key; a ready question has no entry. */
  questions: Record<string, string[]>
}

export const hasIssues = (issues: QuizIssues): boolean => issues.quiz !== null || Object.keys(issues.questions).length > 0

const filledOptions = (q: Pick<DraftQuestion, 'options'>) => q.options.filter((o) => o.text.trim() !== '')
const filledAccepted = (q: Pick<DraftQuestion, 'accepted'>) => q.accepted.map((a) => a.trim()).filter((a) => a !== '')

/** What one question still needs before it can be saved; [] when it is ready. */
export function questionIssues(q: DraftQuestion): string[] {
  const out: string[] = []
  const prompt = q.prompt.trim()
  if (!prompt) out.push('Write the question.')
  else if (prompt.length > PROMPT_MAX) out.push('Keep the question to 1,000 characters.')

  if (q.points === null) out.push('Give it points, from 0 to 100.')
  else if (!Number.isFinite(q.points) || q.points < 0 || q.points > POINTS_MAX) out.push('Points must be from 0 to 100.')

  if (isChoice(q.kind)) {
    const filled = filledOptions(q)
    if (filled.length < MIN_OPTIONS) out.push('Give it at least 2 choices.')
    if (filled.length > MAX_OPTIONS) out.push('Give it at most 8 choices.')
    q.options.forEach((o, i) => {
      if (o.text.trim().length > OPTION_TEXT_MAX) out.push(`Keep choice ${letterAt(i)} to 300 characters.`)
    })
    q.options.forEach((o, i) => {
      if (q.correct.includes(o.id) && o.text.trim() === '') out.push(`Choice ${letterAt(i)} is marked right but has no words.`)
    })
    const right = filled.filter((o) => q.correct.includes(o.id)).length
    if (q.kind === 'one' && right === 0 && !out.some((m) => m.includes('marked right'))) out.push('Mark the right answer.')
    if (q.kind === 'one' && right > 1) out.push('Mark only one right answer.')
    if (q.kind === 'many' && right === 0 && !out.some((m) => m.includes('marked right'))) out.push('Mark at least one right answer.')
  } else if (q.kind === 'short') {
    const accepted = filledAccepted(q)
    if (accepted.length === 0) out.push('Type at least one accepted answer.')
    else if (accepted.length > MAX_ACCEPTED) out.push('Keep it to 10 accepted answers.')
    if (accepted.some((a) => a.length > ACCEPTED_MAX)) out.push('Keep each accepted answer to 300 characters.')
  }
  return out
}

/** Every question's problems (see QuizIssues); nothing when the whole quiz can be saved. */
export function validateQuestions(questions: DraftQuestion[]): QuizIssues {
  let quiz: string | null = null
  if (questions.length === 0) quiz = 'Add at least one question.'
  else if (questions.length > MAX_QUESTIONS) quiz = 'A quiz holds at most 50 questions.'
  const byKey: Record<string, string[]> = {}
  for (const q of questions) {
    const found = questionIssues(q)
    if (found.length > 0) byKey[q.key] = found
  }
  return { quiz, questions: byKey }
}

// ---------------------------------------------------------------------------
// Totals and the release rule

/** The quiz's points (an empty box counts 0). */
export const totalPoints = (questions: Pick<DraftQuestion, 'points'>[]): number =>
  round2(questions.reduce((sum, q) => sum + (q.points != null && Number.isFinite(q.points) ? q.points : 0), 0))

/** "Right after they submit" is only possible when no question is graded by hand. */
export const canReleaseOnSubmit = (questions: Pick<DraftQuestion, 'kind'>[]): boolean => questions.every((q) => q.kind !== 'long')

const listNumbers = (ns: number[]): string =>
  ns.length <= 1 ? String(ns[0] ?? '') : `${ns.slice(0, -1).join(', ')} and ${ns[ns.length - 1]}`

/** Under "After I review and publish": "Needed here: question 4 is graded by hand"; null with no written question. */
export function writtenHint(questions: Pick<DraftQuestion, 'kind'>[]): string | null {
  const ns = questions.flatMap((q, i) => (q.kind === 'long' ? [i + 1] : []))
  if (ns.length === 0) return null
  return ns.length === 1
    ? `Needed here: question ${ns[0]} is graded by hand`
    : `Needed here: questions ${listNumbers(ns)} are graded by hand`
}

const formatPoints = (n: number): string => String(round2(n))

/** "Grade 5 Science · 4 questions · 8 points" */
export function builderSubline(classLabel: string, questions: Pick<DraftQuestion, 'points'>[]): string {
  const n = questions.length
  const pts = totalPoints(questions)
  return `${classLabel} · ${n} ${n === 1 ? 'question' : 'questions'} · ${formatPoints(pts)} ${pts === 1 ? 'point' : 'points'}`
}

/** The word after the points box: "pt" for exactly 1, else "pts". */
export const pointsUnit = (points: number | null): string => (points === 1 ? 'pt' : 'pts')

/** What a points box holds: { value } (null when empty), or null for a keystroke to refuse. */
export function parsePointsText(text: string): { value: number | null } | null {
  if (text === '') return { value: null }
  if (!/^\d*\.?\d*$/.test(text) || text === '.') return null
  const n = Number(text)
  return Number.isFinite(n) ? { value: n } : null
}

/**
 * What a points box shows: what was typed while it still means the question's
 * points ("1." on the way to "1.5"), else the points themselves, e.g. after
 * "Go back to what's saved" put the saved points back.
 */
export function pointsTextFor(text: string, value: number | null): string {
  const parsed = parsePointsText(text)
  if (parsed && parsed.value === value) return text
  return value === null ? '' : formatPoints(value)
}

// ---------------------------------------------------------------------------
// Editing

/** Mark a choice right: one answer replaces the mark, several toggle it (kept in choice order). */
export function toggleCorrect(q: DraftQuestion, optionId: string): DraftQuestion {
  if (q.kind === 'one') return { ...q, correct: [optionId] }
  const next = q.correct.includes(optionId) ? q.correct.filter((c) => c !== optionId) : [...q.correct, optionId]
  return { ...q, correct: q.options.map((o) => o.id).filter((id) => next.includes(id)) }
}

/**
 * The letter for a new choice: the first one free in this question, avoiding
 * `reserved` (the ids the question had when it was saved: a student may have
 * picked one). If every free letter is reserved, one of them is reused.
 */
export function nextOptionId(options: QuizOption[], reserved: string[] = []): string | null {
  const used = new Set(options.map((o) => o.id))
  const free = OPTION_IDS.filter((id) => !used.has(id))
  if (free.length === 0) return null
  return free.find((id) => !reserved.includes(id)) ?? free[0]
}

/** Drop a choice and its right-answer mark. */
export const removeOption = (q: DraftQuestion, optionId: string): DraftQuestion => ({
  ...q,
  options: q.options.filter((o) => o.id !== optionId),
  correct: q.correct.filter((c) => c !== optionId),
})

/** A new type, keeping what still fits: one keeps a single right answer; partial points are for several only. */
export function changeKind(q: DraftQuestion, kind: QuestionKind): DraftQuestion {
  const next: DraftQuestion = { ...q, kind, partialCredit: kind === 'many' ? q.partialCredit : false }
  if (isChoice(kind) && q.options.length === 0) next.options = blankOptions()
  if (kind === 'one') next.correct = q.correct.slice(0, 1)
  if (kind === 'short' && q.accepted.length === 0) next.accepted = ['']
  return next
}

/** The list with one entry moved up (-1) or down (+1); unchanged at either end. */
export function moveInList<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const to = index + delta
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return list
  const out = [...list]
  ;[out[index], out[to]] = [out[to], out[index]]
  return out
}

// ---------------------------------------------------------------------------
// What a save sends

/** One question as the PUT takes it: only its kind's fields, trimmed, without empty choices or answers. */
export function toQuestionInput(q: DraftQuestion, questionId: string | null = q.questionId): QuestionInput {
  const input: QuestionInput = {
    ...(questionId ? { questionId } : {}),
    kind: q.kind,
    prompt: q.prompt.trim(),
    imagePath: q.imagePath,
    points: q.points ?? 0,
  }
  if (isChoice(q.kind)) {
    const options = filledOptions(q).map((o) => ({ id: o.id, text: o.text.trim() }))
    input.options = options
    input.correct = options.map((o) => o.id).filter((id) => q.correct.includes(id))
    input.partialCredit = q.kind === 'many' ? q.partialCredit : false
  } else if (q.kind === 'short') {
    input.accepted = filledAccepted(q)
  }
  return input
}

/** A saved question as the PUT takes it again (a question whose edit isn't ready yet). */
const savedAsInput = (q: Question): QuestionInput => toQuestionInput(draftFromQuestion(q), q.questionId)

export interface SavePlan {
  /** The PUT's list, in the page's order. */
  input: QuestionInput[]
  /** input[i] is the question with key keys[i] (to read the new ids from the answer). */
  keys: string[]
  /** Questions whose current edit is not sent (not ready yet). */
  waiting: string[]
}

/**
 * What an autosave sends (see the header). `ids` holds the ids earlier saves
 * gave new questions (a save in flight may have answered after this value was
 * scheduled); `saved` is the last saved version of each question.
 */
export function buildSave(
  current: DraftQuestion[],
  ctx: { ids: Map<string, string>; saved: Map<string, Question> },
): SavePlan {
  const plan: SavePlan = { input: [], keys: [], waiting: [] }
  for (const q of current) {
    const questionId = q.questionId ?? ctx.ids.get(q.key) ?? null
    if (questionIssues(q).length === 0) {
      plan.input.push(toQuestionInput(q, questionId))
      plan.keys.push(q.key)
      continue
    }
    plan.waiting.push(q.key)
    const last = questionId ? ctx.saved.get(questionId) : undefined
    if (last) {
      plan.input.push(savedAsInput(last))
      plan.keys.push(q.key)
    }
  }
  return plan
}

/** "Question 2 isn't saved yet. Finish it and it saves."; null when everything is sent. */
export function waitingLine(questions: Pick<DraftQuestion, 'key'>[], waiting: string[]): string | null {
  const ns = questions.flatMap((q, i) => (waiting.includes(q.key) ? [i + 1] : []))
  if (ns.length === 0) return null
  return ns.length === 1
    ? `Question ${ns[0]} isn't saved yet. Finish it and it saves.`
    : `Questions ${listNumbers(ns)} aren't saved yet. Finish them and they save.`
}

// ---------------------------------------------------------------------------
// Preview as a student

/** The questions as a student would get them (no key, no empty choices): the preview runs the player on these. */
export function previewQuestions(questions: DraftQuestion[]): StudentQuestion[] {
  return questions.map((q) => ({
    questionId: q.key,
    kind: q.kind,
    prompt: q.prompt.trim(),
    imageUrl: q.imageUrl,
    options: isChoice(q.kind) ? filledOptions(q).map((o) => ({ id: o.id, text: o.text.trim() })) : [],
    points: q.points ?? 0,
    hint: STUDENT_HINTS[q.kind] ?? null,
  }))
}

// ---------------------------------------------------------------------------
// The settings column

const when = (iso: string) => `${dayLabel(iso)} · ${timeText(iso)}`

/** The "When" card: "Posts Mon, Oct 19 · 7:30 am" (or posted, or not yet) and the due time. */
export function quizWhenLines(item: {
  status: ItemStatus
  effectiveStatus: ItemStatus
  publishAt: string | null
  postedAt: string | null
  dueAt: string | null
}): { postsLabel: string; posts: string; due: string } {
  let postsLabel = 'Posts'
  let posts = 'Not posted yet'
  if (item.effectiveStatus === 'posted') {
    postsLabel = 'Posted'
    const at = item.postedAt ?? item.publishAt
    posts = at ? when(at) : 'Posted'
  } else if (item.status === 'scheduled' && item.publishAt) posts = when(item.publishAt)
  return { postsLabel, posts, due: item.dueAt ? when(item.dueAt) : 'No due date' }
}

/** "Quizzes · out of 8"; "Counts on its own · out of 8"; "Not in Grades". The "out of" is the quiz's points. */
export function quizGradebookLine(gradebook: Pick<ItemGradebook, 'categoryId' | 'categoryName'> | null, total: number): string {
  if (!gradebook) return 'Not in Grades'
  const where = gradebook.categoryId ? (gradebook.categoryName ?? 'In Grades') : 'Counts on its own'
  return `${where} · out of ${formatPoints(total)}`
}

// ---------------------------------------------------------------------------
// A save the server refuses

export interface SaveProblem {
  message: string
  /** What fixes it: going back to the saved questions, or a grade in the grading view. */
  fix: 'saved' | 'grading' | null
}

const TAKEN_FALLBACK = 'Students have already taken this quiz. You can change wording, answers and points, but not remove questions.'
const ABOVE_FALLBACK = "Some grades on students' work are above the quiz's new total. Change them in the grading view first."

/**
 * The words above the questions for a refused save. 409 QUIZ_TAKEN (a removed
 * question, or a type change, once students have taken it) is undone by going
 * back to what's saved; 409 DRAFT_ABOVE_MAX (a grade above the new total) is
 * fixed in the grading view, or by keeping the points. Anything else is the
 * server's own message.
 */
export function builderSaveProblem(err: unknown): SaveProblem {
  const code = typeof err === 'object' && err !== null ? (err as { code?: unknown }).code : undefined
  const said = err instanceof Error && err.message.trim() ? err.message.trim() : ''
  if (code === 'QUIZ_TAKEN') return { message: `${said || TAKEN_FALLBACK} Go back to what's saved to undo that change.`, fix: 'saved' }
  if (code === 'DRAFT_ABOVE_MAX') return { message: `${said || ABOVE_FALLBACK} Or put the points back as they were.`, fix: 'grading' }
  return { message: said || "The questions didn't save.", fix: null }
}

// ---------------------------------------------------------------------------
// Work that can't be saved yet is never dropped

const EMPTY_QUIZ = 'A quiz needs at least one question, so the last saved one stays until you add another.'

/** What isn't saved yet, by question number (0: the quiz as a whole): for the Saved pill and the leave warning. */
export function unsavedQuestions(questions: DraftQuestion[], savedCount: number): { n: number; needs: string[] }[] {
  if (questions.length === 0) return savedCount > 0 ? [{ n: 0, needs: [EMPTY_QUIZ] }] : []
  return questions.flatMap((q, i) => {
    const needs = questionIssues(q)
    return needs.length > 0 ? [{ n: i + 1, needs }] : []
  })
}

/** The Saved pill while something can't be saved yet: "Question 3 not saved yet", "2 questions not saved yet". */
export function notSavedLabel(unsaved: { n: number }[]): string | null {
  if (unsaved.length === 0) return null
  if (unsaved[0].n === 0) return 'Not saved yet'
  return unsaved.length === 1 ? `Question ${unsaved[0].n} not saved yet` : `${unsaved.length} questions not saved yet`
}

// The builder's list, per quiz, for the rest of the session, while something in
// it can't be saved yet (an unfinished question, or every question deleted):
// leaving the builder and coming back brings it back as it was.
const keptLists = new Map<string, DraftQuestion[]>()

/** Keep the list while something in it isn't saved yet; forget it once everything is. */
export function keepUnfinished(itemId: string, questions: DraftQuestion[], opts: { savedCount?: number } = {}): void {
  if (unsavedQuestions(questions, opts.savedCount ?? 0).length > 0) keptLists.set(itemId, questions)
  else keptLists.delete(itemId)
}

/** The list kept for this quiz (see keepUnfinished), or null. */
export const keptUnfinished = (itemId: string): DraftQuestion[] | null => keptLists.get(itemId) ?? null

// ---------------------------------------------------------------------------
// A question's picture

export const QUIZ_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const QUIZ_IMAGE_LIMIT_BYTES = 3 * 1024 * 1024

/**
 * Why a question's picture can't go up, or null. Run on the picture AFTER it
 * was resized (src/lib/uploadPrep.ts, preset 'quizImage'): a phone photo is
 * shrunk well under 3 MB first, so only a picture the browser couldn't redraw
 * is ever refused for its size.
 */
export function quizImageProblem(file: Pick<File, 'type' | 'size'>): string | null {
  if (!QUIZ_IMAGE_TYPES.includes(file.type)) return 'Use a JPEG, PNG or WebP picture.'
  if (file.size > QUIZ_IMAGE_LIMIT_BYTES) return "This picture is still over 3 MB after resizing. Try a smaller one, or a screenshot of it."
  return null
}
