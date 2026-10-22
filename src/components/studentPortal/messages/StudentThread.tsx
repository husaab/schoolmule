// src/components/studentPortal/messages/StudentThread.tsx
// One conversation as the student sees it (Student-Messages board): the class
// icon, the title and "{Subject} · {about an assignment|general}", who is in it,
// the line telling them their parents are in it, the bubbles, and the box to
// write in. The student's own messages sit on the right in indigo, teachers on
// the left in white, parents on the left in amber. A student can edit or delete
// their own message for 15 minutes (the server's window); an older one has
// neither. The server marks the thread read when it is fetched, and the page
// asks again every 15 s and when the tab comes back, so an answer shows up
// without a reload.
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, PaperAirplaneIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import LoadError from '@/components/classroom/LoadError'
import AttachmentChip from '@/components/messaging/AttachmentChip'
import { toneClasses } from '@/components/messaging/tones'
import { useLoad } from '@/hooks/useLoad'
import { defaultIdentity } from '@/lib/classIdentity'
import { isTouchKeyboard, shouldSendOnKey } from '@/lib/enterToSend'
import { studentItemHref } from '@/lib/portalRoutes'
import {
  BODY_MAX,
  canChangeOwnMessage,
  messageWhen,
  parentsBanner,
  senderLabel,
  threadSubline,
} from '@/lib/studentMessages'
import {
  deleteStudentMessage,
  editStudentMessage,
  getStudentConversation,
  postStudentMessage,
} from '@/services/studentMessagingService'
import type { Message, Thread } from '@/services/types/messaging'
import type { StudentClassCard } from '@/services/types/studentPortal'
import { useNotificationStore } from '@/store/useNotificationStore'
import ParticipantsStrip from './ParticipantsStrip'

const REFRESH_MS = 15_000
const tone = toneClasses('student')

interface StudentThreadProps {
  conversationId: string
  /** The signed-in student. */
  userId: string
  classes: StudentClassCard[] | null
  /** An admin's preview: the thread can be read but not written. */
  previewing?: boolean
  /** The list should look again (a send, a removal, a read). */
  onChanged: () => void
  /** The server marked the thread read: the nav badge should ask again. */
  onRead: () => void
  /** Phone: back to the list. */
  onBack: () => void
}

const messageOf = (err: unknown, fallback: string): string => (err instanceof Error && err.message ? err.message : fallback)

