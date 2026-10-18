// src/components/studentPortal/work/WorkMessages.tsx
// "Messages about this work · {teacher} and your parents" (Student-Assignment
// board): the private thread tied to this assignment. The student asks the
// teacher a question; the teacher and the student's parents can read it and
// answer. The first message starts the thread. A student can edit or delete
// their own message for 15 minutes. Everything goes through the student's
// routes (/api/student/items/:itemId/thread…); the words are in itemPageText.ts.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import { useLoad } from '@/hooks/useLoad'
import { postedAtLabel } from '@/lib/classroomText'
import { workMessagesSubtitle } from '@/lib/itemPageText'
import { MESSAGE_EDIT_WINDOW_MS } from '@/lib/studentMessages'
import {
  deleteStudentMessage,
  editStudentMessage,
  getStudentItemThread,
  postStudentItemMessage,
} from '@/services/studentPortalService'
import type { Message, Thread } from '@/services/types/messaging'
import type { ItemThreadInfo } from '@/services/types/studentPortal'
import { useNotificationStore } from '@/store/useNotificationStore'

interface WorkMessagesProps {
  itemId: string
  teacherName: string | null
  /** From the item: null until someone has written. */
  thread: ItemThreadInfo | null
  userId: string
  /** An admin's preview: the messages can be read but not written. */
  readOnly?: boolean
}

const messageOf = (err: unknown, fallback: string): string => (err instanceof Error && err.message ? err.message : fallback)

