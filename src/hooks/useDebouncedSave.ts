// src/hooks/useDebouncedSave.ts
// One autosaved value, bound to React (D17): the grading view's draft grade
// and feedback, a student's typed answer (Task 20), quiz answers (Task 24).
// `schedule(value)` saves after `delayMs` of quiet (600 ms), `flush()` saves
// at once (blur, a student switch) and resolves when it is done; leaving the
// page or unmounting the view saves too. The rules live in
// src/lib/debouncedSaver.ts (unit-tested).
//
//   const answer = useDebouncedSave({ save: (text) => saveText(itemId, text) })
//   <textarea onChange={(e) => answer.schedule(e.target.value)} onBlur={() => void answer.flush()} />
//   <SavedPill status={answer.status} … />
'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  createDebouncedSaver,
  DEBOUNCED_SAVE_MS,
  type DebouncedSaveOptions,
  type DebouncedSaveStatus,
  type DebouncedSaver,
  type DebouncedSaverState,
} from '@/lib/debouncedSaver'

export type { DebouncedSaveStatus } from '@/lib/debouncedSaver'

export interface DebouncedSave<T> {
  status: DebouncedSaveStatus
  /** The last failure's message while something is failed. */
  error: string | null
  schedule: (value: T) => void
  flush: (opts?: DebouncedSaveOptions) => Promise<void>
  retry: () => Promise<void>
  discard: () => void
  /** Everything not confirmed by the server yet, or null (to show unsaved edits when a view reopens). */
  peek: () => T | null
  /** Whether a save has failed, read now (after `await flush()`). */
  hasFailures: () => boolean
}

const SERVER_STATE: DebouncedSaverState = { status: 'saved', error: null }
const serverState = () => SERVER_STATE

export function useDebouncedSave<T>({
  save,
  delayMs = DEBOUNCED_SAVE_MS,
  merge,
}: {
  /** Saves one value; `opts.keepalive` is set when the page is going away. */
  save: (value: T, opts: DebouncedSaveOptions) => Promise<void>
  delayMs?: number
  /** Combines an older unsent value with a newer one (default: the newer wins). */
  merge?: (older: T, newer: T) => T
}): DebouncedSave<T> {
  const [saver] = useState<DebouncedSaver<T>>(() => createDebouncedSaver<T>({ save, merge, delayMs }))
  // The latest callbacks, so the saver (made once) never calls a stale closure.
  useEffect(() => {
    saver.setHandlers({ save, merge })
  })
  const state = useSyncExternalStore(saver.subscribe, saver.getState, serverState)
  useEffect(() => saver.connect(window, document), [saver])

  const schedule = useCallback((value: T) => saver.schedule(value), [saver])
  const flush = useCallback((opts?: DebouncedSaveOptions) => saver.flush(opts), [saver])
  const retry = useCallback(() => saver.retry(), [saver])
  const discard = useCallback(() => saver.discard(), [saver])
  const peek = useCallback(() => saver.peek(), [saver])
  const hasFailures = useCallback(() => saver.hasFailures(), [saver])

  return { status: state.status, error: state.error, schedule, flush, retry, discard, peek, hasFailures }
}
