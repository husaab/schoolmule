// src/hooks/useCommentAutosave.ts
// Report card and progress report comments autosave (D17, controller ruling
// for T9): what the teacher types or picks for a student is saved a second
// after they stop, at once when they leave the field, and on every way out
// of the page (sub-tab, class tab, sidebar link, page hide), through the same
// bulk endpoints and payloads Save All uses. Latest wins per student; a
// failed save keeps the text and the Saved pill offers Retry. Save All stays
// as a manual flush.
'use client'

import { useCallback, useMemo } from 'react'
import { createAutosaver, type SaveOptions } from '@/lib/scoreAutosaver'
import { statusOf } from '@/lib/scoreAutosaveQueue'
import {
  PROGRESS_FIELDS,
  REPORT_CARD_FIELDS,
  sameFeedback,
  type FeedbackEntry,
} from '@/lib/commentAutosave'
import { upsertBulkReportCardFeedback } from '@/services/reportCardService'
import { upsertBulkProgressReportFeedback } from '@/services/progressReportService'
import type { ReportCardFeedbackPayload } from '@/services/types/reportCard'
import type { BulkProgressReportFeedbackPayload } from '@/services/progressReportService'
import { useUserStore } from '@/store/useUserStore'
import { autosaverFor, useBoundAutosaver } from './autosaverBinding'
import type { AutosaveStatus } from './useScoreAutosave'

export type CommentKind = 'report' | 'progress'
export type CommentFieldOf<K extends CommentKind> = K extends 'report'
  ? (typeof REPORT_CARD_FIELDS)[number]
  : (typeof PROGRESS_FIELDS)[number]

export const COMMENT_DEBOUNCE_MS = 1000

type AnyEntry = FeedbackEntry<string>

const FIELDS: Record<CommentKind, readonly string[]> = { report: REPORT_CARD_FIELDS, progress: PROGRESS_FIELDS }

// The bulk endpoints are all-or-nothing transactions, so a batch either
// saved every student or none.
const SAVE: Record<CommentKind, (entries: AnyEntry[], opts: SaveOptions) => Promise<unknown>> = {
  report: async (entries, opts) => {
    const res = await upsertBulkReportCardFeedback(entries as unknown as ReportCardFeedbackPayload[], opts)
    if (res.status !== 'success') throw new Error(res.message || "The comments didn't save")
    return res
  },
  progress: async (entries, opts) => {
    const res = await upsertBulkProgressReportFeedback(entries as unknown as BulkProgressReportFeedbackPayload[], opts)
    if (res.status !== 'success') throw new Error(res.message || "The comments didn't save")
    return res
  },
}

export interface CommentAutosave<F extends string> {
  status: AutosaveStatus
  /** The teacher changed a student's entry; `saved` is the entry as saved, so typing back to it sends nothing. */
  queue: (studentId: string, entry: FeedbackEntry<F>, saved: FeedbackEntry<F>) => void
  flush: (opts?: SaveOptions) => Promise<void>
  retry: () => Promise<void>
  /** Forget every entry that didn't save (the pill's Discard). */
  discard: () => void
  /** The student's entry not yet confirmed by the server (pending, in flight or failed), else null. */
  entryFor: (studentId: string) => FeedbackEntry<F> | null
  failedKeys: Set<string>
  /** Students whose comments are not saved yet. */
  unsavedCount: number
}

export function useCommentAutosave<K extends CommentKind>({
  classId,
  kind,
  onSaved,
}: {
  classId: string
  kind: K
  /** The entries the server just saved, to fold into the page's saved comments. */
  onSaved?: (entries: FeedbackEntry<CommentFieldOf<K>>[]) => void
}): CommentAutosave<CommentFieldOf<K>> {
  type F = CommentFieldOf<K>
  const userId = useUserStore((s) => s.user.id) ?? ''
  const autosaver = useMemo(
    () =>
      autosaverFor(
        `${userId}|${classId}|comments-${kind}`,
        () =>
          createAutosaver<AnyEntry, unknown>({
            save: (batch, opts) => SAVE[kind](batch.map(([, entry]) => entry), opts),
            same: sameFeedback(FIELDS[kind]),
            debounceMs: COMMENT_DEBOUNCE_MS,
          }),
        (count) =>
          `Comments for ${count} student${count === 1 ? '' : 's'} didn't save. Open the class's Grades tab to retry.`,
      ),
    [userId, classId, kind],
  )
  const state = useBoundAutosaver(
    autosaver,
    onSaved ? (_res, batch) => onSaved(batch.map(([, entry]) => entry as FeedbackEntry<F>)) : undefined,
  )

  const queue = useCallback(
    (studentId: string, entry: FeedbackEntry<F>, saved: FeedbackEntry<F>) =>
      autosaver.queue(studentId, entry as AnyEntry, saved as AnyEntry),
    [autosaver],
  )
  const flush = useCallback((opts?: SaveOptions) => autosaver.flush(opts), [autosaver])
  const retry = useCallback(() => autosaver.retry(), [autosaver])
  const discard = useCallback(() => autosaver.discard(), [autosaver])
  const entryFor = useCallback(
    (studentId: string): FeedbackEntry<F> | null => {
      const local = state.pending[studentId] ?? state.inFlight[studentId] ?? state.failed[studentId]?.value
      return (local as FeedbackEntry<F> | undefined) ?? null
    },
    [state],
  )
  const failedKeys = useMemo(() => new Set(Object.keys(state.failed)), [state.failed])
  const unsavedCount = new Set([...Object.keys(state.pending), ...Object.keys(state.inFlight), ...failedKeys]).size

  return { status: statusOf(state), queue, flush, retry, discard, entryFor, failedKeys, unsavedCount }
}
