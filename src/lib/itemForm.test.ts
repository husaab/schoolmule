import { describe, it, expect } from 'vitest'
import {
  D2_MESSAGE,
  STANDALONE_MESSAGE,
  autosaveFailure,
  categoryOptionLabel,
  draftItemInput,
  emptyItemValues,
  isoToTorontoParts,
  itemToFormValues,
  keepsUnsetMax,
  toItemInput,
  torontoToIso,
  validateItemForm,
  withSavedGradebook,
  type ItemFormContext,
  type ItemFormValues,
} from './itemForm'
import type { Item } from '@/services/types/classwork'

const NOW = new Date('2026-10-16T12:00:00.000Z')
const CAT = 'aaaaaaaa-0000-4000-8000-000000000001'
const COL = 'bbbbbbbb-0000-4000-8000-000000000002'
const TOPIC = 'cccccccc-0000-4000-8000-000000000003'
const S1 = 'dddddddd-0000-4000-8000-000000000004'

const ctx = (over: Partial<ItemFormContext> = {}): ItemFormContext => ({
  categories: [{ assessmentId: CAT }],
  linkableColumns: [{ assessmentId: COL }],
  topics: [{ topicId: TOPIC }],
  now: NOW,
  ...over,
})

const values = (over: Partial<ItemFormValues> = {}): ItemFormValues => ({
  title: 'Plant cell diagram',
  instructions: '',
  topicId: '',
  date: '',
  dueDate: '',
  dueTime: '',
  submissionMode: 'file',
  gradebookMode: 'category',
  categoryId: CAT,
  columnId: '',
  maxScore: '10',
  audience: 'all',
  studentIds: [],
  emailStudents: true,
  remindStudents: true,
  showEarly: false,
  ...over,
})

describe('validateItemForm: every kind', () => {
  it('passes a complete assignment', () => {
    expect(validateItemForm('assignment', values(), ctx())).toEqual({})
  })

  it('needs a title', () => {
    expect(validateItemForm('assignment', values({ title: '   ' }), ctx()).title).toBe('Give it a title')
  })

  it('keeps the title to 200 characters', () => {
    expect(validateItemForm('material', values({ title: 'x'.repeat(201) }), ctx()).title).toBe(
      'Keep the title to 200 characters',
    )
    expect(validateItemForm('material', values({ title: 'x'.repeat(200) }), ctx())).toEqual({})
  })

  it('keeps the instructions to 20,000 characters', () => {
    expect(validateItemForm('material', values({ instructions: 'x'.repeat(20_001) }), ctx()).instructions).toBe(
      'Keep the instructions to 20,000 characters',
    )
  })

  it("needs the topic to be one of the class's topics", () => {
    expect(validateItemForm('material', values({ topicId: TOPIC }), ctx())).toEqual({})
    expect(validateItemForm('material', values({ topicId: 'nope' }), ctx()).topicId).toBe(
      "Choose one of this class's topics",
    )
  })

  it('needs at least one student when the item is for some students', () => {
    expect(validateItemForm('material', values({ audience: 'some', studentIds: [] }), ctx()).studentIds).toBe(
      'Choose at least one student',
    )
    expect(validateItemForm('material', values({ audience: 'some', studentIds: [S1] }), ctx())).toEqual({})
  })

  it('caps the chosen students at 500', () => {
    const many = Array.from({ length: 501 }, (_, i) => `s${i}`)
    expect(validateItemForm('material', values({ audience: 'some', studentIds: many }), ctx()).studentIds).toBe(
      'Choose at most 500 students',
    )
  })

  it('needs a schedule in the future', () => {
    const past = '2026-10-16T11:00:00.000Z'
    const future = '2026-10-17T11:00:00.000Z'
    expect(validateItemForm('material', values(), ctx({ status: 'scheduled', publishAt: past })).publishAt).toBe(
      'Pick a date and time in the future',
    )
    expect(validateItemForm('material', values(), ctx({ status: 'scheduled', publishAt: null })).publishAt).toBe(
      'Pick a date and time in the future',
    )
    expect(validateItemForm('material', values(), ctx({ status: 'scheduled', publishAt: future }))).toEqual({})
    // Posting or a draft never looks at the schedule.
    expect(validateItemForm('material', values(), ctx({ status: 'posted', publishAt: past }))).toEqual({})
  })
})

