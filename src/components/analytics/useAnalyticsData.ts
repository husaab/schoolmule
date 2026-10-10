// Data-fetching hooks for the analytics views and the dashboard. One hook
// per endpoint, all returning the same { data, loading, error, retry } shape.
// Shared home (not under app/analytics) because the dashboard reuses them.

'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getAnalyticsOverview,
  getAnalyticsClass,
  getAnalyticsStudent,
  getAnalyticsSnapshot,
  getAnalyticsTermComparison,
  getAnalyticsClassesHealth,
} from '@/services/analyticsService'
import {
  OverviewData,
  ClassData,
  StudentData,
  SnapshotData,
  TermComparisonData,
  ClassesHealthData,
} from '@/services/types/analytics'

export interface HookState<T> {
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
  compareTerm: string | null
): HookState<OverviewData> {
  return useFetch<OverviewData>(
    Boolean(termId),
    termId
      ? () => getAnalyticsOverview(termId, compareTerm || undefined).then((r) => r.data)
      : null,
    [termId, compareTerm]
  )
}

export function useAnalyticsClass(
  classId: string | null,
  termId: string | null
): HookState<ClassData> {
  return useFetch<ClassData>(
    Boolean(classId),
    classId
      ? () => getAnalyticsClass(classId, termId || undefined).then((r) => r.data)
      : null,
    [classId, termId]
  )
}

export function useAnalyticsStudent(
  studentId: string | null,
  termId: string | null,
  compareTerm: string | null
): HookState<StudentData> {
  return useFetch<StudentData>(
    Boolean(studentId && termId),
    studentId && termId
      ? () =>
          getAnalyticsStudent(studentId, termId, compareTerm || undefined).then((r) => r.data)
      : null,
    [studentId, termId, compareTerm]
  )
}

export function useAnalyticsSnapshot(termId: string | null): HookState<SnapshotData> {
  return useFetch<SnapshotData>(
    Boolean(termId),
    termId ? () => getAnalyticsSnapshot(termId).then((r) => r.data) : null,
    [termId]
  )
}

export function useAnalyticsTermComparison(
  enabled: boolean,
  subject: string | null,
  grade: string | null
): HookState<TermComparisonData> {
  return useFetch<TermComparisonData>(
    enabled && Boolean(subject && grade),
    enabled && subject && grade
      ? () => getAnalyticsTermComparison(subject, grade).then((r) => r.data)
      : null,
    [enabled, subject, grade]
  )
}

export function useAnalyticsClassesHealth(termId: string | null): HookState<ClassesHealthData> {
  return useFetch<ClassesHealthData>(
    Boolean(termId),
    termId ? () => getAnalyticsClassesHealth(termId).then((r) => r.data) : null,
    [termId]
  )
}
