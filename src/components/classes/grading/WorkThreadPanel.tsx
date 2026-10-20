// src/components/classes/grading/WorkThreadPanel.tsx
// "Messages about this work · {first} and parents" (Teacher-Grading board):
// the private thread anchored to this student's work. Sending ensures the
// thread (POST …/students/:studentId/thread) and then posts through the
// existing messaging API, so the student, the guardians (unless the school
// hides work threads from parents) and the class's teachers all get it.
//
//  - The submission names an existing thread (`stub`); the panel loads it and
//    marks it read for the teacher, and looks again every 20 s while the tab is
//    visible, so a student's question shows up without a reload.
//  - A thread can only start on work that is posted (the server answers 409
//    ITEM_NOT_POSTED): on a draft or scheduled item the panel says so up front
//    instead of letting a message fail. A thread that already exists always
//    takes replies.
//  - The student's messages read in indigo, with "(Student)" beside the name.
//    System lines ("{admin} joined the conversation", "marked this conversation
//    resolved") are notices, a centred italic line like the full conversation,
//    and the list opens on (and follows) the newest message.
//  - Editing and removing a message, resolving the thread and muting it live in
//    the full conversation, one link away.
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import { bubbleKind, parentsAbsent, senderLabelOf } from '@/components/messaging/formatters'
import { toneClasses } from '@/components/messaging/tones'
import { useLoad } from '@/hooks/useLoad'
import { isApiError } from '@/services/apiClient'
import { ensureItemThread } from '@/services/gradingService'
import { getConversation, markRead, postMessage } from '@/services/messagingService'
import type { ItemThreadStub } from '@/services/types/grading'
import type { Message, Thread } from '@/services/types/messaging'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useUserStore } from '@/store/useUserStore'

interface WorkThreadPanelProps {
  itemId: string
  studentId: string
  first: string
  /** Guardians read work threads (the school's setting). */
  includesParents: boolean
  /** The item is live for students (posted, or scheduled and its time has come). */
  itemLive: boolean
  /** From the submission; null when no thread exists yet. */
  stub: ItemThreadStub | null
  disabled: boolean
}

const REFRESH_MS = 20_000
const TZ = 'America/Toronto'
const staff = toneClasses('staff')

const whenText = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: '2-digit' })
    .format(new Date(iso))
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ ?([AP]M)$/i, (_, ap: string) => ` ${ap.toLowerCase()}`)

/** Said where a thread cannot start yet; the server's own words for it are the same. */
const NOT_POSTED_NOTE = 'Post this work before messaging students about it.'

const bubbleFor = (m: Message, mine: boolean): string =>
  mine ? staff.bubbleMine : { student: staff.bubbleStudent, parent: staff.bubbleParent, other: staff.bubbleTheirs }[bubbleKind(m)]

