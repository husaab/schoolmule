'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChatBubbleLeftRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { listConversations } from '@/services/messagingService'
import type { ConversationItem, ListFilters, SenderRole, Thread } from '@/services/types/messaging'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import ConversationList, { type ListView } from './ConversationList'
import ConversationThread from './ConversationThread'
import NewConversationModal from './NewConversationModal'
import { toneClasses, type Tone } from './tones'

interface MessagingInboxProps {
  tone: Tone
  role: SenderRole
  /** Filters the page imposes (a parent's selected child, a class). */
  fixedFilters?: Pick<ListFilters, 'classId' | 'studentId'>
  /** Extra controls under the search box. */
  listHeaderSlot?: React.ReactNode
  /** Staff: scope the "New message" picker to one class. */
  newMessageClassId?: string
  /** Hide the New message button (admin oversight). */
  hideNewMessage?: boolean
  emptyHint?: string
}

const LIST_REFRESH_MS = 30_000

/**
 * The two-pane inbox shared by the staff and parent pages. The open thread
 * lives in the URL (?thread=) so emails and chips can deep-link straight to
 * it. On phones only one pane shows at a time.
 */
const MessagingInbox: React.FC<MessagingInboxProps> = ({
  tone,
  role,
  fixedFilters,
  listHeaderSlot,
  newMessageClassId,
  hideNewMessage = false,
  emptyHint,
}) => {
  const t = toneClasses(tone)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const bump = useMessagingStore((s) => s.bump)

  const threadId = searchParams.get('thread')
  const [items, setItems] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ListView>('open')
  const [query, setQuery] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const debounced = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    if (debounced.current) clearTimeout(debounced.current)
    debounced.current = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => {
      if (debounced.current) clearTimeout(debounced.current)
    }
  }, [query])

  const filters = useMemo<ListFilters>(
    () => ({
      status: view === 'resolved' ? 'resolved' : 'open',
      q: debouncedQuery || undefined,
      classId: fixedFilters?.classId,
      studentId: fixedFilters?.studentId,
      limit: 100,
    }),
    [view, debouncedQuery, fixedFilters?.classId, fixedFilters?.studentId],
  )

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const res = await listConversations(filters)
        setItems(res.status === 'success' && res.data ? res.data : [])
      } catch {
        if (!silent) setItems([])
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [filters],
  )

  useEffect(() => {
    void load()
    const timer = setInterval(() => {
      if (!document.hidden) void load(true)
    }, LIST_REFRESH_MS)
    return () => clearInterval(timer)
  }, [load, selectedYearId])

  const visible = useMemo(
    () => (view === 'needsReply' ? items.filter((i) => i.needsReply) : items),
    [items, view],
  )

  const setThread = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id) params.set('thread', id)
      else params.delete('thread')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const onChanged = useCallback(() => {
    void load(true)
    void bump()
  }, [load, bump])

  const onCreated = (thread: Thread) => {
    setNewOpen(false)
    setView('open')
    setThread(thread.conversation.conversationId)
    void load(true)
  }

  const showList = !threadId
  const showThread = Boolean(threadId)

  return (
    <>
      <div className={`flex h-[calc(100vh-13rem)] min-h-[520px] overflow-hidden ${t.card}`}>
        {/* List pane */}
        <div className={`${showList ? 'flex' : 'hidden'} w-full flex-col lg:flex lg:w-[360px] lg:flex-shrink-0 lg:border-r ${t.divider}`}>
          {!hideNewMessage && (
            <div className={`flex items-center justify-between border-b px-3 py-2.5 ${t.divider}`}>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Conversations</span>
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${t.primary} cursor-pointer`}
              >
                <PlusIcon className="h-3.5 w-3.5" /> New message
              </button>
            </div>
          )}
          <ConversationList
            items={visible}
            selectedId={threadId}
            onSelect={setThread}
            view={view}
            onViewChange={setView}
            query={query}
            onQueryChange={setQuery}
            tone={tone}
            role={role}
            loading={loading}
            headerSlot={listHeaderSlot}
            emptyHint={emptyHint}
          />
        </div>

        {/* Thread pane */}
        <div className={`${showThread ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col lg:flex`}>
          {threadId ? (
            <ConversationThread
              key={threadId}
              conversationId={threadId}
              tone={tone}
              role={role}
              onChanged={onChanged}
              onBack={() => setThread(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
              <ChatBubbleLeftRightIcon className="h-10 w-10 text-slate-200" />
              <p className="text-sm font-medium text-slate-600">Pick a conversation</p>
              <p className="max-w-xs text-xs text-slate-400">
                {role === 'PARENT'
                  ? 'Every conversation stays linked to the assessment it is about, so the score is always right beside the chat.'
                  : 'Threads are grouped by student and assessment. Resolve one when it is handled; a new reply reopens it.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {!hideNewMessage && (
        <NewConversationModal
          isOpen={newOpen}
          onClose={() => setNewOpen(false)}
          tone={tone}
          role={role}
          classId={newMessageClassId}
          onCreated={onCreated}
        />
      )}
    </>
  )
}

export default MessagingInbox
