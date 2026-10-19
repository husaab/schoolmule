import { describe, expect, it } from 'vitest'
import { DEFAULT_TRANSIENT_KEYS } from './filterMemory'
import {
  STUDENT_PROFILE_PARAMS,
  hrefWithQuery,
  readStudentProfile,
  withStudentProfile,
  withStudentView,
  withoutStudentProfile,
} from './studentProfileUrl'

describe('studentProfileUrl', () => {
  it('opens a profile over the page, keeping its filters', () => {
    expect(withStudentProfile('grade=7&q=ali', 's1')).toBe('grade=7&q=ali&profile=s1')
    expect(withStudentProfile('', 's1', { tab: 'grades', term: 't2' })).toBe('profile=s1&profileTab=grades&profileTerm=t2')
  })

  it('replaces a previously open profile and its view', () => {
    expect(withStudentProfile('grade=7&profile=old&profileTab=reports&profileClass=c1', 'new')).toBe('grade=7&profile=new')
  })

  it('patches the view, removing keys set to null or empty', () => {
    const qs = 'grade=7&profile=s1&profileTab=grades&profileClass=c1'
    expect(withStudentView(qs, { tab: 'attendance', classId: null })).toBe('grade=7&profile=s1&profileTab=attendance')
    expect(withStudentView(qs, { term: 't3' })).toBe('grade=7&profile=s1&profileTab=grades&profileClass=c1&profileTerm=t3')
    expect(withStudentView(qs, { tab: '' })).toBe('grade=7&profile=s1&profileClass=c1')
  })

  it('closes the profile and leaves the page params alone', () => {
    expect(withoutStudentProfile('grade=7&profile=s1&profileTab=grades&profileTerm=t&profileClass=c')).toBe('grade=7')
    expect(withoutStudentProfile('profile=s1')).toBe('')
  })

  it('reads the open profile', () => {
    expect(readStudentProfile(new URLSearchParams('grade=7'))).toBeNull()
    expect(readStudentProfile(new URLSearchParams('profile=s1&profileTerm=t2'))).toEqual({
      studentId: 's1',
      tab: null,
      term: 't2',
      classId: null,
    })
  })

  it('builds hrefs without a dangling ?', () => {
    expect(hrefWithQuery('/students', '')).toBe('/students')
    expect(hrefWithQuery('/students', 'profile=s1')).toBe('/students?profile=s1')
  })

  it('never lets filter memory remember an open profile', () => {
    for (const key of Object.values(STUDENT_PROFILE_PARAMS)) expect(DEFAULT_TRANSIENT_KEYS).toContain(key)
  })
})
