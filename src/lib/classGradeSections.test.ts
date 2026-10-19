import { describe, it, expect } from 'vitest'
import {
  allCollapsed,
  archivedOn,
  cardLabels,
  collapsedKey,
  filterByGrade,
  gradeChip,
  gradeFilterOptions,
  gradeKey,
  gradeRank,
  layoutClasses,
  layoutKeys,
  readCollapsed,
  sectionLabel,
  sectionToken,
  type LayoutCard,
} from './classGradeSections'

let seq = 0
const card = (over: Partial<LayoutCard> = {}): LayoutCard => ({
  classId: `c${++seq}`,
  grade: '5',
  subject: 'Math',
  termName: 'Term 1',
  teacherId: 'u1',
  teacherName: 'Hana Siddiqui',
  archivedAt: null,
  toReviewCount: 0,
  ...over,
})
const ids = (cards: { classId: string }[]) => cards.map((c) => c.classId)

describe('grades', () => {
  it('orders grades JK, SK, 1–8, then unknown, then no grade', () => {
    const keys = ['5', 'JK', '8', 'SK', '1', '7/8', null].map(gradeKey)
    expect([...keys].sort((a, b) => gradeRank(a) - gradeRank(b))).toEqual(['JK', 'SK', '1', '5', '8', '7/8', 'none'])
    expect(gradeKey(undefined)).toBe('none')
    expect(gradeKey('')).toBe('none')
    expect(gradeKey(5)).toBe('5')
  })

  it('labels sections and tokens', () => {
    expect(sectionLabel('JK')).toBe('Junior Kindergarten')
    expect(sectionLabel('SK')).toBe('Senior Kindergarten')
    expect(sectionLabel('5')).toBe('Grade 5')
    expect(sectionLabel('none')).toBe('No grade')
    expect(sectionToken('5')).toBe('5')
    expect(sectionToken('JK')).toBe('JK')
    expect(sectionToken('none')).toBe('–')
    expect(gradeChip('5')).toBe('Grade 5')
    expect(gradeChip('SK')).toBe('SK')
    expect(gradeChip(null)).toBeNull()
  })
})

describe('layoutClasses', () => {
  it("keeps a teacher's cards flat in grade order", () => {
    const g6 = card({ grade: '6' })
    const g4 = card({ grade: '4' })
    const g5a = card({ grade: '5', subject: 'Math' })
    const g5b = card({ grade: '5', subject: 'Science' })
    const layout = layoutClasses([g6, g4, g5a, g5b], { isAdmin: false, view: 'cards' })
    expect(layout.sectioned).toBe(false)
    expect(ids(layout.flat)).toEqual(ids([g4, g5a, g5b, g6]))
    expect(layout.sections).toEqual([])
    expect(layout.archived).toBeNull()
  })

  it("sections an admin's cards when there are two or more grades", () => {
    const jk = card({ grade: 'JK', subject: 'Homeroom' })
    const a = card({ grade: '5', toReviewCount: 8 })
    const b = card({ grade: '5', subject: 'Science', toReviewCount: 12 })
    const layout = layoutClasses([a, jk, b], { isAdmin: true, view: 'cards' })
    expect(layout.sectioned).toBe(true)
    expect(layout.flat).toEqual([])
    expect(layout.sections.map((s) => [s.key, s.label, s.token, ids(s.cards), s.reviewCount])).toEqual([
      ['JK', 'Junior Kindergarten', 'JK', [jk.classId], 0],
      ['5', 'Grade 5', '5', [a.classId, b.classId], 20],
    ])
  })

  it('drops the headers when only one grade is visible', () => {
    const layout = layoutClasses([card(), card({ subject: 'Science' })], { isAdmin: true, view: 'cards' })
    expect(layout.sectioned).toBe(false)
    expect(layout.flat).toHaveLength(2)
  })

  it('sections the List for teachers too', () => {
    const layout = layoutClasses([card({ grade: '4' }), card({ grade: '5' })], { isAdmin: false, view: 'list' })
    expect(layout.sectioned).toBe(true)
    expect(layout.sections.map((s) => s.key)).toEqual(['4', '5'])
  })

  it('puts a class with no grade in a last No grade section', () => {
    const none = card({ grade: null, subject: 'Choir' })
    const g8 = card({ grade: '8' })
    const layout = layoutClasses([none, g8], { isAdmin: true, view: 'cards' })
    expect(layout.sections.map((s) => [s.key, s.label, s.token])).toEqual([
      ['8', 'Grade 8', '8'],
      ['none', 'No grade', '–'],
    ])
  })

  it('collects archived cards in one Archived section', () => {
    const live = card({ grade: '4' })
    const old6 = card({ grade: '6', archivedAt: '2026-09-30T15:00:00Z', toReviewCount: 3 })
    const old2 = card({ grade: '2', archivedAt: '2026-09-01T15:00:00Z' })
    const layout = layoutClasses([live, old6, old2], { isAdmin: false, view: 'cards' })
    expect(ids(layout.flat)).toEqual([live.classId])
    expect(layout.archived?.key).toBe('archived')
    expect(layout.archived?.label).toBe('Archived')
    expect(ids(layout.archived?.cards ?? [])).toEqual([old2.classId, old6.classId])
    expect(layout.archived?.reviewCount).toBe(0)
    expect(layoutKeys(layout)).toEqual(['archived'])
  })

  it('lists every collapsible key, sections then Archived', () => {
    const layout = layoutClasses(
      [card({ grade: 'SK' }), card({ grade: '3' }), card({ grade: '3', archivedAt: '2026-09-30T15:00:00Z' })],
      { isAdmin: true, view: 'cards' },
    )
    expect(layoutKeys(layout)).toEqual(['SK', '3', 'archived'])
  })
})

