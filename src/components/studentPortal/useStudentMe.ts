// src/components/studentPortal/useStudentMe.ts
// The signed-in student's profile (GET /api/student/me), loaded once per
// login and shared by the shell and every student page. Kept in memory only:
// a different sign-in on the same device starts empty and loads its own.
'use client'

import { useCallback, useEffect } from 'react'
import { create } from 'zustand'
import { getStudentMe } from '@/services/studentPortalService'
import { isApiError } from '@/services/apiClient'
import type { StudentMe } from '@/services/types/studentPortal'
import { useUserStore } from '@/store/useUserStore'

export interface StudentMeError {
  message: string
  /** e.g. CLASSROOM_DISABLED or NO_STUDENT_LINK from requireStudent. */
  code: string | null
}

interface StudentMeState {
  userId: string | null
  me: StudentMe | null
  error: StudentMeError | null
  loading: boolean
  load: (userId: string, force?: boolean) => Promise<void>
}

const useStudentMeStore = create<StudentMeState>((set, get) => ({
  userId: null,
  me: null,
  error: null,
  loading: false,
  load: async (userId, force = false) => {
    const current = get()
    if (!force && current.userId === userId && (current.me || current.loading)) return
    set({ userId, loading: true, error: null, me: current.userId === userId ? current.me : null })
    try {
      const res = await getStudentMe()
      // A reply for a session that has since changed is dropped.
      if (get().userId !== userId) return
      set({ me: res.data, loading: false })
    } catch (err) {
      if (get().userId !== userId) return
      set({
        loading: false,
        error: {
          message: err instanceof Error ? err.message : "We couldn't load your account",
          code: isApiError(err) ? err.code : null,
        },
      })
    }
  },
}))

/** The student's profile, the load state, and a way to retry. */
export const useStudentMe = () => {
  const userId = useUserStore((s) => s.user.id)
  const role = useUserStore((s) => s.user.role)
  const storeUserId = useStudentMeStore((s) => s.userId)
  const me = useStudentMeStore((s) => s.me)
  const error = useStudentMeStore((s) => s.error)
  const loading = useStudentMeStore((s) => s.loading)
  const load = useStudentMeStore((s) => s.load)

  useEffect(() => {
    if (userId && role === 'STUDENT') void load(userId)
  }, [userId, role, load])

  const reload = useCallback(() => {
    if (userId) void load(userId, true)
  }, [userId, load])

  const isCurrent = Boolean(userId) && storeUserId === userId
  return {
    me: isCurrent ? me : null,
    error: isCurrent ? error : null,
    loading: !isCurrent || loading,
    reload,
  }
}