export default function WorkThreadPanel({ itemId, studentId, first, includesParents, itemLive, stub, disabled }: WorkThreadPanelProps) {
  const userId = useUserStore((s) => s.user.id)
  const bump = useMessagingStore((s) => s.bump)
  // The thread this panel shows: the one the submission names (it arrives
  // after the panel opens), or the one the first message just created.
  const [createdId, setCreatedId] = useState<string | null>(null)
  const conversationId = createdId ?? stub?.conversationId ?? null
  // The thread a first message just started, until the panel has loaded it.
  const [started, setStarted] = useState<Message[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  // The server refused to start a thread on unposted work (the item changed under the page).
  const [refusedNotPosted, setRefusedNotPosted] = useState(false)

  const thread = useLoad<Thread>(conversationId, () => getConversation(conversationId as string).then((r) => r.data as Thread))
  const { reload, patch } = thread
  const messages = (thread.data?.messages ?? started ?? []).filter((m) => !m.deletedAt)
  const withParents = thread.data ? !parentsAbsent(thread.data.participants) : includesParents

  // Opening the panel reads the thread (and clears the teacher's unread count);
  // a new last message does the same once.
  const lastId = thread.data?.messages[thread.data.messages.length - 1]?.messageId ?? null
  const readFor = useRef<string | null>(null)
  useEffect(() => {
    if (!conversationId || !thread.data) return
    const mark = `${conversationId}:${lastId ?? ''}`
    if (readFor.current === mark) return
    readFor.current = mark
    void markRead(conversationId).then(() => bump(), () => {})
  }, [conversationId, thread.data, lastId, bump])

  // Show the newest message when the thread opens and when one arrives, so a just-sent
  // reply never sits below the fold of the short list.
  const listRef = useRef<HTMLUListElement>(null)
  const count = messages.length
  const lastCount = useRef(0)
  useEffect(() => {
    if (count > lastCount.current) {
      const el = listRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
    lastCount.current = count
  }, [count])

  // A student may have written: look again while the tab is visible, and when it comes back.
  useEffect(() => {
    if (!conversationId) return
    const tick = () => {
      if (document.visibilityState === 'visible') reload()
    }
    const timer = setInterval(tick, REFRESH_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [conversationId, reload])

  const cannotStart = !conversationId && (!itemLive || refusedNotPosted)
  const inert = disabled || cannotStart

  const send = async () => {
    const body = text.trim()
    if (!body || sending || inert) return
    setSending(true)
    setProblem(null)
    try {
      const id = conversationId ?? (await ensureItemThread(itemId, studentId)).data.conversationId
      setCreatedId(id)
      const res = await postMessage(id, { body })
      if (res.status !== 'success' || !res.data) throw new Error(res.message || "The message didn't send.")
      const all = res.data.messages
      if (thread.data) {
        patch(() => res.data as Thread)
        reload() // also drops a poll that was already on its way with the thread as it was before this message
      } else setStarted(all)
      setText('')
    } catch (err) {
      if (isApiError(err) && err.code === 'ITEM_NOT_POSTED') {
        // The panel now says it where the messages go (and the box is off): no second line for the same words.
        setRefusedNotPosted(true)
      } else {
        setProblem(err instanceof Error && err.message ? err.message : "The message didn't send.")
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="flex flex-col gap-2.5 border-t border-slate-100 pt-3.5">
      <h3 className="text-sm font-semibold text-slate-900">
        Messages about this work{' '}
        <span className="font-normal text-slate-500">· {withParents ? `${first} and parents` : first}</span>
      </h3>

      {thread.error && !thread.data && messages.length === 0 ? (
        <p className="text-[13px] text-rose-700">
          The messages couldn&apos;t load.{' '}
          <button type="button" onClick={reload} className="cursor-pointer font-semibold underline underline-offset-2">
            Try again
          </button>
        </p>
      ) : thread.loading && messages.length === 0 ? (
        <p className="text-[13px] text-slate-500">Loading messages…</p>
      ) : messages.length === 0 ? (
        <p className="text-[13px] text-slate-500">
          {cannotStart ? NOT_POSTED_NOTE : `No messages yet. Write to ${first} about this work here.`}
        </p>
      ) : (
        <ul ref={listRef} className="flex max-h-72 flex-col gap-2 overflow-y-auto" aria-live="polite">
          {messages.map((m) => {
            if (m.kind === 'system') {
              return (
                <li key={m.messageId} className="text-center text-xs italic text-slate-500">
                  {m.body}
                </li>
              )
            }
            const mine = Boolean(userId) && m.senderId === userId
            return (
              <li key={m.messageId} className={`flex max-w-[90%] gap-2 ${mine ? 'flex-row-reverse self-end' : 'self-start'}`}>
                <Avatar name={m.senderName} avatar={m.senderAvatar ?? null} photoUrl={m.senderPhotoUrl} size={24} />
                <span className={`min-w-0 rounded-[14px] border px-3 py-2.5 text-sm leading-snug ${bubbleFor(m, mine)}`}>
                  <span className="block text-xs text-slate-500">
                    {mine ? 'You' : senderLabelOf(m)} · {whenText(m.createdAt)}
                  </span>
                  <span className="whitespace-pre-wrap break-words text-slate-800">{m.body}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {cannotStart && messages.length > 0 && <p className="text-[13px] text-slate-500">{NOT_POSTED_NOTE}</p>}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={`Reply to ${first} privately`}
          placeholder={cannotStart ? NOT_POSTED_NOTE : `Reply to ${first}…`}
          maxLength={5000}
          disabled={inert}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={inert || sending || !text.trim()}
          className="flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-cyan-600 text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PaperAirplaneIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </form>

      {problem && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
          {problem}
        </p>
      )}

      {conversationId && (
        <Link
          href={`/messages?thread=${encodeURIComponent(conversationId)}`}
          className="w-fit text-xs font-medium text-cyan-700 hover:text-cyan-900"
        >
          Open the full conversation
        </Link>
      )}
    </section>
  )
}
