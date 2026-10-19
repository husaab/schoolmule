// src/lib/debouncedSaverRegistry.ts
// Session-scoped debounced savers, the same pattern as the gradebook's
// autosave (src/hooks/autosaverBinding.ts): one saver per key (e.g.
// "grading:{userId}:{itemId}", "answer:{userId}:{itemId}") lives for the whole
// session, not for one view. So a save still in flight, or one that fails,
// when the teacher (or student) leaves the page is not lost: it is still
// there, failed and offered for Retry, when they come back, and a failure
// that happens while no view shows it is announced (`notify`, a toast).
//
// A saver can move to another key (`rekeySessionSaver`): a new classwork
// draft is saved under "item-form:{user}:new:{class}:{kind}" until its first
// save creates it, then under "item-form:{user}:{itemId}", so its edit page
// finds it and the next New form starts clean.
// Framework-free, unit-tested (debouncedSaverRegistry.test.ts).

import { createDebouncedSaver, DEBOUNCED_SAVE_MS, type DebouncedSaver } from './debouncedSaver'

const savers = new Map<string, DebouncedSaver<unknown>>()
// What the toast says about a value that failed after its view left, by saver (it follows a rekey).
const describers = new WeakMap<DebouncedSaver<unknown>, (failed: unknown) => string>()

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
    const describe = describers.get(saver as DebouncedSaver<unknown>)
    notify(describe ? describe(saver.peek()) : FALLBACK_AWAY)
  })
  savers.set(key, saver as DebouncedSaver<unknown>)
  return saver
}

/** What is not saved yet under `key` (failed, in flight or waiting), without creating a saver. */
export function peekSessionSaver<T>(key: string): T | null {
  return (savers.get(key)?.peek() as T | null | undefined) ?? null
}

/** Moves the saver under `from` to `to` (a new draft got its id); `from` starts fresh next time. */
export function rekeySessionSaver(from: string, to: string): void {
  const saver = savers.get(from)
  if (!saver || from === to) return
  savers.delete(from)
  savers.set(to, saver)
}

/** How the "didn't save after you left" toast words this key's failed value. */
export function setFailedAway(key: string, describe: (failed: unknown) => string): void {
  const saver = savers.get(key)
  if (saver) describers.set(saver, describe)
}

/** The same, for a saver in hand (it keeps its words after a rekey). */
export function setFailedAwayFor<T>(saver: DebouncedSaver<T>, describe: (failed: T | null) => string): void {
  describers.set(saver as DebouncedSaver<unknown>, describe as (failed: unknown) => string)
}

/** Tests only: forget every saver. */
export function resetSessionSavers(): void {
  savers.clear()
}
