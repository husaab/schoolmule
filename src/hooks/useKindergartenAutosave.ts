// src/hooks/useKindergartenAutosave.ts
// JK/SK competency grading autosaves (D17, controller ruling for T9): each
// change queues the student's whole open document (progress report or report
// card), keyed "studentId|document". It saves a second after the teacher
// stops, at once when they leave a field or switch student or document, and
// on every way out of the page, through the same calls and payloads the Save
// button used (src/lib/kindergartenSave.ts). Latest wins per document; a
// failed save keeps the document for Retry or Discard.
'use client'

import { useCallback, useMemo } from 'react'
import { createAutosaver, type SaveOptions } from '@/lib/scoreAutosaver'
import { statusOf } from '@/lib/scoreAutosaveQueue'
import { saveJKDocument, saveSKDocument, type KindergartenSnapshot } from '@/lib/kindergartenSave'
import {
  bulkUpsertJKAssessments,
  bulkUpsertJKDomainComments,
  bulkUpsertJKLearningSkills,
  bulkUpsertJKProgressReportComments,
  upsertJKTeacherAssistant,
} from '@/services/jkService'
import {
  bulkUpsertSKAssessments,
  bulkUpsertSKProgressReportComments,
  bulkUpsertSKSubjectComments,
  upsertSKTeacherAssistant,
} from '@/services/skService'
import { useUserStore } from '@/store/useUserStore'
import { autosaverFor, useBoundAutosaver } from './autosaverBinding'
import type { AutosaveStatus } from './useScoreAutosave'

export type KindergartenKind = 'jk' | 'sk'

export const KINDERGARTEN_DEBOUNCE_MS = 1000

const SAVE_ONE: Record<KindergartenKind, (s: KindergartenSnapshot, opts: SaveOptions) => Promise<void>> = {
  jk: (s, opts) =>
    saveJKDocument(
      s,
      {
        assessments: bulkUpsertJKAssessments,
        progressComments: bulkUpsertJKProgressReportComments,
        domainComments: bulkUpsertJKDomainComments,
        learningSkills: bulkUpsertJKLearningSkills,
        teacherAssistant: upsertJKTeacherAssistant,
      },
      opts,
    ),
  sk: (s, opts) =>
    saveSKDocument(
      s,
      {
        assessments: bulkUpsertSKAssessments,
        subjectComments: bulkUpsertSKSubjectComments,
        progressComments: bulkUpsertSKProgressReportComments,
        teacherAssistant: upsertSKTeacherAssistant,
      },
      opts,
    ),
}

export interface KindergartenAutosave {
  status: AutosaveStatus
  /** The teacher changed the open document; `key` is kindergartenKey(studentId, doc). */
  queue: (key: string, snapshot: KindergartenSnapshot) => void
  flush: (opts?: SaveOptions) => Promise<void>
  retry: () => Promise<void>
  discard: () => void
  /** The document not yet confirmed by the server (pending, in flight or failed), else null. */
  snapshotFor: (key: string) => KindergartenSnapshot | null
  failedKeys: Set<string>
}

export function useKindergartenAutosave({ classId, kind }: { classId: string; kind: KindergartenKind }): KindergartenAutosave {
  const userId = useUserStore((s) => s.user.id) ?? ''
  const autosaver = useMemo(
    () =>
      autosaverFor(
        `${userId}|${classId}|${kind}`,
        () =>
          createAutosaver<KindergartenSnapshot, void>({
            save: async (batch, opts) => {
              if (opts.keepalive) {
                await Promise.all(batch.map(([, snapshot]) => SAVE_ONE[kind](snapshot, opts)))
                return
              }
              for (const [, snapshot] of batch) await SAVE_ONE[kind](snapshot, opts)
            },
            debounceMs: KINDERGARTEN_DEBOUNCE_MS,
          }),
        (count) =>
          `${count} kindergarten record${count === 1 ? '' : 's'} didn't save. Open the class's Grades tab to retry.`,
      ),
    [userId, classId, kind],
  )
  const state = useBoundAutosaver(autosaver)

  const queue = useCallback((key: string, snapshot: KindergartenSnapshot) => autosaver.queue(key, snapshot), [autosaver])
  const flush = useCallback((opts?: SaveOptions) => autosaver.flush(opts), [autosaver])
  const retry = useCallback(() => autosaver.retry(), [autosaver])
  const discard = useCallback(() => autosaver.discard(), [autosaver])
  const snapshotFor = useCallback(
    (key: string) => state.pending[key] ?? state.inFlight[key] ?? state.failed[key]?.value ?? null,
    [state],
  )
  const failedKeys = useMemo(() => new Set(Object.keys(state.failed)), [state.failed])

  return { status: statusOf(state), queue, flush, retry, discard, snapshotFor, failedKeys }
}
