// src/components/classes/stream/useClassStream.ts
// Loads the class Stream (GET /api/classroom/classes/:classId/stream). A late
// answer for another class (or an older reload) never overwrites a newer one,
// a failed reload keeps what is on screen, and coming back to the tab
// refreshes the seen counts.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getClassStream } from '@/services/classroomService'
import type { ClassStreamData } from '@/services/types/classroom'

interface LoadState {
  classId: string
  data: ClassStreamData | null
  error: string | null
}

export function useClassStream(classId: string) {
  const [state, setState] = useState<LoadState | null>(null)
  const seq = useRef(0)

  const reload = useCallback((): Promise<void> => {
    const ticket = ++seq.current
    return getClassStream(classId).then(
      (res) => {
        if (ticket === seq.current) setState({ classId, data: res.data, error: null })
      },
      (err: unknown) => {
        if (ticket !== seq.current) return
        const error = err instanceof Error && err.message ? err.message : "The Stream couldn't be loaded."
        setState((prev) => ({ classId, data: prev?.classId === classId ? prev.data : null, error }))
      },
    )
  }, [classId])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) void reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload])

  const current = state?.classId === classId ? state : null
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    reload,
  }
}
