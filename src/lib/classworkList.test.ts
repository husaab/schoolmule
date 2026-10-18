import { describe, it, expect } from 'vitest'
import { classworkMeta, classworkPill, classworkSections } from './classworkList'
import type { ClassworkTopic, StudentItemSummary } from '@/services/types/studentPortal'

// Thursday, Oct 15 2026, 2:10 pm in Toronto (EDT, UTC-4).
const NOW = new Date('2026-10-15T18:10:00Z')

const row = (over: Partial<StudentItemSummary> = {}): StudentItemSummary => ({
  itemId: 'i1',
  classId: 'c1',
  subject: 'Science',
  teacherName: 'Lina Farouk',
  iconUrl: '/class-icons/science.svg',
  title: 'Plant cell diagram',
  kind: 'assignment',
  submissionMode: 'file',
  dueAt: '2026-10-16T19:30:00Z',
  date: null,
  status: 'assigned',
  isLate: false,
  questionCount: null,
  turnedInAt: null,
  publishedAt: null,
  topicId: null,
  postedAt: '2026-10-13T14:00:00Z',
  grade: null,
  ...over,
})

const topic = (topicId: string, name: string, sortOrder: number): ClassworkTopic => ({ topicId, name, sortOrder, itemCount: 1 })

describe('classworkSections', () => {
  it('puts work with no topic first, with no heading, then each topic in order', () => {
    const topics = [topic('t1', 'Unit 1 · Cells', 1), topic('t2', 'Unit 2 · Matter', 2)]
    const items = [
      row({ itemId: 'a', topicId: 't2' }),
      row({ itemId: 'b', topicId: null }),
      row({ itemId: 'c', topicId: 't1' }),
      row({ itemId: 'd', topicId: 't1' }),
    ]
    const sections = classworkSections(topics, items)
    expect(sections.map((s) => s.title)).toEqual([null, 'Unit 1 · Cells', 'Unit 2 · Matter'])
    expect(sections.map((s) => s.items.map((i) => i.itemId))).toEqual([['b'], ['c', 'd'], ['a']])
  })

  it('keeps the order the server sent inside a section', () => {
    const items = [row({ itemId: 'z', topicId: 't1' }), row({ itemId: 'a', topicId: 't1' })]
    expect(classworkSections([topic('t1', 'Unit 1', 1)], items)[0].items.map((i) => i.itemId)).toEqual(['z', 'a'])
  })

  it('drops a topic with nothing in it', () => {
    expect(classworkSections([topic('t1', 'Unit 1', 1)], [row({ topicId: null })]).map((s) => s.title)).toEqual([null])
  })

  it('files work under an unknown topic with the work that has none', () => {
    const sections = classworkSections([topic('t1', 'Unit 1', 1)], [row({ itemId: 'a', topicId: 'gone' }), row({ itemId: 'b', topicId: null })])
    expect(sections).toHaveLength(1)
    expect(sections[0].items.map((i) => i.itemId)).toEqual(['a', 'b'])
  })

  it('has no sections for an empty class', () => {
    expect(classworkSections([], [])).toEqual([])
  })

  it('orders topics by their sort order even when sent out of order', () => {
    const topics = [topic('t2', 'B', 2), topic('t1', 'A', 1)]
    const items = [row({ itemId: 'a', topicId: 't2' }), row({ itemId: 'b', topicId: 't1' })]
    expect(classworkSections(topics, items).map((s) => s.title)).toEqual(['A', 'B'])
  })
})

describe('classworkPill', () => {
  it('words each state of the work', () => {
    expect(classworkPill(row({ status: 'assigned' }))).toMatchObject({ label: 'Assigned', suffix: null })
    expect(classworkPill(row({ status: 'missing' }))).toMatchObject({ label: 'Missing' })
    expect(classworkPill(row({ status: 'turned_in' }))).toMatchObject({ label: 'Turned in', suffix: null })
    expect(classworkPill(row({ status: 'turned_in', isLate: true }))).toMatchObject({ label: 'Turned in', suffix: ' · late' })
    expect(classworkPill(row({ kind: 'material', status: 'material' }))).toMatchObject({ label: 'To read' })
    expect(classworkPill(row({ status: 'excused' }))).toMatchObject({ label: 'Excused' })
  })

  it('shows the score on graded work', () => {
    expect(classworkPill(row({ status: 'graded', grade: { score: 8, maxScore: 10 } }))).toMatchObject({ label: 'Graded', suffix: ' · 8/10' })
    expect(classworkPill(row({ status: 'graded', grade: null }))).toMatchObject({ label: 'Graded', suffix: null })
  })

  it('has no pill for work done in class', () => {
    expect(classworkPill(row({ status: 'no_turn_in', kind: 'assessment' })).label).toBe('')
  })
})

describe('classworkMeta', () => {
  it('says when open work is due', () => {
    expect(classworkMeta(row(), NOW)).toBe('Due tomorrow, 3:30 pm')
    expect(classworkMeta(row({ dueAt: '2026-10-21T19:30:00Z' }), NOW)).toBe('Due Wed, Oct 21')
    expect(classworkMeta(row({ dueAt: null }), NOW)).toBe('No due date')
  })

  it('says "was due" for assigned work whose date passed (a child who cannot sign in)', () => {
    expect(classworkMeta(row({ status: 'assigned', dueAt: '2026-10-08T19:30:00Z' }), NOW)).toBe('Was due Oct 8')
    expect(classworkMeta(row({ status: 'assigned', dueAt: '2026-10-13T19:30:00Z' }), NOW)).toBe('Was due Tuesday')
  })

  it('says when missing work was due', () => {
    expect(classworkMeta(row({ status: 'missing', dueAt: '2026-10-08T19:30:00Z' }), NOW)).toBe('Was due Oct 8')
    expect(classworkMeta(row({ status: 'missing', dueAt: '2026-10-13T19:30:00Z' }), NOW)).toBe('Was due Tuesday')
  })

  it('says when work was turned in and graded', () => {
    expect(classworkMeta(row({ status: 'turned_in', turnedInAt: '2026-10-15T14:00:00Z' }), NOW)).toBe('Turned in today')
    expect(classworkMeta(row({ status: 'turned_in', turnedInAt: '2026-10-13T22:42:00Z', isLate: true }), NOW)).toBe('Turned in Tuesday · late')
    expect(
      classworkMeta(row({ status: 'graded', turnedInAt: '2026-10-08T22:42:00Z', publishedAt: '2026-10-15T14:00:00Z', grade: { score: 8, maxScore: 10 } }), NOW),
    ).toBe('Turned in Oct 8 · graded today')
    expect(classworkMeta(row({ status: 'graded', turnedInAt: null, publishedAt: '2026-10-12T14:00:00Z' }), NOW)).toBe('Graded Monday')
    expect(classworkMeta(row({ status: 'excused' }), NOW)).toBe('Excused')
  })

  it('names a material and work done in class', () => {
    expect(classworkMeta(row({ kind: 'material', status: 'material', dueAt: null }), NOW)).toBe('Material')
    expect(classworkMeta(row({ kind: 'assessment', status: 'no_turn_in', dueAt: null, date: '2026-10-23' }), NOW)).toBe('Fri, Oct 23 · in class')
    expect(classworkMeta(row({ kind: 'assignment', submissionMode: 'none', status: 'no_turn_in', dueAt: null }), NOW)).toBe('Done in class')
  })
})
