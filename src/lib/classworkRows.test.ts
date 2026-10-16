import { describe, it, expect } from 'vitest'
import {
  deleteItemMessage,
  deleteTopicMessage,
  groupClasswork,
  itemGradeLine,
  itemMeta,
  itemPill,
  itemRowHref,
  moveTopicOrder,
  parseKindFilter,
  parseTopicFilter,
} from './classworkRows'
import type { ItemSummary, Topic } from '@/services/types/classwork'

const NOW = new Date('2026-10-16T14:00:00.000Z') // Fri, Oct 16, 10 am in Toronto

const item = (over: Partial<ItemSummary> = {}): ItemSummary => ({
  itemId: 'i1',
  classId: 'c1',
  kind: 'assignment',
  title: 'Plant cell diagram',
  topicId: null,
  status: 'posted',
  effectiveStatus: 'posted',
  publishAt: null,
  postedAt: '2026-10-13T12:00:00.000Z',
  dueAt: '2026-10-16T19:30:00.000Z',
  date: '2026-10-16',
  submissionMode: 'file',
  showEarly: false,
  audience: 'all',
  gradebook: {
    assessmentId: 'a1',
    categoryId: 'cat1',
    categoryName: 'Homework',
    maxScore: 10,
    weightPoints: 4,
    isPublished: false,
    scoreCount: 0,
  },
  attachmentCount: 0,
  counts: { turnedIn: 12, missing: 2, notYet: 8, toReview: 12, drafts: 0, published: 0 },
  classAvgPct: null,
  createdAt: '2026-10-13T12:00:00.000Z',
  editedAt: null,
  ...over,
})

const assessment = (over: Partial<ItemSummary> = {}) =>
  item({
    kind: 'assessment',
    title: 'Unit 2 test',
    dueAt: null,
    date: '2026-10-23',
    submissionMode: 'none',
    gradebook: { ...item().gradebook!, categoryName: 'Tests', maxScore: 30 },
    counts: { turnedIn: 0, missing: 0, notYet: 0, toReview: 0, drafts: 0, published: 0 },
    ...over,
  })

const topic = (topicId: string, name: string, sortOrder: number, itemCount = 0): Topic => ({ topicId, name, sortOrder, itemCount })

describe('itemMeta', () => {
  it('an assignment: due, turned in, missing, not yet', () => {
    expect(itemMeta(item(), NOW)).toBe('Due Fri, Oct 16 · 12 turned in · 2 missing · 8 not yet')
  })

  it('leaves out the counts that are zero, and adds what is published', () => {
    expect(itemMeta(item({ counts: { turnedIn: 0, missing: 0, notYet: 22, toReview: 0, drafts: 0, published: 0 } }), NOW)).toBe(
      'Due Fri, Oct 16 · 0 turned in · 22 not yet',
    )
    expect(
      itemMeta(item({ dueAt: '2026-10-02T19:30:00.000Z', counts: { turnedIn: 0, missing: 0, notYet: 0, toReview: 0, drafts: 0, published: 22 } }), NOW),
    ).toBe('Due Oct 2 · 22 published')
  })

  it('says "all {n} published" once everyone it reaches is published', () => {
    const done = item({ dueAt: '2026-10-02T19:30:00.000Z', counts: { turnedIn: 0, missing: 0, notYet: 0, toReview: 0, drafts: 0, published: 22 } })
    expect(itemMeta(done, NOW, 22)).toBe('Due Oct 2 · all 22 published')
    expect(itemMeta(done, NOW, 24)).toBe('Due Oct 2 · 22 published')
  })

  it('an assignment with no due date or nothing to turn in', () => {
    expect(itemMeta(item({ dueAt: null, counts: { ...item().counts } }), NOW)).toBe(
      'No due date · 12 turned in · 2 missing · 8 not yet',
    )
    expect(itemMeta(item({ submissionMode: 'none' }), NOW)).toBe('Due Fri, Oct 16 · done in class')
  })

  it('a scheduled item says when it posts', () => {
    const scheduled = item({ status: 'scheduled', effectiveStatus: 'scheduled', publishAt: '2026-10-19T11:30:00.000Z', dueAt: '2026-10-21T19:30:00.000Z' })
    expect(itemMeta(scheduled, NOW)).toBe('Posts Mon, Oct 19 at 7:30 am · due Wed, Oct 21')
  })

  it('a draft is not posted yet', () => {
    expect(itemMeta(item({ status: 'draft', effectiveStatus: 'draft' }), NOW)).toBe('Not posted yet')
  })

  it('an assessment: in class on its date, on calendars or with its class average', () => {
    expect(itemMeta(assessment({ showEarly: true }), NOW)).toBe("In class · Fri, Oct 23 · shows on students' calendars")
    expect(itemMeta(assessment(), NOW)).toBe('In class · Fri, Oct 23')
    expect(
      itemMeta(assessment({ date: '2026-10-07', classAvgPct: 81.2, gradebook: { ...assessment().gradebook!, isPublished: true } }), NOW),
    ).toBe('In class · Oct 7 · class average 81%')
    expect(itemMeta(assessment({ date: null }), NOW)).toBe('In class')
  })

  it('a material says when it was posted', () => {
    expect(itemMeta(item({ kind: 'material', gradebook: null, dueAt: null, postedAt: '2026-10-09T15:00:00.000Z' }), NOW)).toBe(
      'Posted Oct 9',
    )
  })
})

