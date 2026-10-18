// src/components/assessments/student/rowNotes.ts
// The small line under an assessment in the gradebook's student window that
// says what its status means for the grade. A draft is not a grade yet (only
// the teacher sees it, and the window's totals leave it out), so a draft
// Missing or Excused row must not say it already counts as 0 / never counts:
// it says the same thing in the future tense, once, beside "draft".

import type { ScoreStatus } from '@/lib/gradeEngine'

export type RowNoteTone = 'rose' | 'gray' | 'slate'

export interface RowNote {
  text: string
  tone: RowNoteTone
}

/** The note under a row, or null when its status needs none (graded, not a draft). */
export function rowNote(status: ScoreStatus, isDraft: boolean): RowNote | null {
  if (isDraft) {
    if (status === 'missing') return { text: 'Missing (draft) — only you see it. It counts as 0 once it is published', tone: 'rose' }
    if (status === 'excused') return { text: 'Excused (draft) — only you see it. It will not count toward the grade once it is published', tone: 'gray' }
    return { text: 'Draft — only you see it, and it counts once it is published', tone: 'slate' }
  }
  if (status === 'excused') return { text: 'Excused — this assessment never counts toward the grade', tone: 'gray' }
  if (status === 'missing') return { text: 'Missing — counts as 0 until a score is entered', tone: 'rose' }
  return null
}