describe('validateItemForm: assessments', () => {
  const assessment = (over: Partial<ItemFormValues> = {}) =>
    values({ title: 'Unit 2 test', maxScore: '30', date: '2026-10-23', ...over })

  it('passes with a category, an out of and a date', () => {
    expect(validateItemForm('assessment', assessment(), ctx())).toEqual({})
    expect(validateItemForm('assessment', assessment({ date: '' }), ctx())).toEqual({})
  })

  it('needs a category, with the D2 message when the class has none', () => {
    expect(validateItemForm('assessment', assessment(), ctx({ categories: [] })).categoryId).toBe(D2_MESSAGE)
    expect(validateItemForm('assessment', assessment({ categoryId: '' }), ctx()).categoryId).toBe('Choose a category')
  })

  it('always counts toward a category, whatever the gradebook mode says', () => {
    expect(validateItemForm('assessment', assessment({ gradebookMode: 'none', categoryId: '' }), ctx()).categoryId).toBe(
      'Choose a category',
    )
    expect(toItemInput('assessment', assessment({ gradebookMode: 'none' })).gradebook).toEqual({
      mode: 'category',
      categoryId: CAT,
      maxScore: 30,
    })
  })

  it('needs an out of above 0 and at most 10,000', () => {
    expect(validateItemForm('assessment', assessment({ maxScore: '' }), ctx()).maxScore).toBe('Out of must be more than 0')
    expect(validateItemForm('assessment', assessment({ maxScore: '0' }), ctx()).maxScore).toBe('Out of must be more than 0')
    expect(validateItemForm('assessment', assessment({ maxScore: 'ten' }), ctx()).maxScore).toBe(
      'Out of must be more than 0',
    )
    expect(validateItemForm('assessment', assessment({ maxScore: '10001' }), ctx()).maxScore).toBe(
      'Out of must be 10,000 or less',
    )
    expect(validateItemForm('assessment', assessment({ maxScore: '7.5' }), ctx())).toEqual({})
  })

  it('needs a real calendar date', () => {
    expect(validateItemForm('assessment', assessment({ date: '2026-02-30' }), ctx()).date).toBe('Pick a real date')
  })

  it('keeps a column that counts on its own without asking for a category', () => {
    expect(
      validateItemForm('assessment', assessment({ categoryId: '', maxScore: '' }), ctx({ categories: [], standaloneColumn: true })),
    ).toEqual({})
  })
})

