// src/services/reportGenerationService.ts
// Report cards and progress reports generated in the background. Starting a
// run only queues it (the server prints it); the page follows it with
// listReportRuns. Every call is scoped to the selected school year.
import apiClient from './apiClient'
import type {
  ReportGenerationEnvelope,
  ReportGenerationType,
  ReportRun,
  StartReportRunPayload,
  StartedReportRun,
} from './types/reportGeneration'

const RUNS = '/report-generation/runs'

/** POST /api/report-generation/runs: queue these students; answers at once. */
export const startReportRun = async (payload: StartReportRunPayload): Promise<ReportGenerationEnvelope<StartedReportRun>> =>
  apiClient<ReportGenerationEnvelope<StartedReportRun>, StartReportRunPayload>(RUNS, { method: 'POST', body: payload })

/** GET /api/report-generation/runs: what a page shows for one report type and term, oldest run first. */
export const listReportRuns = async ({ reportType, term }: { reportType: ReportGenerationType; term: string }): Promise<ReportGenerationEnvelope<ReportRun[]>> =>
  apiClient<ReportGenerationEnvelope<ReportRun[]>>(`${RUNS}?reportType=${encodeURIComponent(reportType)}&term=${encodeURIComponent(term)}`)

const control = (action: 'cancel' | 'retry' | 'dismiss') => async (runId: string): Promise<ReportGenerationEnvelope<ReportRun>> =>
  apiClient<ReportGenerationEnvelope<ReportRun>, Record<string, never>>(`${RUNS}/${encodeURIComponent(runId)}/${action}`, { method: 'POST', body: {} })

/** Stop: what hasn't started is dropped; a report being made now finishes. */
export const cancelReportRun = control('cancel')
/** Try again: the failed students wait again. */
export const retryReportRun = control('retry')
/** Clear a finished run's results from the page, for everyone. */
export const dismissReportRun = control('dismiss')
