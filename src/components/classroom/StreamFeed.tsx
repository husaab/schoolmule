// src/components/classroom/StreamFeed.tsx
// A class Stream as a student or parent reads it (Student-Class and
// Parent-Lens boards): posts with the teacher's avatar, "New" on what has not
// been opened, attachments that open a freshly signed link, and "Got it" where
// the teacher asked for one (parents only). Posted assignments, quizzes and
// materials sit between the posts as notice rows. There is no reply button on
// a post: the one "Message {teacher}" button at the top of the page is how to
// write to a teacher.
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  BookmarkIcon,
  CheckIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import { formatBytes, isImage } from '@/components/messaging/formatters'
import { dueLine, postedAtLabel } from '@/lib/classroomText'
import { buildStreamFeed, noticeLead } from '@/lib/streamFeed'
import { shortDate } from '@/lib/studentAccounts'
import type { ClassNotice, StudentAnnouncement, StudentAttachment } from '@/services/types/studentPortal'

const CLAMP_CHARS = 600

interface StreamFeedProps {
  announcements: StudentAnnouncement[]
  notices: ClassNotice[]
  /** Open one file (the page asks for a fresh signed link). */
  onOpenAttachment: (announcement: StudentAnnouncement, attachment: StudentAttachment) => Promise<void> | void
  /** "Got it" (true) and its undo (false). Left out where nobody is asked for one. */
  onAck?: (announcement: StudentAnnouncement, acked: boolean) => Promise<void> | void
  /** Show posts and their state, but offer no "Got it". */
  readOnly?: boolean
  /** Called once per post that was unread when it scrolled into view. */
  onSeen?: (announcement: StudentAnnouncement) => void
  /** Where a classwork notice goes; null leaves it as plain text. */
  noticeHref?: (notice: ClassNotice) => string | null
  /** A post to scroll to and ring (an email's deep link). */
  focusId?: string | null
  tone?: 'student' | 'parent'
  now?: Date
}

const TONE = {
  student: {
    newRing: 'border-indigo-200',
    newPill: 'bg-indigo-50 text-indigo-800',
    focusRing: 'ring-2 ring-indigo-300',
    open: 'bg-indigo-600 text-white',
    ack: 'bg-amber-700 text-white hover:bg-amber-800',
    link: 'text-indigo-700',
  },
  parent: {
    newRing: 'border-amber-200',
    newPill: 'bg-amber-50 text-amber-800',
    focusRing: 'ring-2 ring-amber-300',
    open: 'bg-amber-700 text-white',
    ack: 'bg-amber-700 text-white hover:bg-amber-800',
    link: 'text-amber-800',
  },
}

function AttachmentButton({
  attachment,
  onOpen,
}: {
  attachment: StudentAttachment
  onOpen: () => Promise<void> | void
}) {
  const [opening, setOpening] = useState(false)
  const Icon = attachment.mimeType === 'application/pdf' ? DocumentTextIcon : isImage(attachment.mimeType) ? PhotoIcon : DocumentIcon
  return (
    <button
      type="button"
      disabled={opening}
      aria-label={`Open ${attachment.fileName}`}
      onClick={async () => {
        if (opening) return
        setOpening(true)
        try {
          await onOpen()
        } finally {
          setOpening(false)
        }
      }}
      className="inline-flex max-w-xs cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
    >
      <Icon className={`h-[18px] w-[18px] shrink-0 ${attachment.mimeType === 'application/pdf' ? 'text-rose-500' : 'text-slate-500'}`} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate text-sm text-slate-900">{attachment.fileName}</span>
        <span className="block text-[11px] text-slate-400">{formatBytes(attachment.sizeBytes)}</span>
      </span>
    </button>
  )
}

interface PostCardProps {
  post: StudentAnnouncement
  isNew: boolean
  focused: boolean
  tone: 'student' | 'parent'
  now: Date
  onOpenAttachment: StreamFeedProps['onOpenAttachment']
  onAck?: StreamFeedProps['onAck']
  onSeen?: (post: StudentAnnouncement) => void
}

