// src/components/classes/people/useClassPeople.ts
// Loads the class People tab (GET /api/classroom/classes/:classId/people). A
// late answer for another class (or an older reload) never overwrites a newer
// one, a failed reload keeps what is on screen, and `patchStudent` applies a
// change the server has already confirmed (a picked avatar) without a refetch.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getClassPeople } from '@/services/classroomService'
import type { ClassPeopleData, PeopleStudent } from '@/services/types/classroom'

interface LoadState {
  classId: string
  data: ClassPeopleData | null
  error: string | null
}

export function useClassPeople(classId: string) {
  const [state, setState] = useState<LoadState | null>(null)
  const seq = useRef(0)

  const reload = useCallback((): Promise<void> => {
    const ticket = ++seq.current
    return getClassPeople(classId).then(
      (res) => {
        if (ticket === seq.current) setState({ classId, data: res.data, error: null })
      },
      (err: unknown) => {
        if (ticket !== seq.current) return
        const error = err instanceof Error && err.message ? err.message : "The class roster couldn't be loaded."
        setState((prev) => ({ classId, data: prev?.classId === classId ? prev.data : null, error }))
      },
    )
  }, [classId])

  useEffect(() => {
    void reload()
  }, [reload])

  const patchStudent = useCallback(
    (studentId: string, patch: Partial<PeopleStudent>) =>
      setState((prev) =>
        prev?.data && prev.classId === classId
          ? {
              ...prev,
              data: { ...prev.data, students: prev.data.students.map((s) => (s.studentId === studentId ? { ...s, ...patch } : s)) },
            }
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
    patchStudent,
  }
}
