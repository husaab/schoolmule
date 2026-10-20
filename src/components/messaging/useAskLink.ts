'use client'

import { useEffect, useRef } from 'react'
import type { FilterParams } from '@/hooks/useFilterParams'
import { CLEAR_ASK_LINK, parseAskLink, resolveAskLink, type AskPreset } from '@/lib/askLink'
import { getParentTargets } from '@/services/messagingService'
import { useChildStoreHydrated, useSelectedChildStore } from '@/store/useSelectedChildStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

/**
 * Parent Messages: an email's "Ask <teacher> about this" (lib/askLink). Once
 * the parent's children are known it selects the child, works out what the
 * link may start from the conversation targets, and hands New message its
 * preset through `open` (or says why it can't). The link's keys leave the
 * address straight away, so Back or a refresh never reopens it. Runs once
 * per link.
 */
export function useAskLink(filters: FilterParams, enabled: boolean, open: (preset: AskPreset) => void) {
  const { get, setParams } = filters
  const link = enabled ? parseAskLink(get) : null
  const linkKey = link && JSON.stringify(link)
  const handled = useRef<string | null>(null)
  const hydrated = useChildStoreHydrated()
  const hasChildren = useSelectedChildStore((s) => s.children.length > 0)
  const viewerId = useUserStore((s) => s.user.id)
  const showNotification = useNotificationStore((s) => s.showNotification)

  useEffect(() => {
    // Wait for the sidebar's child list, so the window can name the child.
    if (!link || !hydrated || !hasChildren || handled.current === linkKey) return
    handled.current = linkKey
    setParams(CLEAR_ASK_LINK)
    const { children, selectChild } = useSelectedChildStore.getState()
    if (children.some((c) => c.studentId === link.studentId)) selectChild(link.studentId)
    getParentTargets(link.studentId)
      .then((res) => {
        const outcome = res.data ? resolveAskLink(link, res.data, viewerId) : null
        if (outcome?.kind === 'compose') open(outcome.preset)
        else showNotification(outcome?.message ?? 'Could not open a new message from that link.', 'info', 7000)
      })
      // 403: the link is for a child this account isn't linked to.
      .catch(() => showNotification("That link is for a child who isn't linked to your account.", 'error'))
    // `link` is rebuilt every render; linkKey stands for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkKey, hydrated, hasChildren, setParams, viewerId, showNotification, open])
}
