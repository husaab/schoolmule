'use client'

import React, { useEffect, useRef } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import AttachmentChip from '@/components/messaging/AttachmentChip'
import { formatDayLabel, formatTime } from '@/components/messaging/formatters'
import type { AnnouncementAttachment, AnnouncementItem } from '@/services/types/announcement'
import AnnouncementScopeChip from './AnnouncementScopeChip'

interface Props {
  item: AnnouncementItem
  attachments?: AnnouncementAttachment[]
  expanded: boolean
  onToggle: () => void
  onAsk: (item: AnnouncementItem) => void
  onRead: (id: string) => void
}

const PREVIEW_CHARS = 220

/** One announcement in the parent feed: full body when unread or expanded, clipped otherwise. */
const AnnouncementCard: React.FC<Props> = ({ item, attachments = [], expanded, onToggle, onAsk, onRead }) => {
  const ref = useRef<HTMLElement>(null)
  const unread = !item.read
  const long = item.body.length > PREVIEW_CHARS
  const showFull = unread || expanded || !long

  // Seen = it was on screen; one call per card.
  useEffect(() => {
    if (!unread || !ref.current || typeof IntersectionObserver === 'undefined') return
    const el = ref.current
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onRead(item.announcementId)
          io.disconnect()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [unread, item.announcementId, onRead])

  const child = item.children?.[0] ?? null
  const askLabel = item.authorRole === 'ADMIN' ? 'Ask about this' : `Ask ${item.authorName} about this`

  return (
    <article ref={ref} className={`relative rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${item.isPinned ? 'border-amber-200' : 'border-stone-200/70'}`}>
      {unread && <span className="absolute left-4 top-5 h-2 w-2 rounded-full bg-amber-600" aria-label="Unread" />}
      <div className="pl-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <AnnouncementScopeChip item={item} tone="parent" child={child} />
          {item.children && item.children.length > 1 && <span className="text-[11px] text-slate-400">+ {item.children.length - 1} more</span>}
          <span className="ml-auto text-xs text-slate-400">
            {item.authorName} · {formatDayLabel(item.publishedAt)}, {formatTime(item.publishedAt)}
            {item.editedAt ? ' · edited' : ''}
          </span>
        </div>
        <h2 className={`text-base font-semibold ${unread ? 'text-slate-900' : 'text-slate-800'}`}>{item.title}</h2>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
          {showFull ? item.body : `${item.body.slice(0, PREVIEW_CHARS).trimEnd()}…`}
        </p>
        {long && !unread && (
          <button type="button" onClick={onToggle} className="mt-1 text-xs font-medium text-amber-700 cursor-pointer">
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((a) => (
              <AttachmentChip key={a.attachmentId} attachment={{ ...a, messageId: item.announcementId }} />
            ))}
          </div>
        )}
        {attachments.length === 0 && item.attachmentCount > 0 && (
          <button type="button" onClick={onToggle} className="mt-2 text-xs text-amber-700 cursor-pointer">
            {item.attachmentCount} attachment{item.attachmentCount === 1 ? '' : 's'} · show
          </button>
        )}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onAsk(item)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer ${
              unread || item.isPinned ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-stone-200 bg-white text-slate-700 hover:bg-stone-50'
            }`}
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" /> {askLabel}
          </button>
        </div>
      </div>
    </article>
  )
}

export default AnnouncementCard
