'use client'

import React from 'react'
import Link from 'next/link'
import { ChatBubbleLeftRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import { formatListStamp } from '@/components/messaging/formatters'
import type { ConversationItem } from '@/services/types/messaging'
import { Card, EmptyState } from './ui'

interface MessagesTabProps {
  threads: ConversationItem[] | null
  loading: boolean
  error: string | null
  isAdmin: boolean
  archived: boolean
  onNew: () => void
}

const MessagesTab: React.FC<MessagesTabProps> = ({ threads, loading, error, isAdmin, archived, onNew }) => (
  <Card
    title="Conversations with guardians"
    subtitle={isAdmin ? 'Every thread about this student' : 'Threads on your classes and homeroom'}
    action={
      !archived && (
        <button
          onClick={onNew}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600"
        >
          <PlusIcon className="h-4 w-4" />
          New message
        </button>
      )
    }
    flush
  >
    {loading && !threads ? (
      <div className="flex justify-center py-10">
        <Spinner size="md" />
      </div>
    ) : error ? (
      <p className="px-6 pb-6 text-sm text-rose-600">{error}</p>
    ) : !threads || threads.length === 0 ? (
      <EmptyState icon={ChatBubbleLeftRightIcon} title="No conversations yet">
        Messages between teachers and this student&apos;s guardians will show up here.
      </EmptyState>
    ) : (
      <ul className="divide-y divide-slate-50 pb-2">
        {threads.map((t) => (
          <li key={t.conversationId}>
            <Link
              href={`/messages?thread=${encodeURIComponent(t.conversationId)}`}
              className="flex items-start justify-between gap-4 px-6 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <span className="truncate">{t.title}</span>
                  {t.unreadCount > 0 && (
                    <span className="flex-shrink-0 rounded-full bg-cyan-500 px-1.5 text-[11px] font-semibold text-white">{t.unreadCount}</span>
                  )}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {t.classSubject}
                  {t.leadTeacherName ? ` · ${t.leadTeacherName}` : ''}
                  {t.termName ? ` · ${t.termName}` : ''}
                </p>
                {t.lastMessage?.body && (
                  <p className="mt-1 truncate text-sm text-slate-600">
                    {t.lastMessage.senderName ? <span className="font-medium text-slate-700">{t.lastMessage.senderName}: </span> : null}
                    {t.lastMessage.body}
                  </p>
                )}
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-slate-400">{formatListStamp(t.lastMessageAt)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    t.status === 'resolved' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {t.status === 'resolved' ? 'Resolved' : 'Open'}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </Card>
)

export default MessagesTab
