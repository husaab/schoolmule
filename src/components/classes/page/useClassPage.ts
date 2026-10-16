// src/components/classes/page/useClassPage.ts
// Loads the class page's header data (GET /api/classroom/classes/:classId):
// the class card with its options, the teachers, what the viewer may do and
// the school's classroom settings. A late answer for another class (or an
// older reload) never overwrites a newer one.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getClassPage } from '@/services/classroomService'
import { isApiError } from '@/services/apiClient'
import type { ClassPageData } from '@/services/types/classroom'

export interface ClassPageError {
  message: string
  /** The HTTP status (403 not your class, 404 no such class), null for a network failure. */
  status: number | null
}

const toPageError = (err: unknown): ClassPageError => ({
  message: err instanceof Error && err.message ? err.message : "This class couldn't be loaded.",
  status: isApiError(err) ? err.status : null,
})

interface LoadState {
  classId: string
  data: ClassPageData | null
  error: ClassPageError | null
}

export function useClassPage(classId: string) {
  const [state, setState] = useState<LoadState | null>(null)
  const seq = useRef(0)

  // Answers arrive in callbacks; one for an older request (another class, an
  // earlier reload) is dropped.
  const reload = useCallback((): Promise<void> => {
    const ticket = ++seq.current
    return getClassPage(classId).then(
      (res) => {
        if (ticket === seq.current) setState({ classId, data: res.data, error: null })
      },
      (err: unknown) => {
        if (ticket !== seq.current) return
        const error = toPageError(err)
        // A failed reload keeps what is already on screen.
        setState((prev) => ({ classId, data: prev?.classId === classId ? prev.data : null, error }))
      },
    )
  }, [classId])

  useEffect(() => {
    void reload()
  }, [reload])

  const patchClass = useCallback(
    (patch: Partial<ClassPageData['class']>) =>
      setState((prev) =>
        prev?.data && prev.classId === classId
          ? { ...prev, data: { ...prev.data, class: { ...prev.data.class, ...patch } } }
          : prev,
      ),
    [classId],
  )

  const current = state?.classId === classId ? state : null
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    reload,
    patchClass,
  }
}
