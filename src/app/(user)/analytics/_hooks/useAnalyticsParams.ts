// All analytics drill-down + filter state lives in the URL so views are
// shareable and the browser back button walks the drill path.

'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { GradeEngine, AnalyticsViewLevel } from '@/services/types/analytics'

export interface AnalyticsParams {
  view: AnalyticsViewLevel
  termId: string | null
  compareTerm: string | null
  grade: string | null
  subject: string | null
  classId: string | null
  studentId: string | null
  engine: GradeEngine
}

export interface UseAnalyticsParams extends AnalyticsParams {
  /** Merge a patch into the current params and replace the URL (no scroll). */
  setParams: (patch: Partial<AnalyticsParams>) => void
  /** Drill to a view, clearing deeper-level selections automatically. */
  drillTo: (view: AnalyticsViewLevel, patch?: Partial<AnalyticsParams>) => void
}

const VIEWS: AnalyticsViewLevel[] = ['school', 'grade', 'class', 'student']

export function useAnalyticsParams(): UseAnalyticsParams {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const params = useMemo<AnalyticsParams>(() => {
    const rawView = searchParams.get('view')
    const view = VIEWS.includes(rawView as AnalyticsViewLevel)
      ? (rawView as AnalyticsViewLevel)
      : 'school'
    const rawEngine = searchParams.get('engine')
    return {
      view,
      termId: searchParams.get('termId'),
      compareTerm: searchParams.get('compareTerm'),
      grade: searchParams.get('grade'),
      subject: searchParams.get('subject'),
      classId: searchParams.get('classId'),
      studentId: searchParams.get('studentId'),
      engine: rawEngine === 'null_zero' ? 'null_zero' : 'null_skip',
    }
  }, [searchParams])

  const setParams = useCallback(
    (patch: Partial<AnalyticsParams>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === '') next.delete(key)
        else next.set(key, String(value))
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const drillTo = useCallback(
    (view: AnalyticsViewLevel, patch: Partial<AnalyticsParams> = {}) => {
      // Clear selections deeper than the target view so breadcrumbs stay honest.
      const cleared: Partial<AnalyticsParams> = { view, ...patch }
      if (view === 'school') {
        cleared.grade = null
        cleared.classId = null
        cleared.studentId = null
      } else if (view === 'grade') {
        cleared.classId = null
        cleared.studentId = null
      } else if (view === 'class') {
        cleared.studentId = null
      }
      setParams(cleared)
    },
    [setParams]
  )

  return { ...params, setParams, drillTo }
}
