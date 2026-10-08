'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MegaphoneIcon } from '@heroicons/react/24/outline'
import NewConversationModal from '@/components/messaging/NewConversationModal'
import ParentEmptyState from '@/components/parent/ParentEmptyState'
import { getAnnouncement, listAnnouncements, markAnnouncementRead } from '@/services/announcementService'
import { isApiError } from '@/services/apiClient'
import type { AnnouncementAttachment, AnnouncementItem } from '@/services/types/announcement'
import type { Thread } from '@/services/types/messaging'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import AnnouncementCard from './AnnouncementCard'

const REFRESH_MS = 30_000

/** Parent feed: newest first, pinned on top (server order), one card per post. */
const AnnouncementFeed: React.FC<{ studentId?: string }> = ({ studentId }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const bump = useMessagingStore((s) => s.bump)
  const deepLink = searchParams.get('announcement')
  const [items, setItems] = useState<AnnouncementItem[] | null>(null)
  const [attachments, setAttachments] = useState<Record<string, AnnouncementAttachment[]>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [removedNotice, setRemovedNotice] = useState(false)
  const [asking, setAsking] = useState<AnnouncementItem | null>(null)

  // Fetch on mount, on child/year change, and quietly every 30 s while visible.
  useEffect(() => {
    let cancelled = false
    const fetchList = async () => {
      try {
        const res = await listAnnouncements({ studentId, limit: 100 })
        if (!cancelled) setItems(res.data ?? [])
      } catch {
        if (!cancelled) setItems((cur) => cur ?? [])
      }
    }
    void fetchList()
    const timer = setInterval(() => {
      if (!document.hidden) void fetchList()
    }, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [studentId, selectedYearId])

  // Deep link from an email: fetch attachments (and learn if it was removed), scroll to it.
  useEffect(() => {
    if (!deepLink) return
    let cancelled = false
    getAnnouncement(deepLink)
      .then((res) => {
        if (cancelled || !res.data) return
        const detail = res.data
        setAttachments((cur) => ({ ...cur, [deepLink]: detail.attachments }))
        setExpanded((cur) => new Set(cur).add(deepLink))
        setTimeout(() => document.getElementById(`announcement-${deepLink}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      })
      .catch((err) => {
        if (!cancelled && isApiError(err) && err.status === 410) setRemovedNotice(true)
      })
    return () => {
      cancelled = true
    }
  }, [deepLink])

  const onRead = useCallback(
    async (id: string) => {
      setItems((cur) => cur?.map((i) => (i.announcementId === id ? { ...i, read: true } : i)) ?? cur)
      try {
        await markAnnouncementRead(id)
        void bump()
      } catch {
        // Best-effort.
      }
    },
    [bump],
  )

  const toggle = async (item: AnnouncementItem) => {
    setExpanded((cur) => {
      const next = new Set(cur)
      if (next.has(item.announcementId)) next.delete(item.announcementId)
      else next.add(item.announcementId)
      return next
    })
    if (item.attachmentCount > 0 && !attachments[item.announcementId]) {
      try {
        const res = await getAnnouncement(item.announcementId)
        const detail = res.data
        if (detail) setAttachments((cur) => ({ ...cur, [item.announcementId]: detail.attachments }))
      } catch {
        // The card keeps showing the attachment count.
      }
    }
  }

  const onCreated = (thread: Thread) => {
    setAsking(null)
    router.push(`/parent/messages?tab=conversations&thread=${encodeURIComponent(thread.conversation.conversationId)}`)
  }

  return (
    <div className="space-y-3">
      {removedNotice && (
        <p className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-600">The announcement in that link was removed by the school.</p>
      )}
      {items === null ? (
        [0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-100" />)
      ) : items.length === 0 ? (
        <ParentEmptyState
          icon={MegaphoneIcon}
          title="No announcements yet"
          message="Class and school announcements from your children's teachers will appear here, and you'll get an email for each one."
        />
      ) : (
        items.map((item) => (
          <div key={item.announcementId} id={`announcement-${item.announcementId}`}>
            <AnnouncementCard
              item={item}
              attachments={attachments[item.announcementId]}
              expanded={expanded.has(item.announcementId)}
              onToggle={() => void toggle(item)}
              onAsk={setAsking}
              onRead={onRead}
            />
          </div>
        ))
      )}
      <NewConversationModal
        isOpen={asking !== null}
        onClose={() => setAsking(null)}
        tone="parent"
        role="PARENT"
        preset={
          asking
            ? {
                mode: 'general',
                teacherId: asking.authorId ?? undefined,
                title: `Re: ${asking.title}`.slice(0, 120),
                announcementId: asking.announcementId,
                announcementScopeLabel: asking.scopeLabel,
                authorName: asking.authorName,
                childIds: (asking.children ?? []).map((c) => c.studentId),
              }
            : undefined
        }
        onCreated={onCreated}
      />
    </div>
  )
}

export default AnnouncementFeed
