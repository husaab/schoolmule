import { describe, expect, it } from 'vitest'
import {
  buildRoster,
  emailedLine,
  filterRoster,
  generateErrorText,
  gradeBreakdown,
  normalizeProgressReport,
  parseGenerateResult,
  parseGradeList,
  reportLine,
  reportStatus,
  rosterCounts,
  selectionTargets,
  localDateISO,
} from './progressReportRoster'

const student = (studentId: string, name: string, grade: string | number | null) => ({ studentId, name, grade })
const report = (studentId: string, extra: Record<string, unknown> = {}) =>
  normalizeProgressReport({
    student_id: studentId,
    student_name: `Report ${studentId}`,
    term: 'Term 1',
    grade: '3',
    file_path: `pr/${studentId}.pdf`,
    generated_at: '2026-10-12T15:00:00Z',
    email_sent: false,
    ...extra,
  })

describe('normalizeProgressReport', () => {
  it('reads the snake_case rows the API returns, and camelCase too', () => {
    expect(report('s1')).toMatchObject({ studentId: 's1', filePath: 'pr/s1.pdf', grade: '3', emailSent: false })
    expect(normalizeProgressReport({ studentId: 's2', filePath: 'x.pdf', emailSent: true, grade: 4 })).toMatchObject({ studentId: 's2', filePath: 'x.pdf', emailSent: true, grade: '4' })
  })
})

describe('reportStatus', () => {
  it('tells none, ready, emailed and updated apart', () => {
    expect(reportStatus(null)).toBe('none')
    expect(reportStatus(report('a'))).toBe('ready')
    expect(reportStatus(report('a', { email_sent: true, email_sent_at: '2026-10-14T15:00:00Z' }))).toBe('emailed')
    // Regenerated after it was emailed: the family has the older PDF.
    expect(reportStatus(report('a', { email_sent: true, email_sent_at: '2026-10-14T15:00:00Z', generated_at: '2026-10-20T15:00:00Z' }))).toBe('updated')
    // A sent row without a date is plain "emailed".
    expect(reportStatus(report('a', { email_sent: true }))).toBe('emailed')
  })
})

describe('buildRoster', () => {
  const students = [student('s2', 'Zayd', 3), student('s1', 'Amina', 3), student('s3', 'Hana', 'JK'), student('s4', 'Nobody', null)]
  const reports = [report('s1'), report('gone', { grade: '5', student_name: 'Moved Away' })]

  it('lists every student once, with their report, grade by grade then by name', () => {
    const rows = buildRoster(students, reports)
    expect(rows.map((r) => r.name)).toEqual(['Hana', 'Amina', 'Zayd', 'Moved Away', 'Nobody'])
    expect(rows.find((r) => r.studentId === 's1')!.status).toBe('ready')
    expect(rows.find((r) => r.studentId === 's2')!.status).toBe('none')
  })

  it('keeps a report whose student left the list, so it can still be opened or deleted', () => {
    const gone = buildRoster(students, reports).find((r) => r.studentId === 'gone')!
    expect(gone.student).toBeNull()
    expect(gone.report?.filePath).toBe('pr/gone.pdf')
  })
})

describe('filters and counts', () => {
  const rows = buildRoster(
    [student('a', 'Adam', 3), student('b', 'Bilal', 3), student('c', 'Cyra', 4), student('d', 'Dawud', 4)],
    [
      report('a', { email_sent: true, email_sent_at: '2026-10-14T00:00:00Z' }),
      report('b'),
      report('c', { grade: '4', email_sent: true, email_sent_at: '2026-10-14T00:00:00Z', generated_at: '2026-10-20T00:00:00Z' }),
    ],
  )

  it('filters by grade, status and name; Emailed includes the updated ones', () => {
    expect(filterRoster(rows, { grades: ['3'], status: '', q: '' }).map((r) => r.studentId)).toEqual(['a', 'b'])
    expect(filterRoster(rows, { grades: [], status: 'emailed', q: '' }).map((r) => r.studentId)).toEqual(['a', 'c'])
    expect(filterRoster(rows, { grades: [], status: 'updated', q: '' }).map((r) => r.studentId)).toEqual(['c'])
    expect(filterRoster(rows, { grades: [], status: 'none', q: '' }).map((r) => r.studentId)).toEqual(['d'])
    expect(filterRoster(rows, { grades: [], status: '', q: ' bil ' }).map((r) => r.studentId)).toEqual(['b'])
    expect(parseGradeList('')).toEqual([])
    expect(parseGradeList('3,JK')).toEqual(['3', 'JK'])
  })

  it('counts the term and each grade', () => {
    expect(rosterCounts(rows)).toEqual({ total: 4, generated: 3, emailed: 2, ready: 1, none: 1, updated: 1 })
    expect(gradeBreakdown(rows).map((g) => [g.grade, g.counts.generated, g.counts.total])).toEqual([
      ['3', 2, 2],
      ['4', 1, 2],
    ])
  })

  it('works out what a selection can act on', () => {
    const t = selectionTargets(rows, ['a', 'b', 'd'])
    expect(t.generateIds).toEqual(['a', 'b', 'd'])
    expect(t.filePaths).toEqual(['pr/a.pdf', 'pr/b.pdf'])
    expect(t.emailIds).toEqual(['b'])
    expect(t.replacing).toBe(2)
  })

  it('says each row the way the list shows it', () => {
    const [a, b, c, d] = ['a', 'b', 'c', 'd'].map((id) => rows.find((r) => r.studentId === id)!)
    expect(reportLine(d)).toBe('Not generated')
    expect(reportLine(b)).toMatch(/^Generated Oct 1[12]$/)
    expect(reportLine(c)).toMatch(/^Updated Oct (19|20)$/)
    expect(emailedLine(a)).toMatch(/^Emailed Oct 1[34]$/)
    expect(emailedLine(c)).toMatch(/^Emailed Oct 1[34], before the update$/)
  })
})

describe('parseGenerateResult', () => {
  it('reads who was generated and who failed, with the reason', () => {
    expect(parseGenerateResult({ generated: [{ studentId: 'a', message: 'ok' }], failed: [{ studentId: 'b', error: 'Student not enrolled in any classes for Term 1' }] })).toEqual({
      generated: ['a'],
      failed: [{ studentId: 'b', error: 'Student not enrolled in any classes for Term 1' }],
    })
    expect(parseGenerateResult(null)).toEqual({ generated: [], failed: [] })
  })

  it('says the skip reasons in plain words', () => {
    expect(generateErrorText('Student not enrolled in any classes for Term 1', 'Term 1')).toBe('Not in any Term 1 class yet. Add them to a class, then generate again.')
    expect(generateErrorText('Puppeteer timed out', 'Term 1')).toBe('Puppeteer timed out')
  })
})

describe('localDateISO', () => {
  it("writes the device's own calendar date, zero-padded", () => {
    expect(localDateISO(new Date(2026, 10, 4, 23, 30))).toBe('2026-11-04')
    expect(localDateISO(new Date(2027, 0, 31, 0, 5))).toBe('2027-01-31')
  })
})
