import { describe, it, expect } from 'vitest'
import { STUDENT_NAV, isStudentNavActive } from './studentNav'
import { studentTone } from './studentTone'

describe('student nav', () => {
  it('starts with Home at /student', () => {
    expect(STUDENT_NAV[0]).toMatchObject({ href: '/student', label: 'Home' })
  })

  it('every entry is a student page', () => {
    for (const item of STUDENT_NAV) expect(item.href === '/student' || item.href.startsWith('/student/')).toBe(true)
  })

  it('Home is active only on /student itself', () => {
    expect(isStudentNavActive('/student', '/student')).toBe(true)
    expect(isStudentNavActive('/student', '/student/todo')).toBe(false)
  })

  it('other entries own their sub-pages', () => {
    expect(isStudentNavActive('/student/grades', '/student/grades')).toBe(true)
    expect(isStudentNavActive('/student/grades', '/student/grades/x')).toBe(true)
    expect(isStudentNavActive('/student/grades', '/student/gradesx')).toBe(false)
  })

  it('uses the indigo student tone', () => {
    expect(studentTone.primary).toBe('bg-indigo-600 hover:bg-indigo-700 text-white')
    expect(studentTone.navActive).toBe('bg-indigo-50 text-indigo-700 border-indigo-100')
    expect(studentTone.page).toBe('bg-slate-50')
    expect(studentTone.accentText).toBe('text-indigo-700')
  })
})
