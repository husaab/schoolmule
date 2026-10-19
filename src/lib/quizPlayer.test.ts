import { describe, it, expect } from 'vitest'
import {
  answeredCount,
  answerText,
  confirmCounts,
  correctText,
  doneCopy,
  initPlayer,
  isAnswered,
  nextLabel,
  playerSubline,
  pointsWord,
  progressPct,
  questionLine,
  quizIntroState,
  quizReducer,
  quizSaveVerdict,
  resultRows,
  resultsScoreLine,
  toAnswerPayload,
  type PlayerState,
} from './quizPlayer'
import type { StudentQuestion, StudentQuiz } from '@/services/types/quiz'

const Q1 = '11111111-1111-4111-8111-111111111111'
const Q2 = '22222222-2222-4222-8222-222222222222'
const Q3 = '33333333-3333-4333-8333-333333333333'
const Q4 = '44444444-4444-4444-8444-444444444444'

const QUESTIONS: StudentQuestion[] = [
  {
    questionId: Q1,
    kind: 'one',
    prompt: 'Which part of a plant cell makes food using sunlight?',
    imageUrl: null,
    options: [
      { id: 'a', text: 'Nucleus' },
      { id: 'b', text: 'Chloroplast' },
      { id: 'c', text: 'Vacuole' },
    ],
    points: 2,
    hint: null,
  },
  {
    questionId: Q2,
    kind: 'many',
    prompt: "Which parts do plant cells have that animal cells don't?",
    imageUrl: null,
    options: [
      { id: 'a', text: 'Cell wall' },
      { id: 'b', text: 'Chloroplasts' },
      { id: 'c', text: 'Nucleus' },
    ],
    points: 2,
    hint: 'Pick all that apply.',
  },
  { questionId: Q3, kind: 'short', prompt: 'What fills a cell?', imageUrl: null, options: [], points: 1, hint: null },
  { questionId: Q4, kind: 'long', prompt: 'Why do plant cells need a cell wall?', imageUrl: null, options: [], points: 3, hint: 'Your teacher grades this one.' },
]

const start = (): PlayerState => initPlayer(QUESTIONS)

describe('answers', () => {
  it('one answer replaces the pick', () => {
    let s = quizReducer(start(), { type: 'pick', questionId: Q1, optionId: 'a' })
    s = quizReducer(s, { type: 'pick', questionId: Q1, optionId: 'b' })
    expect(s.answers[Q1]).toEqual({ choice: 'b' })
  })

  it('several answers toggle, kept in choice order', () => {
    let s = quizReducer(start(), { type: 'pick', questionId: Q2, optionId: 'c' })
    s = quizReducer(s, { type: 'pick', questionId: Q2, optionId: 'a' })
    expect(s.answers[Q2]).toEqual({ choices: ['a', 'c'] })
    s = quizReducer(s, { type: 'pick', questionId: Q2, optionId: 'c' })
    expect(s.answers[Q2]).toEqual({ choices: ['a'] })
  })

  it('ignores a pick on a question that takes text, or a choice that is not there', () => {
    const s = start()
    expect(quizReducer(s, { type: 'pick', questionId: Q3, optionId: 'a' })).toBe(s)
    expect(quizReducer(s, { type: 'pick', questionId: Q1, optionId: 'z' })).toBe(s)
  })

  it('keeps typed text as typed', () => {
    const s = quizReducer(start(), { type: 'text', questionId: Q4, value: 'It keeps the cell firm. ' })
    expect(s.answers[Q4]).toEqual({ text: 'It keeps the cell firm. ' })
  })

  it('counts what is answered; blank text and no picks do not count', () => {
    expect(isAnswered({ kind: 'one' }, { choice: 'b' })).toBe(true)
    expect(isAnswered({ kind: 'one' }, { choice: null })).toBe(false)
    expect(isAnswered({ kind: 'many' }, { choices: [] })).toBe(false)
    expect(isAnswered({ kind: 'many' }, { choices: ['a'] })).toBe(true)
    expect(isAnswered({ kind: 'short' }, { text: '   ' })).toBe(false)
    expect(isAnswered({ kind: 'long' }, { text: 'Firm.' })).toBe(true)
    expect(isAnswered({ kind: 'short' }, null)).toBe(false)
    expect(isAnswered({ kind: 'short' }, undefined)).toBe(false)
    const answers = { [Q1]: { choice: 'b' }, [Q2]: { choices: [] }, [Q3]: { text: ' ' }, [Q4]: { text: 'Firm.' } }
    expect(answeredCount(QUESTIONS, answers)).toBe(2)
  })

  it('sends each changed answer, a cleared one as null', () => {
    expect(
      toAnswerPayload({ [Q1]: { choice: 'b' }, [Q2]: { choices: [] }, [Q3]: { text: '  ' }, [Q4]: { text: 'Firm.' } }),
    ).toEqual([
      { questionId: Q1, answer: { choice: 'b' } },
      { questionId: Q2, answer: null },
      { questionId: Q3, answer: null },
      { questionId: Q4, answer: { text: 'Firm.' } },
    ])
    expect(toAnswerPayload({ [Q1]: null, [Q2]: { choice: null } })).toEqual([
      { questionId: Q1, answer: null },
      { questionId: Q2, answer: null },
    ])
  })
})

