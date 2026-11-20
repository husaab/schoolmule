// src/lib/classReportOptions.ts
// A class's report options (Settings → Class options → On reports): the name
// progress reports print after the subject instead of the teacher's
// ("Salaat – Supervisor"). Same rules as the API: spaces tidied, at most 80
// characters, empty = the teacher's own name (null).

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
