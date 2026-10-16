import { describe, it, expect } from 'vitest'
import {
  parentClassesHref,
  parentItemHref,
  parseParentClassTab,
  parseStudentClassTab,
  studentClassHref,
  studentGradesHref,
  studentItemHref,
  studentMessageHref,
} from './portalRoutes'

describe('student class links', () => {
  it('leaves the Stream as the bare URL', () => {
    expect(studentClassHref('c1')).toBe('/student/classes/c1')
    expect(studentClassHref('c1', 'stream')).toBe('/student/classes/c1')
  })

  it('adds the tab and other params', () => {
    expect(studentClassHref('c1', 'grades')).toBe('/student/classes/c1?tab=grades')
    expect(studentClassHref('c1', 'stream', { announcement: 'a1' })).toBe('/student/classes/c1?announcement=a1')
    expect(studentClassHref('c1', 'people', { x: '' })).toBe('/student/classes/c1?tab=people')
  })

  it('reads a tab, falling back to the Stream', () => {
    expect(parseStudentClassTab('people')).toBe('people')
    expect(parseStudentClassTab('settings')).toBe('stream')
    expect(parseStudentClassTab(null)).toBe('stream')
  })
})

describe('other student links', () => {
  it('builds the Grades link', () => {
    expect(studentGradesHref()).toBe('/student/grades')
    expect(studentGradesHref({ classId: 'c1' })).toBe('/student/grades?class=c1')
    expect(studentGradesHref({ classId: 'c1', termId: 't1' })).toBe('/student/grades?class=c1&term=t1')
  })

  it('builds item and message links', () => {
    expect(studentItemHref('i1')).toBe('/student/items/i1')
    expect(studentMessageHref({ teacherId: 't1', classId: 'c1' })).toBe('/student/messages?compose=1&teacher=t1&class=c1')
  })
})

describe('parent links', () => {
  it('builds the Classes link', () => {
    expect(parentClassesHref()).toBe('/parent/classes')
    expect(parentClassesHref({ classId: 'c1' })).toBe('/parent/classes?class=c1')
    expect(parentClassesHref({ classId: 'c1', tab: 'grades' })).toBe('/parent/classes?class=c1&tab=grades')
    expect(parentClassesHref({ classId: 'c1', tab: 'stream' })).toBe('/parent/classes?class=c1')
  })

  it('reads a tab, falling back to the Stream', () => {
    expect(parseParentClassTab('classwork')).toBe('classwork')
    expect(parseParentClassTab('people')).toBe('stream')
  })

  it('builds the lens item link', () => {
    expect(parentItemHref('s1', 'i1')).toBe('/parent/classes/s1/items/i1')
  })
})
