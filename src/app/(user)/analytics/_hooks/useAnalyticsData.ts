// Data-fetching hooks for the analytics views. One hook per drill level,
// all returning the same { data, loading, error, retry } shape.

'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getAnalyticsOverview,
  getAnalyticsClass,
  getAnalyticsStudent,
  getAnalyticsSnapshot,
  getAnalyticsTermComparison,
} from '@/services/analyticsService'
import {
  OverviewData,
  ClassData,
  StudentData,
  SnapshotData,
  TermComparisonData,
  GradeEngine,
} from '@/services/types/analytics'

interface HookState<T> {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
}

function useFetch<T>(enabled: boolean, fetcher: (() => Promise<T>) | null, deps: unknown[]): HookState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!enabled || !fetcher) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err: Error) => {
        console.error(err)
        if (!cancelled) setError(err.message || 'Failed to load analytics')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, retryKey, ...deps])

  const retry = useCallback(() => setRetryKey((k) => k + 1), [])
  return { data, loading, error, retry }
}

export function useAnalyticsOverview(
  termId: string | null,
  engine: GradeEngine,
  compareTerm: string | null
): HookState<OverviewData> {
  return useFetch<OverviewData>(
    Boolean(termId),
    termId
      ? () => getAnalyticsOverview(termId, engine, compareTerm || undefined).then((r) => r.data)
      : null,
    [termId, engine, compareTerm]
  )
}

export function useAnalyticsClass(
  classId: string | null,
  engine: GradeEngine,
  termId: string | null
): HookState<ClassData> {
  return useFetch<ClassData>(
    Boolean(classId),
    classId
      ? () => getAnalyticsClass(classId, engine, termId || undefined).then((r) => r.data)
      : null,
    [classId, engine, termId]
  )
}

export function useAnalyticsStudent(
  studentId: string | null,
  termId: string | null,
  engine: GradeEngine,
  compareTerm: string | null
): HookState<StudentData> {
  return useFetch<StudentData>(
    Boolean(studentId && termId),
    studentId && termId
      ? () =>
          getAnalyticsStudent(studentId, termId, engine, compareTerm || undefined).then(
            (r) => r.data
          )
      : null,
    [studentId, termId, engine, compareTerm]
  )
}

export function useAnalyticsSnapshot(
  termId: string | null,
  engine: GradeEngine
): HookState<SnapshotData> {
  return useFetch<SnapshotData>(
    Boolean(termId),
    termId ? () => getAnalyticsSnapshot(termId, engine).then((r) => r.data) : null,
    [termId, engine]
  )
}

export function useAnalyticsTermComparison(
  enabled: boolean,
  subject: string | null,
  grade: string | null,
  engine: GradeEngine
): HookState<TermComparisonData> {
  return useFetch<TermComparisonData>(
    enabled && Boolean(subject && grade),
    enabled && subject && grade
      ? () => getAnalyticsTermComparison(subject, grade, engine).then((r) => r.data)
      : null,
    [enabled, subject, grade, engine]
  )
}
