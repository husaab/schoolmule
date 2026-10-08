'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BellSlashIcon,
  BellIcon,
  CheckCircleIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline'
import type { Message, SenderRole, Thread } from '@/services/types/messaging'
import {
  deleteMessage,
  editMessage,
  getConversation,
  markRead,
  postMessage,
  setMuted,
  setStatus,
} from '@/services/messagingService'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import Composer from './Composer'
import MessageBubble from './MessageBubble'
import ThreadContextCard from './ThreadContextCard'
import { displayName, formatDayLabel, othersLabel } from './formatters'
import { toneClasses, type Tone } from './tones'

interface ConversationThreadProps {
  conversationId: string
  tone: Tone
  role: SenderRole
  /** Fired after anything that changes the list (a send, a resolve, a read). */
  onChanged?: () => void
  /** Mobile: go back to the list. */
  onBack?: () => void
}

const REFRESH_MS = 15_000
const EDIT_WINDOW_MS = 15 * 60 * 1000

type Row = { kind: 'day'; label: string; key: string } | { kind: 'msg'; message: Message }

/** Group messages under day labels so a long thread still reads in time. */
const toRows = (messages: Message[]): Row[] => {
  const rows: Row[] = []
  let lastDay = ''
  for (const m of messages) {
    const day = formatDayLabel(m.createdAt)
    if (day !== lastDay) {
      rows.push({ kind: 'day', label: day, key: `day-${m.messageId}` })
      lastDay = day
    }
    rows.push({ kind: 'msg', message: m })
  }
  return rows
}

/**
 * Right pane of the inbox: header, score strip, bubbles, composer. Marks the
 * thread read on open and whenever the tab comes back, and re-fetches every
 * 15 s while mounted — the cheapest thing that keeps two people in sync
 * without realtime.
 */
