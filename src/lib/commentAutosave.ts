// src/lib/commentAutosave.ts
// Report card and progress report comments autosave (D17, controller ruling
// for T9). The autosaver (scoreAutosaver.ts createAutosaver) queues one entry
// per student, keyed by studentId; these helpers build that entry exactly as
// Save All always has (every field the teacher edited, else the saved value,
// omitted when nothing is saved), so the bulk endpoints receive the same
// payloads as before.

export const REPORT_CARD_FIELDS = ['workHabits', 'behavior', 'comment'] as const
export const PROGRESS_FIELDS = ['coreStandards', 'workHabit', 'behavior', 'comment'] as const

export interface FeedbackIds {
  studentId: string
  classId: string
  term: string
}

export type FeedbackEntry<F extends string> = FeedbackIds & Partial<Record<F, string>>

/** One student's saved comment entry; a field with nothing saved is omitted (undefined). */
export function feedbackEntry<F extends string>(
  ids: FeedbackIds,
  fields: readonly F[],
  saved: Partial<Record<F, string | null>> | undefined,
): FeedbackEntry<F> {
  const entry = { ...ids } as FeedbackEntry<F>
  for (const field of fields) {
    ;(entry as Record<string, unknown>)[field] = saved?.[field] ?? undefined
  }
  return entry
}

/** The entry with one field set to what the teacher typed or picked ('' when emptied). */
export function withFeedbackField<F extends string>(entry: FeedbackEntry<F>, field: NoInfer<F>, value: string): FeedbackEntry<F> {
  return { ...entry, [field]: value }
}

/**
 * One field changed for one student: the entry to queue, built on what is
 * typed and not yet saved, else on the saved entry. Null when nothing may be
 * queued: a class without a term, or saved comments that failed to load (the
 * upsert nulls every field it is not sent, so an entry built on nothing would
 * erase the student's saved comments).
 */
export function commentChange<F extends string>(
  state: { term: string; savedLoaded: boolean; saved: FeedbackEntry<F>; local: FeedbackEntry<F> | null },
  field: NoInfer<F>,
  value: string,
): { entry: FeedbackEntry<F>; saved: FeedbackEntry<F> } | null {
  if (!state.term || !state.savedLoaded) return null
  return { entry: withFeedbackField(state.local ?? state.saved, field, value), saved: state.saved }
}

/** Same text in every field ('' and nothing saved are both empty): typing back to the saved entry sends nothing. */
export const sameFeedback =
  <F extends string>(fields: readonly F[]) =>
  (a: FeedbackEntry<F>, b: FeedbackEntry<F>): boolean =>
    fields.every((f) => (a[f] ?? '') === (b[f] ?? ''))