describe('validateItemForm: assignments and quizzes', () => {
  it('a category needs the class to have one (D2)', () => {
    expect(validateItemForm('assignment', values(), ctx({ categories: [] })).categoryId).toBe(D2_MESSAGE)
  })

  it('a category needs a choice and an out of', () => {
    expect(validateItemForm('quiz', values({ categoryId: '' }), ctx()).categoryId).toBe('Choose a category')
    expect(validateItemForm('quiz', values({ maxScore: '-1' }), ctx()).maxScore).toBe('Out of must be more than 0')
  })

  it('an existing column must be one the class offers', () => {
    expect(validateItemForm('assignment', values({ gradebookMode: 'existing', columnId: COL }), ctx())).toEqual({})
    expect(validateItemForm('assignment', values({ gradebookMode: 'existing', columnId: '' }), ctx()).columnId).toBe(
      'Choose a column',
    )
    expect(validateItemForm('assignment', values({ gradebookMode: 'existing', columnId: 'x' }), ctx()).columnId).toBe(
      'Choose a column',
    )
  })

  it('not graded needs nothing else', () => {
    expect(validateItemForm('assignment', values({ gradebookMode: 'none', categoryId: '', maxScore: '' }), ctx({ categories: [] }))).toEqual({})
  })

  it('a column that counts on its own cannot move into a category (the 409)', () => {
    expect(validateItemForm('assignment', values(), ctx({ standaloneColumn: true })).gradebook).toBe(STANDALONE_MESSAGE)
  })

  it('the due date and time come as a pair', () => {
    expect(validateItemForm('assignment', values({ dueDate: '2026-10-20', dueTime: '' }), ctx()).dueTime).toBe('Add a time')
    expect(validateItemForm('assignment', values({ dueDate: '', dueTime: '15:30' }), ctx()).dueDate).toBe('Add a date')
    expect(validateItemForm('assignment', values({ dueDate: '2026-10-20', dueTime: '15:30' }), ctx())).toEqual({})
    expect(validateItemForm('assignment', values({ dueDate: '2026-13-01', dueTime: '15:30' }), ctx()).dueDate).toBe(
      'Pick a real date',
    )
  })
})

describe('validateItemForm: materials', () => {
  it('ignores the gradebook and the due date', () => {
    expect(
      validateItemForm('material', values({ categoryId: '', maxScore: '', dueDate: '2026-10-20', dueTime: '' }), ctx({ categories: [] })),
    ).toEqual({})
  })
})

describe('torontoToIso / isoToTorontoParts', () => {
  it('reads a date and time on the Toronto clock', () => {
    expect(torontoToIso('2026-10-16', '15:30')).toBe('2026-10-16T19:30:00.000Z') // EDT, UTC-4
    expect(torontoToIso('2026-12-01', '09:00')).toBe('2026-12-01T14:00:00.000Z') // EST, UTC-5
  })

  it('is null without both parts or for an impossible date', () => {
    expect(torontoToIso('', '15:30')).toBeNull()
    expect(torontoToIso('2026-10-16', '')).toBeNull()
    expect(torontoToIso('2026-02-30', '10:00')).toBeNull()
  })

  it('splits an instant back into the Toronto date and time', () => {
    expect(isoToTorontoParts('2026-10-16T19:30:00.000Z')).toEqual({ date: '2026-10-16', time: '15:30' })
    expect(isoToTorontoParts('2026-12-02T03:15:00.000Z')).toEqual({ date: '2026-12-01', time: '22:15' })
    expect(isoToTorontoParts(null)).toEqual({ date: '', time: '' })
  })
})

