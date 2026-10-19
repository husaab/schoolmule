import { describe, it, expect } from 'vitest'
import {
  buildSave,
  builderSaveProblem,
  builderSubline,
  canReleaseOnSubmit,
  changeKind,
  draftFromQuestion,
  hasIssues,
  moveInList,
  newQuestion,
  nextOptionId,
  parsePointsText,
  pointsUnit,
  previewQuestions,
  quizGradebookLine,
  quizWhenLines,
  removeOption,
  toggleCorrect,
  toQuestionInput,
  totalPoints,
  validateQuestions,
  waitingLine,
  writtenHint,
  type DraftQuestion,
} from './quizBuilder'
import type { Question } from '@/services/types/quiz'

const ID1 = '11111111-1111-4111-8111-111111111111'
const ID2 = '22222222-2222-4222-8222-222222222222'

/** A finished one-answer question. */
const one = (patch: Partial<DraftQuestion> = {}): DraftQuestion => ({
  ...newQuestion('one', 'k1'),
  prompt: 'Which part of a plant cell makes food using sunlight?',
  options: [
    { id: 'a', text: 'Nucleus' },
    { id: 'b', text: 'Chloroplast' },
    { id: 'c', text: 'Vacuole' },
    { id: 'd', text: 'Cell wall' },
  ],
  correct: ['b'],
  points: 2,
  ...patch,
})

const saved = (patch: Partial<Question> = {}): Question => ({
  questionId: ID1,
  kind: 'one',
  prompt: 'Which part of a plant cell makes food using sunlight?',
  imagePath: null,
  imageUrl: null,
  options: [
    { id: 'a', text: 'Nucleus' },
    { id: 'b', text: 'Chloroplast' },
  ],
  correct: ['b'],
  accepted: [],
  points: 2,
  partialCredit: false,
  sortOrder: 0,
  ...patch,
})

describe('newQuestion', () => {
  it('starts a choice question with four empty choices a to d and 1 point', () => {
    for (const kind of ['one', 'many'] as const) {
      const q = newQuestion(kind, 'k')
      expect(q).toMatchObject({ key: 'k', questionId: null, kind, prompt: '', correct: [], accepted: [], points: 1, partialCredit: false })
      expect(q.options).toEqual([
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' },
      ])
    }
  })

  it('starts a short-text question with one empty accepted answer', () => {
    const q = newQuestion('short', 'k')
    expect(q.options).toEqual([])
    expect(q.accepted).toEqual([''])
    expect(q.points).toBe(1)
  })

  it('starts a written question with nothing but its prompt and points', () => {
    const q = newQuestion('long', 'k')
    expect(q).toMatchObject({ kind: 'long', options: [], accepted: [], correct: [], points: 1 })
  })

  it('gives every new question its own key', () => {
    expect(newQuestion('one').key).not.toBe(newQuestion('one').key)
  })
})

