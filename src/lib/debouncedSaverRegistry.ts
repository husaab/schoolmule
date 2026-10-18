// src/lib/debouncedSaverRegistry.ts
// Session-scoped debounced savers, the same pattern as the gradebook's
// autosave (src/hooks/autosaverBinding.ts): one saver per key (e.g.
// "grading:{userId}:{itemId}", "answer:{userId}:{itemId}") lives for the whole
// session, not for one view. So a save still in flight, or one that fails,
// when the teacher (or student) leaves the page is not lost: it is still
// there, failed and offered for Retry, when they come back, and a failure
// that happens while no view shows it is announced (`notify`, a toast).
// Framework-free, unit-tested (debouncedSaverRegistry.test.ts).

import { createDebouncedSaver, DEBOUNCED_SAVE_MS, type DebouncedSaver } from './debouncedSaver'

const savers = new Map<string, DebouncedSaver<unknown>>()
// What the toast says about a value that failed after its view left, by key.
const describers = new Map<string, (failed: unknown) => string>()

const FALLBACK_AWAY = "Some changes didn't save. Open the page again to retry."

// The first view's effect sets the real handlers before anything can be typed.
const notReady = () => Promise.reject(new Error('Not ready to save yet'))

/** The session's saver for `key`, created on first use. */
export function sessionDebouncedSaver<T>(
  key: string,
  { delayMs = DEBOUNCED_SAVE_MS, notify }: { delayMs?: number; notify: (message: string) => void },
): DebouncedSaver<T> {
  const existing = savers.get(key)
  if (existing) return existing as DebouncedSaver<T>
  const saver = createDebouncedSaver<T>({ save: notReady, delayMs })
  saver.onFailed(() => {
    if (saver.isConnected()) return
    const describe = describers.get(key)
    notify(describe ? describe(saver.peek()) : FALLBACK_AWAY)
  })
  savers.set(key, saver as DebouncedSaver<unknown>)
  return saver
}

/** How the "didn't save after you left" toast words this key's failed value. */
export function setFailedAway(key: string, describe: (failed: unknown) => string): void {
  describers.set(key, describe)
}

/** Tests only: forget every saver. */
export function resetSessionSavers(): void {
  savers.clear()
  describers.clear()
}
