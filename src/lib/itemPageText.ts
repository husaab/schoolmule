// src/lib/itemPageText.ts
// The words of the assignment page (Student-Assignment board) and of the
// parent's read-only twin: the header lines ("Lina Farouk · posted Oct 13",
// "Due tomorrow, 3:30 pm"), a file row, the Turn in bar in each of its states,
// the grade block, and the notes a parent reads. Dates are read on the Toronto
// calendar. Copy names people, never "he" or "she". Pure, so it is unit-tested
// (itemPageText.test.ts); the components only render what these decide.

import { dayKeyLabel } from '@/lib/classStream'
import { dayKeyOf, daysFromToday, firstNameOf, formatMark, timeText, wasDue } from '@/lib/classroomText'
import { formatSize } from '@/lib/attachments'
import { shortDate, torontoDateKey } from '@/lib/studentAccounts'
import type { DebouncedSaveStatus } from '@/lib/debouncedSaver'
import type { StudentItem, SubmissionFile, WorkStatus } from '@/services/types/studentPortal'

const cap = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

// ---------------------------------------------------------------------------
// Header

/** "Lina Farouk · posted Oct 13". */
export function postedLine(teacherName: string | null, postedAt: string | null, now: Date = new Date()): string {
  const posted = postedAt ? `posted ${shortDate(postedAt, now)}` : null
  if (teacherName && posted) return `${teacherName} · ${posted}`
  if (teacherName) return teacherName
  return posted ? cap(posted) : ''
}

/** "10 points"; null when the work is not worth any. */
export function pointsText(points: number | null): string | null {
  if (points == null || points <= 0) return null
  return `${formatMark(points)} ${points === 1 ? 'point' : 'points'}`
}

export interface DueLine {
  text: string
  tone: 'amber' | 'rose' | 'slate'
}

/**
 * The due line under the title. Ahead of now: "Due tomorrow, 3:30 pm" (amber for today and tomorrow). Past:
 * "Was due Tuesday, 3:30 pm", in rose while the work is not in and quiet once it is. A dated in-class test
 * reads "Fri, Oct 23 · in class". Null when there is no date at all.
 */
export function itemDueLine(
  item: { dueAt: string | null; date: string | null },
  status: WorkStatus,
  now: Date = new Date(),
): DueLine | null {
  if (item.dueAt) {
    const time = timeText(item.dueAt)
    if (Date.parse(item.dueAt) < now.getTime()) {
      const open = status === 'assigned' || status === 'missing'
      return { text: `${cap(wasDue(item, now))}, ${time}`, tone: open ? 'rose' : 'slate' }
    }
    const key = dayKeyOf(item)
    const days = key ? daysFromToday(key, now) : 9
    const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : days <= 6 && key ? dayKeyLabel(key).split(',')[0] : key ? dayKeyLabel(key) : ''
    return { text: `Due ${when}, ${time}`, tone: days <= 1 ? 'amber' : 'slate' }
  }
  if (item.date) return { text: `${dayKeyLabel(item.date)} · in class`, tone: 'slate' }
  return null
}

/** The status the page works from: the submission's, else what the grade says, else "to read" or "nothing to turn in". */
export function itemStatusOf(item: Pick<StudentItem, 'kind' | 'submission' | 'grade'>): WorkStatus {
  if (item.submission) return item.submission.status
  if (item.grade) return item.grade.status
  return item.kind === 'material' ? 'material' : 'no_turn_in'
}

// ---------------------------------------------------------------------------
// Your work

/** "Photo · 2.1 MB", "PDF · 120 KB", "Word file · 40 KB". */
export function fileKindLabel(file: Pick<SubmissionFile, 'fileName' | 'mimeType' | 'sizeBytes'>): string {
  const mime = (file.mimeType || '').toLowerCase()
  const name = (file.fileName || '').toLowerCase()
  let kind = 'File'
  if (mime.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|heif)$/.test(name)) kind = 'Photo'
  else if (mime === 'application/pdf' || name.endsWith('.pdf')) kind = 'PDF'
  else if (mime.includes('word') || /\.docx?$/.test(name)) kind = 'Word file'
  else if (mime.includes('powerpoint') || mime.includes('presentation') || /\.pptx?$/.test(name)) kind = 'PowerPoint'
  return `${kind} · ${formatSize(file.sizeBytes)}`
}

/** The Turn in button: "Mark as done" when there is nothing to add. */
export const turnInLabel = (mode: string | null | undefined): string => (mode === 'done' ? 'Mark as done' : 'Turn in')

const teacherOr = (teacher: string | null): string => teacher ?? 'Your teacher'

/** The line under the button: what is missing while it is off, who sees it once it is on. */
export function turnInHint(opts: { mode: string | null | undefined; canTurnIn: boolean; teacher: string | null }): string {
  if (!opts.canTurnIn) {
    if (opts.mode === 'text') return 'Write your answer first.'
    if (opts.mode === 'file') return 'Add a photo or file first.'
  }
  return `${teacherOr(opts.teacher)} sees it right away.`
}