describe('validateQuestions', () => {
  it('passes a finished quiz', () => {
    const issues = validateQuestions([one(), { ...newQuestion('long', 'k2'), prompt: 'Why do plant cells need a cell wall?' }])
    expect(hasIssues(issues)).toBe(false)
  })

  it('needs at least one question, and at most 50', () => {
    expect(validateQuestions([]).quiz).toBe('Add at least one question.')
    const many = Array.from({ length: 51 }, (_, i) => one({ key: `k${i}` }))
    expect(validateQuestions(many).quiz).toBe('A quiz holds at most 50 questions.')
  })

  it('asks for the question and keeps it to 1,000 characters', () => {
    expect(validateQuestions([one({ prompt: '   ' })]).questions.k1).toContain('Write the question.')
    expect(validateQuestions([one({ prompt: 'x'.repeat(1001) })]).questions.k1).toContain('Keep the question to 1,000 characters.')
  })

  it('asks for points from 0 to 100', () => {
    expect(validateQuestions([one({ points: null })]).questions.k1).toContain('Give it points, from 0 to 100.')
    expect(validateQuestions([one({ points: 101 })]).questions.k1).toContain('Points must be from 0 to 100.')
    expect(validateQuestions([one({ points: -1 })]).questions.k1).toContain('Points must be from 0 to 100.')
    expect(hasIssues(validateQuestions([one({ points: 0 })]))).toBe(false)
  })

  it('needs two choices with words; empty ones are simply left out', () => {
    const twoBlank = one({ options: [{ id: 'a', text: 'Nucleus' }, { id: 'b', text: ' ' }, { id: 'c', text: '' }], correct: ['a'] })
    expect(validateQuestions([twoBlank]).questions.k1).toContain('Give it at least 2 choices.')
    const oneBlank = one({ options: [{ id: 'a', text: 'Nucleus' }, { id: 'b', text: 'Chloroplast' }, { id: 'c', text: '' }], correct: ['b'] })
    expect(hasIssues(validateQuestions([oneBlank]))).toBe(false)
  })

  it('keeps a choice to 300 characters, named by its letter', () => {
    const long = one({ options: [{ id: 'a', text: 'Nucleus' }, { id: 'b', text: 'x'.repeat(301) }], correct: ['a'] })
    expect(validateQuestions([long]).questions.k1).toContain('Keep choice B to 300 characters.')
  })

  it('needs exactly one right answer for one answer, at least one for several', () => {
    expect(validateQuestions([one({ correct: [] })]).questions.k1).toContain('Mark the right answer.')
    expect(validateQuestions([one({ correct: ['a', 'b'] })]).questions.k1).toContain('Mark only one right answer.')
    expect(validateQuestions([one({ kind: 'many', correct: [] })]).questions.k1).toContain('Mark at least one right answer.')
    expect(hasIssues(validateQuestions([one({ kind: 'many', correct: ['a', 'b'] })]))).toBe(false)
  })

  it('will not count an empty choice as the right answer', () => {
    const q = one({ options: [{ id: 'a', text: 'Nucleus' }, { id: 'b', text: 'Chloroplast' }, { id: 'c', text: '' }], correct: ['c'] })
    expect(validateQuestions([q]).questions.k1).toContain('Choice C is marked right but has no words.')
  })

  it('needs 1 to 10 accepted answers for short text, each up to 300 characters', () => {
    const short = (accepted: string[]) => ({ ...newQuestion('short', 'k1'), prompt: 'What fills a cell?', accepted })
    expect(validateQuestions([short([''])]).questions.k1).toContain('Type at least one accepted answer.')
    expect(validateQuestions([short(Array.from({ length: 11 }, (_, i) => `a${i}`))]).questions.k1).toContain(
      'Keep it to 10 accepted answers.',
    )
    expect(validateQuestions([short(['x'.repeat(301)])]).questions.k1).toContain('Keep each accepted answer to 300 characters.')
    expect(hasIssues(validateQuestions([short(['cytoplasm', ''])]))).toBe(false)
  })

  it('keeps the messages per question', () => {
    const issues = validateQuestions([one(), one({ key: 'k2', prompt: '' })])
    expect(issues.questions.k1).toBeUndefined()
    expect(issues.questions.k2).toEqual(['Write the question.'])
  })
})

describe('totals and the release rule', () => {
  it('adds the points, an empty box counting 0', () => {
    expect(totalPoints([{ points: 2 }, { points: 1.5 }, { points: null }, { points: 3 }])).toBe(6.5)
    expect(totalPoints([])).toBe(0)
  })

  it('releases on submit only when every question is auto-graded', () => {
    expect(canReleaseOnSubmit([{ kind: 'one' }, { kind: 'many' }, { kind: 'short' }])).toBe(true)
    expect(canReleaseOnSubmit([{ kind: 'one' }, { kind: 'long' }])).toBe(false)
  })

  it('says which question is graded by hand', () => {
    expect(writtenHint([{ kind: 'one' }, { kind: 'many' }, { kind: 'short' }, { kind: 'long' }])).toBe(
      'Needed here: question 4 is graded by hand',
    )
    expect(writtenHint([{ kind: 'long' }, { kind: 'one' }, { kind: 'long' }])).toBe('Needed here: questions 1 and 3 are graded by hand')
    expect(writtenHint([{ kind: 'one' }])).toBeNull()
  })

  it('writes the header line', () => {
    expect(builderSubline('Grade 5 Science', [{ points: 2 }, { points: 2 }, { points: 1 }, { points: 3 }])).toBe(
      'Grade 5 Science · 4 questions · 8 points',
    )
    expect(builderSubline('Grade 5 Science', [{ points: 1 }])).toBe('Grade 5 Science · 1 question · 1 point')
  })

  it('reads the points box as pt or pts', () => {
    expect(pointsUnit(1)).toBe('pt')
    expect(pointsUnit(2)).toBe('pts')
    expect(pointsUnit(0.5)).toBe('pts')
    expect(pointsUnit(null)).toBe('pts')
  })

  it('reads typed points: empty is null, junk is refused', () => {
    expect(parsePointsText('')).toEqual({ value: null })
    expect(parsePointsText('2.5')).toEqual({ value: 2.5 })
    expect(parsePointsText('2.')).toEqual({ value: 2 })
    expect(parsePointsText('abc')).toBeNull()
    expect(parsePointsText('-1')).toBeNull()
  })
})

