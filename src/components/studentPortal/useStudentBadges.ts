// src/components/studentPortal/useStudentBadges.ts
// What the student shell shows beside its nav items and under "My classes".
// The To-do badge is what the student still has to do (assigned + missing,
// from GET /api/student/todo). It asks at most once per 30 s (a mount, a focus
// or the tab coming back all count; final review M8), and at once when a page
// changed it (a turn-in, an unsubmit); the To-do page hands its own counts over. The Messages badge is
// how many conversations have something unread (GET /api/student/conversations/
// unread-count). It asks at most once per 30 s: one shared timer (not one per
// nav bar, and not restarted by a page change), nothing while the tab is
// hidden, and no request at all while the Messages page is open, because that
// page's own list already carries the unread counts and hands the number over
// (useMessagesBadgeFromList) — unless that list can't count them (still
// loading, failed, or too long), when the badge keeps asking on its own. The
// class list is the student's current-term classes.

import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { studentClassHref } from '@/lib/portalRoutes'
import { todoBadgeCount } from '@/lib/todoText'
import { createPollTimer, refreshDue } from '@/lib/pollTimer'
import { messagesBadgeCount } from '@/lib/studentMessages'
import { getStudentUnreadCount } from '@/services/studentMessagingService'
import { getStudentTodo } from '@/services/studentPortalService'
import type { TodoCounts } from '@/services/types/studentPortal'
import { useUserStore } from '@/store/useUserStore'
import type { StudentBadgeKey, StudentClassLink } from './studentNav'
import { useStudentClasses } from './useStudentClasses'

/** The To-do badge asks at most this often unless forced (a turn-in): a page change no longer refetches the list. */
const TODO_REFRESH_MS = 30_000

/** The Messages badge asks at most this often (a mount, a focus and the timer all count). */
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
  /** The Messages page already holds the unread counts (its list). */
  setMessagesCount: (userId: string, count: number) => void
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
    if (!refreshDue({ force, inFlight, sameUser: stored === userId, lastAt, now, everyMs: TODO_REFRESH_MS })) return
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
    if (!refreshDue({ force, inFlight: messagesInFlight, sameUser: stored === userId, lastAt: messagesAt, now, everyMs: MESSAGES_POLL_MS })) return
    // The attempt is stamped when it starts, so a failure waits a full interval before the next try.
    set({ messagesInFlight: true, messagesAt: now, userId, messages: stored === userId ? get().messages : 0, todo: stored === userId ? get().todo : 0 })
    try {
      const res = await getStudentUnreadCount()
      if (get().userId === userId) set({ messages: messagesBadgeCount(res.data) })
    } catch {
      // The badge is a hint: a failed refresh keeps the last number.
    } finally {
      set({ messagesInFlight: false })
      messagesPoll.rearm()
    }
  },
  setTodoCounts: (userId, counts) => set({ userId, todo: todoBadgeCount(counts), lastAt: Date.now() }),
  setMessagesCount: (userId, count) => {
    const { userId: stored } = get()
    set({ userId, messages: Math.max(0, Math.floor(count)), messagesAt: Date.now(), todo: stored === userId ? get().todo : 0 })
    messagesPoll.rearm()
  },
}))

// The one timer behind the Messages badge: due MESSAGES_POLL_MS after the last attempt, whoever made it.
// It stays quiet while the Messages page is open and feeding the number from its own list.
let pollUserId: string | null = null
let listFeeders = 0
const messagesPoll = createPollTimer({
  everyMs: MESSAGES_POLL_MS,
  lastAt: () => useBadgeStore.getState().messagesAt,
  isVisible: () => typeof document === 'undefined' || document.visibilityState === 'visible',
  poll: () => {
    if (pollUserId && listFeeders === 0) void useBadgeStore.getState().refreshMessages(pollUserId, true)
  },
})

/** Called by a page that just learned the counts (the To-do, or a turn-in). */
export const setTodoBadgeCounts = (userId: string, counts: TodoCounts) => useBadgeStore.getState().setTodoCounts(userId, counts)

/** Called after something changed the counts without returning them (a turn-in, an unsubmit). */
export const refreshTodoBadge = (userId: string) => useBadgeStore.getState().refresh(userId, true)

/** Called by the Messages page after it opened, sent or removed something (the unread number moved). */
export const refreshMessagesBadge = (userId: string) => useBadgeStore.getState().refreshMessages(userId, true)

/**
 * The Messages page's list carries every row's unread count, so while that page
 * is open the badge takes its number from the list (`unreadConversations`) and
 * sends no request of its own. While the list can't give the number (null:
 * still loading, failed, or too long to count from) the badge keeps polling,
 * so it never goes silent.
 */
export const useMessagesBadgeFromList = (userId: string, unreadConversations: number | null): void => {
  const feeding = unreadConversations !== null
  useEffect(() => {
    if (!feeding) return
    listFeeders += 1
    return () => {
      listFeeders -= 1
      messagesPoll.rearm()
    }
  }, [feeding])
  useEffect(() => {
    if (unreadConversations !== null) useBadgeStore.getState().setMessagesCount(userId, unreadConversations)
  }, [userId, unreadConversations])
}

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
    // Both nav bars (sidebar and phone tabs) run this hook and every page remounts them: they share
    // one timer, and a mount, focus or tab-visible refresh within 30 s of the last Messages ask is skipped.
    pollUserId = userId
    const release = messagesPoll.acquire()
    window.addEventListener('focus', both)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      release()
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
