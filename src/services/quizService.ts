// src/services/quizService.ts
// Quizzes (Task 23). The teacher's routes (/api/classroom, staff, the
// caller's own classes): the questions with their answer key, question
// images, and the points on one student's answer. The student's routes
// (/api/student): the quiz without the key, the one attempt, autosaved
// answers and the submit. The server keys every student call on the signed-in
// student, never on an id sent from here.

import apiClient from './apiClient'
import apiUpload from './apiUpload'
import type {
  QuestionImageUpload,
  QuestionInput,
  QuizBuilderData,
  QuizEnvelope,
  QuizOverrideInput,
  QuizOverrideResult,
  QuizScoreResult,
  StudentAnswerInput,
  StudentQuiz,
} from './types/quiz'

const itemPath = (itemId: string) => `/classroom/items/${encodeURIComponent(itemId)}`
const studentItemPath = (itemId: string) => `/student/items/${encodeURIComponent(itemId)}`

// ── The teacher ─────────────────────────────────────────────────────────────

/** GET the questions (with the key), the quiz's settings and whether anyone has turned it in. */
export const getQuestions = (itemId: string) => apiClient<QuizEnvelope<QuizBuilderData>>(`${itemPath(itemId)}/questions`)

/**
 * PUT every question, in order: upserts by questionId and deletes the rest
 * (409 once a student has turned it in). Answers like GET. `keepalive` lets
 * the save outlive the page (an autosave sent from pagehide).
 */
export const saveQuestions = (itemId: string, questions: QuestionInput[], opts: { keepalive?: boolean } = {}) =>
  apiClient<QuizEnvelope<QuizBuilderData>, { questions: QuestionInput[] }>(`${itemPath(itemId)}/questions`, {
    method: 'PUT',
    body: { questions },
    keepalive: opts.keepalive,
  })

/** POST an image for a question (JPEG, PNG or WebP up to 3 MB); a question points at it on the next PUT. */
export const uploadQuestionImage = (itemId: string, file: File) => {
  const form = new FormData()
  form.append('image', file, file.name)
  return apiUpload<QuizEnvelope<QuestionImageUpload>>(`${itemPath(itemId)}/question-images`, form)
}

/** PATCH the teacher's points on one answer (null: the machine's points again) and the note. */
export const overrideQuizAnswer = (answerId: string, body: QuizOverrideInput, opts: { keepalive?: boolean } = {}) =>
  apiClient<QuizEnvelope<QuizOverrideResult>, QuizOverrideInput>(`/classroom/quiz-answers/${encodeURIComponent(answerId)}`, {
    method: 'PATCH',
    body,
    keepalive: opts.keepalive,
  })

/**
 * POST quiz-score: back to the quiz's own score after the teacher typed one (live on a published column, else a
 * draft). 409 while the quiz isn't turned in or a written answer is ungraded; 400 for a quiz with no column.
 */
export const restoreQuizScore = (itemId: string, studentId: string) =>
  apiClient<QuizEnvelope<QuizScoreResult>>(`${itemPath(itemId)}/submissions/${encodeURIComponent(studentId)}/quiz-score`, {
    method: 'POST',
  })

// ── The student ─────────────────────────────────────────────────────────────

/** GET the quiz: questions in the attempt's order, never the key; the results once the grade is out. */
export const getStudentQuiz = (itemId: string) => apiClient<QuizEnvelope<StudentQuiz>>(`${studentItemPath(itemId)}/quiz`)

/** POST start: the one attempt, created once (idempotent; the shuffled order is kept). */
export const startStudentQuiz = (itemId: string) =>
  apiClient<QuizEnvelope<StudentQuiz>>(`${studentItemPath(itemId)}/quiz/start`, { method: 'POST' })

/** PUT answers (autosave): 409 ALREADY_SUBMITTED once turned in, 409 ITEM_CLOSED once closed. */
export const saveStudentQuizAnswers = (itemId: string, answers: StudentAnswerInput[], opts: { keepalive?: boolean } = {}) =>
  apiClient<QuizEnvelope<{ savedAt: string }>, { answers: StudentAnswerInput[] }>(`${studentItemPath(itemId)}/quiz-answers`, {
    method: 'PUT',
    body: { answers },
    keepalive: opts.keepalive,
  })

/** POST submit: turns the attempt in (one try). Answers with the quiz as it now stands. */
export const submitStudentQuiz = (itemId: string) =>
  apiClient<QuizEnvelope<StudentQuiz>>(`${studentItemPath(itemId)}/quiz-submit`, { method: 'POST' })
