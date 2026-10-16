// src/hooks/autosaverBinding.ts
// What useScoreAutosave and useCommentAutosave share: one autosaver per key
// (signed-in user, class, and what it saves) for the whole session, so every
// component of the Grades tab reads the same queue and a save that fails
// after the teacher left is still there (outlined, with Retry) when they come
// back; and the React binding (state, onSaved, page lifecycle).
'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { Autosaver } from '@/lib/scoreAutosaver'
import { emptyQueue, type QueueState } from '@/lib/scoreAutosaveQueue'
import { useNotificationStore } from '@/store/useNotificationStore'

const autosavers = new Map<string, Autosaver<unknown, unknown>>()

/**
 * The session's autosaver for `key`, created on first use. `failedAway`
 * words the toast shown when a save fails after the teacher left the tab.
 */
export function autosaverFor<V, R>(
  key: string,
  create: () => Autosaver<V, R>,
  failedAway: (count: number) => string,
): Autosaver<V, R> {
  const existing = autosavers.get(key)
  if (existing) return existing as unknown as Autosaver<V, R>
  const autosaver = create()
  autosaver.onFailed(() => {
    if (autosaver.isConnected()) return
    const count = Object.keys(autosaver.getState().failed).length
    useNotificationStore.getState().showNotification(failedAway(count), 'error', 8000)
  })
  autosavers.set(key, autosaver as unknown as Autosaver<unknown, unknown>)
  return autosaver
}

const SERVER_SNAPSHOT: QueueState<never> = emptyQueue<never>()
const serverSnapshot = () => SERVER_SNAPSHOT

/**
 * Subscribes to an autosaver: returns its queue state, forwards saved
 * batches to `onSaved`, and while mounted saves on page hide/unload; when
 * the component goes away (any in-app navigation) whatever is still typed is
 * saved at once.
 */
export function useBoundAutosaver<V, R>(
  autosaver: Autosaver<V, R>,
  onSaved?: (res: R, batch: [string, V][]) => void,
): QueueState<V> {
  const state = useSyncExternalStore(autosaver.subscribe, autosaver.getState, serverSnapshot as () => QueueState<V>)

  const onSavedRef = useRef(onSaved)
  useEffect(() => {
    onSavedRef.current = onSaved
  }, [onSaved])
  useEffect(() => autosaver.onSaved((res, batch) => onSavedRef.current?.(res, batch)), [autosaver])
  useEffect(() => autosaver.connect(window, document), [autosaver])

  return state
}
