import { describe, expect, it } from 'vitest'
import { SALAAT_RATINGS, isSalaatDone, salaatByGrade, salaatProgress } from './salaat'

const s = (grade: string, workHabit: '' | 'E' | 'G' = '', behavior: '' | 'E' | 'S' = '') => ({ grade, workHabit, behavior })

describe('salaat', () => {
  it('offers the E/G/S/N scale with full names on hover', () => {
    expect(SALAAT_RATINGS.map((r) => r.value)).toEqual(['E', 'G', 'S', 'N'])
    expect(SALAAT_RATINGS[3].title).toBe('N - Needs Improvement')
  })

  it('counts a student done once both ratings are picked', () => {
    expect(isSalaatDone(s('4', 'E', 'S'))).toBe(true)
    expect(isSalaatDone(s('4', 'E'))).toBe(false)
    expect(isSalaatDone(s('4', '', 'S'))).toBe(false)
    expect(salaatProgress([s('4', 'E', 'S'), s('4', 'G'), s('5')])).toEqual({ done: 1, total: 3 })
    expect(salaatProgress([])).toEqual({ done: 0, total: 0 })
  })

  it('groups the list by grade in its order', () => {
    expect(salaatByGrade([s('4'), s('4'), s('5')]).map((g) => [g.grade, g.students.length])).toEqual([['4', 2], ['5', 1]])
  })
})
