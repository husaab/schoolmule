// src/components/classes/grading/quickComments.ts
// The grading view's quick-comment chips (Teacher-Grading board): a click
// adds the comment to the end of the feedback. A static list for now; a
// teacher-managed comment bank is v1.1.

export const FEEDBACK_MAX = 5000

export interface QuickComment {
  /** The chip reads "+ {label}". */
  label: string
  /** What is added to the feedback. */
  text: string
}

export const QUICK_COMMENTS: readonly QuickComment[] = [
  { label: 'Great labelling', text: 'Great labelling.' },
  { label: 'Check your spelling', text: 'Check your spelling.' },
  { label: 'See me in class', text: 'See me in class.' },
]

/**
 * The feedback with a quick comment added: alone when the box is empty, after
 * a line break when the text ends with one, otherwise after one space. A
 * comment that would pass the limit is not added.
 */
export function appendQuickComment(feedback: string, text: string, max: number = FEEDBACK_MAX): string {
  if (feedback.trim() === '') return text.slice(0, max)
  const base = /\n\s*$/.test(feedback) ? feedback.replace(/[ \t]+$/, '') : feedback.trimEnd()
  const joined = base.endsWith('\n') ? `${base}${text}` : `${base} ${text}`
  return joined.length > max ? feedback : joined
}
