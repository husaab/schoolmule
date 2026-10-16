// src/components/classes/stream/StreamPostCard.tsx
// One announcement in the teacher's Stream (the Teacher-Stream board): the
// author's avatar and name ("· co-teacher"), "Oct 12 · emailed to students
// and parents" (or "not emailed"), a ⋮ with Edit and Delete for those who may
// change it, the title and message, attachments that open a fresh signed link
// on click, and the footer chips (seen by parents, seen by students, Got it)
// which open who has seen it. The list carries only counts, so the post's
// files and receipts come from its own detail, fetched when they are needed.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DocumentIcon, DocumentTextIcon, PencilSquareIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import ReadReceipts from '@/components/announcements/ReadReceipts'
import KebabMenu, { type KebabItem } from '@/components/classes/shared/KebabMenu'
import { formatBytes, isImage } from '@/components/messaging/formatters'
import { postByline, seenChips, type PostAuthor } from '@/lib/classStream'
import {
  getAnnouncement,
  getAnnouncementAttachmentUrl,
  retryAnnouncementEmails,
} from '@/services/announcementService'
import type { AnnouncementAttachment, AnnouncementDetail, AnnouncementItem } from '@/services/types/announcement'
import type { StreamAudience } from '@/services/types/classroom'
import { useNotificationStore } from '@/store/useNotificationStore'

const CLAMP_CHARS = 600

interface DetailState {
  /** The post as it was when this was fetched (id, edit time, file count). */
  contentKey: string
  /** contentKey plus the refresh counter. */
  key: string
  detail: AnnouncementDetail | null
  failed: boolean
}

/**
 * The post's detail (files, receipts, email stats), fetched once `enabled`,
 * again when the post changed (an edit) and again whenever `nonce` moves.
 * While a refresh is in flight the last answer for the same post stays on
 * screen; a late answer for an older request is dropped.
 */
function useAnnouncementDetail(item: AnnouncementItem, enabled: boolean, nonce: number) {
  const contentKey = `${item.announcementId}|${item.editedAt ?? ''}|${item.attachmentCount}`
  const key = `${contentKey}|${nonce}`
  const [state, setState] = useState<DetailState | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    getAnnouncement(item.announcementId).then(
      (res) => !cancelled && setState({ contentKey, key, detail: res.data ?? null, failed: !res.data }),
      () =>
        !cancelled &&
        setState((prev) => ({ contentKey, key, detail: prev?.contentKey === contentKey ? prev.detail : null, failed: true })),
    )
    return () => {
      cancelled = true
    }
  }, [enabled, item.announcementId, contentKey, key])

  const fresh = state?.contentKey === contentKey ? state : null
  return {
    detail: fresh?.detail ?? null,
    failed: fresh?.failed ?? false,
    loading: enabled && state?.key !== key,
  }
}

/** A file on the post: opens a freshly signed link in a new tab (the old one may have expired). */
function AttachmentButton({ announcementId, attachment }: { announcementId: string; attachment: AnnouncementAttachment }) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [opening, setOpening] = useState(false)
  const Icon = attachment.mimeType === 'application/pdf' ? DocumentTextIcon : isImage(attachment.mimeType) ? PhotoIcon : DocumentIcon

  const open = async () => {
    if (opening) return
    setOpening(true)
    // Opened before the request so the browser sees a click, filled in after.
    const tab = window.open('about:blank', '_blank')
    if (tab) tab.opener = null
    try {
      const res = await getAnnouncementAttachmentUrl(announcementId, attachment.attachmentId)
      const url = res.data?.url
      if (!url) throw new Error("This file couldn't be opened.")
      if (tab) tab.location.href = url
      else window.location.assign(url)
    } catch (err) {
      tab?.close()
      showNotification(err instanceof Error && err.message ? err.message : "This file couldn't be opened.", 'error')
    } finally {
      setOpening(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void open()}
      disabled={opening}
      aria-label={`Open ${attachment.fileName}`}
      title={`Open ${attachment.fileName}`}
      className="inline-flex max-w-xs cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
    >
      <Icon className={`h-5 w-5 shrink-0 ${attachment.mimeType === 'application/pdf' ? 'text-rose-500' : 'text-slate-400'}`} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-slate-700">{attachment.fileName}</span>
        <span className="block text-[11px] text-slate-400">{formatBytes(attachment.sizeBytes)}</span>
      </span>
    </button>
  )
}

interface StreamPostCardProps {
  item: AnnouncementItem
  audience: StreamAudience
  author: PostAuthor
  /** The viewer may open the ⋮ (Edit, Delete) when the post is theirs or they are an admin. */
  canChange: boolean
  /** Admins can queue failed emails again. */
  isAdmin: boolean
  /** Edit: the card fetches the post fresh, then hands it up to open the editor. */
  onEdit: (detail: AnnouncementDetail) => void
  onDelete: (item: AnnouncementItem) => void
  /** Counts may have changed (emails queued again). */
  onChanged: () => void
}

