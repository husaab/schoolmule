// src/services/gradingService.ts
// Grading turned-in work (/api/classroom, staff only; every item route checks
// that the caller teaches the item's class). Drafts live on the student's
// submission until Publish copies them into the gradebook (spec D3); once a
// column is published, a grade edit goes live as it saves (D17).
//
// The item-thread route is Task 17's (shared contract). Until that backend
// lands it answers 404, so the grading view keeps its thread panel inert
// (ITEM_THREADS_ENABLED in src/lib/classroomFeatures.ts). The thread itself is
// named by the submission (`SubmissionDetail.thread`), so there is no GET here.

import apiClient from './apiClient'
import type {
  GradePatch,
  GradePatchResult,
  GradingEnvelope,
  GradingList,
  GridOverlay,
  PublishGradesResult,
  SubmissionDetail,
} from './types/grading'

const itemPath = (itemId: string) => `/classroom/items/${encodeURIComponent(itemId)}`
const studentPath = (itemId: string, studentId: string) =>
  `${itemPath(itemId)}/submissions/${encodeURIComponent(studentId)}`

/** GET the grading list: the item's students with their work state, drafts and what is published. */
export const getGradingList = (itemId: string) =>
  apiClient<GradingEnvelope<GradingList>>(`${itemPath(itemId)}/submissions`)

/** GET one student's turned-in work: typed answer, files (signed for an hour) and their row. */
export const getSubmission = (itemId: string, studentId: string) =>
  apiClient<GradingEnvelope<SubmissionDetail>>(studentPath(itemId, studentId))

/**
 * PATCH a draft grade and/or feedback. Keys left out keep their value; a
 * typed score resets the status to graded unless one is sent. `keepalive`
 * lets the save outlive the page (sent from pagehide).
 */
export const updateSubmission = (itemId: string, studentId: string, patch: GradePatch, opts: { keepalive?: boolean } = {}) =>
  apiClient<GradingEnvelope<GradePatchResult>, GradePatch>(studentPath(itemId, studentId), {
    method: 'PATCH',
    body: patch,
    keepalive: opts.keepalive,
  })

/** POST publish: these students' drafts (or every pending one, 'graded') go to the gradebook and the column is published on its first use. */
export const publishGrades = (itemId: string, studentIds: string[] | 'graded') =>
  apiClient<GradingEnvelope<PublishGradesResult>, { studentIds: string[] | 'graded' }>(`${itemPath(itemId)}/publish`, {
    method: 'POST',
    body: { studentIds },
  })

/** POST mark-missing: the students' work counts as 0, published at once. */
export const markMissing = (itemId: string, studentIds: string[]) =>
  apiClient<GradingEnvelope<PublishGradesResult>, { studentIds: string[] }>(`${itemPath(itemId)}/mark-missing`, {
    method: 'POST',
    body: { studentIds },
  })

/** POST excuse (excused: true) or lift it (false). An excuse is published at once. */
export const excuseStudents = (itemId: string, studentIds: string[], excused: boolean) =>
  apiClient<GradingEnvelope<PublishGradesResult>, { studentIds: string[]; excused: boolean }>(`${itemPath(itemId)}/excuse`, {
    method: 'POST',
    body: { studentIds, excused },
  })

/** GET the gradebook grid's classwork layer: turn-in columns and their draft / turned-in / past-due cells. */
export const getGridOverlay = (classId: string) =>
  apiClient<GradingEnvelope<GridOverlay>>(`/classroom/classes/${encodeURIComponent(classId)}/grid-overlay`)

/** POST ensures that thread exists (Task 17); the teacher then posts through /api/messaging. */
export const ensureItemThread = (itemId: string, studentId: string) =>
  apiClient<GradingEnvelope<{ conversationId: string }>>(
    `${itemPath(itemId)}/students/${encodeURIComponent(studentId)}/thread`,
    { method: 'POST' },
  )
