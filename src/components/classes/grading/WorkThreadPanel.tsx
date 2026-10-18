// src/components/classes/grading/WorkThreadPanel.tsx
// "Messages about this work · {first} and parents" (Teacher-Grading board):
// the private thread anchored to this student's work. Sending ensures the
// thread (POST …/students/:studentId/thread) and then posts through the
// existing messaging API, so the student, the guardians (unless the school
// hides work threads from parents) and the class's teachers all get it.
//
// The thread routes are Task 17's. Until they land, ITEM_THREADS_ENABLED is
// off and the panel is shown but inert.
'use client'

import { useState } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import { useLoad } from '@/hooks/useLoad'
import { ITEM_THREADS_ENABLED } from '@/lib/classroomFeatures'
import { ensureItemThread } from '@/services/gradingService'
import { getConversation, postMessage } from '@/services/messagingService'
import type { ItemThreadStub } from '@/services/types/grading'
import type { Message } from '@/services/types/messaging'
import { useNotificationStore } from '@/store/useNotificationStore'

interface WorkThreadPanelProps {
  itemId: string
  studentId: string
  first: string
  /** Guardians read work threads (the school's setting). */
  includesParents: boolean
  /** From the submission; null when no thread exists yet (or before Task 17). */
  stub: ItemThreadStub | null
  disabled: boolean
}

const TZ = 'America/Toronto'
const whenText = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: '2-digit' })
    .format(new Date(iso))
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ ?([AP]M)$/i, (_, ap: string) => ` ${ap.toLowerCase()}`)

export default function WorkThreadPanel({ itemId, studentId, first, includesParents, stub, disabled }: WorkThreadPanelProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  // The thread this panel shows: the one the submission names (it arrives
  // after the panel opens), or the one the first message just created.
  const [createdId, setCreatedId] = useState<string | null>(null)
  const conversationId = createdId ?? stub?.conversationId ?? null
  const [sent, setSent] = useState<Message[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const thread = useLoad<Message[]>(ITEM_THREADS_ENABLED && conversationId ? conversationId : null, async () => {
    const res = await getConversation(conversationId as string)
    return res.data?.messages ?? []
  })
  const messages = (sent ?? thread.data ?? []).filter((m) => !m.deletedAt)
  const inert = !ITEM_THREADS_ENABLED || disabled

  const send = async () => {
    const body = text.trim()
    if (!body || sending || inert) return
    setSending(true)
    try {
      const id = conversationId ?? (await ensureItemThread(itemId, studentId)).data.conversationId
      setCreatedId(id)
      const res = await postMessage(id, { body })
      if (res.status !== 'success' || !res.data) throw new Error(res.message || "The message didn't send.")
      setSent(res.data.messages)
      setText('')
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "The message didn't send.", 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="flex flex-col gap-2.5 border-t border-slate-100 pt-3.5">
      <h3 className="text-sm font-semibold text-slate-900">
        Messages about this work{' '}
        <span className="font-normal text-slate-500">· {includesParents ? `${first} and parents` : first}</span>
      </h3>

      {!ITEM_THREADS_ENABLED ? (
        <p className="text-[13px] text-slate-500">Messages about a student&apos;s work aren&apos;t switched on yet.</p>
      ) : thread.loading && messages.length === 0 ? (
        <p className="text-[13px] text-slate-500">Loading messages…</p>
      ) : messages.length === 0 ? (
        <p className="text-[13px] text-slate-500">No messages yet. Write to {first} about this work here.</p>
      ) : (
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {messages.map((m) => (
            <li
              key={m.messageId}
              className="flex max-w-[90%] gap-2 self-start rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-snug"
            >
              <Avatar name={m.senderName} avatar={m.senderAvatar ?? null} size={24} />
              <span className="min-w-0">
                <span className="block text-xs text-slate-500">
                  {m.senderName} · {whenText(m.createdAt)}
                </span>
                <span className="whitespace-pre-wrap break-words text-slate-800">{m.body}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

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
          placeholder={`Reply to ${first}…`}
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
    </section>
  )
}
