// src/components/classroom/useSubmissionMode.ts
// How the item on screen is handed in. The item payload may not say (see
// lib/submissionMode.ts), so the mode comes from the item itself when it can,
// else from the list the student opened it from (lib/submissionModeCache.ts),
// else the class's Classwork list is asked once; its rows carry the mode. Once a mode is
// known for an item it is kept, so removing the last file or clearing the
// answer never sends the page back to asking. The student's page and the
// parent's lens each pass their own list loader.
'use client'

import { useState } from 'react'
import { useLoad } from '@/hooks/useLoad'
import { inferSubmissionMode } from '@/lib/submissionMode'
import { recallSubmissionMode } from '@/lib/submissionModeCache'
import type { StudentClasswork, StudentItem, SubmissionMode } from '@/services/types/studentPortal'

export interface SubmissionModeState {
  /** undefined while it is being found out. */
  mode: SubmissionMode | null | undefined
  error: Error | null
  retry: () => void
}

export function useSubmissionMode(
  item: StudentItem | null,
  /** Scopes the lookup: the student, or the parent and child. */
  owner: string,
  loadClasswork: (classId: string) => Promise<StudentClasswork>,
): SubmissionModeState {
  // From the item itself, else from the list the student came from.
  const fromItem = item ? inferSubmissionMode(item) : undefined
  const inferred = fromItem !== undefined ? fromItem : item ? recallSubmissionMode(item.itemId) : undefined

  // The last mode known for this item. Set while rendering (the "derive state" pattern), so there is no flash.
  const [known, setKnown] = useState<{ itemId: string; mode: SubmissionMode | null } | null>(null)
  if (item && inferred !== undefined && (known?.itemId !== item.itemId || known.mode !== inferred)) {
    setKnown({ itemId: item.itemId, mode: inferred })
  }
  const remembered = item && known?.itemId === item.itemId ? known.mode : undefined
  const effective = inferred !== undefined ? inferred : remembered

  // Wrapped, because a found "nothing to turn in" is null and must not read as "not loaded yet".
  const lookup = useLoad<{ mode: SubmissionMode | null }>(item && effective === undefined ? `mode:${owner}:${item.itemId}` : null, async () => {
    const list = await loadClasswork(item!.classId)
    return { mode: list.items.find((i) => i.itemId === item!.itemId)?.submissionMode ?? null }
  })

  if (effective !== undefined) return { mode: effective, error: null, retry: lookup.reload }
  return { mode: lookup.data ? lookup.data.mode : undefined, error: lookup.error, retry: lookup.reload }
}
