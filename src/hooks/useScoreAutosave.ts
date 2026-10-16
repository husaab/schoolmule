// src/hooks/useScoreAutosave.ts
// Grades autosave (D17) for one class, bound to React. Every score cell in
// the Grades tab (the grid, the category window, the column window) queues
// what the teacher types here; it saves through upsertScoresByClass after
// 600 ms of quiet, at once when the teacher leaves a cell, and on every way
// out of the page (see src/lib/scoreAutosaver.ts).
//
// One autosaver per signed-in user and class lives for the whole session, so
// every component of the tab (the toolbar's Saved pill, the grid, the
// windows) shares the same queue, and a save that fails after the teacher has
// left is still outlined with Retry when they come back.
'use client'

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { upsertScoresByClass, type UpsertScoresResponse } from '@/services/classService'
import { createScoreAutosaver, type SaveOptions, type ScoreAutosaver as Autosaver } from '@/lib/scoreAutosaver'
import {
  displayValue as displayOf,
  emptyQueue,
  statusOf,
  type CellValue,
  type QueueState,
} from '@/lib/scoreAutosaveQueue'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

export type AutosaveStatus = 'saved' | 'saving' | 'error'

export interface ScoreAutosave {
  status: AutosaveStatus
  /** The teacher typed `value` into a cell; pass the saved value so typing it back sends nothing. */
  queue: (studentId: string, assessmentId: string, value: CellValue, saved?: CellValue) => void
  /** Save now (leaving a cell, switching sub-tab); resolves when everything typed so far has saved or failed. */
  flush: (opts?: SaveOptions) => Promise<void>
  retry: () => Promise<void>
  /** Forget a cell's unsent and failed value (it was flagged missing/excused). */
  drop: (key: string) => void
  /** What a cell shows: the newest local value, else the saved one. */
  displayValue: (key: string, saved: CellValue) => CellValue
  failedKeys: Set<string>
  /** Every local value not yet confirmed by the server (failed < in flight < pending), for live totals. */
  pendingMap: () => Record<string, CellValue>
}

const autosavers = new Map<string, Autosaver<UpsertScoresResponse>>()

function autosaverFor(userId: string, classId: string): Autosaver<UpsertScoresResponse> {
  const key = `${userId}|${classId}`
  const existing = autosavers.get(key)
  if (existing) return existing
  const autosaver = createScoreAutosaver<UpsertScoresResponse>({
    save: (items, opts) => upsertScoresByClass(classId, items, opts),
  })
  // A save that fails after the teacher left the Grades tab must not fail
  // silently: say so, and keep the values for Retry when they come back.
  autosaver.onFailed(() => {
    if (autosaver.isConnected()) return
    const count = Object.keys(autosaver.getState().failed).length
    useNotificationStore
      .getState()
      .showNotification(
        `${count} grade change${count === 1 ? '' : 's'} didn't save. Open the class's Grades tab to retry.`,
        'error',
        8000,
      )
  })
  autosavers.set(key, autosaver)
  return autosaver
}

const SERVER_SNAPSHOT: QueueState = emptyQueue()
const serverSnapshot = () => SERVER_SNAPSHOT

export function useScoreAutosave({
  classId,
  onSaved,
}: {
  classId: string
  /** Merges the saved rows (res.data, and res.drafts once the server sends them) into the grid. */
  onSaved?: (res: UpsertScoresResponse) => void
}): ScoreAutosave {
  const userId = useUserStore((s) => s.user.id) ?? ''
  const autosaver = useMemo(() => autosaverFor(userId, classId), [userId, classId])
  const state = useSyncExternalStore(autosaver.subscribe, autosaver.getState, serverSnapshot)

  const onSavedRef = useRef(onSaved)
  useEffect(() => {
    onSavedRef.current = onSaved
  }, [onSaved])
  useEffect(() => autosaver.onSaved((res) => onSavedRef.current?.(res)), [autosaver])

  // While this view is up, page hide/unload save first; when it goes away
  // (any in-app navigation) whatever is still typed is saved at once.
  useEffect(() => autosaver.connect(window, document), [autosaver])

  const queue = useCallback(
    (studentId: string, assessmentId: string, value: CellValue, saved?: CellValue) =>
      autosaver.queue(`${studentId}|${assessmentId}`, value, saved),
    [autosaver],
  )
  const flush = useCallback((opts?: SaveOptions) => autosaver.flush(opts), [autosaver])
  const retry = useCallback(() => autosaver.retry(), [autosaver])
  const drop = useCallback((key: string) => autosaver.drop(key), [autosaver])
  const displayValue = useCallback((key: string, saved: CellValue) => displayOf(state, key, saved), [state])
  const failedKeys = useMemo(() => new Set(Object.keys(state.failed)), [state.failed])
  const pendingMap = useCallback(() => {
    const out: Record<string, CellValue> = {}
    for (const [k, f] of Object.entries(state.failed)) out[k] = f.value
    Object.assign(out, state.inFlight, state.pending)
    return out
  }, [state])

  return {
    status: statusOf(state),
    queue,
    flush,
    retry,
    drop,
    displayValue,
    failedKeys,
    pendingMap,
  }
}
