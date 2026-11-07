// src/lib/reportGeneration.ts
// Report cards and progress reports are generated in the background: each
// press of Generate is a run on the server (services/reportGenerationService).
// A page shows one card for its term, however many runs are behind it, and
// each waiting student's row says Queued or Generating. This file turns the
// runs into those numbers and states, and owns the card's words, so the web
// and the app say the same. Platform-neutral: the app copies it verbatim.

import type { ReportRun, ReportRunItemStatus } from '@/services/types/reportGeneration'

export type WaitingState = 'queued' | 'printing'

export interface ActiveGeneration {
  /** Made or skipped so far, across every running run. */
  done: number
  /** Students in the running runs, less any stopped. */
  total: number
  /** Skipped so far. */
  failed: number
  /** No report has finished in 5 minutes. */
  stalled: boolean
  /** Who else started a running run (never the viewer). */
  startedBy: string[]
  runIds: string[]
}

export interface FinishedGeneration {
  generatedIds: string[]
  failed: { studentId: string; error: string }[]
  /** Students a Stop left out. */
  cancelled: number
  runIds: string[]
}

export interface GenerationSummary {
  /** Null when nothing runs, or only one student waits (their row says so). */
  active: ActiveGeneration | null
  /** Null when no finished run has results to show. One-student runs never do: they get a toast. */
  finished: FinishedGeneration | null
  /** Students waiting now, by id. */
  waiting: Map<string, WaitingState>
}

const isWaiting = (status: ReportRunItemStatus): status is WaitingState => status === 'queued' || status === 'printing'
const byCreated = (runs: ReportRun[]) => [...runs].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

/** Each student's latest state: a later run decides. */
function latestStates(runs: ReportRun[]): Map<string, { status: ReportRunItemStatus; error: string | null }> {
  const latest = new Map<string, { status: ReportRunItemStatus; error: string | null }>()
  for (const run of byCreated(runs)) {
    for (const item of run.items) {
      // A student can wait in only one run; that state wins over an older result.
      const current = latest.get(item.studentId)
      if (current && isWaiting(current.status) && !isWaiting(item.status)) continue
      latest.set(item.studentId, { status: item.status, error: item.error })
    }
  }
  return latest
}

/** The card's numbers and each waiting student, from the runs a page lists. */
export function summarizeRuns(runs: ReportRun[], currentUserId: string | null): GenerationSummary {
  const latest = latestStates(runs)
  const waiting = new Map<string, WaitingState>()
  for (const [studentId, { status }] of latest) if (isWaiting(status)) waiting.set(studentId, status)

  const running = byCreated(runs).filter((r) => !r.finishedAt)
  const total = running.reduce((n, r) => n + r.studentCount - r.counts.cancelled, 0)
  const active: ActiveGeneration | null =
    running.length > 0 && total >= 2
      ? {
          done: running.reduce((n, r) => n + r.counts.generated + r.counts.failed, 0),
          total,
          failed: running.reduce((n, r) => n + r.counts.failed, 0),
          stalled: running.some((r) => r.stalled),
          startedBy: [
            ...new Set(running.filter((r) => r.createdBy !== currentUserId && r.createdByName).map((r) => r.createdByName as string)),
          ],
          runIds: running.map((r) => r.runId),
        }
      : null

  const done = byCreated(runs).filter((r) => r.finishedAt && r.studentCount > 1)
  const students = [...new Set(done.flatMap((r) => r.items.map((i) => i.studentId)))]
  const generatedIds = students.filter((id) => latest.get(id)?.status === 'generated')
  const failed = students
    .filter((id) => latest.get(id)?.status === 'failed')
    .map((studentId) => ({ studentId, error: latest.get(studentId)?.error || 'Unknown error' }))
  const cancelled = students.filter((id) => latest.get(id)?.status === 'cancelled').length
  const finished: FinishedGeneration | null =
    generatedIds.length + failed.length + cancelled > 0 ? { generatedIds, failed, cancelled, runIds: done.map((r) => r.runId) } : null

  return { active, finished, waiting }
}

/**
 * The rows to keep showing as generating: the waiting students, plus anyone a
 * running run has just made whose new report the page's list hasn't read yet.
 */
export function withUnlistedReports(waiting: Map<string, WaitingState>, runs: ReportRun[], hasReport: (studentId: string) => boolean): Map<string, WaitingState> {
  const shown = new Map(waiting)
  for (const run of runs) {
    if (run.finishedAt) continue
    for (const item of run.items) {
      if (item.status === 'generated' && !shown.has(item.studentId) && !hasReport(item.studentId)) shown.set(item.studentId, 'printing')
    }
  }
  return shown
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** The card's two lines. */
export function generationCardText(
  doc: { noun: string; nouns: string },
  { active, finished }: Pick<GenerationSummary, 'active' | 'finished'>,
): { title: string; detail: string } {
  if (active) {
    return {
      title: `Generating ${doc.nouns} · ${active.done} of ${active.total}`,
      detail: active.stalled
        ? 'No report has finished in 5 minutes. Nothing is lost, and it picks up again when the server is back. You can stop it and try later.'
        : 'This keeps going if you leave this page.',
    }
  }
  if (!finished) return { title: '', detail: '' }
  const parts = [`${count(finished.generatedIds.length, doc.noun, doc.nouns)} ready`]
  if (finished.failed.length > 0) parts.push(`${count(finished.failed.length, 'student', 'students')} skipped`)
  if (finished.cancelled > 0) parts.push(`${finished.cancelled} not started`)
  return {
    title: `${finished.cancelled > 0 ? 'Stopped · ' : ''}${parts.join(' · ')}`,
    detail: finished.failed.length > 0 ? 'See details for who was skipped and why.' : "They're in the list now.",
  }
}
