import { describe, expect, it } from 'vitest'
import { generationCardText, summarizeRuns, withUnlistedReports } from './reportGeneration'
import type { ReportRun, ReportRunItemStatus } from '@/services/types/reportGeneration'

let seq = 0
// A run of students in the order given, each with its status.
function run(items: [string, ReportRunItemStatus, string?][], over: Partial<ReportRun> = {}): ReportRun {
  seq += 1
  const counts = { pending: 0, generated: 0, failed: 0, cancelled: 0 }
  for (const [, status] of items) counts[status === 'queued' || status === 'printing' ? 'pending' : status] += 1
  const active = items.some(([, status]) => status === 'queued' || status === 'printing')
  return {
    runId: `run-${seq}`,
    reportType: 'report_card',
    term: 'Term 1',
    studentCount: items.length,
    createdAt: `2026-11-07T10:${String(seq).padStart(2, '0')}:00Z`,
    finishedAt: active ? null : `2026-11-07T11:${String(seq).padStart(2, '0')}:00Z`,
    createdBy: 'me',
    createdByName: 'Office Admin',
    stalled: false,
    counts,
    items: items.map(([studentId, status, error]) => ({ studentId, status, error: error ?? null })),
    ...over,
  }
}
const many = (prefix: string, n: number, status: ReportRunItemStatus): [string, ReportRunItemStatus][] =>
  Array.from({ length: n }, (_, i) => [`${prefix}${i}`, status])

describe('summarizeRuns', () => {
  it('adds up every active run into one set of numbers', () => {
    const a = run([...many('a', 40, 'generated'), ...many('q', 60, 'queued')])
    const b = run(many('b', 63, 'queued'))
    const { active, finished } = summarizeRuns([a, b], 'me')
    expect(active).toMatchObject({ done: 40, total: 163, failed: 0, stalled: false, startedBy: [] })
    expect(active!.runIds).toEqual([a.runId, b.runId])
    expect(finished).toBeNull()
  })

  it('shows no card for one student alone', () => {
    const one = run([['s1', 'printing']])
    const s = summarizeRuns([one], 'me')
    expect(s.active).toBeNull()
    expect(s.finished).toBeNull()
    expect(s.waiting.get('s1')).toBe('printing')

    const done = run([['s2', 'generated']])
    expect(summarizeRuns([done], 'me').finished).toBeNull()
  })

  it('shows the card once two students are waiting across runs', () => {
    const s = summarizeRuns([run([['s1', 'queued']]), run([['s2', 'printing']])], 'me')
    expect(s.active).toMatchObject({ done: 0, total: 2 })
  })

  it("a student in a later run takes that run's state", () => {
    const first = run([['a', 'failed', 'No classes found'], ['b', 'generated']])
    const later = run([['a', 'generated'], ['c', 'generated']])
    const { finished } = summarizeRuns([first, later], 'me')
    expect(finished!.failed).toEqual([])
    expect(finished!.generatedIds.sort()).toEqual(['a', 'b', 'c'])
    expect(finished!.runIds).toEqual([first.runId, later.runId])
  })

  it('a student queued again is waiting, not failed', () => {
    const first = run([['a', 'failed', 'No classes found'], ['b', 'generated'], ['c', 'failed', 'Timed out']])
    const again = run([['a', 'queued']])
    const s = summarizeRuns([first, again], 'me')
    expect(s.waiting.get('a')).toBe('queued')
    expect(s.finished!.failed).toEqual([{ studentId: 'c', error: 'Timed out' }])
    expect(s.finished!.generatedIds).toEqual(['b'])
  })

  it('marks printing and queued apart in waiting', () => {
    const s = summarizeRuns([run([['a', 'printing'], ['b', 'queued'], ['c', 'generated']])], 'me')
    expect([...s.waiting.entries()]).toEqual([['a', 'printing'], ['b', 'queued']])
  })

  it('counts a stalled run', () => {
    const s = summarizeRuns([run(many('a', 3, 'queued')), run(many('b', 3, 'queued'), { stalled: true })], 'me')
    expect(s.active!.stalled).toBe(true)
  })

  it('names who started a run only when it is someone else', () => {
    const mine = run(many('a', 3, 'queued'))
    const theirs = run(many('b', 3, 'queued'), { createdBy: 'layla', createdByName: 'Layla Saleh' })
    const alsoTheirs = run(many('c', 3, 'queued'), { createdBy: 'layla', createdByName: 'Layla Saleh' })
    expect(summarizeRuns([mine], 'me').active!.startedBy).toEqual([])
    expect(summarizeRuns([mine, theirs, alsoTheirs], 'me').active!.startedBy).toEqual(['Layla Saleh'])
  })

  it('counts what a stopped run left out', () => {
    const stopped = run([['a', 'generated'], ['b', 'cancelled'], ['c', 'cancelled']])
    expect(summarizeRuns([stopped], 'me').finished).toMatchObject({ generatedIds: ['a'], failed: [], cancelled: 2 })
  })

  it('a finished run whose students are all waiting again shows no results', () => {
    const first = run([['a', 'failed', 'x'], ['b', 'failed', 'y']])
    const again = run([['a', 'queued'], ['b', 'queued']])
    const s = summarizeRuns([first, again], 'me')
    expect(s.finished).toBeNull()
    expect(s.active).toMatchObject({ done: 0, total: 2 })
  })
})

describe('withUnlistedReports', () => {
  it("keeps a student generating until the report list has their new report", () => {
    const active = run([['a', 'generated'], ['b', 'printing'], ['c', 'generated']])
    const { waiting } = summarizeRuns([active], 'me')
    const shown = withUnlistedReports(waiting, [active], (id) => id === 'c')
    expect([...shown.entries()].sort()).toEqual([['a', 'printing'], ['b', 'printing']])
  })

  it('leaves finished runs alone', () => {
    const done = run([['a', 'generated'], ['b', 'generated']])
    expect(withUnlistedReports(new Map(), [done], () => false).size).toBe(0)
  })
})

describe('generationCardText', () => {
  const doc = { noun: 'report card', nouns: 'report cards' }

  it('says how far it has got', () => {
    const { active } = summarizeRuns([run([...many('a', 41, 'generated'), ...many('q', 122, 'queued')])], 'me')
    expect(generationCardText(doc, { active, finished: null })).toEqual({ title: 'Generating report cards · 41 of 163', detail: 'This keeps going if you leave this page.' })
  })

  it('says when nothing has moved', () => {
    const { active } = summarizeRuns([run(many('q', 3, 'queued'), { stalled: true })], 'me')
    expect(generationCardText(doc, { active, finished: null }).detail).toBe(
      'No report has finished in 5 minutes. Nothing is lost, and it picks up again when the server is back. You can stop it and try later.',
    )
  })

  it('says what is ready and who was skipped', () => {
    const { finished } = summarizeRuns([run([...many('a', 161, 'generated'), ['x', 'failed', 'e'], ['y', 'failed', 'e']])], 'me')
    expect(generationCardText(doc, { active: null, finished }).title).toBe('161 report cards ready · 2 students skipped')
    const { finished: one } = summarizeRuns([run([['a', 'generated'], ['b', 'failed', 'e']])], 'me')
    expect(generationCardText(doc, { active: null, finished: one }).title).toBe('1 report card ready · 1 student skipped')
  })

  it('says a stop left some out', () => {
    const { finished } = summarizeRuns([run([['a', 'generated'], ['b', 'generated'], ['c', 'cancelled']])], 'me')
    expect(generationCardText(doc, { active: null, finished }).title).toBe('Stopped · 2 report cards ready · 1 not started')
  })
})
