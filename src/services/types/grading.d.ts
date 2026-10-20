// services/types/grading.d.ts
// Grading turned-in work (/api/classroom, staff): the grading view's list and
// one student's submission, draft grades and feedback, per-student Publish,
// Mark missing and Excuse, and the gradebook grid's classwork layer. The
// shapes are the backend's (Tasks 16 and 17) verbatim.
//
// The words: a Draft only the teacher sees, Publish (the teacher's release),
// Published. Students and parents see "Graded".

import type { AvatarSpec } from './profile'
import type { ItemSummary, SubmissionMode } from './classwork'
import type { SubmissionQuiz } from './quiz'

export type WorkStatus = 'assigned' | 'missing' | 'turned_in' | 'graded' | 'excused' | 'no_turn_in' | 'material'

/** A gradebook cell's status (the same three the grid knows). */
export type GradeStatus = 'graded' | 'missing' | 'excused'

export type GradingLabel =
  | 'Graded · draft'
  | 'Turned in'
  | 'Turned in · late'
  | 'Missing'
  | 'Not turned in yet'
  | 'Published'
  | 'Excused'

export interface GradingRow {
  studentId: string
  name: string
  avatar: AvatarSpec | null
  /** Signed photo URL, while the school has student photos on. Optional: older servers don't send it. */
  photoUrl?: string | null
  status: WorkStatus
  /** Turned in late (kept after grading, so the panel can still say so). */
  isLate: boolean
  turnedInAt: string | null
  draftScore: number | null
  draftStatus: GradeStatus | null
  /** What the student and parents see now. */
  publishedScore: number | null
  publishedStatus: GradeStatus | null
  publishedAt: string | null
  feedback: string | null
  /** Counted by "Publish to N students". */
  needsPublish: boolean
  /** A thread about this work exists (the chat icon beside the student). */
  hasThread: boolean
  label: GradingLabel
  /**
   * A quiz column: the score was typed by the teacher and wins over the quiz's points (T23 fix round 1; false
   * for every other column). Optional only so older fixtures still type-check.
   */
  scoreSetByTeacher?: boolean
  /**
   * The student signs in to the student portal, so a publish emails them (smoke S5). Optional: older servers don't
   * send it, and then the copy promises the email only to students who sign in.
   */
  signsIn?: boolean
  /**
   * A publish emails the student: they sign in, the school sends student emails for their grade and they have an
   * address (FE re-review N6). Optional: no server sends it yet; without it the copy hedges the email for a student
   * who signs in.
   */
  getsEmail?: boolean
  /**
   * Fable I1: the draft grade or feedback was made before the student took the work back or turned it in again
   * (a draft is invisible to them). Turned in again: back in "To grade", flagged "Graded earlier — check the new
   * work". No Publish takes it (the server sends needsPublish false) until the teacher saves the score, status or
   * feedback again, which clears it. Optional: older servers don't send it, and then nothing is flagged.
   */
  draftPredatesWork?: boolean
}

export interface GradingCounts {
  all: number
  /** Handed in, graded or not. */
  turnedIn: number
  /** Turned in, no draft yet, nothing published. */
  toGrade: number
  /** Missing, confirmed or past due. */
  missing: number
  /** Drafts waiting for Publish (= "Publish to N students"). */
  drafts: number
  published: number
}

export interface GradingItem extends ItemSummary {
  maxScore: number | null
  categoryName: string | null
}

/** GET /items/:itemId/submissions */
export interface GradingList {
  item: GradingItem
  isAssessmentPublished: boolean
  counts: GradingCounts
  students: GradingRow[]
}

export interface SubmissionFile {
  fileId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  /** Signed for an hour. */
  url: string | null
}

/** The private thread about this work (null `conversationId`: nobody has written yet). */
export interface ItemThreadStub {
  conversationId: string | null
  messageCount: number
}

/** GET /items/:itemId/submissions/:studentId */
export interface SubmissionDetail {
  row: GradingRow
  textAnswer: string | null
  files: SubmissionFile[]
  /** A quiz: the student's attempt and answers with the key (Task 23); null until they start, and for assignments. */
  quiz: SubmissionQuiz | null
  /** The private thread about this work; null until someone writes. */
  thread: ItemThreadStub | null
}

/** PATCH /items/:itemId/submissions/:studentId: only the keys that changed. */
export interface GradePatch {
  draftScore?: number | null
  draftStatus?: GradeStatus | null
  feedback?: string | null
}

export interface GradePatchResult {
  row: GradingRow
  /** The grade and feedback are visible to the student now. */
  live: boolean
}

/** 'draft_predates_work' (Fable I1): a draft made before the student took the work back or turned it in again. */
export type PublishSkipReason = 'no_draft' | 'not_in_audience' | 'unchanged' | 'draft_predates_work'

export interface GradingEmailSummary {
  attempted: number
  sent: number
  failed: number
  skippedNoEmail: number
}

/** POST publish / mark-missing / excuse */
export interface PublishGradesResult {
  publishedStudentIds: string[]
  skipped: { studentId: string; reason: PublishSkipReason }[]
  /** The column was published by this call (its first publish). */
  assessmentPublished: boolean
  emailSummary?: GradingEmailSummary
  /** Mark missing and Excuse: every student whose status changed. */
  updatedStudentIds?: string[]
}

/** A turn-in column of the class (an assignment or quiz with a gradebook column). */
export interface GridOverlayItem {
  assessmentId: string
  itemId: string
  kind: 'assignment' | 'quiz'
  submissionMode: SubmissionMode
}

export type GridOverlayState = 'turned_in' | 'draft' | 'missing_derived'

export interface GridOverlayCell {
  studentId: string
  assessmentId: string
  state: GridOverlayState
  /** Set for drafts only. */
  draftScore: number | null
  draftStatus: GradeStatus | null
  isLate: boolean
  /**
   * A draft this column's Publish would publish (false for one equal to what students already see, which
   * Publish skips as unchanged). Optional: older servers don't send it, and then every draft counts.
   */
  needsPublish?: boolean
  /** Fable I1: a draft made before the student's newest turn-in; the column's Publish leaves it out. Optional. */
  draftPredatesWork?: boolean
}

/** GET /classes/:classId/grid-overlay */
export interface GridOverlay {
  items: GridOverlayItem[]
  cells: GridOverlayCell[]
}

/** POST /studentAssessments/classes/:classId/scores answers `drafts` in this shape (NUMERIC may come as "8.00"). */
export interface UpsertDraftRow {
  student_id: string
  assessment_id: string
  draft_score: number | string | null
  draft_status: GradeStatus | null
}

export interface GradingEnvelope<T> {
  status: 'success'
  data: T
}
