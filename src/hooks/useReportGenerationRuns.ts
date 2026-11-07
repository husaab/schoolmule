// src/hooks/useReportGenerationRuns.ts
//
// Follows a page's report generation runs on the server: reads them when the
// page opens (and when its term or school year changes), every 4 seconds
// while anything is running, then stops. Start, Stop, Try again and Dismiss
// go through here and read the runs again. A read that answers for a term or
// year the page has left is dropped. Plain timers and no browser APIs: the
// app copies this file verbatim.
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { summarizeRuns } from '@/lib/reportGeneration'
import {
  cancelReportRun,
  dismissReportRun,
  listReportRuns,
  retryReportRun,
  startReportRun,
} from '@/services/reportGenerationService'
import type { ReportGenerationType, ReportRun, StartedReportRun } from '@/services/types/reportGeneration'

const POLL_MS = 4000

export interface ReportRunsScope {
  reportType: ReportGenerationType
  term: string
  /** The selected school year: a change reads again. */
  yearId: string | null
}

export function useReportGenerationRuns(scope: ReportRunsScope | null, currentUserId: string | null) {
  const key = scope && scope.term ? `${scope.yearId ?? ''}|${scope.reportType}|${scope.term}` : null
  const [answer, setAnswer] = useState<{ key: string; runs: ReportRun[] } | null>(null)
  // Bumped after every read, answered or not, so the next poll is scheduled.
  const [reads, setReads] = useState(0)
  // One-student runs started from this page, for the toast when they finish.
  const [startedHere, setStartedHere] = useState<string[]>([])
  const latestRequest = useRef(0)
  const scopeRef = useRef(scope)
  scopeRef.current = scope

  const reload = useCallback(async () => {
    const current = scopeRef.current
    if (!key || !current) return
    const request = ++latestRequest.current
    try {
      const res = await listReportRuns({ reportType: current.reportType, term: current.term })
      if (request !== latestRequest.current) return
      if (res.status === 'success' && Array.isArray(res.data)) setAnswer({ key, runs: res.data })
    } catch {
      // Keep what's shown; the next read tries again.
    } finally {
      if (request === latestRequest.current) setReads((n) => n + 1)
    }
  }, [key])

  useEffect(() => {
    void reload()
  }, [reload])

  const runs = useMemo(() => (answer && answer.key === key ? answer.runs : []), [answer, key])
  const running = runs.some((r) => !r.finishedAt)

  useEffect(() => {
    if (!running) return undefined
    const timer = setTimeout(() => void reload(), POLL_MS)
    return () => clearTimeout(timer)
  }, [running, reads, reload])

  const start = useCallback(
    async (studentIds: string[], reportDate?: string): Promise<StartedReportRun> => {
      const current = scopeRef.current
      if (!key || !current) throw new Error('Pick a term first')
      const res = await startReportRun({ reportType: current.reportType, term: current.term, studentIds, reportDate })
      if (res.status !== 'success' || !res.data) throw new Error(res.message || "Couldn't start generating")
      const { run } = res.data
      if (run) {
        if (run.studentCount === 1) setStartedHere((ids) => [...ids, run.runId])
        // Show it at once; the read below brings everything else.
        setAnswer((prev) => ({ key, runs: [...(prev && prev.key === key ? prev.runs : []).filter((r) => r.runId !== run.runId), run] }))
      }
      void reload()
      return res.data
    },
    [key, reload],
  )

  const each = useCallback(
    (call: (runId: string) => Promise<unknown>) => async (runIds: string[]) => {
      try {
        await Promise.all(runIds.map((id) => call(id)))
      } finally {
        await reload()
      }
    },
    [reload],
  )
  const stop = useMemo(() => each(cancelReportRun), [each])
  const dismiss = useMemo(() => each(dismissReportRun), [each])
  /** Try again for these skipped students, each in the run that holds their result. */
  const retry = useCallback(
    async (failed: { runId: string; studentId: string }[]) => {
      const byRun = new Map<string, string[]>()
      for (const f of failed) byRun.set(f.runId, [...(byRun.get(f.runId) ?? []), f.studentId])
      try {
        await Promise.all([...byRun].map(([runId, studentIds]) => retryReportRun(runId, studentIds)))
      } finally {
        await reload()
      }
    },
    [reload],
  )

  const summary = useMemo(() => summarizeRuns(runs, currentUserId), [runs, currentUserId])
  const finishedHere = useMemo(() => runs.filter((r) => r.finishedAt && startedHere.includes(r.runId)), [runs, startedHere])

  return { runs, summary, start, stop, retry, dismiss, reload, finishedHere }
}