describe('toItemInput', () => {
  it('builds dueAt from the Toronto date and time', () => {
    const input = toItemInput('assignment', values({ dueDate: '2026-10-16', dueTime: '15:30' }))
    expect(input.dueAt).toBe('2026-10-16T19:30:00.000Z')
    expect(input).not.toHaveProperty('date')
    expect(input.gradebook).toEqual({ mode: 'category', categoryId: CAT, maxScore: 10 })
    expect(input.submissionMode).toBe('file')
    expect(input.emailStudents).toBe(true)
    expect(input.remindStudents).toBe(true)
  })

  it('sends no due date when none is set', () => {
    expect(toItemInput('assignment', values()).dueAt).toBeNull()
  })

  it('material drops the gradebook, the due date and the turn-in mode', () => {
    const input = toItemInput('material', values({ dueDate: '2026-10-16', dueTime: '15:30' }))
    expect(input).not.toHaveProperty('gradebook')
    expect(input).not.toHaveProperty('dueAt')
    expect(input).not.toHaveProperty('submissionMode')
    expect(input).not.toHaveProperty('remindStudents')
    expect(input.kind).toBe('material')
  })

  it('assessment sends date, not dueAt, and a category column', () => {
    const input = toItemInput(
      'assessment',
      values({ title: ' Unit 2 test ', date: '2026-10-23', maxScore: '30', showEarly: true, emailStudents: false }),
    )
    expect(input.date).toBe('2026-10-23')
    expect(input).not.toHaveProperty('dueAt')
    expect(input).not.toHaveProperty('submissionMode')
    expect(input.title).toBe('Unit 2 test')
    expect(input.gradebook).toEqual({ mode: 'category', categoryId: CAT, maxScore: 30 })
    expect(input.showEarly).toBe(true)
    expect(input.emailStudents).toBe(false)
  })

  it('a column that counts on its own sends no gradebook (it keeps its place)', () => {
    expect(toItemInput('assessment', values({ date: '2026-10-23' }), { standaloneColumn: true })).not.toHaveProperty('gradebook')
  })

  it('maps the other gradebook choices', () => {
    expect(toItemInput('assignment', values({ gradebookMode: 'existing', columnId: COL })).gradebook).toEqual({
      mode: 'existing',
      assessmentId: COL,
    })
    expect(toItemInput('assignment', values({ gradebookMode: 'none' })).gradebook).toEqual({ mode: 'none' })
  })

  it('a quiz sends no turn-in mode (the server keeps it none)', () => {
    expect(toItemInput('quiz', values())).not.toHaveProperty('submissionMode')
  })

  it('blank instructions and no topic are null; chosen students only for some', () => {
    const all = toItemInput('material', values({ instructions: '  ', topicId: '' }))
    expect(all.instructions).toBeNull()
    expect(all.topicId).toBeNull()
    expect(all.audience).toBe('all')
    expect(all).not.toHaveProperty('studentIds')
    const some = toItemInput('material', values({ audience: 'some', studentIds: [S1], topicId: TOPIC }))
    expect(some.studentIds).toEqual([S1])
    expect(some.topicId).toBe(TOPIC)
  })

  it('carries the status and the schedule when given', () => {
    expect(toItemInput('material', values(), { status: 'posted' }).status).toBe('posted')
    const scheduled = toItemInput('material', values(), { status: 'scheduled', publishAt: '2026-10-19T11:30:00.000Z' })
    expect(scheduled.status).toBe('scheduled')
    expect(scheduled.publishAt).toBe('2026-10-19T11:30:00.000Z')
    expect(toItemInput('material', values())).not.toHaveProperty('status')
  })
})

describe('draftItemInput (autosave)', () => {
  it('waits for a title', () => {
    expect(draftItemInput('assignment', values({ title: ' ' }), ctx())).toBeNull()
  })

  it('saves as a draft and leaves out what is not ready yet', () => {
    const input = draftItemInput(
      'assignment',
      values({ dueDate: '2026-10-20', dueTime: '', maxScore: '', audience: 'some', studentIds: [] }),
      ctx(),
    )
    expect(input).not.toBeNull()
    expect(input!.status).toBe('draft')
    expect(input).not.toHaveProperty('dueAt')
    expect(input).not.toHaveProperty('gradebook')
    expect(input).not.toHaveProperty('audience')
    expect(input).not.toHaveProperty('studentIds')
    expect(input!.title).toBe('Plant cell diagram')
  })

  it('sends everything once it is all valid', () => {
    const input = draftItemInput('assignment', values({ dueDate: '2026-10-16', dueTime: '15:30' }), ctx())
    expect(input!.dueAt).toBe('2026-10-16T19:30:00.000Z')
    expect(input!.gradebook).toEqual({ mode: 'category', categoryId: CAT, maxScore: 10 })
  })
})

describe('emptyItemValues', () => {
  it('starts an assessment in the first category, shown early, not emailed', () => {
    const v = emptyItemValues('assessment', { categories: [{ assessmentId: CAT }] })
    expect(v.gradebookMode).toBe('category')
    expect(v.categoryId).toBe(CAT)
    expect(v.showEarly).toBe(true)
    expect(v.emailStudents).toBe(false)
  })

  it('starts an assignment as a file turn-in, not graded when there is no category', () => {
    const v = emptyItemValues('assignment', { categories: [], topicId: TOPIC })
    expect(v.submissionMode).toBe('file')
    expect(v.gradebookMode).toBe('none')
    expect(v.topicId).toBe(TOPIC)
    expect(v.emailStudents).toBe(true)
  })
})