describe('moving through the quiz', () => {
  it('starts on the first question with the saved answers', () => {
    const s = initPlayer(QUESTIONS, { [Q1]: { choice: 'a' } })
    expect(s).toMatchObject({ index: 0, stage: 'question' })
    expect(s.answers[Q1]).toEqual({ choice: 'a' })
  })

  it('goes forward and back within bounds', () => {
    let s = quizReducer(start(), { type: 'back' })
    expect(s.index).toBe(0)
    s = quizReducer(s, { type: 'next' })
    s = quizReducer(s, { type: 'next' })
    expect(s.index).toBe(2)
    s = quizReducer(s, { type: 'back' })
    expect(s.index).toBe(1)
  })

  it('goes from the last question to the review, and back to the last question', () => {
    let s = quizReducer(start(), { type: 'go', index: 3 })
    expect(nextLabel(s)).toBe('Review & turn in')
    s = quizReducer(s, { type: 'next' })
    expect(s.stage).toBe('review')
    expect(s.index).toBe(3)
    s = quizReducer(s, { type: 'back' })
    expect(s).toMatchObject({ stage: 'question', index: 3 })
  })

  it('jumps to a question from the dots (and from the review), clamped', () => {
    let s = quizReducer(start(), { type: 'review' })
    s = quizReducer(s, { type: 'go', index: 1 })
    expect(s).toMatchObject({ stage: 'question', index: 1 })
    expect(quizReducer(s, { type: 'go', index: 9 }).index).toBe(3)
    expect(quizReducer(s, { type: 'go', index: -2 }).index).toBe(0)
  })

  it('stays done once turned in', () => {
    let s = quizReducer(start(), { type: 'submitted' })
    expect(s.stage).toBe('done')
    s = quizReducer(s, { type: 'back' })
    expect(s.stage).toBe('done')
    expect(quizReducer(s, { type: 'text', questionId: Q4, value: 'late' }).answers[Q4]).toBeUndefined()
  })

  it('fills the progress bar question by question, full on the review', () => {
    expect(progressPct(start())).toBe(25)
    expect(progressPct(quizReducer(start(), { type: 'go', index: 1 }))).toBe(50)
    expect(progressPct(quizReducer(start(), { type: 'review' }))).toBe(100)
    expect(progressPct(initPlayer([]))).toBe(0)
    expect(nextLabel(start())).toBe('Next')
  })
})

