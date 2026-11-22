// src/lib/tours/progress.ts
// How a tour event moves a person's progress. The server applies the same
// rule (schoolmule-backend services/tours/tourProgress.js) and its answer
// wins; this copy only makes the change show at once. Keep the two in step:
// progress.test.ts and the backend's tourProgress.test.js check the same cases.

import type { TourEvent, TourProgress, TourId } from './types'

export const SNOOZE_DAYS = 3
const DAY_MS = 24 * 60 * 60 * 1000

export interface EventInput {
  event: TourEvent
  version: number
  stepIndex: number | null
  stepId?: string | null
}

export function applyEvent(tourId: TourId, row: TourProgress | undefined, { event, version, stepIndex, stepId = null }: EventInput, now: Date): TourProgress {
  // An event from an older version of the tour (an old tab) changes nothing.
  if (row && version < row.version) return row
  const fresh = !row || version > row.version
  const base: TourProgress = fresh
    ? { tourId, status: 'offered', version, stepIndex: 0, stepId: null, snoozedUntil: null, completedAt: null }
    : { ...row }
  const closed = base.status === 'completed' || base.status === 'dismissed'
  const moved = stepIndex !== null && Number.isInteger(stepIndex) && stepIndex >= 0
  const at = moved ? stepIndex : base.stepIndex
  const atId = moved ? stepId : (base.stepId ?? null)

  switch (event) {
    case 'offered':
      return base
    case 'started':
      return { ...base, status: 'in_progress', stepIndex: at, stepId: atId, snoozedUntil: null, completedAt: null }
    case 'step':
    case 'paused':
    case 'resumed':
      return closed ? base : { ...base, status: 'in_progress', stepIndex: at, stepId: atId }
    case 'completed':
      return { ...base, status: 'completed', completedAt: now.toISOString(), snoozedUntil: null }
    case 'dismissed':
      return base.status === 'completed' ? base : { ...base, status: 'dismissed', snoozedUntil: null }
    case 'snoozed':
      return closed ? base : { ...base, status: 'offered', snoozedUntil: new Date(now.getTime() + SNOOZE_DAYS * DAY_MS).toISOString() }
  }
}
