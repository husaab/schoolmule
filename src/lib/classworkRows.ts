// src/lib/classworkRows.ts
// The words and grouping of the teacher's Classwork tab (the Teacher-Classwork
// board): each row's meta line, grade line, pill and link, the sections per
// topic, the URL filters, topic moves and the delete confirmations. Pure, so
// it is unit-tested (classworkRows.test.ts); the components only render what
// these decide. Dates read on the Toronto calendar, the school's.

import { dayKeyLabel, dayLabel } from '@/lib/classStream'
import { teacherItemHref } from '@/lib/classroomRoutes'
import { shortDate, torontoDateKey } from '@/lib/studentAccounts'
import type { ItemKind, ItemSummary, Topic } from '@/services/types/classwork'

const TZ = 'America/Toronto'

export const ITEM_KINDS: readonly ItemKind[] = ['assessment', 'assignment', 'quiz', 'material']

export const KIND_LABELS: Record<ItemKind, string> = {
  assessment: 'Assessment',
  assignment: 'Assignment',
  quiz: 'Quiz',
  material: 'Material',
}

export const KIND_PLURALS: Record<ItemKind, string> = {
  assessment: 'Assessments',
  assignment: 'Assignments',
  quiz: 'Quizzes',
  material: 'Materials',
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Live for students: posted, or scheduled and its time has come. */
export const isLive = (item: Pick<ItemSummary, 'effectiveStatus'>): boolean => item.effectiveStatus === 'posted'

/** An item students hand something in for. */
const takesTurnIn = (item: Pick<ItemSummary, 'kind' | 'submissionMode'>): boolean =>
  item.kind === 'quiz' || (item.kind === 'assignment' && item.submissionMode !== 'none')

// ---------------------------------------------------------------------------
// Dates

const timeOfDay = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
    .format(new Date(iso))
    .replace(/\s+/g, ' ')
    .replace(/ ?([AP]M)$/i, (_, ap: string) => ` ${ap.toLowerCase()}`)

/** "Oct 7" for a calendar day. */
const monthDay = (key: string): string => {
  const [y, m, d] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(new Date(Date.UTC(y, m - 1, d)))
}

/** Today or later reads "Fri, Oct 23"; a past day "Oct 7". */
const dayText = (key: string, now: Date): string => (key >= torontoDateKey(now) ? dayKeyLabel(key) : monthDay(key))

const dueText = (iso: string, now: Date): string => dayText(torontoDateKey(new Date(iso)), now)

// ---------------------------------------------------------------------------
// Rows

/**
 * The line under a row's title:
 * - draft: "Not posted yet"; scheduled: "Posts Mon, Oct 19 at 7:30 am · due Wed, Oct 21"
 * - assessment: "In class · Fri, Oct 23 · shows on students' calendars" / "… · class average 81%"
 * - assignment, quiz: "Due Fri, Oct 16 · 12 turned in · 2 missing · 8 not yet" (zeros left out, "… published" added;
 *   "all 22 published" once everyone it reaches is published; `reach` = the students it is for, when known)
 * - material: "Posted Oct 9"
 */
export function itemMeta(item: ItemSummary, now: Date = new Date(), reach?: number): string {
  if (item.status === 'draft') return 'Not posted yet'

  if (item.effectiveStatus === 'scheduled' && item.publishAt) {
    const posts = `Posts ${dayLabel(item.publishAt)} at ${timeOfDay(item.publishAt)}`
    if (item.dueAt) return `${posts} · due ${dayLabel(item.dueAt)}`
    if (item.kind === 'assessment' && item.date) return `${posts} · in class ${dayKeyLabel(item.date)}`
    return posts
  }

  if (item.kind === 'material') return item.postedAt ? `Posted ${shortDate(item.postedAt, now)}` : 'Posted'

  if (item.kind === 'assessment') {
    const parts = ['In class']
    if (item.date) parts.push(dayText(item.date, now))
    if (item.classAvgPct != null) parts.push(`class average ${Math.round(item.classAvgPct)}%`)
    else if (item.showEarly && item.date && item.date > torontoDateKey(now) && !item.gradebook?.isPublished) {
      parts.push("shows on students' calendars")
    }
    return parts.join(' · ')
  }

  const parts = [item.dueAt ? `Due ${dueText(item.dueAt, now)}` : 'No due date']
  if (!takesTurnIn(item)) {
    parts.push('done in class')
    return parts.join(' · ')
  }
  const { turnedIn, missing, notYet, published } = item.counts
  if (reach && published >= reach && turnedIn + missing + notYet === 0) {
    parts.push(`all ${reach} published`)
    return parts.join(' · ')
  }
  if (turnedIn + missing + notYet > 0) parts.push(`${turnedIn} turned in`)
  if (missing > 0) parts.push(`${missing} missing`)
  if (notYet > 0) parts.push(`${notYet} not yet`)
  if (published > 0) parts.push(`${published} published`)
  return parts.join(' · ')
}

const points = (n: number) => String(Math.round(n * 100) / 100)

/** "Homework · out of 10"; null when the item is not graded. */
export function itemGradeLine(item: Pick<ItemSummary, 'gradebook'>): string | null {
  const gb = item.gradebook
  if (!gb) return null
  const where = gb.categoryName ?? 'Counts on its own'
  return gb.maxScore != null ? `${where} · out of ${points(gb.maxScore)}` : where
}

export interface RowPill {
  label: string
  className: string
}

const SLATE = 'bg-slate-100 text-slate-600'

/** Draft · Scheduled · "{n} to review" · Published · Upcoming · Posted. */
export function itemPill(item: ItemSummary, now: Date = new Date()): RowPill {
  if (item.status === 'draft') return { label: 'Draft', className: SLATE }
  if (item.effectiveStatus === 'scheduled') return { label: 'Scheduled', className: 'bg-amber-100 text-amber-800' }
  if (takesTurnIn(item) && item.counts.toReview > 0) {
    return { label: `${item.counts.toReview} to review`, className: 'bg-cyan-100 text-cyan-800' }
  }
  const published = item.gradebook ? item.gradebook.isPublished : item.counts.published > 0
  if (published && item.counts.drafts === 0) return { label: 'Published', className: 'bg-emerald-100 text-emerald-700' }
  if (item.kind === 'assessment' && item.date && item.date >= torontoDateKey(now)) return { label: 'Upcoming', className: SLATE }
  return { label: 'Posted', className: SLATE }
}

/** Where a row opens (see teacherItemHref). */
export const itemRowHref = (item: ItemSummary): string =>
  teacherItemHref(item.classId, {
    itemId: item.itemId,
    kind: item.kind,
    assessmentId: item.gradebook?.assessmentId ?? null,
    live: item.status !== 'draft' && item.effectiveStatus !== 'scheduled',
  })

// ---------------------------------------------------------------------------
// Sections and filters

/** ?topic= : a topic id, 'none' (no topic) or null (every topic). */
export type TopicFilter = string | 'none' | null

export interface ClassworkFilters {
  topic: TopicFilter
  kind: ItemKind | null
}

export const parseTopicFilter = (value: string | null | undefined, topics: Pick<Topic, 'topicId'>[]): TopicFilter => {
  if (!value) return null
  if (value === 'none') return 'none'
  return topics.some((t) => t.topicId === value) ? value : null
}

export const parseKindFilter = (value: string | null | undefined): ItemKind | null =>
  value && (ITEM_KINDS as readonly string[]).includes(value) ? (value as ItemKind) : null

export interface ClassworkSection {
  key: string
  /** null: the items with no topic. */
  topic: Topic | null
  items: ItemSummary[]
}

/**
 * Items without a topic first, then one section per topic in the teacher's
 * order (empty topics included, so a new topic shows). A topic filter keeps
 * that section only; a type filter hides sections with nothing of that type.
 * An item whose topic is gone counts as having none.
 */
export function groupClasswork(topics: Topic[], items: ItemSummary[], filters: ClassworkFilters): ClassworkSection[] {
  const known = new Set(topics.map((t) => t.topicId))
  const shown = filters.kind ? items.filter((i) => i.kind === filters.kind) : items
  const byTopic = new Map<string | null, ItemSummary[]>()
  for (const i of shown) {
    const key = i.topicId && known.has(i.topicId) ? i.topicId : null
    byTopic.set(key, [...(byTopic.get(key) ?? []), i])
  }

  const sections: ClassworkSection[] = []
  if (filters.topic === null || filters.topic === 'none') {
    const loose = byTopic.get(null) ?? []
    if (loose.length > 0 || filters.topic === 'none') sections.push({ key: 'none', topic: null, items: loose })
  }
  if (filters.topic !== 'none') {
    for (const t of [...topics].sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (filters.topic && filters.topic !== t.topicId) continue
      const list = byTopic.get(t.topicId) ?? []
      if (filters.kind && list.length === 0 && filters.topic !== t.topicId) continue
      sections.push({ key: t.topicId, topic: t, items: list })
    }
  }
  return sections
}

/** The topic ids with one moved up (-1) or down (1); null when it is already at that end. */
export function moveTopicOrder(topics: Topic[], topicId: string, direction: -1 | 1): string[] | null {
  const ids = [...topics].sort((a, b) => a.sortOrder - b.sortOrder).map((t) => t.topicId)
  const from = ids.indexOf(topicId)
  const to = from + direction
  if (from < 0 || to < 0 || to >= ids.length) return null
  ;[ids[from], ids[to]] = [ids[to], ids[from]]
  return ids
}

// ---------------------------------------------------------------------------
// Delete confirmations

export function deleteTopicMessage(topic: Pick<Topic, 'name' | 'itemCount'>): string {
  if (topic.itemCount === 0) return `Delete ${topic.name}? It has nothing in it.`
  return `Delete ${topic.name}? Its ${plural(topic.itemCount, 'item stays', 'items stay')} in Classwork without a topic.`
}

/**
 * Linked work takes its gradebook column and scores; anything else just
 * leaves Classwork (a draft was never seen by anyone).
 */
export function deleteItemMessage(
  item: Pick<ItemSummary, 'title' | 'gradebook'> & { status?: ItemSummary['status']; counts?: Pick<ItemSummary['counts'], 'drafts'> },
): string {
  const gb = item.gradebook
  if (!gb && item.status === 'draft') return `Discard ${item.title}? It was never posted, so no one has seen it.`
  if (!gb) return `Delete ${item.title}? Students will no longer see it.`
  const column = gb.categoryName ? `the ${gb.categoryName} column` : 'the column'
  const base = `Delete ${item.title}? This also removes ${column} "${item.title}" and its ${plural(gb.scoreCount, 'score', 'scores')} from Grades.`
  // Grades still in the grading view (not published yet) live on the students' work, not in the column.
  const drafts = item.counts?.drafts ?? 0
  return drafts > 0 ? `${base} It also deletes ${plural(drafts, 'grade', 'grades')} on students' work that ${drafts === 1 ? "isn't" : "aren't"} published yet.` : base
}
