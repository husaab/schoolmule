import { describe, it, expect } from 'vitest'
import {
  ackBatch,
  clampScoreInput,
  discardFailed,
  failKeys,
  displayValue,
  drop,
  emptyQueue,
  enqueue,
  failBatch,
  retryFailed,
  sameScore,
  statusOf,
  takeBatch,
} from './scoreAutosaveQueue'

const K1 = 's1|a1'
const K2 = 's2|a1'

describe('scoreAutosaveQueue', () => {
  it('enqueue then takeBatch moves every pending value in flight', () => {
    let s = enqueue(emptyQueue(), K1, 8)
    s = enqueue(s, K2, null)
    const { state, batch } = takeBatch(s)
    expect(batch).toEqual([
      [K1, 8],
      [K2, null],
    ])
    expect(state.pending).toEqual({})
    expect(state.inFlight).toEqual({ [K1]: 8, [K2]: null })
  })

  it('the latest typed value wins while still pending', () => {
    let s = enqueue(emptyQueue(), K1, 1)
    s = enqueue(s, K1, 10)
    expect(takeBatch(s).batch).toEqual([[K1, 10]])
  })

  it('a second takeBatch while a batch is in flight returns nothing', () => {
    const first = takeBatch(enqueue(emptyQueue(), K1, 8)).state
    const again = takeBatch(enqueue(first, K2, 5))
    expect(again.batch).toEqual([])
    expect(again.state.pending).toEqual({ [K2]: 5 })
    expect(again.state.inFlight).toEqual({ [K1]: 8 })
  })

  it('a key re-typed while in flight survives ackBatch as pending (latest wins)', () => {
    let s = takeBatch(enqueue(emptyQueue(), K1, 8)).state
    s = enqueue(s, K1, 9)
    s = ackBatch(s)
    expect(s.inFlight).toEqual({})
    expect(s.pending).toEqual({ [K1]: 9 })
    expect(takeBatch(s).batch).toEqual([[K1, 9]])
  })

  it('failBatch keeps each failed value unless a newer one is pending', () => {
    let s = enqueue(emptyQueue(), K1, 8)
    s = enqueue(s, K2, 4)
    s = takeBatch(s).state
    s = enqueue(s, K2, 6) // re-typed while in flight
    s = failBatch(s, 'Network down')
    expect(s.inFlight).toEqual({})
    expect(s.failed).toEqual({ [K1]: { value: 8, message: 'Network down' } })
    expect(s.pending).toEqual({ [K2]: 6 })
  })

  it('typing into a failed cell clears its failure', () => {
    let s = failBatch(takeBatch(enqueue(emptyQueue(), K1, 8)).state, 'x')
    s = enqueue(s, K1, 7)
    expect(s.failed).toEqual({})
    expect(s.pending).toEqual({ [K1]: 7 })
  })

  it('retryFailed re-queues the failed values (a newer pending one wins)', () => {
    let s = enqueue(emptyQueue(), K1, 8)
    s = enqueue(s, K2, 4)
    s = failBatch(takeBatch(s).state, 'x')
    s = { ...s, pending: { [K2]: 5 } }
    s = retryFailed(s)
    expect(s.failed).toEqual({})
    expect(s.pending).toEqual({ [K1]: 8, [K2]: 5 })
  })

  it('drop forgets the pending and failed value of one key only', () => {
    let s = failBatch(takeBatch(enqueue(emptyQueue(), K1, 8)).state, 'x')
    s = enqueue(s, K2, 3)
    s = enqueue(s, 's3|a1', 2)
    s = drop(drop(s, K1), K2)
    expect(s.failed).toEqual({})
    expect(s.pending).toEqual({ 's3|a1': 2 })
  })

  it('failKeys fails only the keys that failed; the rest of the batch counts as saved', () => {
    let s = enqueue(emptyQueue(), K1, 8)
    s = enqueue(s, K2, 4)
    s = enqueue(s, 's3|a1', 5)
    s = takeBatch(s).state
    s = enqueue(s, 's3|a1', 6) // re-typed while in flight: stays pending
    s = failKeys(s, [K2, 's3|a1'], 'Failed to save')
    expect(s.inFlight).toEqual({})
    expect(s.failed).toEqual({ [K2]: { value: 4, message: 'Failed to save' } })
    expect(s.pending).toEqual({ 's3|a1': 6 })
  })

  it('discardFailed forgets every failed value (and nothing else)', () => {
    let s = failBatch(takeBatch(enqueue(emptyQueue(), K1, 8)).state, 'Score must be between 0 and 10')
    s = enqueue(s, K2, 3)
    s = discardFailed(s)
    expect(s.failed).toEqual({})
    expect(s.pending).toEqual({ [K2]: 3 })
    expect(statusOf(discardFailed(failBatch(takeBatch(enqueue(emptyQueue(), K1, 8)).state, 'x')))).toBe('saved')
  })

  it('drop leaves a value already in flight alone', () => {
    const s = drop(takeBatch(enqueue(emptyQueue(), K1, 8)).state, K1)
    expect(s.inFlight).toEqual({ [K1]: 8 })
  })

  it('statusOf: saving while anything is pending or in flight, error on failures, else saved', () => {
    expect(statusOf(emptyQueue())).toBe('saved')
    const pending = enqueue(emptyQueue(), K1, 8)
    expect(statusOf(pending)).toBe('saving')
    const inFlight = takeBatch(pending).state
    expect(statusOf(inFlight)).toBe('saving')
    const failed = failBatch(inFlight, 'x')
    expect(statusOf(failed)).toBe('error')
    expect(statusOf(enqueue(failed, K2, 1))).toBe('saving')
    expect(statusOf(ackBatch(inFlight))).toBe('saved')
  })

  it('displayValue: pending > in flight > failed > saved', () => {
    expect(displayValue(emptyQueue(), K1, 5)).toBe(5)
    let s = failBatch(takeBatch(enqueue(emptyQueue(), K1, 6)).state, 'x')
    expect(displayValue(s, K1, 5)).toBe(6)
    s = takeBatch(retryFailed(s)).state
    s = { ...s, failed: { [K1]: { value: 1, message: 'x' } } }
    expect(displayValue(s, K1, 5)).toBe(6)
    s = enqueue(s, K1, null)
    expect(displayValue(s, K1, 5)).toBe(null)
    expect(displayValue(s, K2, null)).toBe(null)
  })
})

describe('clampScoreInput', () => {
  it('empty or unreadable input is a blank cell', () => {
    expect(clampScoreInput('', 10)).toBe(null)
    expect(clampScoreInput('abc', 10)).toBe(null)
  })

  it('keeps a typed score between 0 and the maximum', () => {
    expect(clampScoreInput('7.5', 10)).toBe(7.5)
    expect(clampScoreInput('0', 10)).toBe(0)
    expect(clampScoreInput('12', 10)).toBe(10)
    expect(clampScoreInput('-3', 10)).toBe(0)
  })

  it('falls back to 100 when the maximum is missing', () => {
    expect(clampScoreInput('140', 0)).toBe(100)
    expect(clampScoreInput('140', NaN)).toBe(100)
  })
})

describe('sameScore', () => {
  it('compares numbers the server sends as strings', () => {
    expect(sameScore(8, '8.00' as unknown as number)).toBe(true)
    expect(sameScore(8, 9)).toBe(false)
    expect(sameScore(null, null)).toBe(true)
    expect(sameScore(null, undefined)).toBe(true)
    expect(sameScore(0, null)).toBe(false)
  })
})
