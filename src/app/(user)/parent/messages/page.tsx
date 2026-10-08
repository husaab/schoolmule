'use client'

// Parent inbox. The child pills in the toolbar drive the same selected-child
// store as the sidebar, so "All children" vs one child filters the list.

import React, { Suspense } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ChildFilterPills from '@/components/parent/ChildFilterPills'
import MessagingInbox from '@/components/messaging/MessagingInbox'
import { ALL_CHILDREN, useSelectedChildStore } from '@/store/useSelectedChildStore'
import { useMessagingStore } from '@/store/useMessagingStore'

const ParentMessagesPage: React.FC = () => {
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId)
  const summary = useMessagingStore((s) => s.summary)
  const studentId = selectedChildId === ALL_CHILDREN ? undefined : selectedChildId

  return (
    <ParentPageShell
      title="Messages"
      subtitle="Ask a teacher about a mark, share something from home, keep the whole conversation in one place."
      badge={
        summary.unreadConversations > 0
          ? { icon: ChatBubbleLeftRightIcon, label: `${summary.unreadConversations} unread` }
          : undefined
      }
    >
      <Suspense fallback={<div className="h-[520px] rounded-2xl border border-stone-200/70 bg-white" />}>
        <MessagingInbox
          tone="parent"
          role="PARENT"
          fixedFilters={studentId ? { studentId } : undefined}
          listHeaderSlot={<ChildFilterPills />}
          emptyHint="Open Grades and choose “Ask the teacher” on any assessment, or use New message."
        />
      </Suspense>
    </ParentPageShell>
  )
}

export default ParentMessagesPage
