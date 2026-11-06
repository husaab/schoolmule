// src/lib/modifiedMark.ts
//
// A modified mark: one student's real score on a different version of an
// assessment. The rules and wording the web and app share. The server keeps the
// same rules in utils/modifiedMark.js, and its tests run the same cases.
//
// Pure: copied as-is to the mobile app.

export const MODIFIED_LABEL_MAX = 80
export const DEFAULT_MODIFIED_LABEL = 'Earlier grade level skills'
export const MODIFIED_LABEL_ERROR = 'Use plain words about the test. Families read this label.'
const REFUSED_WORD = /\biep\b/i

/** Trimmed, with inner whitespace collapsed; an empty label is no label. */
export function normalizeModifiedLabel(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const label = String(raw).trim().replace(/\s+/g, ' ')
  return label === '' ? null : label
}

/** The error to show for a label, or null when it's fine. */
export function validateModifiedLabel(raw: string | null | undefined): string | null {
  const label = normalizeModifiedLabel(raw)
  if (label == null) return null
  return label.length > MODIFIED_LABEL_MAX || REFUSED_WORD.test(label) ? MODIFIED_LABEL_ERROR : null
}

/** One-tap labels for a class's grade: the default, then the two grades below. */
export function gradeLevelSuggestions(grade: string | number | null | undefined): string[] {
  const n = Number(grade)
  const suggestions = [DEFAULT_MODIFIED_LABEL]
  if (!Number.isInteger(n)) return suggestions
  for (const below of [n - 1, n - 2]) if (below >= 1) suggestions.push(`Grade ${below} level`)
  return suggestions
}

/**
 * What the label box starts with. A marked cell keeps what it has, even none.
 * Otherwise it remembers the last label used for this student in this class
 * (`studentLabels`, oldest first), so the next test takes two clicks.
 */
export function initialModifiedLabel(input: { modified: boolean; current: string | null; studentLabels: string[] }): string {
  if (input.modified) return input.current ?? ''
  return input.studentLabels[input.studentLabels.length - 1] ?? DEFAULT_MODIFIED_LABEL
}

/** One student's labels in a class's score rows, for initialModifiedLabel. */
export function modifiedLabelsOf(
  rows: { student_id: string; is_modified?: boolean; modified_label?: string | null }[],
  studentId: string,
): string[] {
  return rows.filter((r) => r.student_id === studentId && r.is_modified && r.modified_label).map((r) => r.modified_label as string)
}

/** Flagged, and the cell holds a real mark (0 is one). Blank, missing and excused cells never show it. */
export function isEffectivelyModified(cell: { modified: boolean; status: string; value: number | string | null }): boolean {
  return cell.modified && cell.status === 'graded' && cell.value != null
}

/** "This grade includes 2 modified assessments". */
export const modifiedCountLine = (count: number): string =>
  `This grade includes ${count} modified assessment${count === 1 ? '' : 's'}`

/** The publish dialog's last check: every mark counted, each student named once. Null with none. */
export function modifiedMarksLine(marks: { studentName: string }[]): string | null {
  if (marks.length === 0) return null
  const names = [...new Set(marks.map((m) => m.studentName))]
  return `Includes ${marks.length} modified mark${marks.length === 1 ? '' : 's'}: ${names.join(', ')}`
}

/** What the word means, in the same words as the email. */
export const modifiedExplainer = (first: string): string =>
  `Modified means ${first} wrote a different version of this assessment, set by the teacher. The mark shows how ${first} did on that version, so it can't be compared directly to the class's test.`

export const MODIFIED_SHARED_NOTICE = 'This mark is already shared. Families see the label next time they open it. No new email goes out.'
export const MODIFIED_LEGEND = "Modified: a different test. Counts in the student's grade, not the column's class average."
