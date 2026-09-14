'use client'

// Resolves the active term as an id (useUserStore only holds the term's
// name) plus the term that came before it, so the dashboard can ask
// analytics for a term-over-term delta without the user picking anything.
// Same seeding rule as the analytics page: the active term, else the first.

import { useEffect, useMemo, useState } from 'react'
import { getTermsBySchool } from '@/services/termService'
import type { TermPayload } from '@/services/types/term'

export interface DashboardTerms {
  activeTerm: TermPayload | null
  /** The most recent term that started before the active one, if any. */
  previousTerm: TermPayload | null
  loading: boolean
}

export function useDashboardTerms(
  school: string | null,
  selectedYearId: string | null
): DashboardTerms {
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!school) return
    let cancelled = false
    setLoading(true)
    getTermsBySchool(school)
      .then((res) => {
        if (!cancelled) setTerms(res.status === 'success' ? res.data : [])
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setTerms([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [school, selectedYearId]) // the year header scopes which terms come back

  return useMemo(() => {
    const activeTerm = terms.find((t) => t.isActive) ?? terms[0] ?? null
    const previousTerm = activeTerm
      ? (terms
          .filter((t) => t.termId !== activeTerm.termId && t.startDate < activeTerm.startDate)
          .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0] ?? null)
      : null
    return { activeTerm, previousTerm, loading }
  }, [terms, loading])
}
