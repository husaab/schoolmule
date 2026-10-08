'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { listConversations } from '@/services/messagingService'
import type { ConversationItem } from '@/services/types/messaging'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { formatListStamp } from '@/components/messaging/formatters'
import { childColor, childInitial } from './childColors'

/**
 * Dashboard card: the latest conversations across every child, unread
 * first. Quiet when there is nothing to show — a parent who has never
 * messaged gets one line inviting them to, not an empty box.
 */
const MessagesCard: React.FC<{ limit?: number }> = ({ limit = 3 }) => {
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const [result, setResult] = useState<{ year: string | null; items: ConversationItem[] } | null>(null)

  useEffect(() => {
    let cancelled = false
    listConversations({ status: 'open', limit: 20 })
      .then((res) => {
        if (cancelled) return
        const items = (res.data ?? []).sort((a, b) => Number(b.unreadCount > 0) - Number(a.unreadCount > 0))
        setResult({ year: selectedYearId, items: items.slice(0, limit) })
      })
      .catch(() => !cancelled && setResult({ year: selectedYearId, items: [] }))
    return () => {
      cancelled = true
    }
  }, [selectedYearId, limit])

  const items = result?.items ?? []
  const unread = items.reduce((n, c) => n + c.unreadCount, 0)

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-5 mb-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-amber-500" />
          Messages
          {unread > 0 && (
            <span className="rounded-full bg-amber-700 px-2 py-px text-[10px] font-semibold text-white">{unread} new</span>
          )}
        </h3>
        <Link href="/parent/messages" className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900">
          See all <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>

      {result === null ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">
          No conversations yet. Open{' '}
          <Link href="/parent/grades" className="font-medium text-amber-700">
            Grades
          </Link>{' '}
          and choose “Ask the teacher” on any assessment.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((c) => {
            const color = childColor(c.studentId)
            return (
              <li key={c.conversationId}>
                <Link
                  href={`/parent/messages?thread=${encodeURIComponent(c.conversationId)}`}
                  className="flex items-center gap-3 py-2.5 hover:bg-stone-50/60 -mx-2 px-2 rounded-xl"
                >
                  <span
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.solid} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
                    title={c.studentName}
                  >
                    {childInitial(c.studentName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${c.unreadCount > 0 ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
                      {c.title}
                      <span className="text-slate-400 font-normal"> · {c.leadTeacherName ?? c.classSubject}</span>
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {c.lastMessage?.deleted ? 'Message removed' : c.lastMessage?.body ?? ''}
                    </span>
                  </span>
                  <span className="flex-shrink-0 text-[11px] text-slate-400">{formatListStamp(c.lastMessageAt)}</span>
                  {c.unreadCount > 0 && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-600" />}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default MessagesCard
