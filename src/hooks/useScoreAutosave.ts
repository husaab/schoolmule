// src/hooks/useScoreAutosave.ts
// Grades autosave (D17) for one class, bound to React. Every score cell in
// the Grades tab (the grid, the category window, the column window) queues
// what the teacher types here; it saves through upsertScoresByClass after
// 600 ms of quiet, at once when the teacher leaves a cell, and on every way
// out of the page (see src/lib/scoreAutosaver.ts).
//
// One autosaver per signed-in user and class lives for the whole session
// (autosaverBinding.ts), so every component of the tab (the toolbar's Saved
// pill, the grid, the windows) shares the same queue, and a save that fails
// after the teacher has left is still outlined with Retry when they come back.
'use client'

import { useCallback, useMemo } from 'react'
import { upsertScoresByClass, type UpsertScoresResponse } from '@/services/classService'
import { createScoreAutosaver, type SaveOptions } from '@/lib/scoreAutosaver'
import { displayValue as displayOf, statusOf, type CellValue } from '@/lib/scoreAutosaveQueue'
import { useUserStore } from '@/store/useUserStore'
import { autosaverFor, useBoundAutosaver } from './autosaverBinding'

export type AutosaveStatus = 'saved' | 'saving' | 'error'

export interface ScoreAutosave {
  status: AutosaveStatus
  /** The teacher typed `value` into a cell; pass the saved value so typing it back sends nothing. */
  queue: (studentId: string, assessmentId: string, value: CellValue, saved?: CellValue) => void
  /** Save now (leaving a cell, switching sub-tab); resolves when everything typed so far has saved or failed. */
  flush: (opts?: SaveOptions) => Promise<void>
  retry: () => Promise<void>
  /** Forget a cell's unsent and failed value (it was flagged missing/excused, or its column is gone). */
  drop: (key: string) => void
  /** What a cell shows: the newest local value, else the saved one. */
  displayValue: (key: string, saved: CellValue) => CellValue
  failedKeys: Set<string>
  /** Every local value not yet confirmed by the server (failed < in flight < pending), for live totals. */
  pendingMap: () => Record<string, CellValue>
}

export function useScoreAutosave({
  classId,
  onSaved,
}: {
  classId: string
  /** Merges the saved rows (res.data, and res.drafts once the server sends them) into the grid. */
  onSaved?: (res: UpsertScoresResponse) => void
}): ScoreAutosave {
  const userId = useUserStore((s) => s.user.id) ?? ''
  const autosaver = useMemo(
    () =>
      autosaverFor(
        `${userId}|${classId}|scores`,
        () =>
          createScoreAutosaver<UpsertScoresResponse>({
            save: (items, opts) => upsertScoresByClass(classId, items, opts),
          }),
        (count) => `${count} grade change${count === 1 ? '' : 's'} didn't save. Open the class's Grades tab to retry.`,
      ),
    [userId, classId],
  )
  const state = useBoundAutosaver(autosaver, onSaved ? (res) => onSaved(res) : undefined)

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