describe('itemToFormValues', () => {
  const item = (over: Partial<Item> = {}): Item => ({
    itemId: 'i1',
    classId: 'c1',
    kind: 'assignment',
    title: 'Plant cell diagram',
    topicId: TOPIC,
    status: 'posted',
    effectiveStatus: 'posted',
    publishAt: null,
    postedAt: '2026-10-13T12:00:00.000Z',
    dueAt: '2026-10-16T19:30:00.000Z',
    date: '2026-10-16',
    submissionMode: 'text',
    showEarly: false,
    audience: 'some',
    gradebook: {
      assessmentId: COL,
      categoryId: CAT,
      categoryName: 'Homework',
      maxScore: 10,
      weightPoints: 4,
      isPublished: false,
      scoreCount: 0,
    },
    attachmentCount: 0,
    counts: { turnedIn: 0, missing: 0, notYet: 0, toReview: 0, drafts: 0, published: 0 },
    classAvgPct: null,
    createdAt: '2026-10-13T12:00:00.000Z',
    editedAt: null,
    instructions: 'Label six parts.',
    emailStudents: false,
    remindStudents: true,
    studentIds: [S1],
    attachments: [],
    ...over,
  })

  it('reads a linked item back into the form', () => {
    const v = itemToFormValues(item())
    expect(v).toMatchObject({
      title: 'Plant cell diagram',
      instructions: 'Label six parts.',
      topicId: TOPIC,
      dueDate: '2026-10-16',
      dueTime: '15:30',
      submissionMode: 'text',
      gradebookMode: 'category',
      categoryId: CAT,
      maxScore: '10',
      audience: 'some',
      studentIds: [S1],
      emailStudents: false,
    })
  })

  it('a column with no category is the existing column it fills', () => {
    const v = itemToFormValues(item({ gradebook: { ...item().gradebook!, categoryId: null, categoryName: null } }))
    expect(v.gradebookMode).toBe('existing')
    expect(v.columnId).toBe(COL)
  })

  it('an unlinked item is not graded', () => {
    expect(itemToFormValues(item({ gradebook: null })).gradebookMode).toBe('none')
  })
})

describe('categoryOptionLabel', () => {
  it('reads "Tests (30 of 100)"', () => {
    expect(categoryOptionLabel({ assessmentId: CAT, name: 'Tests', weightPoints: 30, childCount: 2 })).toBe('Tests (30 of 100)')
    expect(categoryOptionLabel({ assessmentId: CAT, name: 'Homework', weightPoints: 12.5, childCount: 0 })).toBe(
      'Homework (12.5 of 100)',
    )
  })
})

describe('a column whose "Out of" was never set', () => {
  const current = { categoryId: CAT, maxScore: null }

  it('stays as it is when left blank in the same category', () => {
    const v = values({ maxScore: '', date: '2026-10-23' })
    expect(keepsUnsetMax('assessment', v, current)).toBe(true)
    expect(validateItemForm('assessment', v, ctx({ currentColumn: current }))).toEqual({})
    expect(toItemInput('assessment', v, { currentColumn: current })).not.toHaveProperty('gradebook')
    expect(validateItemForm('assignment', v, ctx({ currentColumn: current }))).toEqual({})
    expect(toItemInput('assignment', v, { currentColumn: current })).not.toHaveProperty('gradebook')
  })

  it('needs an "Out of" once the teacher types one, or moves it to another category', () => {
    expect(validateItemForm('assessment', values({ maxScore: '0' }), ctx({ currentColumn: current })).maxScore).toBe(
      'Out of must be more than 0',
    )
    const other = { categoryId: 'another-category', maxScore: null }
    expect(keepsUnsetMax('assessment', values({ maxScore: '' }), other)).toBe(false)
    expect(validateItemForm('assessment', values({ maxScore: '' }), ctx({ currentColumn: other })).maxScore).toBe(
      'Out of must be more than 0',
    )
  })

  it('is not a rule for a column that has an "Out of"', () => {
    expect(keepsUnsetMax('assessment', values({ maxScore: '' }), { categoryId: CAT, maxScore: 10 })).toBe(false)
    expect(keepsUnsetMax('assessment', values({ maxScore: '' }), null)).toBe(false)
  })
})

