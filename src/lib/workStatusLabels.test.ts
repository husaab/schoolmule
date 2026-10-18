import { describe, it, expect } from 'vitest'
import { displayStatus, rowScoreText, workStatusLabel, type DisplayStatus } from './workStatusLabels'
import type { WorkStatus } from '@/services/types/studentPortal'

describe('workStatusLabel', () => {
  it('gives every status the brief label and colors', () => {
    const expected: Record<DisplayStatus, [string, string]> = {
      assigned: ['Assigned', 'bg-slate-100 text-slate-600'],
      ready: ['Ready to turn in', 'bg-indigo-50 text-indigo-800'],
      turned_in: ['Turned in', 'bg-emerald-100 text-emerald-700'],
      graded: ['Graded', 'bg-indigo-100 text-indigo-800'],
      missing: ['Missing', 'bg-rose-100 text-rose-700'],
      excused: ['Excused', 'bg-stone-100 text-stone-600'],
      material: ['To read', 'bg-stone-100 text-stone-600'],
      no_turn_in: ['', ''],
    }
    for (const [status, [label, pill]] of Object.entries(expected)) {
      const got = workStatusLabel(status as DisplayStatus)
      expect(got.label, status).toBe(label)
      expect(got.pill, status).toBe(pill)
      expect(got.suffix, status).toBeNull()
    }
  })

  it('adds " · late" in amber to a turned-in item that was late', () => {
    const late = workStatusLabel('turned_in', true)
    expect(late.label).toBe('Turned in')
    expect(late.pill).toBe('bg-emerald-100 text-emerald-700')
    expect(late.suffix).toBe(' · late')
    expect(late.suffixClass).toBe('text-amber-800')
  })

  it('shows lateness only on a turned-in item', () => {
    for (const status of ['assigned', 'ready', 'graded', 'missing', 'excused', 'material', 'no_turn_in'] as DisplayStatus[]) {
      expect(workStatusLabel(status, true).suffix, status).toBeNull()
    }
    expect(workStatusLabel('turned_in', false).suffix).toBeNull()
  })

  it('adds a score after Graded', () => {
    const graded = workStatusLabel('graded', false, '8/10')
    expect(graded.label).toBe('Graded')
    expect(graded.suffix).toBe(' · 8/10')
    expect(graded.suffixClass).toBe('')
  })

  it('ignores a score on any other status', () => {
    expect(workStatusLabel('missing', false, '8/10').suffix).toBeNull()
    expect(workStatusLabel('graded', false, null).suffix).toBeNull()
  })

  it('has no pill for work with nothing to turn in', () => {
    expect(workStatusLabel('no_turn_in').label).toBe('')
  })
})

describe('displayStatus', () => {
  it('is "ready" only for assigned work that has something added', () => {
    expect(displayStatus('assigned', true)).toBe('ready')
    expect(displayStatus('assigned', false)).toBe('assigned')
  })

  it('leaves every other status as it is, work or not', () => {
    const others: WorkStatus[] = ['missing', 'turned_in', 'graded', 'excused', 'no_turn_in', 'material']
    for (const status of others) {
      expect(displayStatus(status, true), status).toBe(status)
      expect(displayStatus(status, false), status).toBe(status)
    }
  })

  it('keeps Missing as Missing once a late file is added', () => {
    expect(displayStatus('missing', true)).toBe('missing')
  })
})

describe('rowScoreText', () => {
  it('writes a published score as score/max', () => {
    expect(rowScoreText({ status: 'graded', score: 8, maxScore: 10 })).toBe('8/10')
    expect(rowScoreText({ status: 'graded', score: 13.5, maxScore: 15 })).toBe('13.5/15')
  })

  it('has no score text for feedback only, missing or excused', () => {
    expect(rowScoreText({ status: 'graded', score: null, maxScore: null })).toBeNull()
    expect(rowScoreText({ status: 'missing', score: null, maxScore: 10 })).toBeNull()
    expect(rowScoreText({ status: 'excused', score: null, maxScore: 10 })).toBeNull()
    expect(rowScoreText(null)).toBeNull()
  })
})
