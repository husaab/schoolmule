// src/lib/submissionModeCache.ts
// How each item is handed in (a photo or file, a typed answer, "Mark as done"),
// remembered from the lists that carry it (the To-do, a class's Classwork, Home)
// so the assignment page does not have to ask again when the student opens an
// item from one of them. The item payload itself does not say (see
// lib/submissionMode.ts). In memory for this visit only; nothing is stored.

import type { SubmissionMode } from '@/services/types/studentPortal'

const modes = new Map<string, SubmissionMode | null>()

/** Remember the mode of each listed item (null: nothing to turn in online). */
export function rememberSubmissionModes(items: { itemId: string; submissionMode: SubmissionMode | null }[]): void {
  for (const item of items) modes.set(item.itemId, item.submissionMode)
}

/** The remembered mode, or undefined when no list has told us. */
export const recallSubmissionMode = (itemId: string): SubmissionMode | null | undefined => modes.get(itemId)

/** Tests only. */
export const forgetSubmissionModes = (): void => modes.clear()
