// src/lib/classStream.ts
// The words and ordering of the teacher's class Stream (the Teacher-Stream
// board): the feed that interleaves posts with classwork notices, the line
// under each post's author, the "seen by" chips, the Upcoming rows and the
// "who gets emails" copy. Pure, so it is unit-tested (classStream.test.ts);
// the components only render what these decide. Dates are read on the
// Toronto calendar, the school's.

import { shortDate } from '@/lib/studentAccounts'
import type { AnnouncementItem } from '@/services/types/announcement'
import type { ClassPageTeacher, ComingUpRow, ItemKind, StreamAudience, StreamNotice } from '@/services/types/classroom'
import type { AvatarSpec } from '@/services/types/profile'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// ---------------------------------------------------------------------------
// The feed

export type FeedEntry =
  | { type: 'post'; key: string; at: string; item: AnnouncementItem }
  | { type: 'notice'; key: string; at: string; notice: StreamNotice }

const time = (iso: string): number => {
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? 0 : t
}

/**
 * Pinned posts stay on top (newest first among them). Everything else, posts
 * and classwork notices together, runs newest first by the time it went up.
 * When a post and a notice share a moment the post comes first.
 */
export function buildFeed(posts: AnnouncementItem[], notices: StreamNotice[]): FeedEntry[] {
  const pinned: FeedEntry[] = []
  const rest: FeedEntry[] = []
  for (const item of posts) {
    const entry: FeedEntry = { type: 'post', key: `post:${item.announcementId}`, at: item.publishedAt, item }
    ;(item.isPinned ? pinned : rest).push(entry)
  }
  for (const notice of notices) {
    rest.push({ type: 'notice', key: `notice:${notice.itemId}`, at: notice.postedAt, notice })
  }
  const newestFirst = (a: FeedEntry, b: FeedEntry) =>
    time(b.at) - time(a.at) || (a.type === b.type ? 0 : a.type === 'post' ? -1 : 1)
  return [...pinned.sort(newestFirst), ...rest.sort(newestFirst)]
}

// ---------------------------------------------------------------------------
// Dates

const utcDate = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** "Fri, Oct 16" for a 'YYYY-MM-DD' calendar date. */
export const dayKeyLabel = (key: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).format(utcDate(key))

/** "Fri, Oct 16" for an instant, on the Toronto calendar. */
export const dayLabel = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', weekday: 'short', month: 'short', day: 'numeric' }).format(
    new Date(iso),
  )

// ---------------------------------------------------------------------------
// Posts

/**
 * Who a post was emailed to, as the line under the author says it. A post made
 * without email is "not emailed"; otherwise the label follows who the class
 * can be emailed today (students only count when the school emails them).
 */
export function emailedLabel(sendEmail: boolean | undefined, audience: StreamAudience): string {
  if (sendEmail === false) return 'not emailed'
  if (audience.students > 0 && audience.guardians > 0) return 'emailed to students and parents'
  if (audience.guardians > 0) return 'emailed to parents'
  if (audience.students > 0) return 'emailed to students'
  return 'emailed'
}

/** "Oct 12 · emailed to students and parents", with " · edited" once the words changed. */
export const postByline = (item: AnnouncementItem, audience: StreamAudience): string =>
  [shortDate(item.publishedAt), emailedLabel(item.sendEmail, audience)].concat(item.editedAt ? ['edited'] : []).join(' · ')

export interface PostAuthor {
  avatar: AvatarSpec | null
  photoUrl: string | null
  /** True when the author co-teaches the class (the lead teacher and admins carry no tag). */
  coTeacher: boolean
}

/** The author's avatar and tag, read from the class's teachers; anyone else (an admin) is the neutral avatar. */
export function resolveAuthor(authorId: string | null, teachers: Pick<ClassPageTeacher, 'userId' | 'role' | 'avatar' | 'photoUrl'>[]): PostAuthor {
  const teacher = authorId ? teachers.find((t) => t.userId === authorId) : undefined
  if (!teacher) return { avatar: null, photoUrl: null, coTeacher: false }
  return { avatar: teacher.avatar ?? null, photoUrl: teacher.photoUrl ?? null, coTeacher: teacher.role === 'co' }
}

