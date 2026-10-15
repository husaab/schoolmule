import { describe, expect, it } from 'vitest'
import type { ClassPayload } from '@/services/types/class'
import { filterClasses, gradeOptions, knownOrAll, subjectOptions, teacherOptions } from './classListFilters'

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
