// src/services/types/reportGeneration.d.ts
// Report cards and progress reports generated in the background
// (/api/report-generation): a run is one press of Generate, an item one
// student of it.

export type ReportGenerationType = 'progress_report' | 'report_card'

/** printing: being made now; queued: waiting its turn. */
export type ReportRunItemStatus = 'queued' | 'printing' | 'generated' | 'failed' | 'cancelled'

export interface ReportRunItem {
  studentId: string
  status: ReportRunItemStatus
  /** Why it couldn't be made (failed). */
  error: string | null
}

export interface ReportRun {
  runId: string
  reportType: ReportGenerationType
  term: string
  studentCount: number
  createdAt: string
  /** Null while anything waits. */
  finishedAt: string | null
  createdBy: string | null
  createdByName: string | null
  /** Something waits and no report has finished in 5 minutes. */
  stalled: boolean
  counts: { pending: number; generated: number; failed: number; cancelled: number }
  /** In the order they print. */
  items: ReportRunItem[]
}

export interface StartReportRunPayload {
  reportType: ReportGenerationType
  term: string
  studentIds: string[]
  /** YYYY-MM-DD, printed on JK/SK progress reports. */
  reportDate?: string
}

/** run is null when every student was waiting already. */
export interface StartedReportRun {
  run: ReportRun | null
  alreadyQueued: number
}

export interface ReportGenerationEnvelope<T> {
  status: string
  data: T
  message?: string
}