export default function WorkMessages({ itemId, teacherName, thread, userId, readOnly = false }: WorkMessagesProps) {
  const notify = useNotificationStore((s) => s.showNotification)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState<{ messageId: string; text: string } | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  // What changed here (a message just sent, edited or removed) wins over what was loaded.
  const [local, setLocal] = useState<Message[] | null>(null)
  // The thread the first message just started (the item only learns of it on its next read).
  const [startedId, setStartedId] = useState<string | null>(null)

  const loaded = useLoad<Thread | null>(thread ? `item-thread:${userId}:${itemId}` : null, () =>
    getStudentItemThread(itemId).then((r) => r.data.thread),
  )
  const { reload } = loaded
  const conversationId = startedId ?? loaded.data?.conversation.conversationId ?? thread?.conversationId ?? null
  const all = local ?? loaded.data?.messages ?? []
  const messages = all.filter((m) => !m.deletedAt && m.kind === 'message')
  const now = new Date()

  // Coming back to the tab: the teacher may have answered.
  useEffect(() => {
    if (!thread) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setLocal(null)
        reload()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [thread, reload])

  const send = useCallback(async () => {
    const body = text.trim()
    if (!body || sending || readOnly) return
    setSending(true)
    try {
      const res = await postStudentItemMessage(itemId, body)
      setLocal(res.data.messages)
      setStartedId(res.data.conversation.conversationId)
      setText('')
    } catch (err) {
      notify(messageOf(err, "The message didn't send. Try again."), 'error')
    } finally {
      setSending(false)
    }
  }, [text, sending, readOnly, itemId, notify])

  const saveEdit = async () => {
    if (!editing || !conversationId) return
    const body = editing.text.trim()
    if (!body) return
    try {
      const res = await editStudentMessage(conversationId, editing.messageId, body)
      setLocal(all.map((m) => (m.messageId === editing.messageId ? { ...m, body: res.data.body, editedAt: res.data.editedAt } : m)))
      setEditing(null)
    } catch (err) {
      notify(messageOf(err, "The message couldn't be changed."), 'error')
    }
  }

  const remove = async (messageId: string) => {
    if (!conversationId) return
    try {
      const res = await deleteStudentMessage(conversationId, messageId)
      setLocal(all.map((m) => (m.messageId === messageId ? { ...m, body: null, deletedAt: res.data.deletedAt } : m)))
      setConfirmingDelete(null)
    } catch (err) {
      notify(messageOf(err, "The message couldn't be deleted."), 'error')
    }
  }

  const own = (m: Message) => m.senderId === userId

  return (
    <section className="flex flex-col gap-3 rounded-[20px] border border-slate-200/70 bg-white p-5">
      <h2 className="text-[15px] font-semibold text-slate-900">
        Messages about this work <span className="font-normal text-slate-500">· {workMessagesSubtitle(teacherName)}</span>
      </h2>

      {loaded.error && !loaded.data && !local ? (
        <p className="text-sm text-rose-700">
          We couldn&apos;t load the messages.{' '}
          <button type="button" onClick={reload} className="cursor-pointer font-semibold underline underline-offset-2">
            Try again
          </button>
        </p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-slate-500">
          {loaded.loading && thread ? 'Loading messages…' : `No messages yet. Ask ${teacherName ?? 'your teacher'} a question about this work.`}
        </p>
      ) : (
        <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto" aria-live="polite">
          {messages.map((m) => {
            const mine = own(m)
            const canTouch = mine && !readOnly && now.getTime() - Date.parse(m.createdAt) < MESSAGE_EDIT_WINDOW_MS
            const isEditing = editing?.messageId === m.messageId
            return (
              <li key={m.messageId} className={`flex max-w-[92%] items-end gap-2 ${mine ? 'flex-row-reverse self-end' : 'self-start'}`}>
                <Avatar name={m.senderName} avatar={m.senderAvatar ?? null} size={28} />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className={`rounded-[14px] px-3.5 py-2.5 text-sm leading-snug ${mine ? 'bg-indigo-50' : 'bg-slate-100'}`}>
                    {!mine && (
                      <span className="block text-xs text-slate-500">
                        {m.senderName}
                        {m.senderRole === 'PARENT' ? ' · parent' : ''}
                      </span>
                    )}
                    {isEditing ? (
                      <form
                        className="flex flex-col gap-2"
                        onSubmit={(e) => {
                          e.preventDefault()
                          void saveEdit()
                        }}
                      >
                        <input
                          type="text"
                          value={editing.text}
                          onChange={(e) => setEditing({ messageId: m.messageId, text: e.target.value })}
                          maxLength={5000}
                          aria-label="Change your message"
                          autoFocus
                          className="w-full min-w-[12rem] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                        <span className="flex gap-3 text-xs font-medium">
                          <button type="submit" className="cursor-pointer text-indigo-700 hover:text-indigo-900">
                            Save
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className="cursor-pointer text-slate-500 hover:text-slate-700">
                            Cancel
                          </button>
                        </span>
                      </form>
                    ) : (
                      <span className="whitespace-pre-wrap break-words text-slate-800">{m.body}</span>
                    )}
                  </div>
                  <div className={`flex flex-wrap items-center gap-x-3 text-xs text-slate-500 ${mine ? 'justify-end' : ''}`}>
                    <span>
                      {postedAtLabel(m.createdAt, now)}
                      {m.editedAt ? ' · edited' : ''}
                    </span>
                    {canTouch && !isEditing && confirmingDelete !== m.messageId && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing({ messageId: m.messageId, text: m.body ?? '' })}
                          className="cursor-pointer font-medium text-slate-600 hover:text-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(m.messageId)}
                          className="cursor-pointer font-medium text-slate-600 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {confirmingDelete === m.messageId && (
                      <span className="flex items-center gap-2 font-medium">
                        Delete this message?
                        <button type="button" onClick={() => void remove(m.messageId)} className="cursor-pointer text-rose-700 hover:text-rose-900">
                          Delete
                        </button>
                        <button type="button" onClick={() => setConfirmingDelete(null)} className="cursor-pointer text-slate-600 hover:text-slate-800">
                          Keep
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
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
          aria-label={`Write to ${teacherName ?? 'your teacher'} about this work`}
          placeholder={readOnly ? 'Messages can’t be sent from a preview' : `Ask ${teacherName ?? 'your teacher'}…`}
          maxLength={5000}
          disabled={readOnly}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[15px] outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={readOnly || sending || !text.trim()}
          className="flex h-[46px] w-[46px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PaperAirplaneIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </form>
      <p className="text-xs text-slate-500">Your parents can see these messages.</p>
    </section>
  )
}