export interface SeenChip {
  kind: 'parents' | 'students' | 'ack'
  text: string
}

/**
 * The footer chips of a post. Parents and students appear only when someone
 * can read the post (a class with no student logins shows no student chip);
 * "Got it" appears only when the author asked for it. Guardian and student
 * counts mean different things (see the Stream response), so each says whom.
 */
export function seenChips(item: AnnouncementItem): SeenChip[] {
  const chips: SeenChip[] = []
  const parents = item.audienceCount ?? 0
  if (parents > 0) chips.push({ kind: 'parents', text: `Seen by ${item.seenCount ?? 0} of ${parents} ${parents === 1 ? 'parent' : 'parents'}` })
  const students = item.studentAudienceCount ?? 0
  if (students > 0) {
    chips.push({ kind: 'students', text: `Seen by ${item.studentSeenCount ?? 0} of ${students} ${students === 1 ? 'student' : 'students'}` })
  }
  if (item.ackRequested) chips.push({ kind: 'ack', text: `Got it · ${item.ackCount ?? 0}` })
  return chips
}

// ---------------------------------------------------------------------------
// Classwork notices

const NOTICE_HEADLINE: Record<ItemKind, string> = {
  assessment: 'New assessment',
  assignment: 'New assignment',
  quiz: 'New quiz',
  material: 'New material',
}

/** "New assignment" */
export const noticeHeadline = (kind: ItemKind): string => NOTICE_HEADLINE[kind] ?? 'New classwork'

/** "Oct 13 · due Fri, Oct 16 · 12 of 22 turned in" (due and the count only when the work has them). */
export function noticeMeta(notice: StreamNotice): string {
  const parts = [shortDate(notice.postedAt)]
  if (notice.dueAt) parts.push(`due ${dayLabel(notice.dueAt)}`)
  if (notice.kind !== 'material' && notice.turnedInCount != null && notice.total != null) {
    parts.push(`${notice.turnedInCount} of ${notice.total} turned in`)
  }
  return parts.join(' · ')
}

// ---------------------------------------------------------------------------
// Upcoming

/** "Due Fri, Oct 16", "Fri, Oct 23 · in class", or just the date. */
export function upcomingLabel(row: Pick<ComingUpRow, 'date' | 'dueAt' | 'inClass'>): string {
  const day = dayKeyLabel(row.date)
  if (row.inClass) return `${day} · in class`
  return row.dueAt ? `Due ${day}` : day
}

// ---------------------------------------------------------------------------
// Who gets emails

export type EmailAudienceKind = 'both' | 'parents' | 'students' | 'none'

export const emailAudienceKind = (audience: StreamAudience): EmailAudienceKind => {
  if (audience.students > 0 && audience.guardians > 0) return 'both'
  if (audience.guardians > 0) return 'parents'
  if (audience.students > 0) return 'students'
  return 'none'
}

/**
 * The composer's email checkbox: "Email students and parents · 22 students, 31 parents".
 * With no count to give yet (null: students are still being picked, or the count is on its way),
 * it says no numbers rather than a "no one has an email" it does not know.
 */
export function emailCheckboxText(audience: StreamAudience | null): string {
  if (audience === null) return 'Email students and parents'
  switch (emailAudienceKind(audience)) {
    case 'both':
      return `Email students and parents · ${plural(audience.students, 'student', 'students')}, ${plural(audience.guardians, 'parent', 'parents')}`
    case 'parents':
      return `Email parents · ${plural(audience.guardians, 'parent', 'parents')}`
    case 'students':
      return `Email students · ${plural(audience.students, 'student', 'students')}`
    default:
      return 'Email students and parents · no one has an email on file yet'
  }
}
