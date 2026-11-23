import { describe, expect, it } from 'vitest'
import {
  fromDraft,
  layoutProblem,
  moveItem,
  parseClassNames,
  placeOf,
  toDraft,
  uncoveredSubjects,
  type LayoutSection,
} from './subjectHeadings'

const LAYOUT: LayoutSection[] = [
  { heading: 'Language & Literacy', subjects: [{ name: 'English Language Arts', classes: ['English'] }] },
  {
    heading: 'Religious Studies',
    subjects: [
      { name: 'Quran', classes: ['Quran', 'Quran Teaching'] },
      { name: 'Salaat', classes: [] },
    ],
  },
]

describe('subject headings', () => {
  it('reads typed class names: tidied, no blanks or repeats', () => {
    expect(parseClassNames(' Quran ,, quran,  Quran   Teaching ,')).toEqual(['Quran', 'Quran Teaching'])
    expect(parseClassNames('  ')).toEqual([])
  })

  it('round-trips a layout through the draft', () => {
    const draft = toDraft(LAYOUT)
    expect(draft[1].subjects[0].classes).toBe('Quran, Quran Teaching')
    expect(new Set(draft.flatMap((s) => [s.key, ...s.subjects.map((x) => x.key)])).size).toBe(5)
    expect(fromDraft(draft)).toEqual(LAYOUT)
    draft[0].heading = '  Language   Arts '
    expect(fromDraft(draft)[0].heading).toBe('Language Arts')
  })

  it('finds where a class prints, ignoring case and spaces; its own name with no class names', () => {
    expect(placeOf(LAYOUT, ' english ')).toEqual({ heading: 'Language & Literacy', name: 'English Language Arts' })
    expect(placeOf(LAYOUT, 'quran teaching')).toEqual({ heading: 'Religious Studies', name: 'Quran' })
    expect(placeOf(LAYOUT, 'Salaat')).toEqual({ heading: 'Religious Studies', name: 'Salaat' })
    expect(placeOf(LAYOUT, 'Math')).toBeNull()
  })

  it('lists the class subjects no heading covers, none without a layout', () => {
    expect(uncoveredSubjects(LAYOUT, ['English', 'Math', 'Salaat', 'Art'])).toEqual(['Math', 'Art'])
    expect(uncoveredSubjects([], ['Math'])).toEqual([])
  })

  it('moves one place and stops at the ends', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b'])
    const list = ['a', 'b']
    expect(moveItem(list, 0, -1)).toBe(list)
    expect(moveItem(list, 1, 1)).toBe(list)
  })

  it.each([
    [[], 'Add at least one heading'],
    [[{ heading: '', subjects: [{ name: 'Math', classes: [] }] }], 'Every heading needs a name'],
    [[{ heading: 'Math', subjects: [] }], 'Add a subject under "Math"'],
    [[{ heading: 'Math', subjects: [{ name: '', classes: [] }] }], 'Every subject under "Math" needs a name'],
    [
      [{ heading: 'A', subjects: [{ name: 'X', classes: [] }] }, { heading: 'a', subjects: [{ name: 'Y', classes: [] }] }],
      '"a" is in the list twice',
    ],
    [
      [{ heading: 'A', subjects: [{ name: 'Visual Arts', classes: ['Art'] }, { name: 'art', classes: [] }] }],
      'Classes named "art" are under both "Visual Arts" and "art". Keep them under one.',
    ],
  ])('says what stops %j saving, as the API does', (sections, problem) => {
    expect(layoutProblem(sections as LayoutSection[])).toBe(problem)
  })

  it('has nothing to say about a good layout', () => {
    expect(layoutProblem(LAYOUT)).toBeNull()
  })
})
