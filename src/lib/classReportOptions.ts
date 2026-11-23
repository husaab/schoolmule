// src/lib/classReportOptions.ts
// A class's report options (Settings → Class options → On reports): the name
// progress reports print after the subject instead of the teacher's
// ("Salaat – Supervisor"), and the goals paragraph a goals-and-comment class
// prints above every comment. Same rules as the API: the name's spaces tidied,
// at most 80 characters; the paragraph keeps its line breaks, at most 1000;
// empty = none (null).

export const REPORT_TEACHER_NAME_MAX = 80

/** The name as the API stores it: spaces tidied, '' → null. */
export const tidyReportTeacherName = (typed: string): string | null => typed.replace(/\s+/g, ' ').trim() || null

/**
 * What to send when the field is left: the new value (a name, or null to go
 * back to the teacher), or undefined when nothing changed.
 */
export function reportTeacherNameChange(typed: string, saved: string | null): string | null | undefined {
  const next = tidyReportTeacherName(typed)
  return next === (saved ?? null) ? undefined : next
}

export const PROGRESS_GOALS_MAX = 1000

/** The goals paragraph as the API stores it: line breaks kept, ends trimmed, '' → null. */
export const tidyProgressGoals = (typed: string): string | null => typed.replace(/\r\n?/g, '\n').trim() || null

/** What to send when the goals box is left: the new paragraph, null to remove it, or undefined when nothing changed. */
export function progressGoalsChange(typed: string, saved: string | null): string | null | undefined {
  const next = tidyProgressGoals(typed)
  return next === (saved ?? null) ? undefined : next
}