describe('autosaveFailure', () => {
  const saved = {
    itemId: 'i1',
    classId: 'c1',
    kind: 'assignment',
    title: 'Plant cell diagram',
    topicId: null,
    status: 'draft',
    effectiveStatus: 'draft',
    publishAt: null,
    postedAt: null,
    dueAt: null,
    date: null,
    submissionMode: 'file',
    showEarly: false,
    audience: 'all',
    gradebook: { assessmentId: COL, categoryId: CAT, categoryName: 'Homework', maxScore: 10, weightPoints: 5, isPublished: false, scoreCount: 0 },
    attachmentCount: 0,
    counts: { turnedIn: 0, missing: 0, notYet: 0, toReview: 0, drafts: 0, published: 0 },
    classAvgPct: null,
    createdAt: '2026-10-13T12:00:00.000Z',
    editedAt: null,
    instructions: null,
    emailStudents: true,
    remindStudents: true,
    studentIds: [],
    attachments: [],
  } as Item

  it("a refused gradebook change (409) shows the server's reason and puts the column back, keeping every other edit", () => {
    const typed = values({ title: 'Plant cell diagram, labelled', gradebookMode: 'none', maxScore: '', instructions: 'Label six parts.' })
    const out = autosaveFailure(
      { status: 409, message: "Students' work on this item is already graded. Clear those grades in the grading view before changing how it counts in the gradebook." },
      typed,
      saved,
    )
    expect(out.message).toMatch(/already graded/)
    expect(out.values).toMatchObject({
      title: 'Plant cell diagram, labelled',
      instructions: 'Label six parts.',
      gradebookMode: 'category',
      categoryId: CAT,
      maxScore: '10',
    })
    // The next save sends the column as saved, so it goes through.
    expect(draftItemInput('assignment', out.values!, ctx())!.gradebook).toEqual({ mode: 'category', categoryId: CAT, maxScore: 10 })
  })

  it('an "Out of" below a grade (DRAFT_ABOVE_MAX) goes back to the saved "Out of"', () => {
    const out = autosaveFailure({ status: 409, message: "Some grades on students' work are above 5. Change them in the grading view first." }, values({ maxScore: '5' }), saved)
    expect(out.values!.maxScore).toBe('10')
  })

  it('a refused first save leaves the new draft ungraded', () => {
    const out = autosaveFailure({ status: 409, message: 'Another item already fills that gradebook column. Choose another column.' }, values({ gradebookMode: 'existing', columnId: COL }), null)
    expect(out.values!.gradebookMode).toBe('none')
    expect(out.values!.title).toBe('Plant cell diagram')
  })

  it('any other failure keeps the form as typed and says why', () => {
    expect(autosaveFailure({ status: 500, message: 'Error saving the item' }, values(), saved)).toEqual({ message: 'Error saving the item', values: null })
    expect(autosaveFailure(null, values(), saved).message).toBe("The draft didn't save.")
  })

  it('withSavedGradebook copies only the gradebook fields', () => {
    const v = withSavedGradebook(values({ title: 'New title', gradebookMode: 'existing', columnId: 'x', maxScore: '3' }), saved)
    expect(v).toMatchObject({ title: 'New title', gradebookMode: 'category', categoryId: CAT, columnId: '', maxScore: '10' })
  })
})
