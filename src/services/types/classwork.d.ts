// services/types/classwork.d.ts
// Classwork for staff (/api/classroom): items, topics, attachments and copy
// from another class. The shapes are the backend's (Task 14) verbatim; the
// counts on an item come from Task 15.

import type { ItemKind } from './classroom'

export type { ItemKind } from './classroom'

export type SubmissionMode = 'file' | 'text' | 'done' | 'none'
export type ItemStatus = 'draft' | 'scheduled' | 'posted'
export type ItemAudience = 'all' | 'some'

/** How an item counts in the gradebook (D2). */
export type GradebookInput =
  | { mode: 'category'; categoryId: string; maxScore: number }
  | { mode: 'existing'; assessmentId: string }
  | { mode: 'none' }

/** POST /classes/:classId/items; PATCH /items/:itemId takes any subset. */
export interface ItemInput {
  kind: ItemKind
  title: string
  instructions?: string | null
  topicId?: string | null
  /** ISO; assignment/quiz only. */
  dueAt?: string | null
  /** YYYY-MM-DD; kind 'assessment' only. */
  date?: string | null
  /** Assignment only (file|text|done|none); forced 'none' otherwise. */
  submissionMode?: SubmissionMode
  gradebook?: GradebookInput
  status?: ItemStatus
  publishAt?: string | null
  audience?: ItemAudience
  studentIds?: string[]
  emailStudents?: boolean
  remindStudents?: boolean
  showEarly?: boolean
}

export interface Topic {
  topicId: string
  name: string
  sortOrder: number
  itemCount: number
}

/** A gradebook category: "Homework (20 of 100)". */
export interface CategoryOption {
  assessmentId: string
  name: string
  weightPoints: number
  childCount: number
}

/** A gradebook column an assignment or quiz may fill. */
export interface ColumnOption {
  assessmentId: string
  name: string
  categoryName: string | null
  maxScore: number | null
}

export interface Attachment {
  attachmentId: string
  kind: 'file' | 'link'
  title: string | null
  fileName: string | null
  mimeType: string | null
  sizeBytes: number | null
  /** A file's signed URL (1 h) when the payload signs it; a link's address. */
  url: string | null
  youtubeId: string | null
}

export interface ItemGradebook {
  assessmentId: string
  /** null: the column counts on its own (no category). */
  categoryId: string | null
  categoryName: string | null
  maxScore: number | null
  weightPoints: number | null
  isPublished: boolean
  /** Cells holding a grade: a score, or a missing/excused status. */
  scoreCount: number
}

export interface ItemCounts {
  turnedIn: number
  missing: number
  notYet: number
  toReview: number
  drafts: number
  published: number
}

export interface ItemSummary {
  itemId: string
  classId: string
  kind: ItemKind
  title: string
  topicId: string | null
  status: ItemStatus
  /** 'posted' for a scheduled item whose time has come. */
  effectiveStatus: ItemStatus
  publishAt: string | null
  postedAt: string | null
  dueAt: string | null
  /** YYYY-MM-DD: the gradebook column's date. */
  date: string | null
  submissionMode: SubmissionMode
  showEarly: boolean
  audience: ItemAudience
  gradebook: ItemGradebook | null
  attachmentCount: number
  counts: ItemCounts
  /** Plain published assessments: the grade engine's class average. */
  classAvgPct: number | null
  createdAt: string
  editedAt: string | null
}

export interface Item extends ItemSummary {
  instructions: string | null
  emailStudents: boolean
  remindStudents: boolean
  studentIds: string[]
  attachments: Attachment[]
}

/** GET /classes/:classId/items */
export interface ClassworkData {
  topics: Topic[]
  items: ItemSummary[]
  categories: CategoryOption[]
  linkableColumns: ColumnOption[]
}

export interface DeleteItemResult {
  deleted: true
  /** A gradebook column (and its scores) went with it. */
  removedColumn: boolean
}

export interface CopySource {
  classId: string
  /** "Grade 5 Science · Term 1" */
  label: string
  itemCount: number
}

export interface CopyInput {
  sourceClassId: string
  itemIds?: string[]
  includeTopics?: boolean
}

export interface CopyWarning {
  title: string
  message: string
}

export interface CopyResult {
  copied: number
  items: ItemSummary[]
  warnings: CopyWarning[]
}

export interface ClassworkEnvelope<T> {
  status: 'success'
  data: T
}
