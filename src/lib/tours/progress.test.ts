// The same cases as the backend's __tests__/unit/services/tourProgress.test.js.
import { describe, expect, it } from 'vitest'
import { applyEvent } from './progress'
import type { TourProgress } from './types'

const NOW = new Date('2026-11-24T15:00:00Z')
const row = (over: Partial<TourProgress> = {}): TourProgress => ({
  tourId: 't', status: 'in_progress', version: 1, stepIndex: 2, stepId: 'classes', snoozedUntil: null, completedAt: null, ...over,
})
const apply = (r: TourProgress | undefined, event: Parameters<typeof applyEvent>[2]['event'], version = 1, stepIndex: number | null = null, stepId: string | null = null) =>
  applyEvent('t', r, { event, version, stepIndex, stepId }, NOW)

describe('applyEvent', () => {
  it('creates an offered row on the first event', () => {
    expect(apply(undefined, 'offered')).toEqual({ tourId: 't', status: 'offered', version: 1, stepIndex: 0, stepId: null, snoozedUntil: null, completedAt: null })
  })
  it('offered never downgrades', () => {
    expect(apply(row(), 'offered')).toEqual(row())
  })
  it('started reopens a finished tour', () => {
    expect(apply(row({ status: 'completed', completedAt: 'x' }), 'started', 1, 0)).toMatchObject({ status: 'in_progress', stepIndex: 0, completedAt: null })
  })
  it('step, paused and resumed never reopen a closed tour', () => {
    expect(apply(row(), 'step', 1, 4, 'messages')).toMatchObject({ status: 'in_progress', stepIndex: 4, stepId: 'messages' })
    expect(apply(row({ status: 'completed' }), 'step', 1, 1)).toMatchObject({ status: 'completed', stepIndex: 2 })
    expect(apply(row({ status: 'dismissed' }), 'resumed', 1, 1)).toMatchObject({ status: 'dismissed' })
  })
  it('a missing step index keeps the current step and its id', () => {
    expect(apply(row(), 'resumed')).toMatchObject({ stepIndex: 2, stepId: 'classes' })
  })
  it('completed stamps the time; dismissed keeps a completed tour completed', () => {
    expect(apply(row(), 'completed')).toMatchObject({ status: 'completed', completedAt: NOW.toISOString() })
    expect(apply(row({ status: 'offered' }), 'dismissed')).toMatchObject({ status: 'dismissed' })
    expect(apply(row({ status: 'completed' }), 'dismissed')).toMatchObject({ status: 'completed' })
  })
  it('snoozed asks again in three days', () => {
    expect(apply(row({ status: 'offered' }), 'snoozed')).toMatchObject({ status: 'offered', snoozedUntil: '2026-11-27T15:00:00.000Z' })
  })
  it('a newer version starts over; an older one (an old tab) changes nothing', () => {
    expect(apply(row({ status: 'completed' }), 'offered', 2)).toEqual({ tourId: 't', status: 'offered', version: 2, stepIndex: 0, stepId: null, snoozedUntil: null, completedAt: null })
    const v2 = row({ version: 2, status: 'completed' })
    expect(apply(v2, 'step', 1, 0)).toEqual(v2)
    const open = row({ version: 2, status: 'offered' })
    expect(apply(open, 'completed', 1, 3)).toEqual(open)
    expect(apply(open, 'started', 1, 0)).toEqual(open)
  })
})
