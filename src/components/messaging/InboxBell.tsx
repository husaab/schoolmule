'use client'

// Navbar messages button, reachable from anywhere in the app. Shows the
// unread count and, when opened, the latest unread or waiting threads with
// a jump into the right inbox for the caller's role. Also the one place that
// starts the shared unread poll, since the navbar is on every page.

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { listConversations } from '@/services/messagingService'
import type { ConversationItem } from '@/services/types/messaging'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useUserStore } from '@/store/useUserStore'
import { formatListStamp } from './formatters'

export const inboxPathFor = (role: string | null | undefined) => (role === 'PARENT' ? '/parent/messages' : '/messages')

const InboxBell: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const summary = useMessagingStore((s) => s.summary)
  const startPolling = useMessagingStore((s) => s.startPolling)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user?.id || !user.isVerifiedEmail || !user.isVerifiedSchool) return
    startPolling()
  }, [user?.id, user?.isVerifiedEmail, user?.isVerifiedSchool, startPolling])

  const loadRecent = () => {
    setLoading(true)
    listConversations({ status: 'open', limit: 25 })
      .then((res) => {
        const all = res.data ?? []
        const unread = all.filter((c) => c.unreadCount > 0 || c.needsReply)
        setItems((unread.length ? unread : all).slice(0, 5))
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (!user?.id) return null

  const isParent = user.role === 'PARENT'
  const inbox = inboxPathFor(user.role)
  const count = summary.unreadConversations
  const label = count > 0 ? `Messages, ${count} unread` : 'Messages'

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => {
          if (!open) loadRecent()
          setOpen((v) => !v)
        }}
        aria-label={label}
        title={label}
        className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
        {count > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white ${
              isParent ? 'bg-amber-700' : 'bg-cyan-600'
            }`}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-40">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Messages</p>
            <Link href={inbox} onClick={() => setOpen(false)} className={`text-xs font-medium ${isParent ? 'text-amber-700' : 'text-cyan-700'}`}>
              Open inbox
            </Link>
          </div>
          {loading && items.length === 0 ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-500">You’re all caught up.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((c) => (
                <li key={c.conversationId}>
                  <Link
                    href={`${inbox}?thread=${encodeURIComponent(c.conversationId)}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${c.unreadCount > 0 ? (isParent ? 'bg-amber-600' : 'bg-cyan-600') : 'bg-slate-200'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {isParent ? `${c.leadTeacherName ?? c.classSubject} · ${c.title}` : `${c.studentName} · ${c.title}`}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {c.lastMessage?.deleted ? 'Message removed' : c.lastMessage?.body ?? ''}
                      </span>
                      <span className="block text-[11px] text-slate-400">{formatListStamp(c.lastMessageAt)}</span>
                    </span>
                    <ArrowRightIcon className="mt-1 h-4 w-4 flex-shrink-0 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default InboxBell
