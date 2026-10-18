// src/components/studentPortal/useStudentBadges.ts
// What the student shell shows beside its nav items and under "My classes".
// The To-do badge is what the student still has to do (assigned + missing,
// from GET /api/student/todo), refreshed when the tab gets focus and by the
// pages that change it (a turn-in, the To-do itself). Messages fills its own
// badge later. The class list is the student's current-term classes.

import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { studentClassHref } from '@/lib/portalRoutes'
import { todoBadgeCount } from '@/lib/todoText'
import { getStudentTodo } from '@/services/studentPortalService'
import type { TodoCounts } from '@/services/types/studentPortal'
import { useUserStore } from '@/store/useUserStore'
import type { StudentBadgeKey, StudentClassLink } from './studentNav'
import { useStudentClasses } from './useStudentClasses'

/** The two nav bars each ask for the badge; a refresh within this many ms of the last one is skipped. */
const MIN_REFRESH_MS = 1500

interface BadgeState {
  userId: string | null
  todo: number
  inFlight: boolean
  lastAt: number
  refresh: (userId: string, force?: boolean) => Promise<void>
  /** A page already holds the counts (the To-do, or the answer to a turn-in). */
  setTodoCounts: (userId: string, counts: TodoCounts) => void
}

const useBadgeStore = create<BadgeState>((set, get) => ({
  userId: null,
  todo: 0,
  inFlight: false,
  lastAt: 0,
  refresh: async (userId, force = false) => {
    const now = Date.now()
    const { inFlight, lastAt, userId: stored } = get()
    if (inFlight || (!force && stored === userId && now - lastAt < MIN_REFRESH_MS)) return
    set({ inFlight: true, userId, todo: stored === userId ? get().todo : 0 })
    try {
      const res = await getStudentTodo('assigned')
      if (get().userId === userId) set({ todo: todoBadgeCount(res.data.counts), lastAt: Date.now() })
    } catch {
      // The badge is a hint: a failed refresh keeps the last number.
    } finally {
      set({ inFlight: false })
    }
  },
  setTodoCounts: (userId, counts) => set({ userId, todo: todoBadgeCount(counts), lastAt: Date.now() }),
}))

/** Called by a page that just learned the counts (the To-do, or a turn-in). */
export const setTodoBadgeCounts = (userId: string, counts: TodoCounts) => useBadgeStore.getState().setTodoCounts(userId, counts)

/** Called after something changed the counts without returning them (a turn-in, an unsubmit). */
export const refreshTodoBadge = (userId: string) => useBadgeStore.getState().refresh(userId, true)

const NO_BADGES: Partial<Record<StudentBadgeKey, number>> = {}

/** Counts for nav badges, keyed by StudentNavItem.badgeKey. */
export const useStudentBadges = (): Partial<Record<StudentBadgeKey, number>> => {
  const userId = useUserStore((s) => s.user.id)
  const role = useUserStore((s) => s.user.role)
  const storeUserId = useBadgeStore((s) => s.userId)
  const todo = useBadgeStore((s) => s.todo)
  const refresh = useBadgeStore((s) => s.refresh)

  useEffect(() => {
    if (!userId || role !== 'STUDENT') return
    void refresh(userId)
    const onFocus = () => void refresh(userId)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh(userId)
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, role, refresh])

  const count = userId && storeUserId === userId ? todo : 0
  return useMemo(() => (count > 0 ? { todo: count } : NO_BADGES), [count])
}

const NO_CLASSES: StudentClassLink[] = []

/** The sidebar's "My classes" links. */
export const useStudentClassLinks = (): StudentClassLink[] => {
  const { classes } = useStudentClasses()
  return useMemo(
    () =>
      classes
        ? classes.map((c) => ({ href: studentClassHref(c.classId), label: c.subject, iconUrl: c.identity.iconUrl }))
        : NO_CLASSES,
    [classes],
  )
}
