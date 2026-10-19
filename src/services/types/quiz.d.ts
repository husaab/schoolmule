// services/types/quiz.d.ts
// Quizzes (Task 23): the teacher's builder (questions, choices, the answer
// key, points), the student's one attempt (autosaved answers, a confirmed
// submit, the results once graded) and the teacher's per-answer override.
// The shapes are the backend's verbatim (T23 brief and report).
//
// The answer key (`correct`, `accepted`) is in the teacher's shapes only. A
// student's quiz never carries it; `results` (and the key inside them, when
// the teacher shows right answers) only arrive once the grade is visible.

import type { GradingRow } from './grading'
import type { PersonLite } from './profile'

/** One answer · Several answers · Short text · Written answer. */
export type QuestionKind = 'one' | 'many' | 'short' | 'long'

/** When students see their scores: after the teacher publishes (default), or as they submit. */
export type QuizRelease = 'after_review' | 'on_submit'

/** A choice of a one/many question. `id` is a letter a–h, stable for the question's life. */
export interface QuizOption {
  id: string
  text: string
}

/** PUT /items/:itemId/questions: one question as sent. No `questionId`: a new question. */
export interface QuestionInput {
  questionId?: string
  kind: QuestionKind
  prompt: string
  imagePath?: string | null
  options?: QuizOption[]
  /** The right choices' ids (one: exactly one; many: at least one). */
  correct?: string[]
  /** Short text: the answers marked right (capitals and spaces don't matter). */
  accepted?: string[]
  points: number
  /** Several answers only. */
  partialCredit?: boolean
}

/** A question as the teacher's builder reads it (the key included). */
export interface Question {
  questionId: string
  kind: QuestionKind
  prompt: string
  imagePath: string | null
  /** A signed link (1 h) to the question's image. */
  imageUrl: string | null
  options: QuizOption[]
  correct: string[]
  accepted: string[]
  points: number
  partialCredit: boolean
  sortOrder: number
}

export interface QuizSettings {
  release: QuizRelease
  shuffle: boolean
  showAnswers: boolean
}

/** GET / PUT /items/:itemId/questions */
export interface QuizBuilderData {
  questions: Question[]
  settings: QuizSettings
  /** A student has turned it in: questions can change but not be removed, nor change type. */
  hasSubmissions: boolean
  totalPoints: number
}

/** POST /items/:itemId/question-images (multipart "image": JPEG, PNG or WebP up to 3 MB). */
export interface QuestionImageUpload {
  imagePath: string
  url: string | null
}

/** A stored answer: one {choice} · many {choices} · short/long {text}. */
export type QuizAnswerValue = { choice: string | null } | { choices: string[] } | { text: string }

/** One answer as the teacher grades it (the grading detail and the override reply). */
export interface TeacherQuizAnswer {
  /** Null for a question the student never reached before they started (no row yet). */
  answerId: string | null
  questionId: string
  kind: QuestionKind
  prompt: string
  points: number
  answer: QuizAnswerValue | null
  /** The machine's points; null for a written answer. */
  autoPoints: number | null
  /** The teacher's override; null = the machine's points stand. */
  teacherPoints: number | null
  teacherNote: string | null
  correct: string[]
  accepted: string[]
}

export interface QuizTotals {
  earned: number
  possible: number
  /** A written answer has no points yet. */
  needsReview: boolean
}

/** The grading detail's quiz block (null until the student starts). Answers are in the attempt's order. */
export interface SubmissionQuiz extends QuizTotals {
  attemptId: string
  submittedAt: string | null
  answers: TeacherQuizAnswer[]
  /**
   * The student's score in the column was typed by the teacher (the score box or the grid) and wins over the
   * quiz's points (T23 fix round 1, e66c306). POST …/submissions/:studentId/quiz-score goes back to the quiz's.
   */
  scoreSetByTeacher: boolean
}

/** POST /items/:itemId/submissions/:studentId/quiz-score: back to the quiz's own score. */
export interface QuizScoreResult {
  row: GradingRow
  quiz: SubmissionQuiz | null
}

/** PATCH /quiz-answers/:answerId */
export interface QuizOverrideInput {
  teacherPoints: number | null
  teacherNote?: string | null
}

export interface QuizOverrideResult {
  answer: TeacherQuizAnswer
  totals: QuizTotals
  /** A typed score holds the student's grade, so the new total did not replace it. */
  scoreSetByTeacher: boolean
}

/** A question as the student sees it: never the key. */
export interface StudentQuestion {
  questionId: string
  kind: QuestionKind
  prompt: string
  imageUrl: string | null
  options: QuizOption[]
  points: number
  /** many: "Pick all that apply." · long: "Your teacher grades this one." */
  hint: string | null
}

export interface StudentQuizResult {
  questionId: string
  /** The points this answer earned; null while a written answer has none. */
  points: number | null
  /** The teacher's note on this answer (T23 deviation 7). */
  note?: string | null
  /** Only when the teacher shows right answers: the right option ids, or the accepted short answers. */
  correct?: string[]
}

/** GET /student/items/:itemId/quiz, POST …/quiz/start, POST …/quiz-submit */
export interface StudentQuiz {
  quiz: {
    itemId: string
    title: string
    subject: string
    teacher: PersonLite | null
    totalPoints: number
    questionCount: number
    dueAt: string | null
    release: QuizRelease
    attemptsAllowed: 1
  }
  attempt: null | {
    attemptId: string
    startedAt: string
    submittedAt: string | null
    /** The saved answers by question id (unanswered questions are left out). */
    answers: Record<string, QuizAnswerValue>
  }
  /** In the attempt's order (shuffled when the teacher shuffles). */
  questions: StudentQuestion[]
  /**
   * Only once a Publish for this student came after the submission (T23 fix round 1): a quiz released "right
   * after they submit" is published by the submit itself; otherwise the teacher publishes it.
   */
  results: null | {
    earned: number
    possible: number
    /** The score that counts: the gradebook's (a typed score wins), or the quiz total with no column. */
    score: number | null
    /** The teacher typed the score, so it can differ from the points below. */
    scoreSetByTeacher: boolean
    perQuestion: StudentQuizResult[]
  }
}

/** PUT /student/items/:itemId/quiz-answers */
export interface StudentAnswerInput {
  questionId: string
  /** null clears the saved answer. */
  answer: QuizAnswerValue | null
}

export interface QuizEnvelope<T> {
  status: 'success'
  data: T
}
