// src/lib/scoreAutosaveQueue.ts
// The grade autosave queue (D17), as pure state transitions. A cell the
// teacher types into is `pending`; a save moves every pending value
// `inFlight` (one batch at a time); the server's answer either clears the
// batch (a key re-typed meanwhile stays pending, so the latest value wins)
// or moves its values to `failed`, where they wait for Retry. Keys are
// "studentId|assessmentId". scoreAutosaver.ts drives this with timers and the
// network; the grid only reads displayValue/statusOf. The value type is a
// score by default; report card and progress comments queue one entry per
// student through the same transitions.

export type CellValue = number | null

export interface QueueState<V = CellValue> {
  pending: Record<string, V> // typed, not yet sent (key = studentId|assessmentId)
  inFlight: Record<string, V> // sent, awaiting the server
  failed: Record<string, { value: V; message: string }>
}

export const emptyQueue = <V = CellValue,>(): QueueState<V> => ({ pending: {}, inFlight: {}, failed: {} })

const without = <T,>(o: Record<string, T>, k: string) => {
  const n = { ...o }
  delete n[k]
  return n
}

export function enqueue<V>(s: QueueState<V>, key: string, value: V): QueueState<V> {
  return { ...s, pending: { ...s.pending, [key]: value }, failed: without(s.failed, key) }
}

/** Starts a save: everything pending moves in flight. Only one batch at a time. */
export function takeBatch<V>(s: QueueState<V>): { state: QueueState<V>; batch: [string, V][] } {
  if (Object.keys(s.inFlight).length > 0) return { state: s, batch: [] }
  const batch = Object.entries(s.pending)
  return { state: { ...s, pending: {}, inFlight: { ...s.pending } }, batch }
}

/** The server took the batch. A key re-typed meanwhile stays pending (latest wins). */
export function ackBatch<V>(s: QueueState<V>): QueueState<V> {
  return { ...s, inFlight: {} }
}

/** The batch failed: keep each value for Retry unless the teacher already typed a newer one. */
export function failBatch<V>(s: QueueState<V>, message: string): QueueState<V> {
  const failed = { ...s.failed }
  for (const [k, v] of Object.entries(s.inFlight)) if (!(k in s.pending)) failed[k] = { value: v, message }
  return { ...s, inFlight: {}, failed }
}

/**
 * Part of the batch failed: those keys keep their value for Retry (unless a
 * newer one is pending); the rest of the batch saved.
 */
export function failKeys<V>(s: QueueState<V>, keys: string[], message: string): QueueState<V> {
  const failing = new Set(keys)
  const failed = { ...s.failed }
  for (const [k, v] of Object.entries(s.inFlight)) if (failing.has(k) && !(k in s.pending)) failed[k] = { value: v, message }
  return { ...s, inFlight: {}, failed }
}

export function retryFailed<V>(s: QueueState<V>): QueueState<V> {
  const pending = { ...s.pending }
  for (const [k, f] of Object.entries(s.failed)) if (!(k in pending)) pending[k] = f.value
  return { ...s, pending, failed: {} }
}

/** The teacher chose Discard: forget every value that failed to save (e.g. rejected with a 400). */
export function discardFailed<V>(s: QueueState<V>): QueueState<V> {
  return { ...s, failed: {} }
}

/** A missing/excused flag was set on this cell: forget any unsent number for it. */
export function drop<V>(s: QueueState<V>, key: string): QueueState<V> {
  return { pending: without(s.pending, key), inFlight: s.inFlight, failed: without(s.failed, key) }
}

export function statusOf<V>(s: QueueState<V>): 'saved' | 'saving' | 'error' {
  if (Object.keys(s.pending).length || Object.keys(s.inFlight).length) return 'saving'
  return Object.keys(s.failed).length ? 'error' : 'saved'
}

/** What the cell shows: the newest local intent, else the saved value. */
export function displayValue<V>(s: QueueState<V>, key: string, saved: V): V {
  if (key in s.pending) return s.pending[key]
  if (key in s.inFlight) return s.inFlight[key]
  if (key in s.failed) return s.failed[key].value
  return saved
}

/**
 * A score cell's raw input as a value to save: empty (or unreadable) is a
 * blank cell, anything else is clamped to [0, max] (max falls back to 100),
 * exactly as the gradebook's Save did.
 */
export function clampScoreInput(raw: string, maxScore: number): CellValue {
  if (raw.trim() === '') return null
  const parsed = parseFloat(raw)
  if (Number.isNaN(parsed)) return null
  const max = Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 100
  return Math.min(Math.max(parsed, 0), max)
}

/** Two cell values are the same score (the server sends NUMERIC as "8.00"). */
export function sameScore(a: CellValue | undefined, b: CellValue | undefined): boolean {
  if (a == null || b == null) return a == null && b == null
  return Number(a) === Number(b)
}
