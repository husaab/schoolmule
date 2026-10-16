// src/components/studentPortal/class/StudentStreamTab.tsx
// The Stream tab of a student's class page (Student-Class board): "Coming up"
// beside the class's posts and classwork notices. A post that was unread when
// it came on screen is marked read; it keeps its "New" badge for the visit.
'use client'

import { useCallback } from 'react'
import LoadError from '@/components/classroom/LoadError'
import StreamFeed from '@/components/classroom/StreamFeed'
import UpcomingList from '@/components/classroom/UpcomingList'
import { useLoad } from '@/hooks/useLoad'
import { openSignedUrl } from '@/lib/openSignedUrl'
import { studentItemHref } from '@/lib/portalRoutes'
import { getStudentAttachmentUrl, getStudentClassStream, markStudentAnnouncementRead } from '@/services/studentPortalService'
import type { StudentAnnouncement, StudentAttachment, TodoItem } from '@/services/types/studentPortal'
import { useNotificationStore } from '@/store/useNotificationStore'

interface StudentStreamTabProps {
  classId: string
  upcoming: TodoItem[]
  /** A post to scroll to (an email's deep link). */
  focusId: string | null
}

export default function StudentStreamTab({ classId, upcoming, focusId }: StudentStreamTabProps) {
  const notify = useNotificationStore((s) => s.showNotification)
  const stream = useLoad(`stream:${classId}`, () => getStudentClassStream(classId).then((r) => r.data))
  const { patch } = stream

  const onSeen = useCallback(
    (post: StudentAnnouncement) => {
      patch((d) => ({
        ...d,
        announcements: d.announcements.map((a) => (a.announcementId === post.announcementId ? { ...a, read: true } : a)),
      }))
      // Best effort: the post is read on screen either way.
      void markStudentAnnouncementRead(post.announcementId).catch(() => {})
    },
    [patch],
  )

  const onOpenAttachment = useCallback(
    async (post: StudentAnnouncement, file: StudentAttachment) => {
      try {
        await openSignedUrl(async () => (await getStudentAttachmentUrl(post.announcementId, file.attachmentId)).data.url)
      } catch (err) {
        notify(err instanceof Error && err.message ? err.message : "This file couldn't be opened.", 'error')
      }
    },
    [notify],
  )

  if (stream.error && !stream.data) {
    return <LoadError title="We couldn't load the Stream" message={stream.error.message} onRetry={stream.reload} />
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      {upcoming.length > 0 && (
        <div className="min-w-0 flex-1 basis-full md:basis-60">
          <UpcomingList items={upcoming} hrefFor={(item) => studentItemHref(item.itemId)} />
        </div>
      )}
      <div className="min-w-0 flex-[999_1_480px] basis-full md:basis-[480px]">
        {stream.data ? (
          <StreamFeed
            announcements={stream.data.announcements}
            notices={stream.data.notices}
            onOpenAttachment={onOpenAttachment}
            onSeen={onSeen}
            noticeHref={(n) => studentItemHref(n.itemId)}
            focusId={focusId}
          />
        ) : (
          <div className="flex flex-col gap-4" aria-label="Loading">
            {[0, 1].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
