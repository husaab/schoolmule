'use client'

// Who counts in a class's statistics, for the gradebook and the class page:
// the class's exclusions (staff only), plus saving and removing one. Each
// write replaces that student's entry with what the server now holds.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStatsExclusions, removeStatsExclusion, saveStatsExclusion } from '@/services/classStatsExclusionService'
import type { StatsExclusion, StatsExclusionInput } from '@/services/types/classStatsExclusion'

export interface StatsExclusionsState {
  exclusions: StatsExclusion[]
  /** studentId -> that student's exclusion. */
  byStudent: Map<string, StatsExclusion>
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  /** Throws when the save fails, so the caller can say so. */
  save: (studentId: string, input: StatsExclusionInput) => Promise<StatsExclusion>
  /** Counts the student in every class statistic again. Throws on failure. */
  remove: (studentId: string) => Promise<void>
}

export function useStatsExclusions(classId: string | null | undefined): StatsExclusionsState {
  const [exclusions, setExclusions] = useState<StatsExclusion[]>([])
  const [loading, setLoading] = useState(Boolean(classId))
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!classId) return
    setLoading(true)
    try {
      const res = await getStatsExclusions(classId)
      setExclusions(res.data ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Couldn't load who counts in the class average")
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    void reload()
  }, [reload])

  const save = useCallback(
    async (studentId: string, input: StatsExclusionInput) => {
      if (!classId) throw new Error('No class')
      const res = await saveStatsExclusion(classId, studentId, input)
      setExclusions((prev) => [...prev.filter((e) => e.studentId !== studentId), res.data])
      return res.data
    },
    [classId],
  )

  const remove = useCallback(
    async (studentId: string) => {
      if (!classId) throw new Error('No class')
      await removeStatsExclusion(classId, studentId)
      setExclusions((prev) => prev.filter((e) => e.studentId !== studentId))
    },
    [classId],
  )

  const byStudent = useMemo(() => new Map(exclusions.map((e) => [e.studentId, e])), [exclusions])

  return { exclusions, byStudent, loading, error, reload, save, remove }
}
