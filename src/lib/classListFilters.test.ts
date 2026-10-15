import { describe, expect, it } from 'vitest'
import type { ClassPayload } from '@/services/types/class'
import { classPickerOptions, currentTermClasses, filterClasses, gradeOptions, knownOrAll, subjectOptions, teacherOptions } from './classListFilters'

const cls = (over: Partial<ClassPayload>): ClassPayload => ({
  classId: Math.random().toString(36),
  school: 'test',
  grade: 1,
  subject: 'Math',
  teacherName: 'Teacher A',
  teacherId: 't-a',
  termId: 'term-1',
  termName: 'Term 1',
  createdAt: '',
  lastModifiedAt: '',
  additionalTeachers: [],
  ...over,
})

const classes = [
  cls({ subject: 'Math', grade: 2 }),
  cls({ subject: 'Art', grade: 'JK', teacherId: 't-b', teacherName: 'Teacher B' }),
  cls({
    subject: 'Science',
    grade: 2,
    termName: 'Term 2',
    additionalTeachers: [{ teacherId: 't-c', fullName: 'Teacher C', email: 'c@example.test', addedAt: '' }],
  }),
]
const all = { subject: '', teacher: '', grade: '', term: 'all' }

describe('classListFilters', () => {
  it('builds sorted subject and de-duplicated teacher options incl. co-teachers', () => {
    expect(subjectOptions(classes).map((o) => o.label)).toEqual(['Art', 'Math', 'Science'])
    expect(teacherOptions(classes).map((o) => o.value)).toEqual(['t-a', 't-b', 't-c'])
  })

  it('only offers grades that have classes, in school order', () => {
    expect(gradeOptions(classes).map((g) => g.value)).toEqual(['JK', 2])
  })

  it('teacher filter matches lead or co-teacher, admins only', () => {
    const f = { ...all, teacher: 't-c' }
    expect(filterClasses(classes, f, { isAdmin: true }).map((c) => c.subject)).toEqual(['Science'])
    expect(filterClasses(classes, f, { isAdmin: false })).toHaveLength(3)
  })

  it('combines subject, grade and active-term filters', () => {
    expect(filterClasses(classes, { ...all, grade: '2' }, { isAdmin: true })).toHaveLength(2)
    expect(filterClasses(classes, { ...all, subject: 'Art' }, { isAdmin: true })).toHaveLength(1)
    expect(filterClasses(classes, { ...all, term: 'active' }, { isAdmin: true, activeTermName: 'Term 2' })).toHaveLength(1)
  })
})

describe('knownOrAll', () => {
  it('drops values that match no option', () => {
    expect(knownOrAll('Math', ['Math', 'Art'])).toBe('Math')
    expect(knownOrAll('Gym', ['Math'])).toBe('')
  })
})

describe('class picker scoping', () => {
  const pick = [
    cls({ classId: 'a1', subject: 'Arabic', grade: 1, termName: 'Term 1' }),
    cls({ classId: 'a2', subject: 'Arabic', grade: 1, termName: 'Term 2' }),
    cls({ classId: 'q1', subject: 'Quran', grade: 1, termName: 'Term 1', teacherName: 'Teacher A' }),
    cls({ classId: 'q2', subject: 'Quran', grade: 1, termName: 'Term 1', teacherName: 'Teacher B' }),
  ]
  it('keeps only the active term, plus a deep-linked class', () => {
    expect(currentTermClasses(pick, 'Term 1').map((c) => c.classId)).toEqual(['a1', 'q1', 'q2'])
    expect(currentTermClasses(pick, 'Term 1', 'a2')).toHaveLength(4)
    expect(currentTermClasses(pick, undefined)).toHaveLength(4)
  })
  it('labels other-term classes by term and same-term twins by teacher', () => {
    expect(classPickerOptions(pick, 'Term 1').map((o) => o.label)).toEqual([
      'Arabic · Gr 1',
      'Arabic · Gr 1 · Term 2',
      'Quran · Gr 1 · Teacher A',
      'Quran · Gr 1 · Teacher B',
    ])
  })
})