export default function StudentThread({ conversationId, userId, classes, previewing = false, onChanged, onRead, onBack }: StudentThreadProps) {
  const notify = useNotificationStore((s) => s.showNotification)
  const loaded = useLoad<Thread>(`student-thread:${userId}:${conversationId}`, () => getStudentConversation(conversationId).then((r) => r.data))
  const { reload, patch } = loaded
  const thread = loaded.data

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState<{ messageId: string; text: string } | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)

  // An answer may have come: look again every 15 s while the tab is visible, and when it comes back.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') reload()
    }, REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  // The server marked it read as it answered: the list and the badge follow, once per new last message.
  const lastId = thread?.messages[thread.messages.length - 1]?.messageId ?? null
  const seenFor = useRef<string | null>(null)
  useEffect(() => {
    if (!thread) return
    const mark = `${conversationId}:${lastId ?? ''}`
    if (seenFor.current === mark) return
    seenFor.current = mark
    onRead()
    onChanged()
  }, [thread, conversationId, lastId, onRead, onChanged])

  // Show the newest message when the thread opens and when one arrives.
  const count = thread?.messages.length ?? 0
  const lastCount = useRef(0)
  useEffect(() => {
    if (count > lastCount.current) {
      const el = scroller.current
      if (el) el.scrollTop = el.scrollHeight
    }
    lastCount.current = count
  }, [count])

  // The box grows with what is typed, up to a few lines.
  useEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
    // A scrollbar only once the box has stopped growing.
    el.style.overflowY = el.scrollHeight > 140 ? 'auto' : 'hidden'
  }, [text])

  const messages = useMemo(() => (thread ? thread.messages : []), [thread])

  const send = useCallback(async () => {
    const body = text.trim()
    if (!body || sending || previewing) return
    setSending(true)
    try {
      const res = await postStudentMessage(conversationId, body)
      // The new last message makes the list and the badge look again (see above). The reload also
      // drops a poll that was already on its way with the thread as it was before this message.
      patch(() => res.data)
      reload()
      setText('')
    } catch (err) {
      // The words stay in the box.
      notify(messageOf(err, "The message didn't send. Try again."), 'error')
    } finally {
      setSending(false)
    }
  }, [text, sending, previewing, conversationId, patch, reload, notify])

  const saveEdit = async () => {
    if (!editing) return
    const body = editing.text.trim()
    if (!body) return
    try {
      const res = await editStudentMessage(conversationId, editing.messageId, body)
      patch((d) => ({ ...d, messages: d.messages.map((m) => (m.messageId === editing.messageId ? { ...m, body: res.data.body, editedAt: res.data.editedAt } : m)) }))
      reload()
      setEditing(null)
      onChanged()
    } catch (err) {
      notify(messageOf(err, "The message couldn't be changed."), 'error')
    }
  }

  const remove = async (messageId: string) => {
    try {
      const res = await deleteStudentMessage(conversationId, messageId)
      patch((d) => ({ ...d, messages: d.messages.map((m) => (m.messageId === messageId ? { ...m, body: null, deletedAt: res.data.deletedAt, attachments: [] } : m)) }))
      reload()
      setConfirmingDelete(null)
      onChanged()
    } catch (err) {
      notify(messageOf(err, "The message couldn't be deleted."), 'error')
    }
  }

  if (loaded.error && !thread) {
    return (
      <div className="flex h-full flex-col justify-center gap-4 p-6">
        <LoadError title="We couldn't open this conversation" message={loaded.error.message} onRetry={reload}>
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to messages
          </button>
        </LoadError>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="flex h-full flex-col gap-4 p-6" aria-label="Loading">
        <div className="h-16 w-2/3 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-16 w-1/2 animate-pulse self-end rounded-2xl bg-slate-100" />
      </div>
    )
  }

  const { conversation, participants } = thread
  const icon =
    (conversation.classId ? classes?.find((c) => c.classId === conversation.classId)?.identity.iconUrl : null) ??
    defaultIdentity(conversation.classSubject).iconUrl
  const now = new Date()
  const finished = conversation.status === 'resolved'

  const bubbleOf = (m: Message, mine: boolean): string => (mine ? tone.bubbleMine : m.senderRole === 'PARENT' ? tone.bubbleParent : tone.bubbleTheirs)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-[18px] sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to messages"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 xl:hidden"
          >
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- static class icon */}
          <img src={icon} alt="" className="h-9 w-9 shrink-0 rounded-[10px]" />
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate font-display text-xl font-semibold text-slate-900">{conversation.title}</h2>
            <span className="truncate text-[13px] text-slate-500">{threadSubline(conversation)}</span>
          </div>
          {conversation.classworkItemId && (
            <Link
              href={studentItemHref(conversation.classworkItemId)}
              className="ml-auto shrink-0 text-sm font-medium text-indigo-700 underline-offset-2 hover:text-indigo-900 hover:underline"
            >
              Open the assignment
            </Link>
          )}
        </div>
        <ParticipantsStrip participants={participants} userId={userId} teacherId={conversation.teacherId} />
        <p className="flex items-center gap-2.5 rounded-xl bg-indigo-50 px-3 py-2.5 text-[13px] text-indigo-950">
          <UserGroupIcon className="h-[18px] w-[18px] shrink-0 text-indigo-600" aria-hidden="true" />
          {parentsBanner(participants, conversation.classworkItemId)}
        </p>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6" aria-live="polite">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet.</p>
        ) : (
          <ul className="flex flex-col gap-3.5">
            {messages.map((m) => {
              if (m.kind === 'system') {
                return (
                  <li key={m.messageId} className="text-center text-xs italic text-slate-500">
                    {m.body}
                  </li>
                )
              }
              const mine = m.senderId === userId
              const removed = Boolean(m.deletedAt)
              const canTouch = !previewing && canChangeOwnMessage(m, userId, now)
              const isEditing = editing?.messageId === m.messageId
              return (
                <li key={m.messageId} className={`flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                  <Avatar name={m.senderName} avatar={m.senderAvatar ?? null} photoUrl={m.senderPhotoUrl} size={34} />
                  <div className={`flex max-w-[78%] flex-col gap-1 sm:max-w-[72%] ${mine ? 'items-end' : 'items-start'}`}>
                    <span className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                      <span>
                        {senderLabel(m, userId)} · {messageWhen(m.createdAt, now)}
                        {m.editedAt && !removed ? ' · edited' : ''}
                      </span>
                      {canTouch && !isEditing && (
                        <span className="flex flex-wrap items-center gap-x-3 font-medium">
                          {confirmingDelete === m.messageId ? (
                            <>
                              <span className="text-slate-600">Delete this message?</span>
                              <button type="button" onClick={() => void remove(m.messageId)} className="inline-flex min-h-9 cursor-pointer items-center text-rose-700 hover:text-rose-900">
                                Delete
                              </button>
                              <button type="button" onClick={() => setConfirmingDelete(null)} className="inline-flex min-h-9 cursor-pointer items-center text-slate-600 hover:text-slate-800">
                                Keep
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditing({ messageId: m.messageId, text: m.body ?? '' })}
                                className="inline-flex min-h-9 cursor-pointer items-center text-slate-600 hover:text-indigo-700"
                              >
                                Edit
                              </button>
                              <button type="button" onClick={() => setConfirmingDelete(m.messageId)} className="inline-flex min-h-9 cursor-pointer items-center text-slate-600 hover:text-rose-700">
                                Delete
                              </button>
                            </>
                          )}
                        </span>
                      )}
                    </span>
                    {removed ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 px-3.5 py-2.5 text-sm italic text-slate-500">Message removed</div>
                    ) : isEditing ? (
                      <form
                        className={`flex w-full min-w-[14rem] flex-col gap-2 rounded-2xl border p-3 ${tone.bubbleMine}`}
                        onSubmit={(e) => {
                          e.preventDefault()
                          void saveEdit()
                        }}
                      >
                        <textarea
                          value={editing.text}
                          onChange={(e) => setEditing({ messageId: m.messageId, text: e.target.value })}
                          maxLength={BODY_MAX}
                          rows={3}
                          aria-label="Change your message"
                          autoFocus
                          className="w-full resize-y rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[15px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                        <span className="flex gap-4 text-sm font-medium">
                          <button type="submit" className="min-h-9 cursor-pointer text-indigo-700 hover:text-indigo-900">
                            Save
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className="min-h-9 cursor-pointer text-slate-600 hover:text-slate-800">
                            Cancel
                          </button>
                        </span>
                      </form>
                    ) : (
                      <div className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-[11px] text-[15px] leading-normal ${bubbleOf(m, mine)}`}>{m.body}</div>
                    )}
                    {!removed && m.attachments.length > 0 && (
                      <div className={`flex flex-wrap gap-2 ${mine ? 'justify-end' : ''}`}>
                        {m.attachments.map((a) => (
                          <AttachmentChip key={a.attachmentId} attachment={a} />
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2 bg-slate-50 px-4 pb-5 pt-3.5 sm:px-6">
        {finished && !previewing && (
          <p className="text-xs text-slate-500">This conversation was marked finished. Sending a message opens it again.</p>
        )}
        <form
          className="flex items-end gap-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <textarea
            ref={box}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (shouldSendOnKey(e.nativeEvent, isTouchKeyboard())) {
                e.preventDefault()
                void send()
              }
            }}
            rows={1}
            maxLength={BODY_MAX}
            disabled={previewing}
            aria-label="Write a message"
            placeholder={previewing ? 'Messages can’t be sent from a preview' : 'Write a message…'}
            className="max-h-36 min-h-[50px] min-w-0 flex-1 resize-none rounded-[14px] border border-slate-200 bg-white px-4 py-[13px] text-[15px] leading-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={previewing || sending || !text.trim()}
            className="flex h-[50px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-[14px] bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  )
}