/**
 * What a turned-in item says: who grades it and whether it can still be changed. Once the teacher has published
 * feedback (an item with no gradebook column) it is no longer "waiting to be graded".
 */
export function turnedInNote(opts: { teacher: string | null; canUnsubmit: boolean; closed: boolean; feedback?: boolean }): string {
  const who = teacherOr(opts.teacher)
  if (opts.feedback) return opts.canUnsubmit ? `${who} has sent feedback. You can still unsubmit to change your work.` : `${who} has sent feedback.`
  if (opts.canUnsubmit) return `${who} will grade it. You can unsubmit to change it until then.`
  if (opts.closed) return `${who} will grade it. It can't be changed after the due date.`
  return `${who} will grade it.`
}

/** "This assignment is closed. Ask your teacher." */
export const closedNote = (kind: 'assignment' | 'quiz'): string => `This ${kind} is closed. Ask your teacher.`

/** Under Turn in on work that is past due but still takes late work. */
export function lateNote(item: { dueAt: string | null; date: string | null }, teacher: string | null, now: Date = new Date()): string {
  const was = wasDue(item, now)
  const when = was ? `This ${was}.` : 'This is late.'
  return `${when} If you turn it in now, ${teacher ?? 'your teacher'} will see it's late.`
}

/** "Saved" / "Saving…" / "Couldn't save" beside a typed answer. */
export const workSavedLabel = (status: DebouncedSaveStatus): string =>
  status === 'saving' ? 'Saving…' : status === 'error' ? "Couldn't save" : 'Saved'

// ---------------------------------------------------------------------------
// The grade

/** "Lina Farouk · graded today" / "… · graded Oct 9". */
export function gradedLine(teacher: string | null, publishedAt: string | null, now: Date = new Date()): string | null {
  const when = publishedAt ? `graded ${torontoDateKey(new Date(publishedAt)) === torontoDateKey(now) ? 'today' : shortDate(publishedAt, now)}` : null
  if (teacher && when) return `${teacher} · ${when}`
  if (teacher) return teacher
  return when ? cap(when) : null
}

export type Owner = { you: true } | { name: string }

/** "your" for the student, "Amal's" for a parent, "your child's" while the child's name is not known yet. */
const possessive = (owner: Owner): string => {
  if ('you' in owner) return 'your'
  const first = firstNameOf(owner.name)
  return first ? `${first}'s` : "your child's"
}


export interface GradeBlockCopy {
  tone: 'graded' | 'feedback' | 'missing' | 'excused'
  label: string
  score: { value: string; max: string } | null
  message: string | null
  quote: string | null
  line: string | null
}

/** Everything the grade block says, for the student ("Your grade") or a parent ("Amal's grade"). */
export function gradeBlockCopy(
  grade: NonNullable<StudentItem['grade']>,
  teacher: string | null,
  owner: Owner,
  now: Date = new Date(),
): GradeBlockCopy {
  const quote = grade.feedback?.trim() ? grade.feedback : null
  if (grade.status === 'missing') {
    return {
      tone: 'missing',
      label: 'Missing',
      score: null,
      message: `${teacherOr(teacher)} marked this missing. It counts as 0 until it is graded.`,
      quote,
      line: null,
    }
  }
  if (grade.status === 'excused') {
    return { tone: 'excused', label: 'Excused', score: null, message: `This one doesn't count toward ${possessive(owner)} grade.`, quote, line: null }
  }
  const line = gradedLine(teacher, grade.publishedAt, now)
  if (grade.score == null) return { tone: 'feedback', label: 'Feedback', score: null, message: null, quote, line }
  return {
    tone: 'graded',
    label: cap(`${possessive(owner)} grade`),
    score: { value: formatMark(grade.score), max: grade.maxScore != null ? `/${formatMark(grade.maxScore)}` : '' },
    message: null,
    quote,
    line,
  }
}

// ---------------------------------------------------------------------------
// Whose work, messages, and the parent's notes

/** "Your work" for the student, "Amal's work" for a parent. */
export const workHeading = (owner: Owner): string => cap(`${possessive(owner)} work`)

/** The student's messages about a piece of work always include their parents. */
export const workMessagesSubtitle = (teacher: string | null): string => `${teacher ?? 'your teacher'} and your parents`

/** Under the parent's Classwork list. */
export function lensClassworkNote(childName: string, teacher: string | null): string {
  const first = firstNameOf(childName)
  const base = `Only ${first} can turn work in. You see the same status ${first} does.`
  return teacher ? `${base} Questions? Use "Message ${teacher}" at the top.` : base
}

/** "Private comments between Amal and Lina Farouk: 2" (the link "read" follows it). */
export const parentCommentsLine = (childName: string, teacher: string | null, count: number): string =>
  `Private comments between ${firstNameOf(childName) || 'your child'} and ${teacher ?? 'the teacher'}: ${count}`
