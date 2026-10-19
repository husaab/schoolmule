import { describe, it, expect } from 'vitest'
import { choiceMarks, hasOverride, keyText, overrideHint, parseOverride, quizScoreSource, reviewAnswerText, reviewTotals, totalsLine } from './quizReview'
import type { Question, TeacherQuizAnswer } from '@/services/types/quiz'

const question = (patch: Partial<Question> = {}): Question => ({
  questionId: 'q1',
  kind: 'one',
  prompt: 'Which part makes food?',
  imagePath: null,
  imageUrl: null,
  options: [
    { id: 'a', text: 'Nucleus' },
    { id: 'b', text: 'Chloroplast' },
    { id: 'c', text: 'Vacuole' },
  ],
  correct: ['b'],
  accepted: [],
  points: 2,
  partialCredit: false,
  sortOrder: 0,
  ...patch,
})

const answer = (patch: Partial<TeacherQuizAnswer> = {}): TeacherQuizAnswer => ({
  answerId: 'a1',
  questionId: 'q1',
  kind: 'one',
  prompt: 'Which part makes food?',
  points: 2,
  answer: { choice: 'a' },
  autoPoints: 0,
  teacherPoints: null,
  teacherNote: null,
  correct: ['b'],
  accepted: [],
  ...patch,
})

describe('reviewTotals', () => {
  it('adds the machine points, an override winning over them', () => {
    const answers = [answer(), answer({ answerId: 'a2', questionId: 'q2', autoPoints: 2, points: 2 })]
    expect(reviewTotals(answers, {})).toEqual({ earned: 2, possible: 4, needsReview: false })
    expect(reviewTotals([answer({ teacherPoints: 1.5 }), answers[1]], {})).toEqual({ earned: 3.5, possible: 4, needsReview: false })
  })

  it('uses what is typed but not saved yet, and an empty box goes back to the machine points', () => {
    const answers = [answer({ autoPoints: 2, teacherPoints: 0 })]
    expect(reviewTotals(answers, { a1: 1 }).earned).toBe(1)
    expect(reviewTotals(answers, { a1: null }).earned).toBe(2)
  })

  it('needs review while a written answer has no points', () => {
    const written = answer({ answerId: 'a3', questionId: 'q3', kind: 'long', autoPoints: null, points: 3, answer: { text: 'Firm.' } })
    expect(reviewTotals([answer(), written], {})).toEqual({ earned: 0, possible: 5, needsReview: true })
    expect(reviewTotals([answer(), written], { a3: 2 })).toEqual({ earned: 2, possible: 5, needsReview: false })
  })

  it('counts a question with no answer row: 0, or to review when it is written', () => {
    expect(reviewTotals([answer({ answerId: null, autoPoints: null })], {})).toEqual({ earned: 0, possible: 2, needsReview: false })
    expect(reviewTotals([answer({ answerId: null, kind: 'long', autoPoints: null })], {}).needsReview).toBe(true)
  })

  it('writes the totals line', () => {
    expect(totalsLine({ earned: 6.5, possible: 8, needsReview: false })).toBe('6.5 / 8')
  })
})

describe('parseOverride', () => {
  it('reads points from 0 to the question points; empty goes back to the machine', () => {
    expect(parseOverride('', 2)).toEqual({ value: null })
    expect(parseOverride(' 1.5 ', 2)).toEqual({ value: 1.5 })
    expect(parseOverride('0', 2)).toEqual({ value: 0 })
    expect(parseOverride('1.234', 2)).toEqual({ value: 1.23 })
  })

  it('refuses what is not a number or is out of range', () => {
    expect(parseOverride('abc', 2)).toEqual({ error: 'Type a number' })
    expect(parseOverride('3', 2)).toEqual({ error: 'From 0 to 2' })
    expect(parseOverride('-1', 2)).toEqual({ error: 'From 0 to 2' })
  })

  it('says what an empty box means', () => {
    expect(overrideHint(answer({ autoPoints: 2 }))).toBe('Empty: the automatic 2 points stand.')
    expect(overrideHint(answer({ autoPoints: 1 }))).toBe('Empty: the automatic 1 point stands.')
    expect(overrideHint(answer({ kind: 'long', autoPoints: null }))).toBe('Give it points to finish grading.')
    expect(overrideHint(answer({ kind: 'long', autoPoints: null }), true)).toBe('Graded by you.')
  })
})

describe('the answer and the key in words', () => {
  it('reads a pick, several picks and typed words', () => {
    expect(reviewAnswerText(answer(), question())).toBe('Nucleus')
    expect(reviewAnswerText(answer({ kind: 'many', answer: { choices: ['a', 'c'] } }), question({ kind: 'many' }))).toBe('Nucleus, Vacuole')
    expect(reviewAnswerText(answer({ kind: 'short', answer: { text: ' cytoplasm ' } }), undefined)).toBe('cytoplasm')
    expect(reviewAnswerText(answer({ answer: null }), question())).toBeNull()
  })

  it('falls back to the letter when the question is not loaded', () => {
    expect(reviewAnswerText(answer(), undefined)).toBe('Choice A')
  })

  it('shows the key: the right choices, or the accepted answers', () => {
    expect(keyText(answer(), question())).toBe('Chloroplast')
    expect(keyText(answer({ kind: 'short', correct: [], accepted: ['cytoplasm', 'the cytoplasm'] }), undefined)).toBe(
      'cytoplasm, the cytoplasm',
    )
    expect(keyText(answer({ kind: 'long', correct: [] }), undefined)).toBeNull()
  })

  it('marks each choice as picked and as right', () => {
    expect(choiceMarks(answer({ kind: 'many', answer: { choices: ['a', 'b'] }, correct: ['b', 'c'] }), question({ kind: 'many' }))).toEqual([
      { id: 'a', letter: 'A', text: 'Nucleus', picked: true, right: false },
      { id: 'b', letter: 'B', text: 'Chloroplast', picked: true, right: true },
      { id: 'c', letter: 'C', text: 'Vacuole', picked: false, right: true },
    ])
    expect(choiceMarks(answer(), undefined)).toEqual([])
  })
})

describe('where the score comes from', () => {
  it("follows the server's flag: the grading row's first, else the quiz detail's", () => {
    expect(quizScoreSource({ row: true }, { score: 6, status: 'graded' })).toBe('teacher')
    expect(quizScoreSource({ row: false, quiz: { scoreSetByTeacher: true } }, { score: 6, status: 'graded' })).toBe('auto')
    expect(quizScoreSource({ quiz: { scoreSetByTeacher: true } }, { score: 6, status: 'graded' })).toBe('teacher')
    expect(quizScoreSource({ quiz: null }, { score: 6, status: 'graded' })).toBe('auto')
  })

  it('is nothing without a score, or for Missing and Excused', () => {
    expect(quizScoreSource({ row: true }, { score: null, status: null })).toBe('none')
    expect(quizScoreSource({ row: true }, { score: null, status: 'missing' })).toBe('none')
    expect(quizScoreSource({ row: true }, { score: 3, status: 'excused' })).toBe('none')
  })

  it('tells an answer the teacher changed from the machine points', () => {
    expect(hasOverride({ teacherPoints: 1 }, undefined)).toBe(true)
    expect(hasOverride({ teacherPoints: null }, undefined)).toBe(false)
    expect(hasOverride({ teacherPoints: 1 }, null)).toBe(false)
    expect(hasOverride({ teacherPoints: null }, 0)).toBe(true)
  })
})
