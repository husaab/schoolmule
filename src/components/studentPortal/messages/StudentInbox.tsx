// src/components/studentPortal/messages/StudentInbox.tsx
// The student's Messages page body (Student-Messages board): the conversations
// on the left, and on the right the open one, the new-message form, or a prompt.
// The open conversation and the new-message form live in the URL: `thread`,
// and `compose` with `teacher` and `class` (the last three are transient, set
// by a class page's "Message {teacher}" link). Below xl only one side shows at a
// time. The list looks again every 30 s while the tab is visible and when it
// comes back; the open thread polls itself.
'use client'

import { useCallback, useEffect } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import LoadError from '@/components/classroom/LoadError'
import { refreshMessagesBadge } from '@/components/studentPortal/useStudentBadges'
import { useStudentClasses } from '@/components/studentPortal/useStudentClasses'
import type { FilterParams } from '@/hooks/useFilterParams'
import { useLoad } from '@/hooks/useLoad'
import { composePatch } from '@/lib/studentMessages'
import { listStudentConversations, getStudentMessageTargets } from '@/services/studentMessagingService'
import type { Thread } from '@/services/types/messaging'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import NewStudentMessage from './NewStudentMessage'
import StudentThread from './StudentThread'
import StudentThreadList from './StudentThreadList'

const LIST_REFRESH_MS = 30_000

interface StudentInboxProps {
  filters: FilterParams
  userId: string
  previewing: boolean
}

export default function StudentInbox({ filters, userId, previewing }: StudentInboxProps) {
  const yearId = useSchoolYearStore((s) => s.selectedYearId)
  const { classes } = useStudentClasses()
  const { get, setParams } = filters
  const threadId = get('thread') || null
  const composing = get('compose') === '1'

  const list = useLoad(`student-threads:${userId}:${yearId ?? ''}`, () => listStudentConversations({ limit: 100 }).then((r) => r.data.items))
  const targets = useLoad(`student-targets:${userId}:${yearId ?? ''}`, () => getStudentMessageTargets().then((r) => r.data))
  const reloadList = list.reload

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') reloadList()
    }, LIST_REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') reloadList()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reloadList])

  const openThread = useCallback((id: string) => setParams({ thread: id, compose: null, teacher: null, class: null }), [setParams])
  const closePane = useCallback(() => setParams({ thread: null, compose: null, teacher: null, class: null }), [setParams])
  const onChanged = useCallback(() => reloadList(), [reloadList])
  const onRead = useCallback(() => void refreshMessagesBadge(userId), [userId])

  const onSent = (thread: Thread) => {
    reloadList()
    onRead()
    openThread(thread.conversation.conversationId)
  }

  const items = list.data ?? []
  const showRight = composing || Boolean(threadId)

  return (
    <div className="flex h-[calc(100dvh-11.5rem)] min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white md:h-[calc(100dvh-9.5rem)]">
      <nav
        aria-label="Conversations"
        className={`${showRight ? 'hidden' : 'flex'} w-full flex-col overflow-y-auto xl:flex xl:w-[360px] xl:shrink-0 xl:border-r xl:border-slate-200`}
      >
        {list.error && !list.data ? (
          <div className="p-5">
            <LoadError title="We couldn't load your messages" message={list.error.message} onRetry={list.reload} />
          </div>
        ) : !list.data ? (
          <div className="flex flex-col gap-3 p-4" aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <ChatBubbleLeftRightIcon className="h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="text-[15px] font-medium text-slate-800">No messages yet</p>
            <p className="max-w-xs text-sm text-slate-500">Ask a teacher a question, or tell your teacher something. Your parents will be in the conversation too.</p>
            <button
              type="button"
              onClick={() => setParams(composePatch())}
              className="min-h-11 cursor-pointer rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Message a teacher
            </button>
          </div>
        ) : (
          <StudentThreadList
            items={items}
            teachers={targets.data?.teachers ?? null}
            classes={classes}
            selectedId={composing ? null : threadId}
            userId={userId}
            onSelect={openThread}
          />
        )}
      </nav>

      <section className={`${showRight ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col overflow-y-auto bg-slate-50 xl:flex`}>
        {composing ? (
          <NewStudentMessage
            targets={targets.data}
            error={targets.error?.message ?? null}
            onRetry={targets.reload}
            teacherId={get('teacher') || null}
            classId={get('class') || null}
            onPick={({ teacherId, classId }) => setParams({ teacher: teacherId, class: classId })}
            onCancel={closePane}
            onSent={onSent}
            previewing={previewing}
          />
        ) : threadId ? (
          <StudentThread
            key={threadId}
            conversationId={threadId}
            userId={userId}
            classes={classes}
            previewing={previewing}
            onChanged={onChanged}
            onRead={onRead}
            onBack={closePane}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
            <ChatBubbleLeftRightIcon className="h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="text-[15px] font-medium text-slate-700">Pick a conversation</p>
            <p className="max-w-xs text-sm text-slate-500">Or press Message a teacher to start a new one.</p>
          </div>
        )}
      </section>
    </div>
  )
}
