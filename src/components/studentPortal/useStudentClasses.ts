// src/components/studentPortal/useStudentClasses.ts
// The student's current-term classes (GET /api/student/classes), loaded once
// per login and shared by the sidebar's "My classes", the Grades page and the
// class pages. Home refreshes it from its own answer. Kept in memory only: a
// different sign-in on the same device starts empty and loads its own.
'use client'

import { useCallback, useEffect } from 'react'
import { create } from 'zustand'
import { getStudentClasses } from '@/services/studentPortalService'
import type { StudentClassCard } from '@/services/types/studentPortal'
import { useUserStore } from '@/store/useUserStore'

interface StudentClassesState {
  userId: string | null
  classes: StudentClassCard[] | null
  error: string | null
  loading: boolean
  load: (userId: string, force?: boolean) => Promise<void>
  /** Home already has the list: use it instead of asking again. */
  setFromHome: (userId: string, classes: StudentClassCard[]) => void
}

const useStudentClassesStore = create<StudentClassesState>((set, get) => ({
  userId: null,
  classes: null,
  error: null,
  loading: false,
  load: async (userId, force = false) => {
    const current = get()
    if (!force && current.userId === userId && (current.classes || current.loading)) return
    set({ userId, loading: true, error: null, classes: current.userId === userId ? current.classes : null })
    try {
      const res = await getStudentClasses()
      if (get().userId !== userId) return
      set({ classes: res.data.classes, loading: false })
    } catch (err) {
      if (get().userId !== userId) return
      set({ loading: false, error: err instanceof Error ? err.message : "We couldn't load your classes" })
    }
  },
  setFromHome: (userId, classes) => set({ userId, classes, error: null, loading: false }),
}))

/** Called by Home with the class cards it just loaded. */
export const shareClassesFromHome = (userId: string, classes: StudentClassCard[]) =>
  useStudentClassesStore.getState().setFromHome(userId, classes)

export const useStudentClasses = () => {
  const userId = useUserStore((s) => s.user.id)
  const role = useUserStore((s) => s.user.role)
  const storeUserId = useStudentClassesStore((s) => s.userId)
  const classes = useStudentClassesStore((s) => s.classes)
  const error = useStudentClassesStore((s) => s.error)
  const loading = useStudentClassesStore((s) => s.loading)
  const load = useStudentClassesStore((s) => s.load)

  useEffect(() => {
    if (userId && role === 'STUDENT') void load(userId)
  }, [userId, role, load])

  const reload = useCallback(() => {
    if (userId) void load(userId, true)
  }, [userId, load])

  const isCurrent = Boolean(userId) && storeUserId === userId
  return {
    classes: isCurrent ? classes : null,
    error: isCurrent ? error : null,
    loading: !isCurrent || loading,
    reload,
  }
}
