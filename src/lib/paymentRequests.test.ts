import { describe, it, expect } from 'vitest'
import {
  audienceStudents, audienceSummary, dueStatus, emptyTarget, formatDay, gradeLabel, monthIn, monthShort, monthsPeak,
  requestDraftProblem, rosterGrades, settledPercent, targetIsEmpty, todayIso,
} from './paymentRequests'
import type { PaymentsRoster } from '@/services/types/payments'

const roster: PaymentsRoster = {
  students: [
    { studentId: 'a', name: 'Aisha', grade: '5', classIds: [], hasGuardianEmail: true },
    { studentId: 'o', name: 'Omar', grade: '5', classIds: [], hasGuardianEmail: true },
    { studentId: 'y', name: 'Yusuf', grade: '6', classIds: ['sci'], hasGuardianEmail: false },
    { studentId: 'j', name: 'Jana', grade: 'JK', classIds: [], hasGuardianEmail: true },
  ],
  classes: [{ classId: 'sci', name: 'Science', grade: '6', teacherName: 'Ms T', studentCount: 1 }],
}

describe('who a request goes to', () => {
  it('names grades and lists them in school order', () => {
    expect(gradeLabel('5')).toBe('Grade 5')
    expect(gradeLabel('JK')).toBe('JK')
    expect(gradeLabel(null)).toBe('')
    expect(rosterGrades(roster)).toEqual(['JK', '5', '6'])
  })

  it('takes grades, classes and picked students once each', () => {
    expect(audienceStudents(roster, { grades: ['5'], classIds: ['sci'], studentIds: ['a'] }).map((s) => s.studentId)).toEqual(['a', 'o', 'y'])
    expect(audienceStudents(roster, emptyTarget())).toEqual([])
    expect(targetIsEmpty(emptyTarget())).toBe(true)
    expect(targetIsEmpty({ studentIds: ['a'] })).toBe(false)
  })

  it('says who in words', () => {
    expect(audienceSummary(roster, emptyTarget())).toBe('Nobody yet')
    expect(audienceSummary(roster, { grades: ['5'] })).toBe('Grade 5')
    expect(audienceSummary(roster, { grades: ['5'], classIds: ['sci'], studentIds: ['j', 'a'] })).toBe('Grade 5, Science (Grade 6) and 2 students')
    expect(audienceSummary(roster, { studentIds: ['j'] })).toBe('1 student')
  })
})

describe('a request’s draft', () => {
  it('needs a name and an amount Stripe can take', () => {
    expect(requestDraftProblem({ title: ' ', amountText: '35', dueDate: '' })).toMatch(/name/)
    expect(requestDraftProblem({ title: 'Trip', amountText: '0.25', dueDate: '' })).toMatch(/\$0\.50/)
    expect(requestDraftProblem({ title: 'Trip', amountText: 'abc', dueDate: '' })).toMatch(/amount/)
    expect(requestDraftProblem({ title: 'Trip', amountText: '35', dueDate: '12/12' })).toMatch(/date/)
    expect(requestDraftProblem({ title: 'Trip', amountText: '35.00', dueDate: '2026-12-12' })).toBeNull()
  })
})

describe('progress and dates', () => {
  it('works out the settled share', () => {
    expect(settledPercent({ settled: 1, students: 3 })).toBe(33)
    expect(settledPercent({ settled: 2, count: 2 })).toBe(100)
    expect(settledPercent({ settled: 0, students: 0 })).toBe(0)
  })

  it('says when something is due', () => {
    expect(dueStatus(null)).toBeNull()
    expect(dueStatus('2026-12-12', '2026-11-27')).toEqual({ label: 'Due Dec 12', tone: 'neutral' })
    expect(dueStatus('2026-11-30', '2026-11-27')).toEqual({ label: 'Due Nov 30', tone: 'soon' })
    expect(dueStatus('2026-11-28', '2026-11-27')).toEqual({ label: 'Due tomorrow', tone: 'soon' })
    expect(dueStatus('2026-11-27', '2026-11-27')).toEqual({ label: 'Due today', tone: 'soon' })
    expect(dueStatus('2026-11-26', '2026-11-27')).toEqual({ label: '1 day overdue', tone: 'overdue' })
    expect(dueStatus('2026-11-20', '2026-11-27')).toEqual({ label: '7 days overdue', tone: 'overdue' })
  })

  it('shows a date as written, and today in school time', () => {
    expect(formatDay('2026-12-12')).toBe('Dec 12, 2026')
    expect(formatDay(null)).toBe('')
    // 03:00 UTC on 1 December is still 30 November in Toronto.
    expect(todayIso(new Date('2026-12-01T03:00:00Z'))).toBe('2026-11-30')
  })

  it('scales the months chart', () => {
    const months = [
      { month: '2026-10', cardCents: 1000, officeCents: 500, refundedCents: 0, stripeFeeCents: 40 },
      { month: '2026-11', cardCents: 0, officeCents: 0, refundedCents: 0, stripeFeeCents: 0 },
    ]
    expect(monthShort('2026-11')).toBe('Nov')
    expect(monthIn(months[0])).toBe(1500)
    expect(monthsPeak(months)).toBe(1500)
    expect(monthsPeak([months[1]])).toBe(1)
  })
})
