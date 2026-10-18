import { describe, it, expect } from 'vitest'
import {
  emptyTodoMessage,
  todoBadgeCount,
  todoKindLine,
  todoMeta,
  todoTabs,
  todoWhen,
} from './todoText'
import type { TodoItem } from '@/services/types/studentPortal'

// Thursday, Oct 15 2026, 2:10 pm in Toronto (EDT, UTC-4).
const NOW = new Date('2026-10-15T18:10:00Z')

const item = (over: Partial<TodoItem> = {}): TodoItem => ({
  itemId: 'i1',
  classId: 'c1',
  subject: 'Science',
  teacherName: 'Lina Farouk',
  iconUrl: '/class-icons/science.svg',
  title: 'Plant cell diagram',
  kind: 'assignment',
  submissionMode: 'file',
  dueAt: '2026-10-16T19:30:00Z', // Fri Oct 16, 3:30 pm
  date: null,
  status: 'assigned',
  isLate: false,
  questionCount: null,
  turnedInAt: null,
  publishedAt: null,
  ...over,
})

describe('todoTabs', () => {
  it('counts Assigned and Missing, and leaves Done without a number', () => {
    expect(todoTabs({ assigned: 4, missing: 1, done: 9 })).toEqual([
      { id: 'assigned', label: 'Assigned', count: 4 },
      { id: 'missing', label: 'Missing', count: 1 },
      { id: 'done', label: 'Done', count: null },
    ])
  })

  it('shows no number for an empty tab', () => {
    const tabs = todoTabs({ assigned: 0, missing: 0, done: 0 })
    expect(tabs.map((t) => t.count)).toEqual([null, null, null])
  })

  it('shows no numbers before the counts arrive', () => {
    expect(todoTabs(null).map((t) => t.count)).toEqual([null, null, null])
  })
})

describe('todoBadgeCount', () => {
  it('is what is assigned plus what is missing', () => {
    expect(todoBadgeCount({ assigned: 3, missing: 1, done: 5 })).toBe(4)
    expect(todoBadgeCount({ assigned: 0, missing: 0, done: 5 })).toBe(0)
  })
})

describe('todoKindLine', () => {
  it('says how an assignment is handed in', () => {
    expect(todoKindLine(item({ submissionMode: 'file' }))).toBe('Assignment · photo or file')
    expect(todoKindLine(item({ submissionMode: 'done' }))).toBe('Assignment · mark as done')
    expect(todoKindLine(item({ submissionMode: 'text' }))).toBe('Assignment · typed answer')
  })

  it('names a quiz by its questions when it has some', () => {
    expect(todoKindLine(item({ kind: 'quiz', submissionMode: null, questionCount: 4 }))).toBe('Quiz · 4 questions')
    expect(todoKindLine(item({ kind: 'quiz', submissionMode: null, questionCount: 1 }))).toBe('Quiz · 1 question')
    expect(todoKindLine(item({ kind: 'quiz', submissionMode: null, questionCount: 0 }))).toBe('Quiz')
    expect(todoKindLine(item({ kind: 'quiz', submissionMode: null, questionCount: null }))).toBe('Quiz')
  })

  it('names the other kinds', () => {
    expect(todoKindLine(item({ kind: 'assessment', submissionMode: null }))).toBe('Assessment')
    expect(todoKindLine(item({ kind: 'assignment', submissionMode: 'none' }))).toBe('Assignment')
    expect(todoKindLine(item({ kind: 'material', submissionMode: null }))).toBe('Material')
  })
})

describe('todoMeta', () => {
  it('writes the subject and the teacher', () => {
    expect(todoMeta(item())).toBe('Science · Lina Farouk')
    expect(todoMeta(item({ teacherName: null }))).toBe('Science')
  })
})

