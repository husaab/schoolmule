// src/hooks/useDebouncedSave.ts
// One autosaved value, bound to React (D17): the grading view's draft grade
// and feedback, a student's typed answer (Task 20), quiz answers (Task 24).
// `schedule(value)` saves after `delayMs` of quiet (600 ms), `flush()` saves
// at once (blur, a student switch) and resolves when it is done; leaving the
// page or unmounting the view saves too. The rules live in
// src/lib/debouncedSaver.ts (unit-tested).
//
// Pass a `key` (e.g. "grading:{userId}:{itemId}", "answer:{userId}:{itemId}")
// to keep the saver for the whole session, as the gradebook's autosave does
// (src/lib/debouncedSaverRegistry.ts): a save still in flight or failed when
// the view goes is not lost. It is shown again, failed and offered for Retry,
// when the view comes back (`peek()` reseeds it), and a failure while no view
// shows it raises a toast (`failedAway` words it). The key must stay set (or
// unset) for the life of the component.
//
//   const answer = useDebouncedSave({ key: `answer:${userId}:${itemId}`, save: (text) => saveText(itemId, text) })
//   <textarea onChange={(e) => answer.schedule(e.target.value)} onBlur={() => void answer.flush()} />
//   <SavedPill status={answer.status} … />
'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  createDebouncedSaver,
  DEBOUNCED_SAVE_MS,
  type DebouncedSaveOptions,
  type DebouncedSaveStatus,
  type DebouncedSaver,
  type DebouncedSaverState,
} from '@/lib/debouncedSaver'
import { sessionDebouncedSaver, setFailedAwayFor } from '@/lib/debouncedSaverRegistry'
import { useNotificationStore } from '@/store/useNotificationStore'

export type { DebouncedSaveStatus } from '@/lib/debouncedSaver'

export interface DebouncedSave<T> {
  status: DebouncedSaveStatus
  /** The last failure's message while something is failed. */
  error: string | null
  schedule: (value: T) => void
  flush: (opts?: DebouncedSaveOptions) => Promise<void>
  retry: () => Promise<void>
  discard: () => void
  /** Forget what is waiting and what failed (a draft being thrown away). */
  cancel: () => void
  /** Everything not confirmed by the server yet, or null (to show unsaved edits when a view reopens). */
  peek: () => T | null
  /** Whether a save has failed, read now (after `await flush()`). */
  hasFailures: () => boolean
}

const SERVER_STATE: DebouncedSaverState = { status: 'saved', error: null }
const serverState = () => SERVER_STATE

// A save that failed after its view left (session savers only).
const notifyAway = (message: string) => useNotificationStore.getState().showNotification(message, 'error', 8000)

export function useDebouncedSave<T>({
  save,
  delayMs = DEBOUNCED_SAVE_MS,
  merge,
  split,
  key,
  failedAway,
}: {
  /** Saves one value; `opts.keepalive` is set when the page is going away. */
  save: (value: T, opts: DebouncedSaveOptions) => Promise<void>
  delayMs?: number
  /** Combines an older unsent value with a newer one (default: the newer wins). */
  merge?: (older: T, newer: T) => T
  /** A keyed value: what of a failed value a newer change leaves (see debouncedSaver); the rest waits for Retry. */
  split?: (failed: T, newer: T) => T | null
  /** Keep the saver for the session under this key (see above). */
  key?: string
  /** The toast for a value that failed after the view left (session savers). */
  failedAway?: (failed: T | null) => string
}): DebouncedSave<T> {
  const [local] = useState<DebouncedSaver<T> | null>(() => (key ? null : createDebouncedSaver<T>({ save, merge, split, delayMs })))
  const saver = useMemo(
    () => (key ? sessionDebouncedSaver<T>(key, { delayMs, notify: notifyAway }) : (local as DebouncedSaver<T>)),
    [key, local, delayMs],
  )
  // The latest callbacks, so the saver (made once) never calls a stale closure.
  useEffect(() => {
    saver.setHandlers({ save, merge, split })
    if (key && failedAway) setFailedAwayFor(saver, failedAway)
  })
  const state = useSyncExternalStore(saver.subscribe, saver.getState, serverState)
  useEffect(() => saver.connect(window, document), [saver])

  const schedule = useCallback((value: T) => saver.schedule(value), [saver])
  const flush = useCallback((opts?: DebouncedSaveOptions) => saver.flush(opts), [saver])
  const retry = useCallback(() => saver.retry(), [saver])
  const discard = useCallback(() => saver.discard(), [saver])
  const cancel = useCallback(() => saver.cancel(), [saver])
  const peek = useCallback(() => saver.peek(), [saver])
  const hasFailures = useCallback(() => saver.hasFailures(), [saver])

  return { status: state.status, error: state.error, schedule, flush, retry, discard, cancel, peek, hasFailures }
}