describe('the Grade row', () => {
  const cards = [card({ grade: '5' }), card({ grade: 'JK' }), card({ grade: '5' }), card({ grade: '4' }), card({ grade: null })]

  it('offers grade options with counts in school order', () => {
    expect(gradeFilterOptions(cards)).toEqual([
      { value: 'JK', label: 'JK', count: 1 },
      { value: '4', label: 'Gr 4', count: 1 },
      { value: '5', label: 'Gr 5', count: 2 },
      { value: 'none', label: 'No grade', count: 1 },
    ])
  })

  it('filters to one grade, or keeps all', () => {
    expect(filterByGrade(cards, '5')).toEqual([cards[0], cards[2]])
    expect(filterByGrade(cards, 'none')).toEqual([cards[4]])
    expect(filterByGrade(cards, '')).toEqual(cards)
  })
})

describe('cardLabels', () => {
  it('labels twins by teacher', () => {
    const boys = card({ grade: '7', subject: 'Quran', teacherId: 'idris', teacherName: 'Idris Malik' })
    const girls = card({ grade: '7', subject: 'Quran', teacherId: 'amina', teacherName: 'Amina Farouk' })
    const sk = card({ grade: 'SK', subject: 'Quran', teacherId: 'amina', teacherName: 'Amina Farouk' })
    const labels = cardLabels([sk, boys, girls], { isAdmin: false })
    expect(labels.get(boys.classId)).toEqual({ showTeacher: true, termChip: null, railSuffix: 'Idris Malik' })
    expect(labels.get(girls.classId)).toEqual({ showTeacher: true, termChip: null, railSuffix: 'Amina Farouk' })
    expect(labels.get(sk.classId)).toEqual({ showTeacher: false, termChip: null, railSuffix: null })
  })

  it('labels twins by term', () => {
    const t1 = card({ termName: 'Term 1' })
    const t2 = card({ termName: 'Term 2' })
    const labels = cardLabels([t1, t2], { isAdmin: false })
    expect(labels.get(t1.classId)).toEqual({ showTeacher: false, termChip: 'Term 1', railSuffix: 'Term 1' })
    expect(labels.get(t2.classId)).toEqual({ showTeacher: false, termChip: 'Term 2', railSuffix: 'Term 2' })
  })

  it('always shows the teacher to admins', () => {
    const only = card()
    expect(cardLabels([only], { isAdmin: true }).get(only.classId)).toEqual({ showTeacher: true, termChip: null, railSuffix: null })
  })

  it('matches twins ignoring case and spaces', () => {
    const a = card({ subject: 'Math ', teacherId: 'u1' })
    const b = card({ subject: 'math', teacherId: 'u2', teacherName: 'Omar Shah' })
    expect(cardLabels([a, b], { isAdmin: false }).get(b.classId)?.showTeacher).toBe(true)
  })

  it('leaves twins with the same teacher and term unlabelled', () => {
    const a = card()
    const b = card()
    expect(cardLabels([a, b], { isAdmin: false }).get(a.classId)).toEqual({ showTeacher: false, termChip: null, railSuffix: null })
  })
})

describe('archivedOn', () => {
  it('formats an archive date on the Toronto calendar', () => {
    expect(archivedOn('2026-10-01T02:00:00Z')).toBe('Sep 30')
    expect(archivedOn('2026-10-19T15:00:00Z')).toBe('Oct 19')
  })
})

describe('collapsed grades', () => {
  it('reads remembered collapsed grades, ignoring junk', () => {
    expect(readCollapsed('["JK","5"]')).toEqual(new Set(['JK', '5']))
    expect(readCollapsed('[1,"5",null]')).toEqual(new Set(['5']))
    expect(readCollapsed(null)).toEqual(new Set())
    expect(readCollapsed('nope')).toEqual(new Set())
    expect(readCollapsed('{"a":1}')).toEqual(new Set())
    expect(collapsedKey('PLAYGROUND', 'u1')).toBe('classes-collapsed:PLAYGROUND:u1')
  })

  it('knows when every section is collapsed', () => {
    expect(allCollapsed([], new Set())).toBe(false)
    expect(allCollapsed(['JK', 'archived'], new Set(['JK']))).toBe(false)
    expect(allCollapsed(['JK', 'archived'], new Set(['JK', 'archived', '5']))).toBe(true)
  })
})
