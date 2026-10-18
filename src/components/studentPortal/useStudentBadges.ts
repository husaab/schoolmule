// src/components/studentPortal/useStudentBadges.ts
// What the student shell shows beside its nav items and under "My classes".
// The To-do badge is what the student still has to do (assigned + missing,
// from GET /api/student/todo), refreshed when the tab gets focus and by the
// pages that change it (a turn-in, the To-do itself). The Messages badge is
// how many conversations have something unread (GET /api/student/conversations/
// unread-count): refreshed with the To-do, every 30 s while the tab is
// visible, and by the Messages page when it opens or sends. The class list is
// the student's current-term classes.

import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { studentClassHref } from '@/lib/portalRoutes'
import { todoBadgeCount } from '@/lib/todoText'
import { messagesBadgeCount } from '@/lib/studentMessages'
import { getStudentUnreadCount } from '@/services/studentMessagingService'
import { getStudentTodo } from '@/services/studentPortalService'
import type { TodoCounts } from '@/services/types/studentPortal'
import { useUserStore } from '@/store/useUserStore'
import type { StudentBadgeKey, StudentClassLink } from './studentNav'
import { useStudentClasses } from './useStudentClasses'

/** The two nav bars each ask for the badge; a refresh within this many ms of the last one is skipped. */
const MIN_REFRESH_MS = 1500

/** While the tab is visible the Messages badge asks again this often. */
const MESSAGES_POLL_MS = 30_000

interface BadgeState {
  userId: string | null
  todo: number
  messages: number
  inFlight: boolean
  messagesInFlight: boolean
  lastAt: number
  messagesAt: number
  refresh: (userId: string, force?: boolean) => Promise<void>
  refreshMessages: (userId: string, force?: boolean) => Promise<void>
  /** A page already holds the counts (the To-do, or the answer to a turn-in). */
  setTodoCounts: (userId: string, counts: TodoCounts) => void
}

const useBadgeStore = create<BadgeState>((set, get) => ({
  userId: null,
  todo: 0,
  messages: 0,
  inFlight: false,
  messagesInFlight: false,
  lastAt: 0,
  messagesAt: 0,
  refresh: async (userId, force = false) => {
    const now = Date.now()
    const { inFlight, lastAt, userId: stored } = get()
    if (inFlight || (!force && stored === userId && now - lastAt < MIN_REFRESH_MS)) return
    // A different sign-in on this device starts from zero (the Messages count too).
    set({ inFlight: true, userId, todo: stored === userId ? get().todo : 0, messages: stored === userId ? get().messages : 0 })
    try {
      const res = await getStudentTodo('assigned')
      if (get().userId === userId) set({ todo: todoBadgeCount(res.data.counts), lastAt: Date.now() })
    } catch {
      // The badge is a hint: a failed refresh keeps the last number.
    } finally {
      set({ inFlight: false })
    }
  },
  refreshMessages: async (userId, force = false) => {
    const now = Date.now()
    const { messagesInFlight, messagesAt, userId: stored } = get()
    if (messagesInFlight || (!force && stored === userId && now - messagesAt < MIN_REFRESH_MS)) return
    set({ messagesInFlight: true, userId, messages: stored === userId ? get().messages : 0, todo: stored === userId ? get().todo : 0 })
    try {
      const res = await getStudentUnreadCount()
      if (get().userId === userId) set({ messages: messagesBadgeCount(res.data), messagesAt: Date.now() })
    } catch {
      // The badge is a hint: a failed refresh keeps the last number.
    } finally {
      set({ messagesInFlight: false })
    }
  },
  setTodoCounts: (userId, counts) => set({ userId, todo: todoBadgeCount(counts), lastAt: Date.now() }),
}))

/** Called by a page that just learned the counts (the To-do, or a turn-in). */
export const setTodoBadgeCounts = (userId: string, counts: TodoCounts) => useBadgeStore.getState().setTodoCounts(userId, counts)

/** Called after something changed the counts without returning them (a turn-in, an unsubmit). */
export const refreshTodoBadge = (userId: string) => useBadgeStore.getState().refresh(userId, true)

/** Called by the Messages page after it opened, sent or removed something (the unread number moved). */
export const refreshMessagesBadge = (userId: string) => useBadgeStore.getState().refreshMessages(userId, true)

const NO_BADGES: Partial<Record<StudentBadgeKey, number>> = {}

/** Counts for nav badges, keyed by StudentNavItem.badgeKey. */
export const useStudentBadges = (): Partial<Record<StudentBadgeKey, number>> => {
  const userId = useUserStore((s) => s.user.id)
  const role = useUserStore((s) => s.user.role)
  const storeUserId = useBadgeStore((s) => s.userId)
  const todo = useBadgeStore((s) => s.todo)
  const messages = useBadgeStore((s) => s.messages)
  const refresh = useBadgeStore((s) => s.refresh)
  const refreshMessages = useBadgeStore((s) => s.refreshMessages)

  useEffect(() => {
    if (!userId || role !== 'STUDENT') return
    const both = () => {
      void refresh(userId)
      void refreshMessages(userId)
    }
    both()
    const onVisible = () => {
      if (document.visibilityState === 'visible') both()
    }
    // Both nav bars (sidebar and phone tabs) run this hook: the store's minimum gap keeps them to one request.
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refreshMessages(userId)
    }, MESSAGES_POLL_MS)
    window.addEventListener('focus', both)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', both)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, role, refresh, refreshMessages])

  const mine = Boolean(userId) && storeUserId === userId
  const todoCount = mine ? todo : 0
  const messageCount = mine ? messages : 0
  return useMemo(() => {
    if (todoCount <= 0 && messageCount <= 0) return NO_BADGES
    return { ...(todoCount > 0 ? { todo: todoCount } : {}), ...(messageCount > 0 ? { messages: messageCount } : {}) }
  }, [todoCount, messageCount])
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