describe('todoWhen on Assigned', () => {
  it('writes tomorrow as a weekday and a time, in amber', () => {
    expect(todoWhen(item(), 'assigned', 'Tomorrow', NOW)).toEqual({ text: 'Fri 3:30 pm', tone: 'amber' })
  })

  it('writes today with its time, in amber', () => {
    expect(todoWhen(item({ dueAt: '2026-10-15T21:00:00Z' }), 'assigned', 'Today', NOW)).toEqual({ text: 'Today 5:00 pm', tone: 'amber' })
  })

  it('writes later this week as a weekday and a time, in the plain ink', () => {
    expect(todoWhen(item({ dueAt: '2026-10-17T14:00:00Z' }), 'assigned', 'This week', NOW)).toEqual({ text: 'Sat 10:00 am', tone: 'ink' })
  })

  it('writes next week and later as the date', () => {
    expect(todoWhen(item({ dueAt: '2026-10-19T19:30:00Z' }), 'assigned', 'Next week', NOW)).toEqual({ text: 'Mon, Oct 19', tone: 'ink' })
    expect(todoWhen(item({ dueAt: '2026-11-20T19:30:00Z' }), 'assigned', 'Later', NOW)).toEqual({ text: 'Fri, Nov 20', tone: 'ink' })
  })

  it('writes work with no due date as Anytime, in slate', () => {
    expect(todoWhen(item({ dueAt: null }), 'assigned', 'No due date', NOW)).toEqual({ text: 'Anytime', tone: 'slate' })
  })

  it('reads the Toronto day, not the UTC one', () => {
    // 11:30 pm Toronto on the 16th is already the 17th in UTC.
    expect(todoWhen(item({ dueAt: '2026-10-17T03:30:00Z' }), 'assigned', 'Tomorrow', NOW)).toEqual({ text: 'Fri 11:30 pm', tone: 'amber' })
  })
})

describe('todoWhen on Missing', () => {
  it('says when it was due, in rose', () => {
    expect(todoWhen(item({ status: 'missing', dueAt: '2026-10-13T19:30:00Z' }), 'missing', 'Missing', NOW)).toEqual({ text: 'Was due Tuesday', tone: 'rose' })
    expect(todoWhen(item({ status: 'missing', dueAt: '2026-10-14T19:30:00Z' }), 'missing', 'Missing', NOW)).toEqual({ text: 'Was due yesterday', tone: 'rose' })
    expect(todoWhen(item({ status: 'missing', dueAt: '2026-10-01T19:30:00Z' }), 'missing', 'Missing', NOW)).toEqual({ text: 'Was due Oct 1', tone: 'rose' })
  })

  it('reads a dated in-class test by its date', () => {
    expect(todoWhen(item({ status: 'missing', dueAt: null, date: '2026-10-12' }), 'missing', 'Missing', NOW)).toEqual({ text: 'Was due Monday', tone: 'rose' })
  })

  it('still says Missing when there is no date at all', () => {
    expect(todoWhen(item({ status: 'missing', dueAt: null, date: null }), 'missing', 'Missing', NOW)).toEqual({ text: 'Missing', tone: 'rose' })
  })
})

describe('todoWhen on Done', () => {
  it('says when it was turned in, with late', () => {
    expect(todoWhen(item({ status: 'turned_in', turnedInAt: '2026-10-15T13:00:00Z' }), 'done', 'This week', NOW)).toEqual({ text: 'Turned in today', tone: 'emerald' })
    expect(todoWhen(item({ status: 'turned_in', turnedInAt: '2026-10-14T13:00:00Z', isLate: true }), 'done', 'This week', NOW)).toEqual({ text: 'Turned in yesterday · late', tone: 'emerald' })
  })

  it('says when it was graded', () => {
    expect(todoWhen(item({ status: 'graded', turnedInAt: '2026-10-09T13:00:00Z', publishedAt: '2026-10-12T13:00:00Z' }), 'done', 'Earlier', NOW)).toEqual({ text: 'Graded Monday', tone: 'indigo' })
  })

  it('says excused', () => {
    expect(todoWhen(item({ status: 'excused' }), 'done', 'Earlier', NOW)).toEqual({ text: 'Excused', tone: 'slate' })
  })
})

describe('emptyTodoMessage', () => {
  it('has a line for each tab', () => {
    expect(emptyTodoMessage('assigned', null)).toBe("You're all caught up. Nothing is assigned right now.")
    expect(emptyTodoMessage('missing', null)).toBe('Nothing is missing. Nice work.')
    expect(emptyTodoMessage('done', null)).toBe('Nothing here yet. Work you turn in shows up here.')
  })

  it('names the class when one is chosen', () => {
    expect(emptyTodoMessage('assigned', 'Science')).toBe('Nothing is assigned in Science right now.')
    expect(emptyTodoMessage('missing', 'Science')).toBe('Nothing is missing in Science.')
    expect(emptyTodoMessage('done', 'Science')).toBe('Nothing here yet in Science.')
  })
})
