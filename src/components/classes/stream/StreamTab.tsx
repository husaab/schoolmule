// src/components/classes/stream/StreamTab.tsx
// The class Stream (the Teacher-Stream board). Left: what is coming up and
// who a post here emails. Right: the composer, then the class's announcements
// with classwork notices between them, newest first (pinned posts on top).
// Posts can be edited and deleted from their ⋮ through the existing
// announcement modals. ?compose=1 (a card's "Message all parents", the
// People tab) opens the composer once and is then dropped from the URL.
'use client'

import { useEffect, useMemo, useState, type FC } from 'react'
import Link from 'next/link'
import { MegaphoneIcon, XMarkIcon } from '@heroicons/react/24/outline'
import AnnouncementComposerModal from '@/components/announcements/AnnouncementComposerModal'
import DeleteAnnouncementModal from '@/components/announcements/DeleteAnnouncementModal'
import TabEmptyState from '@/components/classes/page/TabEmptyState'
import type { ClassTabProps } from '@/components/classes/page/tabs'
import { useFilterParams } from '@/hooks/useFilterParams'
import { buildFeed, resolveAuthor } from '@/lib/classStream'
import type { AnnouncementDetail, AnnouncementItem } from '@/services/types/announcement'
import StreamComposer from './StreamComposer'
import StreamNoticeRow from './StreamNoticeRow'
import StreamPostCard from './StreamPostCard'
import UpcomingCard from './UpcomingCard'
import WhoGetsEmailsCard from './WhoGetsEmailsCard'
import { useClassStream } from './useClassStream'

interface CustomPosted {
  announcementId: string
  students: number
}

const StreamTab: FC<ClassTabProps> = ({ classId, data }) => {
  const filters = useFilterParams({ remember: false })
  const { setParams } = filters
  const composeRequested = filters.get('compose') === '1'
  const { data: stream, error, loading, reload } = useClassStream(classId)

  const [composerOpen, setComposerOpen] = useState(composeRequested)
  const [seenCompose, setSeenCompose] = useState(composeRequested)
  const [editing, setEditing] = useState<AnnouncementDetail | null>(null)
  const [deleting, setDeleting] = useState<AnnouncementItem | null>(null)
  const [customPosted, setCustomPosted] = useState<CustomPosted | null>(null)

  // ?compose=1 arriving while the tab is open opens the composer too.
  if (composeRequested !== seenCompose) {
    setSeenCompose(composeRequested)
    if (composeRequested) setComposerOpen(true)
  }
  // It is a one-shot request: drop it so a refresh does not open the composer again.
  useEffect(() => {
    if (composeRequested) setParams({ compose: null })
  }, [composeRequested, setParams])

  const cls = data.class
  const canEdit = data.permissions.canEdit
  const isAdmin = data.permissions.isAdmin
  const feed = useMemo(() => (stream ? buildFeed(stream.announcements, stream.notices) : []), [stream])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start" aria-busy="true">
        <div className="flex w-full flex-col gap-4 lg:w-[260px] lg:shrink-0">
          <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
        <p className="mb-4 text-slate-600">{error ?? "The Stream couldn't be loaded."}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="cursor-pointer rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="flex w-full flex-col gap-4 lg:w-[260px] lg:shrink-0">
        <UpcomingCard classId={classId} rows={stream.upcoming} />
        <WhoGetsEmailsCard audience={stream.audience} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {canEdit ? (
          <StreamComposer
            classId={classId}
            grade={cls.grade}
            subject={cls.subject}
            audience={stream.audience}
            emailDefault={cls.options.emailNewPosts}
            open={composerOpen}
            onOpenChange={setComposerOpen}
            onPosted={(detail, info) => {
              setCustomPosted(info.custom ? { announcementId: detail.announcementId, students: info.students } : null)
              void reload()
            }}
          />
        ) : (
          <p className="rounded-2xl border border-slate-200/70 bg-white px-5 py-3.5 text-sm text-slate-500">
            This class is from a past school year, so it is read-only.
          </p>
        )}

        {customPosted && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            <p className="flex-1">
              Posted to {customPosted.students} chosen {customPosted.students === 1 ? 'student' : 'students'}. Posts to chosen
              students are kept under Messages, not in this Stream.{' '}
              <Link
                href={`/messages?tab=announcements&announcement=${encodeURIComponent(customPosted.announcementId)}`}
                className="font-medium underline"
              >
                Open it
              </Link>
            </p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setCustomPosted(null)}
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-100"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            The Stream couldn&apos;t be refreshed, so this may be out of date.{' '}
            <button type="button" onClick={() => void reload()} className="cursor-pointer font-medium underline">
              Try again
            </button>
          </p>
        )}

        {feed.length === 0 ? (
          <TabEmptyState icon={MegaphoneIcon}>Nothing posted yet. Announcements you post appear here.</TabEmptyState>
        ) : (
          feed.map((entry) =>
            entry.type === 'notice' ? (
              <StreamNoticeRow key={entry.key} notice={entry.notice} classId={classId} color={cls.identity.color} />
            ) : (
              <StreamPostCard
                key={entry.key}
                item={entry.item}
                audience={stream.audience}
                author={resolveAuthor(entry.item.authorId, data.teachers)}
                canChange={canEdit && entry.item.canEdit}
                isAdmin={isAdmin}
                onEdit={setEditing}
                onDelete={setDeleting}
                onChanged={() => void reload()}
              />
            ),
          )
        )}
      </div>

      <AnnouncementComposerModal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        tone="staff"
        mode="edit"
        existing={editing}
        onSaved={() => {
          setEditing(null)
          void reload()
        }}
      />
      <DeleteAnnouncementModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        item={deleting}
        onDeleted={() => {
          setDeleting(null)
          void reload()
        }}
      />
    </div>
  )
}

export default StreamTab
