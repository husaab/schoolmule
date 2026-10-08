'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeftIcon, ArrowPathIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import AttachmentChip from '@/components/messaging/AttachmentChip'
import { formatDayLabel, formatTime } from '@/components/messaging/formatters'
import { toneClasses, type Tone } from '@/components/messaging/tones'
import { getAnnouncement, markAnnouncementRead, retryAnnouncementEmails } from '@/services/announcementService'
import { isApiError } from '@/services/apiClient'
import type { AnnouncementDetail as Detail, AnnouncementItem } from '@/services/types/announcement'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import AnnouncementScopeChip from './AnnouncementScopeChip'
import ReadReceipts from './ReadReceipts'

interface Props {
  announcementId: string
  tone: Tone
  onEdit: (detail: Detail) => void
  onDelete: (item: AnnouncementItem) => void
  onBack: () => void
  /** Called after read-marking so the list can drop the unread dot. */
  onChanged: () => void
  /** Bumps when a save completes, to re-fetch. */
  version?: number
}

/**
 * The open announcement: body, attachments and (for staff) who has seen it.
 * Opening marks it read once; the badge and list refresh through onChanged.
 */
const AnnouncementDetail: React.FC<Props> = ({ announcementId, tone, onEdit, onDelete, onBack, onChanged, version = 0 }) => {
  const t = toneClasses(tone)
  const user = useUserStore((s) => s.user)
  const bump = useMessagingStore((s) => s.bump)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [state, setState] = useState<{ key: string; detail: Detail | null; removed: boolean; error: string | null }>({
    key: '',
    detail: null,
    removed: false,
    error: null,
  })

  const key = `${announcementId}|${version}`
  useEffect(() => {
    let cancelled = false
    getAnnouncement(announcementId)
      .then(async (res) => {
        if (cancelled || !res.data) return
        setState({ key, detail: res.data, removed: false, error: null })
        if (!res.data.read) {
          try {
            await markAnnouncementRead(announcementId)
            void bump()
            onChanged()
          } catch {
            // Read marks are best-effort.
          }
        }
      })
      .catch((err) => {
        if (cancelled) return
        if (isApiError(err) && err.status === 410) setState({ key, detail: null, removed: true, error: null })
        else setState({ key, detail: null, removed: false, error: err instanceof Error ? err.message : 'Could not load this announcement' })
      })
    return () => {
      cancelled = true
    }
    // onChanged changes identity per render; the fetch is keyed on id + version only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementId, version, key, bump])

  const retry = async () => {
    try {
      const res = await retryAnnouncementEmails(announcementId)
      showNotification(`${res.data?.requeued ?? 0} emails queued again`, 'success')
      const fresh = await getAnnouncement(announcementId)
      if (fresh.data) setState((cur) => ({ ...cur, detail: fresh.data ?? cur.detail }))
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not retry', 'error')
    }
  }

  const current = state.key === key ? state : null
  if (current?.removed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
        <p className="text-sm font-medium text-slate-700">This announcement was removed</p>
        <button type="button" onClick={onBack} className={`text-xs ${t.accentText} cursor-pointer`}>
          Back to announcements
        </button>
      </div>
    )
  }
  if (current?.error) return <div className="p-6 text-sm text-rose-600">{current.error}</div>
  const detail = current?.detail
  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <ArrowPathIcon className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    )
  }

  const isStaff = user.role !== 'PARENT'
  const child = detail.children?.[0] ?? null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`flex items-start gap-3 border-b px-5 py-4 ${t.divider}`}>
        <button type="button" onClick={onBack} aria-label="Back" className="mt-0.5 rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden cursor-pointer">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5">
            <AnnouncementScopeChip item={detail} tone={tone} child={child} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{detail.title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {detail.authorId === user.id ? 'You' : detail.authorName} · {formatDayLabel(detail.publishedAt)}, {formatTime(detail.publishedAt)}
            {detail.editedAt && ` · edited ${formatDayLabel(detail.editedAt)}`}
          </p>
        </div>
        {detail.canEdit && (
          <div className="flex flex-shrink-0 gap-1.5">
            <button type="button" onClick={() => onEdit(detail)} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${t.secondary} cursor-pointer`}>
              <PencilSquareIcon className="h-4 w-4" /> Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(detail)}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
            >
              <TrashIcon className="h-4 w-4" /> Delete
            </button>
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{detail.body}</p>
        {detail.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {detail.attachments.map((a) => (
              <AttachmentChip key={a.attachmentId} attachment={{ ...a, messageId: detail.announcementId }} />
            ))}
          </div>
        )}
        {isStaff && detail.receipts && detail.emails && (
          <ReadReceipts
            seenCount={detail.seenCount ?? 0}
            audienceCount={detail.audienceCount ?? 0}
            receipts={detail.receipts}
            emails={detail.emails}
            canRetry={user.role === 'ADMIN'}
            onRetry={retry}
          />
        )}
      </div>
    </div>
  )
}

export default AnnouncementDetail