describe('itemGradeLine', () => {
  it('reads "{Category} · out of {max}"', () => {
    expect(itemGradeLine(item())).toBe('Homework · out of 10')
    expect(itemGradeLine(item({ gradebook: { ...item().gradebook!, categoryName: null, categoryId: null } }))).toBe(
      'Counts on its own · out of 10',
    )
    expect(itemGradeLine(item({ gradebook: null }))).toBeNull()
  })
})

describe('itemPill', () => {
  it('Draft and Scheduled first', () => {
    expect(itemPill(item({ status: 'draft', effectiveStatus: 'draft' }), NOW).label).toBe('Draft')
    expect(itemPill(item({ status: 'scheduled', effectiveStatus: 'scheduled' }), NOW)).toEqual({
      label: 'Scheduled',
      className: 'bg-amber-100 text-amber-800',
    })
  })

  it('turned-in work waiting for a grade', () => {
    expect(itemPill(item(), NOW)).toEqual({ label: '12 to review', className: 'bg-cyan-100 text-cyan-800' })
  })

  it('Published once grades are out and nothing waits', () => {
    const published = item({ counts: { turnedIn: 0, missing: 0, notYet: 0, toReview: 0, drafts: 0, published: 22 }, gradebook: { ...item().gradebook!, isPublished: true } })
    expect(itemPill(published, NOW)).toEqual({ label: 'Published', className: 'bg-emerald-100 text-emerald-700' })
    expect(itemPill(assessment({ gradebook: { ...assessment().gradebook!, isPublished: true } }), NOW).label).toBe('Published')
  })

  it('an assessment still ahead is Upcoming; anything else live is Posted', () => {
    expect(itemPill(assessment(), NOW).label).toBe('Upcoming')
    expect(itemPill(assessment({ date: '2026-10-07' }), NOW).label).toBe('Posted')
    expect(itemPill(item({ kind: 'material', gradebook: null, counts: { turnedIn: 0, missing: 0, notYet: 0, toReview: 0, drafts: 0, published: 0 } }), NOW).label).toBe('Posted')
  })
})

describe('itemRowHref', () => {
  it('goes where the kind is worked on', () => {
    expect(itemRowHref(item())).toBe('/classes/c1/items/i1')
    expect(itemRowHref(assessment())).toBe('/classes/c1?tab=grades&focus=a1')
    expect(itemRowHref(item({ kind: 'material', gradebook: null }))).toBe('/classes/c1/items/i1/edit')
    expect(itemRowHref(item({ status: 'draft', effectiveStatus: 'draft' }))).toBe('/classes/c1/items/i1/edit')
  })
})