function PostCard({ post, isNew, focused, tone, now, onOpenAttachment, onAck, onSeen }: PostCardProps) {
  const t = TONE[tone]
  const ref = useRef<HTMLElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [acking, setAcking] = useState(false)
  const needsSeen = !post.read && !!onSeen

  // Seen = it was on screen; one call per post.
  useEffect(() => {
    if (!needsSeen || !ref.current) return
    if (typeof IntersectionObserver === 'undefined') {
      onSeen?.(post)
      return
    }
    const el = ref.current
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onSeen?.(post)
          io.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [needsSeen, post, onSeen])

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focused])

  const long = post.body.length > CLAMP_CHARS
  const shown = long && !expanded ? `${post.body.slice(0, CLAMP_CHARS).trimEnd()}…` : post.body

  const ack = async (acked: boolean) => {
    if (!onAck || acking) return
    setAcking(true)
    try {
      await onAck(post, acked)
    } finally {
      setAcking(false)
    }
  }

  return (
    <article
      ref={ref}
      id={`announcement-${post.announcementId}`}
      className={`flex flex-col gap-3 rounded-2xl border bg-white p-[18px] sm:p-[22px] ${isNew ? t.newRing : 'border-slate-200/70'} ${focused ? t.focusRing : ''}`}
    >
      <div className="flex items-center gap-3">
        <Avatar name={post.author.name} avatar={post.author.avatar} photoUrl={post.author.photoUrl} size={42} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-medium text-slate-900">{post.author.name}</span>
          <span className="text-[13px] text-slate-500">
            {postedAtLabel(post.publishedAt, now)}
            {post.editedAt ? ' · edited' : ''}
          </span>
        </div>
        {post.isPinned && (
          <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            Pinned
          </span>
        )}
        {isNew && <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${t.newPill}`}>New</span>}
      </div>

      <h3 className="font-display text-[19px] font-semibold text-slate-900 sm:text-[21px]">{post.title}</h3>
      <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-slate-700">{shown}</p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`-mt-1 w-fit cursor-pointer text-[13px] font-medium ${t.link}`}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {post.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.attachments.map((a) => (
            <AttachmentButton key={a.attachmentId} attachment={a} onOpen={() => onOpenAttachment(post, a)} />
          ))}
        </div>
      )}

      {post.ackRequested && onAck && (
        <div className="flex flex-wrap items-center gap-2.5">
          {post.ackedAt ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
                <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                You acknowledged this · {postedAtLabel(post.ackedAt, now)}
              </span>
              <button
                type="button"
                disabled={acking}
                onClick={() => void ack(false)}
                className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 disabled:cursor-wait"
              >
                Undo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={acking}
                onClick={() => void ack(true)}
                className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-[10px] px-[13px] py-2 text-sm font-medium disabled:cursor-wait disabled:opacity-70 ${t.ack}`}
              >
                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                Got it
              </button>
              <span className="text-xs text-slate-500">{post.author.name} asked families to confirm they&apos;ve read this.</span>
            </>
          )}
        </div>
      )}
    </article>
  )
}

function NoticeRow({ notice, href, tone, now }: { notice: ClassNotice; href: string | null; tone: 'student' | 'parent'; now: Date }) {
  const t = TONE[tone]
  const Icon = notice.kind === 'material' ? BookmarkIcon : ClipboardDocumentListIcon
  const meta = [shortDate(notice.postedAt, now), notice.dueAt ? dueLine(notice.dueAt, now) : null].filter(Boolean).join(' · ')
  const body = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${notice.kind === 'material' ? 'bg-slate-100 text-slate-600' : 'bg-teal-100 text-teal-800'}`}
      >
        <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] text-slate-900">
          <strong className="font-medium">{noticeLead(notice.kind)}:</strong> {notice.title}
        </span>
        <span className="text-[13px] text-slate-500">{meta}</span>
      </span>
      {href && <span className={`hidden shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium sm:block ${t.open}`}>Open</span>}
    </>
  )
  const className = 'flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white px-[18px] py-4 sm:px-5'
  return href ? (
    <Link href={href} className={`${className} transition-colors hover:bg-slate-50`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

export default function StreamFeed({
  announcements,
  notices,
  onOpenAttachment,
  onAck,
  readOnly = false,
  onSeen,
  noticeHref,
  focusId = null,
  tone = 'student',
  now = new Date(),
}: StreamFeedProps) {
  // "New" stays on a post for this visit even after it is marked read.
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set())
  const [knownIds, setKnownIds] = useState<Set<string>>(() => new Set())
  const fresh = announcements.filter((a) => !knownIds.has(a.announcementId))
  if (fresh.length > 0) {
    setKnownIds(new Set([...knownIds, ...fresh.map((a) => a.announcementId)]))
    const unread = fresh.filter((a) => !a.read).map((a) => a.announcementId)
    if (unread.length > 0) setNewIds(new Set([...newIds, ...unread]))
  }

  const feed = buildStreamFeed(announcements, notices)
  if (feed.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200/70 bg-white p-6 text-center text-[15px] text-slate-500">
        Nothing posted yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {feed.map((entry) =>
        entry.type === 'post' ? (
          <PostCard
            key={entry.key}
            post={entry.post}
            isNew={newIds.has(entry.post.announcementId)}
            focused={focusId === entry.post.announcementId}
            tone={tone}
            now={now}
            onOpenAttachment={onOpenAttachment}
            onAck={readOnly ? undefined : onAck}
            onSeen={readOnly ? undefined : onSeen}
          />
        ) : (
          <NoticeRow key={entry.key} notice={entry.notice} href={noticeHref?.(entry.notice) ?? null} tone={tone} now={now} />
        ),
      )}
    </div>
  )
}
