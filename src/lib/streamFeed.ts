// src/lib/streamFeed.ts
// The order of a student's or parent's class Stream: pinned posts first, then
// posts and classwork notices together, newest first. When a post and a
// notice share a moment the post comes first. Pure and unit-tested
// (streamFeed.test.ts). (The teacher's Stream has its own, in classStream.ts.)

import type { ClassNotice, StudentAnnouncement } from '@/services/types/studentPortal'

export type StreamEntry =
  | { type: 'post'; key: string; at: string; post: StudentAnnouncement }
  | { type: 'notice'; key: string; at: string; notice: ClassNotice }

const time = (iso: string): number => {
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? 0 : t
}

export function buildStreamFeed(posts: StudentAnnouncement[], notices: ClassNotice[]): StreamEntry[] {
  const pinned: StreamEntry[] = []
  const rest: StreamEntry[] = []
  for (const post of posts) {
    const entry: StreamEntry = { type: 'post', key: `post:${post.announcementId}`, at: post.publishedAt, post }
    ;(post.isPinned ? pinned : rest).push(entry)
  }
  for (const notice of notices) rest.push({ type: 'notice', key: `notice:${notice.itemId}`, at: notice.postedAt, notice })
  const newestFirst = (a: StreamEntry, b: StreamEntry) =>
    time(b.at) - time(a.at) || (a.type === b.type ? 0 : a.type === 'post' ? -1 : 1)
  return [...pinned.sort(newestFirst), ...rest.sort(newestFirst)]
}

/** "New assignment", "New quiz" or "New material". */
export const noticeLead = (kind: ClassNotice['kind']): string =>
  kind === 'quiz' ? 'New quiz' : kind === 'material' ? 'New material' : kind === 'assessment' ? 'New assessment' : 'New assignment'
