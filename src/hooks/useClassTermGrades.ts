// src/hooks/useClassTermGrades.ts
// One class's grades for its own page (the student's "My grades" tab and the parent lens' Grades tab).
// The server answers for the default term. A class page can also open a class from an earlier term (an
// email link, say), which is not in those grades: then the class's own term is asked for instead, found
// by the term name on the class header.
'use client'

import { useLoad } from '@/hooks/useLoad'
import { otherTermFor } from '@/lib/classroomText'
import type { ChildGrades } from '@/services/types/studentPortal'

export function useClassTermGrades(
  scope: string,
  header: { classId: string; termName: string | null },
  load: (termId?: string) => Promise<ChildGrades>,
) {
  const first = useLoad(scope, () => load())
  const otherTermId = first.data ? otherTermFor(first.data, header) : null
  const second = useLoad(otherTermId ? `${scope}:term:${otherTermId}` : null, () => load(otherTermId ?? undefined))
  return otherTermId ? second : first
}
