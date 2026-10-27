'use client'

// Who counts in a class's statistics, for the gradebook and the class page:
// the class's exclusions (staff only), and changing one student's. Changes to
// one student run one at a time, each deciding from what the server last
// returned, so two quick taps can't build on a stale list (a save replaces
// everything that student is left out of).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getStatsExclusions, removeStatsExclusion, saveStatsExclusion } from '@/services/classStatsExclusionService'
import type { StatsExclusion, StatsExclusionInput } from '@/services/types/classStatsExclusion'

/**
 * Given the student's current exclusion, what to save: the new exclusion,
 * null to count them everywhere again, or undefined to leave it as it is.
 */
export type StatsExclusionDecision = (current: StatsExclusion | undefined) => StatsExclusionInput | null | undefined

export interface StatsExclusionsState {
  exclusions: StatsExclusion[]
  /** studentId -> that student's exclusion. */
  byStudent: Map<string, StatsExclusion>
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  /** Changes one student's exclusion; resolves to what the server now holds (null: counted). Throws on failure. */
  update: (studentId: string, decide: StatsExclusionDecision) => Promise<StatsExclusion | null>
}

export function useStatsExclusions(classId: string | null | undefined): StatsExclusionsState {
  const [exclusions, setExclusions] = useState<StatsExclusion[]>([])
  const [loading, setLoading] = useState(Boolean(classId))
  const [error, setError] = useState<string | null>(null)
  // The newest list, read by queued changes before React re-renders.
  const latestRef = useRef<StatsExclusion[]>([])
  const queuesRef = useRef(new Map<string, Promise<unknown>>())

  const replaceAll = (next: StatsExclusion[]) => {
    latestRef.current = next
    setExclusions(next)
  }

  const reload = useCallback(async () => {
    if (!classId) return
    setLoading(true)
    try {
      const res = await getStatsExclusions(classId)
      replaceAll(res.data ?? [])
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

  const update = useCallback(
    (studentId: string, decide: StatsExclusionDecision) => {
      const run = async (): Promise<StatsExclusion | null> => {
        if (!classId) throw new Error('No class')
        const current = latestRef.current.find((e) => e.studentId === studentId)
        const next = decide(current)
        if (next === undefined) return current ?? null
        const others = latestRef.current.filter((e) => e.studentId !== studentId)
        if (next === null) {
          if (current) await removeStatsExclusion(classId, studentId)
          replaceAll(others)
          return null
        }
        const res = await saveStatsExclusion(classId, studentId, next)
        replaceAll([...others, res.data])
        return res.data
      }
      // After this student's previous change, whether it worked or not.
      const queued = (queuesRef.current.get(studentId) ?? Promise.resolve()).catch(() => undefined).then(run)
      queuesRef.current.set(studentId, queued)
      return queued
    },
    [classId],
  )

  const byStudent = useMemo(() => new Map(exclusions.map((e) => [e.studentId, e])), [exclusions])

  return { exclusions, byStudent, loading, error, reload, update }
}
