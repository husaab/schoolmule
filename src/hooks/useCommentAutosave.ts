// src/hooks/useCommentAutosave.ts
// Report card and progress report comments autosave (D17, controller ruling
// for T9): what the teacher types or picks for a student is saved a second
// after they stop, at once when they leave the field, and on every way out
// of the page (sub-tab, class tab, sidebar link, page hide), through the same
// bulk endpoints and payloads Save All uses. Latest wins per student; a
// failed save keeps the text and the Saved pill offers Retry. Save All stays
// as a manual flush.
//
// The school's comment rules (lib/commentRules.ts) apply here too. A comment
// over the maximum words is held back, not sent: it counts as not saved until
// the teacher shortens it, while the rest of the batch saves. A comment that
// is still the saved one is never held (it was saved before the limit), so a
// rating beside it still saves. And a save the
// server refuses because the comments were locked meanwhile tells the page
// (onLocked), so it can show the lock instead of a Retry that can't succeed.
'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { createAutosaver, PartialSaveError, type SaveOptions } from '@/lib/scoreAutosaver'
import { statusOf } from '@/lib/scoreAutosaveQueue'
import {
  PROGRESS_FIELDS,
  REPORT_CARD_FIELDS,
  sameFeedback,
  type FeedbackEntry,
} from '@/lib/commentAutosave'
import { COMMENTS_LOCKED, countWords, heldForLength } from '@/lib/commentRules'
import { isApiError } from '@/services/apiClient'
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

// What each autosaver works under, by its key. The autosaver outlives the
// component that created it (a save that fails after the teacher left is
// still there when they come back), so its save reads the latest rules from
// here rather than from a render.
interface AutosaveRules {
  maxWords: number | null
  onLocked?: () => void
}
const rulesByKey = new Map<string, AutosaveRules>()
// Each student's comment as saved, by autosaver key: noted whenever an entry
// is queued (the page hands over the saved entry) and whenever one saves.
const savedCommentsByKey = new Map<string, Map<string, string>>()
const savedCommentsOf = (key: string): Map<string, string> => {
  let saved = savedCommentsByKey.get(key)
  if (!saved) savedCommentsByKey.set(key, (saved = new Map()))
  return saved
}

/** Sends a batch, holding back the comments over the maximum words. */
async function saveWithinRules(key: string, kind: CommentKind, batch: [string, AnyEntry][], opts: SaveOptions): Promise<unknown> {
  const rules = rulesByKey.get(key)
  const savedComments = savedCommentsOf(key)
  const held = batch.filter(([studentId, entry]) =>
    heldForLength(entry.comment, savedComments.get(studentId), { maxWords: rules?.maxWords ?? null }),
  )
  const sendable = held.length ? batch.filter((pair) => !held.includes(pair)) : batch
  let res: unknown = null
  if (sendable.length) {
    try {
      res = await SAVE[kind](sendable.map(([, entry]) => entry), opts)
    } catch (err) {
      if (isApiError(err) && err.code === COMMENTS_LOCKED) rulesByKey.get(key)?.onLocked?.()
      throw err
    }
    for (const [studentId, entry] of sendable) savedComments.set(studentId, entry.comment ?? '')
  }
  if (held.length) {
    const max = rules?.maxWords ?? 0
    const longest = Math.max(...held.map(([, entry]) => countWords(entry.comment)))
    throw new PartialSaveError(
      held.map(([studentId]) => studentId),
      `Over the limit of ${max} words (${longest}). Shorten the comment to save it.`,
      sendable.length ? { res } : undefined,
    )
  }
  return res
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
  /** Whether anything failed to save, read now (not from the last render): after `await flush()`. */
  hasFailures: () => boolean
  /** Students whose comments are not saved yet. */
  unsavedCount: number
}

export function useCommentAutosave<K extends CommentKind>({
  classId,
  kind,
  onSaved,
  maxWords,
  onLocked,
}: {
  classId: string
  kind: K
  /** The entries the server just saved, to fold into the page's saved comments. */
  onSaved?: (entries: FeedbackEntry<CommentFieldOf<K>>[]) => void
  /** The school's maximum words for a comment (null for none). Leave out to keep what the autosaver already has. */
  maxWords?: number | null
  /** A save was refused because the comments are locked: read the rules again. */
  onLocked?: () => void
}): CommentAutosave<CommentFieldOf<K>> {
  type F = CommentFieldOf<K>
  const userId = useUserStore((s) => s.user.id) ?? ''
  const key = `${userId}|${classId}|comments-${kind}`
  useEffect(() => {
    if (maxWords === undefined && onLocked === undefined) return
    const current = rulesByKey.get(key)
    rulesByKey.set(key, {
      maxWords: maxWords === undefined ? (current?.maxWords ?? null) : maxWords,
      onLocked: onLocked ?? current?.onLocked,
    })
  }, [key, maxWords, onLocked])
  const autosaver = useMemo(
    () =>
      autosaverFor(
        key,
        () =>
          createAutosaver<AnyEntry, unknown>({
            save: (batch, opts) => saveWithinRules(key, kind, batch, opts),
            same: sameFeedback(FIELDS[kind]),
            debounceMs: COMMENT_DEBOUNCE_MS,
          }),
        (count) =>
          `Comments for ${count} student${count === 1 ? '' : 's'} didn't save. Open the class's Grades tab to retry.`,
      ),
    [key, kind],
  )
  const state = useBoundAutosaver(
    autosaver,
    onSaved ? (_res, batch) => onSaved(batch.map(([, entry]) => entry as FeedbackEntry<F>)) : undefined,
  )

  const queue = useCallback(
    (studentId: string, entry: FeedbackEntry<F>, saved: FeedbackEntry<F>) => {
      savedCommentsOf(key).set(studentId, (saved as AnyEntry).comment ?? '')
      autosaver.queue(studentId, entry as AnyEntry, saved as AnyEntry)
    },
    [autosaver, key],
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
  const hasFailures = useCallback(() => Object.keys(autosaver.getState().failed).length > 0, [autosaver])
  const unsavedCount = new Set([...Object.keys(state.pending), ...Object.keys(state.inFlight), ...failedKeys]).size

  return { status: statusOf(state), queue, flush, retry, discard, entryFor, failedKeys, hasFailures, unsavedCount }
}
