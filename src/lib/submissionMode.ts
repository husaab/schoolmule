// src/lib/submissionMode.ts
// How an assignment is handed in (a photo or file, a typed answer, "Mark as
// done") decides what "Your work" shows. The To-do and Classwork rows carry
// it, but the item payload the assignment page reads (StudentItem) does not,
// so the page works it out: from the field when the server sends it, from what
// the work already holds when it does not (a file only exists in file mode, a
// saved answer only in text mode), and otherwise by asking the class's
// Classwork list. Pure, so it is unit-tested (submissionMode.test.ts).

import type { StudentItem, SubmissionMode } from '@/services/types/studentPortal'

/**
 * The mode when it can be known without asking: a mode, null (nothing to turn
 * in online), or undefined (cannot tell yet: ask the Classwork list). In order:
 * the field the server sends; nothing to turn in; what the list the student
 * came from said (`remembered`, it is current, while a teacher may change an
 * assignment's mode after students started); and last, what the work holds.
 */
export function inferSubmissionMode(
  item: Pick<StudentItem, 'kind' | 'submission' | 'submissionMode'>,
  remembered?: SubmissionMode | null,
): SubmissionMode | null | undefined {
  if (item.submissionMode !== undefined) return item.submissionMode
  if (!item.submission || item.kind === 'quiz') return null
  if (remembered !== undefined) return remembered
  if (item.submission.files.length > 0) return 'file'
  if (item.submission.textAnswer) return 'text'
  return undefined
}