const ConversationThread: React.FC<ConversationThreadProps> = ({ conversationId, tone, role, onChanged, onBack }) => {
  const t = toneClasses(tone)
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const bump = useMessagingStore((s) => s.bump)

  const [thread, setThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef(0)

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const res = await getConversation(conversationId)
        if (res.status === 'success' && res.data) {
          setThread(res.data)
          setError(null)
        } else {
          setError(res.message || 'Could not load this conversation')
        }
      } catch (err) {
        if (!silent) setError(err instanceof Error ? err.message : 'Could not load this conversation')
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [conversationId],
  )

  const read = useCallback(async () => {
    try {
      await markRead(conversationId)
      void bump()
      onChanged?.()
    } catch {
      // Read marks are best-effort.
    }
  }, [conversationId, bump, onChanged])

  // Open: load, then mark read. Thereafter poll quietly and re-mark read
  // when new messages land while the tab is visible.
  useEffect(() => {
    let cancelled = false
    setThread(null)
    lastCountRef.current = 0
    void load().then(() => {
      if (!cancelled) void read()
    })
    const timer = setInterval(() => {
      if (!document.hidden) void load(true)
    }, REFRESH_MS)
    const onVisible = () => {
      if (!document.hidden) {
        void load(true)
        void read()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load, read])

  // New messages from the other side arrived during a poll: mark read again
  // and scroll down.
  useEffect(() => {
    if (!thread) return
    const count = thread.messages.length
    if (count > lastCountRef.current) {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
      if (lastCountRef.current > 0 && !document.hidden) void read()
    }
    lastCountRef.current = count
  }, [thread, read])

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const rows = useMemo(() => (thread ? toRows(thread.messages) : []), [thread])
  const isStaff = role !== 'PARENT'
  const others = thread ? othersLabel(thread.participants, user.id || null) : ''

  const send = async ({ body, files }: { body: string; files: File[] }) => {
    const res = await postMessage(conversationId, { body, files })
    if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not send message')
    setThread(res.data)
    void bump()
    onChanged?.()
  }

  const edit = async (message: Message, body: string) => {
    try {
      const res = await editMessage(conversationId, message.messageId, body)
      if (res.status !== 'success') throw new Error(res.message)
      await load(true)
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not edit message', 'error')
      throw err
    }
  }

  const remove = async (message: Message) => {
    try {
      const res = await deleteMessage(conversationId, message.messageId)
      if (res.status !== 'success') throw new Error(res.message)
      await load(true)
      onChanged?.()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not remove message', 'error')
    }
  }

  const toggleStatus = async () => {
    if (!thread) return
    const next = thread.conversation.status === 'resolved' ? 'open' : 'resolved'
    try {
      await setStatus(conversationId, next)
      await load(true)
      onChanged?.()
      showNotification(next === 'resolved' ? 'Conversation resolved' : 'Conversation reopened', 'success')
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not update conversation', 'error')
    }
  }

  const toggleMute = async () => {
    if (!thread) return
    setMenuOpen(false)
    try {
      const res = await setMuted(conversationId, !thread.muted)
      if (res.status === 'success' && res.data) setThread({ ...thread, muted: res.data.muted })
      showNotification(thread.muted ? 'Email notifications on for this conversation' : 'Email notifications off for this conversation', 'success')
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not update conversation', 'error')
    }
  }

  if (loading && !thread) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <ArrowPathIcon className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    )
  }
  if (error || !thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm text-slate-600">{error || 'Conversation not found'}</p>
        {onBack && (
          <button type="button" onClick={onBack} className={`rounded-xl px-3 py-1.5 text-xs ${t.secondary} cursor-pointer`}>
            Back to messages
          </button>
        )}
      </div>
    )
  }

  const { conversation, context, participants } = thread
  const resolved = conversation.status === 'resolved'

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className={`flex items-start gap-3 border-b px-4 py-3.5 sm:px-5 ${t.divider}`}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to messages"
            className="mt-0.5 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden cursor-pointer"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-slate-900">
              {isStaff ? `${conversation.studentName} · ${conversation.title}` : conversation.title}
            </h2>
            <span
              className={`rounded-full border px-2 py-px text-[10px] font-medium ${
                resolved ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {resolved ? 'Resolved' : 'Open'}
            </span>
          </div>
          <p className="truncate text-xs text-slate-500">
            {isStaff ? `${conversation.classSubject} · with ` : `About ${conversation.studentName.split(' ')[0]} · ${conversation.classSubject} · with `}
            {participants
              .filter((p) => p.userId !== user.id)
              .map((p) => displayName(p))
              .join(', ') || 'no one else yet'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isStaff && (
            <button
              type="button"
              onClick={toggleStatus}
              className={`hidden items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium sm:inline-flex ${t.secondary} cursor-pointer`}
            >
              <CheckCircleIcon className={`h-4 w-4 ${resolved ? 'text-slate-400' : 'text-emerald-500'}`} />
              {resolved ? 'Reopen' : 'Mark resolved'}
            </button>
          )}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label="Conversation options"
              onClick={() => setMenuOpen((v) => !v)}
              className={`rounded-xl p-1.5 ${t.secondary} cursor-pointer`}
            >
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {isStaff && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      void toggleStatus()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 sm:hidden cursor-pointer"
                  >
                    <CheckCircleIcon className="h-4 w-4 text-slate-400" /> {resolved ? 'Reopen' : 'Mark resolved'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {thread.muted ? <BellIcon className="h-4 w-4 text-slate-400" /> : <BellSlashIcon className="h-4 w-4 text-slate-400" />}
                  {thread.muted ? 'Email me about this conversation' : 'Stop emailing me about this conversation'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context */}
      <div className="px-4 pt-3 sm:px-5">
        <ThreadContextCard
          context={context}
          title={conversation.title}
          classId={conversation.classId}
          classSubject={conversation.classSubject}
          tone={tone}
          role={role}
        />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-4 sm:px-5">
        {rows.map((row) =>
          row.kind === 'day' ? (
            <div key={row.key} className="flex justify-center">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500">{row.label}</span>
            </div>
          ) : row.message.kind === 'system' ? (
            <p key={row.message.messageId} className="text-center text-[11px] italic text-slate-400">
              {row.message.body}
            </p>
          ) : (
            <MessageBubble
              key={row.message.messageId}
              message={row.message}
              mine={row.message.senderId === user.id}
              tone={tone}
              canEdit={
                row.message.senderId === user.id && Date.now() - new Date(row.message.createdAt).getTime() < EDIT_WINDOW_MS
              }
              canDelete={row.message.senderId === user.id || role === 'ADMIN'}
              onEdit={(body) => edit(row.message, body)}
              onDelete={() => remove(row.message)}
            />
          ),
        )}
      </div>

      {/* Composer */}
      <div className={`border-t px-4 py-3 sm:px-5 ${t.divider}`}>
        {resolved && (
          <p className="mb-2 text-[11px] text-slate-500">This conversation is resolved. Sending a message reopens it.</p>
        )}
        <Composer
          tone={tone}
          placeholder={others ? `Reply to ${others}…` : 'Write a message…'}
          recipientsLabel={others ? `${others} will be emailed` : undefined}
          onSend={send}
          compact
        />
      </div>
    </div>
  )
}

export default ConversationThread