describe('editing a question', () => {
  it('one answer replaces the right answer; several toggles it, in choice order', () => {
    expect(toggleCorrect(one(), 'c').correct).toEqual(['c'])
    const many = one({ kind: 'many', correct: ['c'] })
    expect(toggleCorrect(many, 'a').correct).toEqual(['a', 'c'])
    expect(toggleCorrect(toggleCorrect(many, 'a'), 'c').correct).toEqual(['a'])
  })

  it('removes a choice and its right-answer mark', () => {
    const q = removeOption(one(), 'b')
    expect(q.options.map((o) => o.id)).toEqual(['a', 'c', 'd'])
    expect(q.correct).toEqual([])
  })

  it('picks the next free letter, avoiding letters students may already have answered', () => {
    expect(nextOptionId([{ id: 'a', text: '' }, { id: 'c', text: '' }])).toBe('b')
    expect(nextOptionId([{ id: 'a', text: '' }], ['b', 'c'])).toBe('d')
    const full = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => ({ id, text: '' }))
    expect(nextOptionId(full)).toBeNull()
    // Every free letter was used before: one is reused rather than none.
    expect(nextOptionId(full.slice(0, 7), ['h'])).toBe('h')
  })

  it('changes type keeping what still fits', () => {
    const many = changeKind(one(), 'many')
    expect(many.kind).toBe('many')
    expect(many.correct).toEqual(['b'])
    const backToOne = changeKind({ ...many, correct: ['a', 'b'], partialCredit: true }, 'one')
    expect(backToOne.correct).toEqual(['a'])
    expect(backToOne.partialCredit).toBe(false)
    const short = changeKind(one(), 'short')
    expect(short.accepted).toEqual([''])
    // Its choices are kept, so switching back loses nothing.
    expect(changeKind(short, 'one').options).toHaveLength(4)
    const fromLong = changeKind(newQuestion('long', 'k'), 'many')
    expect(fromLong.options.map((o) => o.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('moves an item up or down and stays in bounds', () => {
    expect(moveInList(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
    expect(moveInList(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b'])
    expect(moveInList(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c'])
    expect(moveInList(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'b', 'c'])
  })
})

describe('what a save sends', () => {
  it('sends each kind with its own fields only, trimmed and without empty choices', () => {
    const q = one({
      prompt: '  Which part?  ',
      options: [{ id: 'a', text: ' Nucleus ' }, { id: 'b', text: '' }, { id: 'c', text: 'Chloroplast' }],
      correct: ['c'],
      accepted: ['stray'],
      partialCredit: true,
    })
    expect(toQuestionInput(q, ID1)).toEqual({
      questionId: ID1,
      kind: 'one',
      prompt: 'Which part?',
      imagePath: null,
      options: [{ id: 'a', text: 'Nucleus' }, { id: 'c', text: 'Chloroplast' }],
      correct: ['c'],
      points: 2,
      partialCredit: false,
    })
    const short = { ...newQuestion('short', 'k'), prompt: 'Fills a cell?', accepted: [' cytoplasm ', ''], options: [{ id: 'a', text: 'x' }] }
    expect(toQuestionInput(short)).toEqual({ kind: 'short', prompt: 'Fills a cell?', imagePath: null, accepted: ['cytoplasm'], points: 1 })
    const long = { ...newQuestion('long', 'k'), prompt: 'Explain.', points: 3 }
    expect(toQuestionInput(long)).toEqual({ kind: 'long', prompt: 'Explain.', imagePath: null, points: 3 })
    const many = one({ kind: 'many', correct: ['d', 'b'], partialCredit: true })
    expect(toQuestionInput(many)).toMatchObject({ correct: ['b', 'd'], partialCredit: true })
  })

  it('sends ready questions; a saved one that is not ready goes as last saved; a new one waits', () => {
    const ready = one({ key: 'k1', questionId: ID1, prompt: 'Changed wording' })
    const brokenSaved = one({ key: 'k2', questionId: ID2, prompt: '' })
    const brokenNew = one({ key: 'k3', prompt: '' })
    const readyNew = { ...newQuestion('long', 'k4'), prompt: 'Explain.' }
    const savedTwo = saved({ questionId: ID2, prompt: 'Old wording' })
    const plan = buildSave([ready, brokenSaved, brokenNew, readyNew], { ids: new Map(), saved: new Map([[ID2, savedTwo]]) })
    expect(plan.keys).toEqual(['k1', 'k2', 'k4'])
    expect(plan.waiting).toEqual(['k2', 'k3'])
    expect(plan.input.map((q) => q.prompt)).toEqual(['Changed wording', 'Old wording', 'Explain.'])
    expect(plan.input[1].questionId).toBe(ID2)
    expect(plan.input[2].questionId).toBeUndefined()
  })

  it('uses the ids a save in flight just got, so a question is never created twice', () => {
    const plan = buildSave([one({ key: 'new-7' })], { ids: new Map([['new-7', ID1]]), saved: new Map() })
    expect(plan.input[0].questionId).toBe(ID1)
  })

  it('round-trips a saved question', () => {
    const draft = draftFromQuestion(saved())
    expect(draft).toMatchObject({ key: ID1, questionId: ID1, kind: 'one', correct: ['b'], points: 2 })
    expect(toQuestionInput(draft, ID1)).toMatchObject({ questionId: ID1, options: saved().options, correct: ['b'] })
    expect(draftFromQuestion(saved({ kind: 'short', options: [], correct: [], accepted: [] })).accepted).toEqual([''])
  })

  it('says which questions are not saved yet', () => {
    const qs = [one({ key: 'k1' }), one({ key: 'k2' }), one({ key: 'k3' })]
    expect(waitingLine(qs, [])).toBeNull()
    expect(waitingLine(qs, ['k2'])).toBe("Question 2 isn't saved yet. Finish it and it saves.")
    expect(waitingLine(qs, ['k1', 'k3'])).toBe("Questions 1 and 3 aren't saved yet. Finish them and they save.")
  })
})

describe('the preview', () => {
  it('shows the questions as a student would, without the key', () => {
    const [q] = previewQuestions([one({ options: [{ id: 'a', text: 'Nucleus' }, { id: 'b', text: '' }, { id: 'c', text: 'Vacuole' }] })])
    expect(q).toEqual({
      questionId: 'k1',
      kind: 'one',
      prompt: 'Which part of a plant cell makes food using sunlight?',
      imageUrl: null,
      options: [{ id: 'a', text: 'Nucleus' }, { id: 'c', text: 'Vacuole' }],
      points: 2,
      hint: null,
    })
    expect(previewQuestions([one({ kind: 'many' })])[0].hint).toBe('Pick all that apply.')
    expect(previewQuestions([{ ...newQuestion('long', 'k'), prompt: 'Explain.' }])[0].hint).toBe('Your teacher grades this one.')
    expect(JSON.stringify(previewQuestions([one()]))).not.toContain('correct')
  })
})

describe('the settings column', () => {
  it('says when the quiz posts and is due (Toronto)', () => {
    expect(
      quizWhenLines({ status: 'scheduled', effectiveStatus: 'scheduled', publishAt: '2026-10-19T11:30:00Z', postedAt: null, dueAt: '2026-10-21T19:30:00Z' }),
    ).toEqual({ postsLabel: 'Posts', posts: 'Mon, Oct 19 · 7:30 am', due: 'Wed, Oct 21 · 3:30 pm' })
    expect(quizWhenLines({ status: 'draft', effectiveStatus: 'draft', publishAt: null, postedAt: null, dueAt: null })).toEqual({
      postsLabel: 'Posts',
      posts: 'Not posted yet',
      due: 'No due date',
    })
    expect(
      quizWhenLines({ status: 'posted', effectiveStatus: 'posted', publishAt: null, postedAt: '2026-10-13T12:00:00Z', dueAt: null }).posts,
    ).toBe('Tue, Oct 13 · 8:00 am')
  })

  it('names the gradebook column, out of the quiz points', () => {
    expect(quizGradebookLine({ categoryId: 'c', categoryName: 'Quizzes' }, 8)).toBe('Quizzes · out of 8')
    expect(quizGradebookLine({ categoryId: null, categoryName: null }, 8)).toBe('Counts on its own · out of 8')
    expect(quizGradebookLine(null, 8)).toBe('Not in Grades')
  })
})

describe('a save the server refuses', () => {
  const apiError = (message: string, code: string | null) => Object.assign(new Error(message), { code })

  it('says how to undo a change students have made impossible (409 QUIZ_TAKEN)', () => {
    expect(builderSaveProblem(apiError("Students have already answered question 2, so its type can't change.", 'QUIZ_TAKEN'))).toEqual({
      message: "Students have already answered question 2, so its type can't change. Go back to what's saved to undo that change.",
      fix: 'saved',
    })
  })

  it('sends a grade above the new total to the grading view (409 DRAFT_ABOVE_MAX)', () => {
    const p = builderSaveProblem(
      apiError("Some grades on students' work are above 6, the quiz's new total. Change them in the grading view first.", 'DRAFT_ABOVE_MAX'),
    )
    expect(p.fix).toBe('grading')
    expect(p.message).toBe(
      "Some grades on students' work are above 6, the quiz's new total. Change them in the grading view first. Or put the points back as they were.",
    )
  })

  it("keeps any other refusal in the server's words", () => {
    expect(builderSaveProblem(apiError('Question 3: mark the right answer', null))).toEqual({ message: 'Question 3: mark the right answer', fix: null })
    expect(builderSaveProblem(new TypeError(''))).toEqual({ message: "The questions didn't save.", fix: null })
  })
})
