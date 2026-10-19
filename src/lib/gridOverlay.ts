// src/lib/gridOverlay.ts
// The gradebook grid's classwork layer (the Teacher-Grades board, spec D3).
// A turn-in column (an assessment filled by an assignment or quiz) keeps its
// scores as drafts on the students' submissions until it is published, so the
// plain score matrix shows those cells blank. The overlay
// (GET /api/classroom/classes/:classId/grid-overlay) puts them back for the
// teacher, marked: a draft grey and italic, "In" for work turned in with no
// grade yet, a rose dot for work past due with nothing turned in. Category
// cells get a dot: rose when anything inside is missing, else cyan when
// anything inside is turned in or a draft.
//
// Drafts are not grades yet, so they never count in the grid's totals (the
// gradebook, report cards and parents see none of them). Pure, so it is
// unit-tested (gridOverlay.test.ts).

import type { CellValue } from '@/lib/scoreAutosaveQueue'
import type { ScoreStatus } from '@/lib/gradeEngine'
import type { ItemStatus } from '@/services/types/classwork'
import type { GridOverlay, GridOverlayCell, GridOverlayItem, UpsertDraftRow } from '@/services/types/grading'

export interface OverlayIndex {
  /** Turn-in columns by assessment id. */
  columns: Record<string, GridOverlayItem>
  /** Cells by "studentId|assessmentId". */
  cells: Record<string, GridOverlayCell>
}

export const EMPTY_OVERLAY: OverlayIndex = { columns: {}, cells: {} }

const keyOf = (studentId: string, assessmentId: string) => `${studentId}|${assessmentId}`

const toNumber = (value: number | string | null | undefined): number | null =>
  value === null || value === undefined || value === '' ? null : Number(value)

export function indexOverlay(data: GridOverlay | null | undefined): OverlayIndex {
  if (!data) return EMPTY_OVERLAY
  const columns: Record<string, GridOverlayItem> = {}
  for (const item of data.items ?? []) columns[item.assessmentId] = item
  const cells: Record<string, GridOverlayCell> = {}
  for (const cell of data.cells ?? []) {
    cells[keyOf(cell.studentId, cell.assessmentId)] = { ...cell, draftScore: toNumber(cell.draftScore) }
  }
  return { columns, cells }
}

/** An assessment filled by an assignment or quiz. */
export const isTurnInColumn = (index: OverlayIndex, assessmentId: string): boolean => assessmentId in index.columns

/**
 * A draft its column's Publish would actually publish. The server marks each
 * cell (`needsPublish`): a draft equal to what students already see is
 * skipped as unchanged, so it isn't counted. Before the server sent the flag
 * (or for a draft just typed, until the overlay is read again) every draft
 * counts. A draft made before the student's newest turn-in
 * (`draftPredatesWork`, Fable I1) waits for the teacher to save it again, so
 * it isn't counted either; saving it in the grid writes a fresh cell.
 */
export const awaitsPublish = (c: GridOverlayCell): boolean =>
  c.state === 'draft' && c.needsPublish !== false && c.draftPredatesWork !== true

/** Drafts waiting on one column: what its "Publish N" publishes. */
export const draftCount = (index: OverlayIndex, assessmentId: string): number =>
  Object.values(index.cells).filter((c) => c.assessmentId === assessmentId && awaitsPublish(c)).length

export function draftCounts(index: OverlayIndex): Record<string, number> {
  const out: Record<string, number> = {}
  for (const c of Object.values(index.cells)) if (awaitsPublish(c)) out[c.assessmentId] = (out[c.assessmentId] ?? 0) + 1
  return out
}

export interface OverlayCellView {
  /** What the cell holds: the draft when there is one, else the gradebook's value. */
  saved: CellValue
  status: ScoreStatus
  /** Only the teacher sees it: grey and italic. */
  draft: boolean
  /** Turned in, no grade yet: "In". */
  turnedIn: boolean
  /** Past due with nothing turned in (nothing is written): a rose dot. */
  derivedMissing: boolean
  isLate: boolean
}

/**
 * One cell as the grid shows it. `matrix` is the gradebook's saved value and
 * status; `columnPublished` the column's publish state. Any value on an
 * unpublished turn-in column is a draft, whatever the item's audience.
 */