describe('the words', () => {
  it('writes points, the header and the question line', () => {
    expect(pointsWord(1)).toBe('1 point')
    expect(pointsWord(2)).toBe('2 points')
    expect(pointsWord(0.5)).toBe('0.5 points')
    expect(playerSubline('Science', 8)).toBe('Science · 8 points · one try')
    expect(questionLine(0, 4, 2)).toBe('Question 1 of 4 · 2 points')
    expect(questionLine(2, 4, 1)).toBe('Question 3 of 4 · 1 point')
  })

  it('counts the answers on the confirm screen', () => {
    expect(confirmCounts(3, 4)).toBe('3 of 4 questions')
    expect(confirmCounts(1, 1)).toBe('1 of 1 question')
  })

  it('thanks the student and says who grades it first: a quiz the teacher publishes never shows a score', () => {
    expect(doneCopy({ first: 'Amal', teacher: 'Lina Farouk', writtenCount: 1, release: 'after_review' })).toEqual({
      title: 'Turned in. Nice work, Amal!',
      body: "Lina Farouk reads the written answer first. You'll see your score and feedback once it's graded.",
      score: null,
    })
    expect(doneCopy({ first: '', teacher: null, writtenCount: 2, release: 'after_review' })).toEqual({
      title: 'Turned in. Nice work!',
      body: "Your teacher reads the written answers first. You'll see your score and feedback once it's graded.",
      score: null,
    })
    expect(doneCopy({ first: 'Amal', teacher: 'Lina Farouk', writtenCount: 0, release: 'after_review' }).body).toBe(
      "Lina Farouk looks it over first. You'll see your score and feedback once it's graded.",
    )
    // Even if a reply carried results, a hand-published quiz says "Turned in" only.
    expect(
      doneCopy({ first: 'Amal', teacher: null, writtenCount: 0, release: 'after_review', results: { earned: 4, possible: 5, score: 4 } }).score,
    ).toBeNull()
  })

  it('shows the score at once for a quiz released right after submit', () => {
    expect(doneCopy({ first: 'Amal', teacher: 'Lina Farouk', writtenCount: 0, release: 'on_submit', results: { earned: 4, possible: 5, score: 4 } })).toEqual({
      title: 'Turned in. Nice work, Amal!',
      body: 'Here is your score. Your answers are below.',
      score: '4 / 5',
    })
    // The score that counts (a typed score wins over the quiz points).
    expect(doneCopy({ first: 'Amal', teacher: null, writtenCount: 0, release: 'on_submit', results: { earned: 4, possible: 5, score: 4.5 } }).score).toBe(
      '4.5 / 5',
    )
    // Released on submit, but the submit came back without results (the column needed a Publish in Grades first).
    expect(doneCopy({ first: 'Amal', teacher: null, writtenCount: 0, release: 'on_submit', results: null })).toEqual({
      title: 'Turned in. Nice work, Amal!',
      body: "Your score shows on the quiz's page as soon as it's ready.",
      score: null,
    })
  })

  it('says when the teacher set the score by hand', () => {
    const results = { earned: 5, possible: 8, score: 6, scoreSetByTeacher: true, perQuestion: [] }
    expect(resultsScoreLine(results, 'Lina Farouk')).toBe("Lina Farouk set your score: 6 / 8. The points below are the quiz's own.")
    expect(resultsScoreLine({ ...results, scoreSetByTeacher: false }, 'Lina Farouk')).toBeNull()
  })
})

describe('a save the server refuses', () => {
  it('settles a quiz that was turned in elsewhere or has closed', () => {
    expect(quizSaveVerdict({ code: 'ALREADY_SUBMITTED', message: "You've already turned in this quiz." })).toEqual({
      message: "You've already turned in this quiz. Your last answers were not saved.",
    })
    expect(quizSaveVerdict({ code: 'ITEM_CLOSED', message: 'This quiz is closed. Ask your teacher.' })).toEqual({
      message: 'This quiz is closed. Ask your teacher. Your last answers were not saved.',
    })
    expect(quizSaveVerdict({ code: 'ITEM_CLOSED' })?.message).toBe('This quiz is closed. Ask your teacher. Your last answers were not saved.')
  })

  it('keeps any other failure as one to retry', () => {
    expect(quizSaveVerdict({ status: 500, message: 'Error saving your answers' })).toBeNull()
    expect(quizSaveVerdict(new TypeError('Failed to fetch'))).toBeNull()
    expect(quizSaveVerdict(null)).toBeNull()
  })
})

