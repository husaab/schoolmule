'use client'

// Parent inbox: announcements first (class and school news), then the
// conversations with teachers. The child pills drive the same selected-child
// store as the sidebar, so "All children" vs one child filters both tabs.

import React, { Suspense } from 'react'
import { ChatBubbleLeftRightIcon, MegaphoneIcon } from '@heroicons/react/24/outline'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ChildFilterPills from '@/components/parent/ChildFilterPills'
import MessagingInbox from '@/components/messaging/MessagingInbox'
import MessagesTabs, { useMessagesTab } from '@/components/messaging/MessagesTabs'
import AnnouncementFeed from '@/components/announcements/AnnouncementFeed'
import { ALL_CHILDREN, useSelectedChildStore } from '@/store/useSelectedChildStore'
import { useMessagingStore } from '@/store/useMessagingStore'

const ParentMessagesBody: React.FC<{ studentId?: string }> = ({ studentId }) => {
  const summary = useMessagingStore((s) => s.summary)
  const [tab, setTab] = useMessagesTab('announcements')
  return (
    <div className="space-y-4">
      <MessagesTabs
        tone="parent"
        active={tab}
        onChange={setTab}
        order={['announcements', 'conversations']}
        counts={{ conversations: summary.unreadConversations, announcements: summary.unreadAnnouncements }}
      />
      {tab === 'announcements' ? (
        <>
          <ChildFilterPills />
          <AnnouncementFeed studentId={studentId} />
        </>
      ) : (
        <MessagingInbox
          tone="parent"
          role="PARENT"
          fixedFilters={studentId ? { studentId } : undefined}
          listHeaderSlot={<ChildFilterPills />}
          emptyHint="Open Grades and choose “Ask the teacher” on any assessment, or use New message."
        />
      )}
    </div>
  )
}

const ParentMessagesPage: React.FC = () => {
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId)
  const summary = useMessagingStore((s) => s.summary)
  const studentId = selectedChildId === ALL_CHILDREN ? undefined : selectedChildId
  const unread = summary.unreadConversations + summary.unreadAnnouncements

  return (
    <ParentPageShell
      title="Messages"
      subtitle="School and class announcements, and your conversations with teachers."
      badge={
        unread > 0
          ? {
              icon: summary.unreadAnnouncements >= summary.unreadConversations ? MegaphoneIcon : ChatBubbleLeftRightIcon,
              label: `${unread} unread`,
            }
          : undefined
      }
    >
      <Suspense fallback={<div className="h-[520px] rounded-2xl border border-stone-200/70 bg-white" />}>
        <ParentMessagesBody studentId={studentId} />
      </Suspense>
    </ParentPageShell>
  )
}

export default ParentMessagesPage