export default function StreamPostCard({ item, audience, author, canChange, isAdmin, onEdit, onDelete, onChanged }: StreamPostCardProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [receiptsOpen, setReceiptsOpen] = useState(false)
  // Moves each time the receipts open, so the numbers are current when looked at.
  const [receiptsNonce, setReceiptsNonce] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const editing = useRef(false)

  const needsDetail = item.attachmentCount > 0 || receiptsOpen
  const { detail, failed, loading } = useAnnouncementDetail(item, needsDetail, receiptsNonce)

  const long = item.body.length > CLAMP_CHARS
  const shown = long && !expanded ? `${item.body.slice(0, CLAMP_CHARS).trimEnd()}…` : item.body
  const chips = seenChips(item)

  const toggleReceipts = () => {
    if (!receiptsOpen) setReceiptsNonce((n) => n + 1)
    setReceiptsOpen((open) => !open)
  }

  const edit = useCallback(async () => {
    if (editing.current) return
    editing.current = true
    setLoadingEdit(true)
    try {
      const res = await getAnnouncement(item.announcementId)
      if (!res.data) throw new Error("This announcement couldn't be opened.")
      onEdit(res.data)
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "This announcement couldn't be opened.", 'error')
    } finally {
      editing.current = false
      setLoadingEdit(false)
    }
  }, [item.announcementId, onEdit, showNotification])

  const retry = async () => {
    try {
      const res = await retryAnnouncementEmails(item.announcementId)
      showNotification(`${res.data?.requeued ?? 0} emails queued again`, 'success')
      setReceiptsNonce((n) => n + 1)
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "The emails couldn't be queued again.", 'error')
    }
  }

  const menu: KebabItem[] = [
    { key: 'edit', label: 'Edit', icon: PencilSquareIcon, onSelect: () => void edit() },
    { key: 'delete', label: 'Delete', icon: TrashIcon, tone: 'danger', separatorBefore: true, onSelect: () => onDelete(item) },
  ]

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-5">
      <div className="flex items-center gap-3">
        <Avatar name={item.authorName} avatar={author.avatar} photoUrl={author.photoUrl} size={40} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-slate-900">
            {item.authorName}
            {author.coTeacher && <span className="font-normal text-slate-500"> · co-teacher</span>}
          </span>
          <span className="text-xs text-slate-500">{postByline(item, audience)}</span>
        </div>
        {item.isPinned && (
          <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            Pinned
          </span>
        )}
        {canChange && <KebabMenu label={`Options for ${item.title}`} items={menu} busy={loadingEdit} />}
      </div>

      <h3 className="font-display text-[19px] font-semibold text-slate-900">{item.title}</h3>
      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-700">{shown}</p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="-mt-1 w-fit cursor-pointer text-[13px] font-medium text-cyan-700 hover:text-cyan-900"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {item.attachmentCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {detail
            ? detail.attachments.map((a) => <AttachmentButton key={a.attachmentId} announcementId={item.announcementId} attachment={a} />)
            : failed
              ? <span className="text-xs text-slate-500">{item.attachmentCount} {item.attachmentCount === 1 ? 'file' : 'files'} could not be loaded. Reload to try again.</span>
              : loading && Array.from({ length: item.attachmentCount }, (_, i) => (
                  <span key={i} className="h-[46px] w-40 animate-pulse rounded-xl bg-slate-100" aria-hidden="true" />
                ))}
        </div>
      )}

      {chips.length > 0 && (
        <button
          type="button"
          onClick={toggleReceipts}
          aria-expanded={receiptsOpen}
          aria-label={receiptsOpen ? 'Hide who has seen this' : 'Show who has seen this'}
          className="flex w-fit cursor-pointer flex-wrap gap-2 text-[13px]"
        >
          {chips.map((chip) => (
            <span
              key={chip.kind}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                chip.kind === 'ack' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
              } ${receiptsOpen ? 'ring-1 ring-slate-300' : ''}`}
            >
              {chip.text}
            </span>
          ))}
        </button>
      )}

      {receiptsOpen &&
        (detail?.receipts && detail.emails ? (
          <ReadReceipts
            seenCount={detail.seenCount ?? 0}
            audienceCount={detail.audienceCount ?? 0}
            ackRequested={detail.ackRequested}
            ackCount={detail.ackCount ?? 0}
            receipts={detail.receipts}
            emails={detail.emails}
            canRetry={isAdmin}
            onRetry={() => void retry()}
          />
        ) : failed ? (
          <p className="text-sm text-slate-500">Who has seen this couldn&apos;t be loaded. Close and open it to try again.</p>
        ) : (
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" aria-hidden="true" />
        ))}
    </article>
  )
}