describe('the quiz on the item page', () => {
  const quiz = (patch: Partial<StudentQuiz> = {}): StudentQuiz => ({
    quiz: {
      itemId: 'i',
      title: 'Cells quiz',
      subject: 'Science',
      teacher: null,
      totalPoints: 8,
      questionCount: 4,
      dueAt: null,
      release: 'after_review',
      attemptsAllowed: 1,
    },
    attempt: null,
    questions: QUESTIONS,
    results: null,
    ...patch,
  })
  const open = { status: 'assigned' as const, canEdit: true }
  const attempt = (submittedAt: string | null) => ({ attemptId: 'a', startedAt: '2026-10-15T14:00:00Z', submittedAt, answers: {} })

  it('starts, continues, waits, then shows the results', () => {
    expect(quizIntroState(open, quiz())).toBe('start')
    expect(quizIntroState(open, quiz({ attempt: attempt(null) }))).toBe('continue')
    expect(quizIntroState({ status: 'turned_in', canEdit: false }, quiz({ attempt: attempt('2026-10-15T15:00:00Z') }))).toBe('waiting')
    expect(
      quizIntroState(
        { status: 'graded', canEdit: false },
        quiz({ attempt: attempt('2026-10-15T15:00:00Z'), results: { earned: 6, possible: 8, score: 6, scoreSetByTeacher: false, perQuestion: [] } }),
      ),
    ).toBe('results')
  })

  it('cannot be taken once closed, excused, graded by hand, or while it has no questions', () => {
    expect(quizIntroState({ status: 'missing', canEdit: false }, quiz())).toBe('closed')
    expect(quizIntroState({ status: 'excused', canEdit: false }, quiz())).toBe('excused')
    expect(quizIntroState({ status: 'graded', canEdit: false }, quiz())).toBe('graded')
    expect(quizIntroState(open, quiz({ questions: [], quiz: { ...quiz().quiz, questionCount: 0 } }))).toBe('empty')
    // Missing but still taking late work: it can be started.
    expect(quizIntroState({ status: 'missing', canEdit: true }, quiz())).toBe('start')
  })
})

describe('the results', () => {
  it('lists each question with the answer, the points and, when shown, the right answer', () => {
    const quiz: StudentQuiz = {
      quiz: {
        itemId: 'i',
        title: 'Cells quiz',
        subject: 'Science',
        teacher: null,
        totalPoints: 8,
        questionCount: 4,
        dueAt: null,
        release: 'after_review',
        attemptsAllowed: 1,
      },
      attempt: {
        attemptId: 'a',
        startedAt: '2026-10-15T14:00:00Z',
        submittedAt: '2026-10-15T15:00:00Z',
        answers: { [Q1]: { choice: 'a' }, [Q2]: { choices: ['a', 'b'] }, [Q3]: { text: 'Cytoplasm' } },
      },
      questions: QUESTIONS,
      results: {
        earned: 5,
        possible: 8,
        score: 5,
        scoreSetByTeacher: false,
        perQuestion: [
          { questionId: Q1, points: 0, note: null, correct: ['b'] },
          { questionId: Q2, points: 2, note: null, correct: ['a', 'b'] },
          { questionId: Q3, points: 1, note: null, correct: ['cytoplasm'] },
          { questionId: Q4, points: 2, note: 'Good start: say why it needs to be firm.' },
        ],
      },
    }
    const rows = resultRows(quiz)
    expect(rows.map((r) => [r.n, r.answer, r.points, r.possible, r.tone])).toEqual([
      [1, 'Nucleus', 0, 2, 'none'],
      [2, 'Cell wall, Chloroplasts', 2, 2, 'full'],
      [3, 'Cytoplasm', 1, 1, 'full'],
      [4, null, 2, 3, 'part'],
    ])
    expect(rows[0].right).toBe('Chloroplast')
    expect(rows[2].right).toBe('cytoplasm')
    expect(rows[3].right).toBeNull()
    expect(rows[3].note).toBe('Good start: say why it needs to be firm.')
  })

  it('reads an answer and a right answer as words', () => {
    expect(answerText(QUESTIONS[0], { choice: 'c' })).toBe('Vacuole')
    expect(answerText(QUESTIONS[1], { choices: [] })).toBeNull()
    expect(answerText(QUESTIONS[2], { text: '  ' })).toBeNull()
    expect(answerText(QUESTIONS[3], undefined)).toBeNull()
    expect(correctText(QUESTIONS[2], ['cytoplasm', 'the cytoplasm'])).toBe('cytoplasm, the cytoplasm')
    expect(correctText(QUESTIONS[0], undefined)).toBeNull()
  })
})