describe('groupClasswork', () => {
  const topics = [topic('t2', 'Unit 2 · Cells', 1), topic('t1', 'Unit 1 · Matter', 0)]
  const items = [
    item({ itemId: 'a', topicId: 't1' }),
    item({ itemId: 'b', topicId: null, kind: 'material', gradebook: null }),
    item({ itemId: 'c', topicId: 't2', kind: 'assessment' }),
    item({ itemId: 'd', topicId: 'gone' }),
  ]

  it('no topic first, then the topics in order; empty topics still show', () => {
    const sections = groupClasswork(topics, items, { topic: null, kind: null })
    expect(sections.map((s) => [s.topic?.topicId ?? null, s.items.map((i) => i.itemId)])).toEqual([
      [null, ['b', 'd']],
      ['t1', ['a']],
      ['t2', ['c']],
    ])
    expect(groupClasswork([topic('t9', 'Empty', 0)], [], { topic: null, kind: null }).map((s) => s.topic?.name)).toEqual(['Empty'])
  })

  it('a topic filter shows that section only', () => {
    expect(groupClasswork(topics, items, { topic: 't2', kind: null }).map((s) => s.topic?.topicId)).toEqual(['t2'])
    expect(groupClasswork(topics, items, { topic: 'none', kind: null }).map((s) => s.topic)).toEqual([null])
  })

  it('a type filter hides sections with nothing of that type', () => {
    const sections = groupClasswork(topics, items, { topic: null, kind: 'assessment' })
    expect(sections.map((s) => s.topic?.topicId ?? null)).toEqual(['t2'])
  })
})

describe('filters', () => {
  const topics = [topic('t1', 'Unit 1', 0)]
  it('reads the topic and type from the URL, ignoring unknown values', () => {
    expect(parseTopicFilter('t1', topics)).toBe('t1')
    expect(parseTopicFilter('none', topics)).toBe('none')
    expect(parseTopicFilter('zzz', topics)).toBeNull()
    expect(parseKindFilter('material')).toBe('material')
    expect(parseKindFilter('essay')).toBeNull()
  })
})

describe('moveTopicOrder', () => {
  const topics = [topic('a', 'A', 0), topic('b', 'B', 1), topic('c', 'C', 2)]
  it('swaps a topic with its neighbour', () => {
    expect(moveTopicOrder(topics, 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(moveTopicOrder(topics, 'b', 1)).toEqual(['a', 'c', 'b'])
  })
  it('is null at either end', () => {
    expect(moveTopicOrder(topics, 'a', -1)).toBeNull()
    expect(moveTopicOrder(topics, 'c', 1)).toBeNull()
  })
})

describe('delete messages', () => {
  it('a topic keeps its items', () => {
    expect(deleteTopicMessage(topic('t', 'Unit 2 · Cells', 0, 4))).toBe(
      'Delete Unit 2 · Cells? Its 4 items stay in Classwork without a topic.',
    )
    expect(deleteTopicMessage(topic('t', 'Unit 3', 0, 1))).toBe('Delete Unit 3? Its 1 item stays in Classwork without a topic.')
    expect(deleteTopicMessage(topic('t', 'Unit 4', 0, 0))).toBe('Delete Unit 4? It has nothing in it.')
  })

  it('a linked item takes its column and scores; an unlinked one just goes', () => {
    expect(deleteItemMessage(item({ gradebook: { ...item().gradebook!, scoreCount: 18 } }))).toBe(
      'Delete Plant cell diagram? This also removes the Homework column "Plant cell diagram" and its 18 scores from Grades.',
    )
    expect(deleteItemMessage(item({ gradebook: { ...item().gradebook!, scoreCount: 1, categoryName: null } }))).toBe(
      'Delete Plant cell diagram? This also removes the column "Plant cell diagram" and its 1 score from Grades.',
    )
    expect(deleteItemMessage(item({ gradebook: null }))).toBe('Delete Plant cell diagram? Students will no longer see it.')
    expect(
      deleteItemMessage(item({ gradebook: { ...item().gradebook!, scoreCount: 0 }, counts: { ...item().counts, drafts: 3 } })),
    ).toBe(
      'Delete Plant cell diagram? This also removes the Homework column "Plant cell diagram" and its 0 scores from Grades. It also deletes 3 grades on students\' work that aren\'t published yet.',
    )
    expect(deleteItemMessage(item({ gradebook: null, status: 'draft' }))).toBe(
      'Discard Plant cell diagram? It was never posted, so no one has seen it.',
    )
  })
})
