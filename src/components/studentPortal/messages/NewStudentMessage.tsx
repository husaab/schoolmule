// src/components/studentPortal/messages/NewStudentMessage.tsx
// "Message a teacher" (Student-Messages board, the new-message state): a grid
// of the student's own teachers to pick from, a subject ("What is it about?"),
// the message, and a note saying plainly that their parents will be in the
// conversation too. A teacher who teaches several of the student's classes gets
// a small "About" choice. The server decides who is allowed; this only offers
// the teachers it listed. A refused send keeps everything that was typed.
'use client'

import { useState } from 'react'
import Avatar from '@/components/avatar/Avatar'
import LoadError from '@/components/classroom/LoadError'
import {
  BODY_MAX,
  SUBJECT_MAX,
  guardiansNote,
  newMessageProblem,
  resolveCompose,
  teacherClassesLine,
} from '@/lib/studentMessages'
import { createStudentConversation } from '@/services/studentMessagingService'
import type { StudentMessageTargets, Thread } from '@/services/types/messaging'

interface NewStudentMessageProps {
  /** Null while the teachers are loading. */
  targets: StudentMessageTargets | null
  error: string | null
  onRetry: () => void
  /** The teacher and class the page's link names (transient URL params). */
  teacherId: string | null
  classId: string | null
  onPick: (choice: { teacherId: string; classId: string | null }) => void
  onCancel: () => void
  onSent: (thread: Thread) => void
  /** An admin's preview: nothing can be sent. */
  previewing?: boolean
}

const messageOf = (err: unknown): string =>
  err instanceof Error && err.message ? err.message : "Your message didn't send. Try again."

export default function NewStudentMessage({
  targets,
  error,
  onRetry,
  teacherId,
  classId,
  onPick,
  onCancel,
  onSent,
  previewing = false,
}: NewStudentMessageProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const choice = resolveCompose(targets, teacherId, classId)
  const problem = newMessageProblem({ teacherId: choice.teacher?.userId ?? null, subject, body })
  const canSend = !problem && !sending && !previewing

  const send = async () => {
    if (!canSend || !choice.teacher) return
    setSending(true)
    setFailure(null)
    try {
      const res = await createStudentConversation({ teacherId: choice.teacher.userId, classId: choice.classId, subject, body })
      onSent(res.data)
    } catch (err) {
      setFailure(messageOf(err))
    } finally {
      setSending(false)
    }
  }

  if (error && !targets) {
    return (
      <div className="p-6">
        <LoadError title="We couldn't load your teachers" message={error} onRetry={onRetry} />
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-[18px] p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault()
        void send()
      }}
    >
      <h2 className="font-display text-[22px] font-semibold text-slate-900">Message a teacher</h2>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] font-semibold text-slate-600">To</legend>
        {!targets ? (
          <div className="grid gap-2 sm:grid-cols-2" aria-label="Loading">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[60px] animate-pulse rounded-[14px] bg-slate-100" />
            ))}
          </div>
        ) : targets.teachers.length === 0 ? (
          <p className="rounded-[14px] bg-slate-100 p-4 text-sm text-slate-600">You don&apos;t have any teachers to message yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-2">
            {targets.teachers.map((t) => {
              const on = choice.teacher?.userId === t.userId
              return (
                <button
                  key={t.userId}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onPick({ teacherId: t.userId, classId: resolveCompose(targets, t.userId, classId).classId })}
                  className={`flex min-h-[60px] cursor-pointer items-center gap-2.5 rounded-[14px] border-2 px-3 py-2.5 text-left transition-colors ${
                    on ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Avatar name={t.name} avatar={t.avatar} size={36} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-slate-900">{t.name}</span>
                    <span className="truncate text-xs text-slate-500">{teacherClassesLine(t)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </fieldset>

      {choice.teacher && choice.teacher.classes.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[13px] font-semibold text-slate-600">About which class?</legend>
          <div className="flex flex-wrap gap-2">
            {choice.teacher.classes.map((c) => {
              const on = c.classId === choice.classId
              return (
                <button
                  key={c.classId}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onPick({ teacherId: choice.teacher!.userId, classId: c.classId })}
                  className={`min-h-10 cursor-pointer rounded-full border px-4 text-sm transition-colors ${
                    on ? 'border-indigo-600 bg-indigo-50 font-medium text-indigo-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {c.subject}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-slate-600">Subject</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="What is it about?"
          maxLength={SUBJECT_MAX}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-slate-600">Message</span>
        <textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={BODY_MAX}
          className="resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[15px] leading-relaxed outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      {targets && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
          {targets.guardians.length > 0 && (
            <span className="flex shrink-0 -space-x-3" aria-hidden="true">
              {targets.guardians.slice(0, 3).map((g, i) => (
                <Avatar key={`${g.name}-${i}`} name={g.name} avatar={null} size={28} className="ring-2 ring-amber-50" />
              ))}
            </span>
          )}
          <span>{guardiansNote(targets.guardians)}</span>
        </div>
      )}

      {failure && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
          {failure}
        </p>
      )}
      {previewing && <p className="text-sm text-slate-500">This is a preview, so nothing here can be sent.</p>}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {problem && !previewing && <span className="mr-auto text-sm text-slate-500">{problem}</span>}
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSend}
          className="min-h-11 cursor-pointer rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  )
}