export function overlayCell(
  index: OverlayIndex,
  studentId: string,
  assessmentId: string,
  matrix: { saved: CellValue; status: ScoreStatus },
  columnPublished: boolean,
): OverlayCellView {
  const plain = { ...matrix, draft: false, turnedIn: false, derivedMissing: false, isLate: false }
  if (!isTurnInColumn(index, assessmentId)) return plain
  const cell = index.cells[keyOf(studentId, assessmentId)]
  const marks = {
    turnedIn: cell?.state === 'turned_in',
    derivedMissing: cell?.state === 'missing_derived',
    isLate: Boolean(cell?.isLate),
  }
  if (cell?.state === 'draft') {
    const status: ScoreStatus = cell.draftStatus ?? 'graded'
    return { saved: status === 'missing' ? null : cell.draftScore, status, draft: true, ...marks }
  }
  const hasValue = matrix.saved !== null || matrix.status !== 'graded'
  return { ...matrix, draft: !columnPublished && hasValue, ...marks }
}

/**
 * The overlay after a grid save (POST …/scores answers `data` for live
 * cells and `drafts` for draft ones): a draft lands at once; a cleared draft
 * stops being one; a live grade on a turn-in column clears its In and
 * missing marks. The grid re-reads the overlay shortly after for the rest.
 */
export function applySavedScores(
  index: OverlayIndex,
  res: { data?: { student_id: string; assessment_id: string; score: CellValue | string; status?: ScoreStatus | null }[]; drafts?: unknown[] } | undefined,
): OverlayIndex {
  if (!res) return index
  let cells: Record<string, GridOverlayCell> | null = null
  const write = () => (cells ??= { ...index.cells })

  for (const raw of (res.drafts ?? []) as UpsertDraftRow[]) {
    if (!raw || !isTurnInColumn(index, raw.assessment_id)) continue
    const key = keyOf(raw.student_id, raw.assessment_id)
    const score = toNumber(raw.draft_score)
    const prev = index.cells[key]
    if (score === null && raw.draft_status === null) {
      if (prev?.state === 'draft') delete write()[key]
      continue
    }
    write()[key] = {
      studentId: raw.student_id,
      assessmentId: raw.assessment_id,
      state: 'draft',
      draftScore: score,
      draftStatus: raw.draft_status,
      isLate: prev?.isLate ?? false,
    }
  }

  for (const row of res.data ?? []) {
    if (!isTurnInColumn(index, row.assessment_id)) continue
    const key = keyOf(row.student_id, row.assessment_id)
    const graded = toNumber(row.score as number | string | null) !== null || row.status === 'missing' || row.status === 'excused'
    if (graded && key in (cells ?? index.cells)) delete write()[key]
  }

  return cells ? { columns: index.columns, cells } : index
}

export type CategoryDot = 'missing' | 'waiting' | null

/**
 * A category cell's dot for one student: rose when anything inside is
 * missing (confirmed in the gradebook, a missing draft, or past due), else
 * cyan when anything inside is turned in or a draft.
 */
export function categoryDot(index: OverlayIndex, studentId: string, childIds: string[], confirmedMissing: boolean): CategoryDot {
  const cells = childIds.map((id) => index.cells[keyOf(studentId, id)]).filter(Boolean)
  const missing = cells.some((c) => c.state === 'missing_derived' || (c.state === 'draft' && c.draftStatus === 'missing'))
  if (confirmedMissing || missing) return 'missing'
  if (cells.some((c) => c.state === 'turned_in' || c.state === 'draft')) return 'waiting'
  return null
}

/** Values not saved yet, minus those typed into columns that keep drafts: totals count grades, not drafts. */
export function withoutDraftColumns(local: Record<string, CellValue>, keepsDrafts: (assessmentId: string) => boolean): Record<string, CellValue> {
  const out: Record<string, CellValue> = {}
  for (const [key, value] of Object.entries(local)) {
    const assessmentId = key.split('|')[1]
    if (!keepsDrafts(assessmentId)) out[key] = value
  }
  return out
}

/** A column whose classwork students can't see yet (Task 18 M7). */
export const notPostedLabel = (status: ItemStatus | null | undefined): string | null =>
  status === 'draft' ? 'Draft · not posted' : status === 'scheduled' ? 'Scheduled · not posted' : null
