// All analytics drill-down + filter state lives in the URL so views are
// shareable and refresh-safe. Built on the shared useFilterParams hook, so
// the drill path is also remembered per tab: coming back to Analytics from
// the sidebar lands on the same term, grade and class the user left.

'use client'

import { useCallback, useMemo } from 'react'
import { AnalyticsViewLevel } from '@/services/types/analytics'
import { useFilterParams } from '@/hooks/useFilterParams'

export interface AnalyticsParams {
  view: AnalyticsViewLevel
  termId: string | null
  compareTerm: string | null
  grade: string | null
  subject: string | null
  classId: string | null
  studentId: string | null
}

export interface UseAnalyticsParams extends AnalyticsParams {
  /** Merge a patch into the current params and replace the URL (no scroll). */
  setParams: (patch: Partial<AnalyticsParams>) => void
  /** Drill to a view, clearing deeper-level selections automatically. */
  drillTo: (view: AnalyticsViewLevel, patch?: Partial<AnalyticsParams>) => void
}

const VIEWS: AnalyticsViewLevel[] = ['school', 'grade', 'subject', 'class', 'student']

// A legacy `engine` param (from an old bookmark) is simply ignored: there is
// one grade engine now and the API no longer reads it either. Marking it
// transient keeps it out of memory; every write also deletes it from the URL.
const LEGACY_TRANSIENT = ['engine']

export function useAnalyticsParams(): UseAnalyticsParams {
  const { get, setParams: setRaw } = useFilterParams({ transient: LEGACY_TRANSIENT })

  const params = useMemo<AnalyticsParams>(() => {
    const rawView = get('view')
    const view = VIEWS.includes(rawView as AnalyticsViewLevel) ? (rawView as AnalyticsViewLevel) : 'school'
    const opt = (key: string) => get(key) || null
    return {
      view,
      termId: opt('termId'),
      compareTerm: opt('compareTerm'),
      grade: opt('grade'),
      subject: opt('subject'),
      classId: opt('classId'),
      studentId: opt('studentId'),
    }
  }, [get])

  const setParams = useCallback(
    (patch: Partial<AnalyticsParams>) => {
      const next: Record<string, string | null> = { engine: null }
      for (const [key, value] of Object.entries(patch)) {
        next[key] = value == null || value === '' ? null : String(value)
      }
      setRaw(next)
    },
    [setRaw],
  )

  const drillTo = useCallback(
    (view: AnalyticsViewLevel, patch: Partial<AnalyticsParams> = {}) => {
      // Clear only selections strictly DEEPER than the target view. grade and
      // subject are independent, stackable filters (Grade 3 + Math), so neither
      // clears the other here — call sites pass explicit grade/subject nulls
      // when they specifically want to narrow one of them.
      const cleared: Partial<AnalyticsParams> = { view, ...patch }
      if (view === 'school') {
        cleared.grade = patch.grade ?? null
        cleared.subject = patch.subject ?? null
        cleared.classId = null
        cleared.studentId = null
      } else if (view === 'grade' || view === 'subject') {
        cleared.classId = null
        cleared.studentId = null
      } else if (view === 'class') {
        cleared.studentId = null
      }
      setParams(cleared)
    },
    [setParams],
  )

  return { ...params, setParams, drillTo }
}
