'use client'

import React from 'react'
import { ChatBubbleLeftRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { ConversationItem, SenderRole } from '@/services/types/messaging'
import { formatListStamp, initials } from './formatters'
import { toneClasses, type Tone } from './tones'

export type ListView = 'open' | 'needsReply' | 'resolved'

interface ConversationListProps {
  items: ConversationItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  view: ListView
  onViewChange: (v: ListView) => void
  query: string
  onQueryChange: (q: string) => void
  tone: Tone
  role: SenderRole
  loading: boolean
  /** Extra controls under the search box (class picker, child pills). */
  headerSlot?: React.ReactNode
  emptyHint?: string
}

const VIEWS: { value: ListView; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'needsReply', label: 'Needs reply' },
  { value: 'resolved', label: 'Resolved' },
]

const Row: React.FC<{
  item: ConversationItem
  selected: boolean
  onSelect: () => void
  tone: Tone
  role: SenderRole
}> = ({ item, selected, onSelect, tone, role }) => {
  const t = toneClasses(tone)
  const unread = item.unreadCount > 0
  const isParent = role === 'PARENT'
  // Parents read the thread as "about my child with this teacher";
  // staff read it as "this student, these guardians".
  const general = item.kind === 'general'
  const headline = isParent ? item.title : `${item.studentName} · ${item.title}`
  const meta = isParent
    ? [item.studentName.split(' ')[0], general ? item.leadTeacherName : item.classSubject, general ? item.classSubject : item.leadTeacherName].filter(Boolean).join(' · ')
    : [general ? 'General' : item.classSubject, item.lastMessage?.senderRole === 'PARENT' ? item.lastMessage.senderName : null].filter(Boolean).join(' · ')
  const snippet = item.lastMessage
    ? item.lastMessage.deleted
      ? 'Message removed'
      : item.lastMessage.kind === 'system'
        ? item.lastMessage.body ?? ''
        : `${item.lastMessage.senderRole === role && item.lastMessage.senderRole !== 'PARENT' ? 'You: ' : ''}${item.lastMessage.body ?? ''}`
    : ''

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors ${t.divider} ${
        selected ? t.rowSelected : 'hover:bg-slate-50/70'
      } cursor-pointer`}
    >
      {selected && <span className={`absolute inset-y-0 left-0 w-0.5 ${t.rowSelectedBar}`} aria-hidden />}
      {isParent ? (
        <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${unread ? t.badge : 'bg-slate-200'}`} aria-hidden />
      ) : (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {initials(item.studentName)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-sm ${unread ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>{headline}</span>
          <span className="flex-shrink-0 text-[11px] text-slate-400">{formatListStamp(item.lastMessageAt)}</span>
        </span>
        <span className="block truncate text-xs text-slate-500">{meta}</span>
        <span className="mt-0.5 flex items-center gap-1.5">
          {item.needsReply && item.status === 'open' && (
            <span className={`flex-shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium ${t.chipActive}`}>
              Needs reply
            </span>
          )}
          {item.status === 'resolved' && (
            <span className="flex-shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-px text-[10px] font-medium text-emerald-700">
              Resolved
            </span>
          )}
          {item.emailFailed && (
            <span className="flex-shrink-0 rounded-full border border-rose-200 bg-rose-50 px-1.5 py-px text-[10px] font-medium text-rose-700">
              Email failed
            </span>
          )}
          <span className={`truncate text-xs ${unread ? 'text-slate-700' : 'text-slate-500'}`}>{snippet}</span>
        </span>
      </span>
      {!isParent && unread && (
        <span className={`mt-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${t.badge}`}>
          {item.unreadCount}
        </span>
      )}
    </button>
  )
}

/**
 * Left pane of the inbox: search, three views, and the rows. The parent
 * variant leads with the assessment name; the staff variant leads with the
 * student, because that is how each side thinks about the thread.
 */
const ConversationList: React.FC<ConversationListProps> = ({
  items,
  selectedId,
  onSelect,
  view,
  onViewChange,
  query,
  onQueryChange,
  tone,
  role,
  loading,
  headerSlot,
  emptyHint,
}) => {
  const t = toneClasses(tone)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`space-y-2.5 border-b p-3 ${t.divider}`}>
        <label className="relative block">
          <span className="sr-only">Search conversations</span>
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={role === 'PARENT' ? 'Search by teacher, class or assessment' : 'Search student, class or assessment'}
            className={`h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${t.focus}`}
          />
        </label>
        {headerSlot}
        <div className="flex gap-1.5">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => onViewChange(v.value)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors cursor-pointer ${view === v.value ? t.chipActive : t.chipIdle}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              {view === 'resolved' ? 'Nothing resolved yet' : view === 'needsReply' ? 'Nothing waiting on you' : 'No conversations yet'}
            </p>
            {emptyHint && <p className="mt-1 text-xs text-slate-500">{emptyHint}</p>}
          </div>
        ) : (
          items.map((item) => (
            <Row
              key={item.conversationId}
              item={item}
              selected={item.conversationId === selectedId}
              onSelect={() => onSelect(item.conversationId)}
              tone={tone}
              role={role}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ConversationList
