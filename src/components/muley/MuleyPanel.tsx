'use client'
// Muley's panel: the conversation, or the list of earlier ones. On a wide
// screen it sits over the right edge with no dimming, so the page stays in
// view and usable beside it; on a phone it is a sheet that rises to nearly
// the full height.

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeftIcon, ClockIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import MuleyAvatar from './MuleyAvatar'
import MuleyMessage from './MuleyMessage'
import MuleyComposer from './MuleyComposer'
import { useMuleyStore } from '@/store/useMuleyStore'
import { useUserStore } from '@/store/useUserStore'
import { can, isFullAdmin } from '@/lib/permissions'
import { muleyTone } from './tone'
import { pageContextFor, pageLabel, startersFor } from '@/lib/muley/pageContext'
import type { Block, ChoiceOption } from '@/lib/muley/types'

const relative = (iso: string) => {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000)
  if (days <= 0) return then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (days === 1) return 'Yesterday'
  if (days < 7) return then.toLocaleDateString([], { weekday: 'long' })
  return then.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

type Props = { pathname: string; firstName: string | null; onClose: () => void }

export default function MuleyPanel({ pathname, firstName, onClose }: Props) {
  const reduceMotion = useReducedMotion()
  const view = useMuleyStore((s) => s.view)
  const thread = useMuleyStore((s) => s.thread)
  const draft = useMuleyStore((s) => s.draft)
  const conversations = useMuleyStore((s) => s.conversations)
  const config = useMuleyStore((s) => s.config)
  const attachments = useMuleyStore((s) => s.attachments)
  const user = useUserStore((s) => s.user)
  const { attach, removeAttachment, setDraft, send, stop, retry, newConversation, setView, openConversation, deleteConversation, applyAction, undoAction, dismissAction } = useMuleyStore.getState()
  const writes = config.status === 'ready' && config.writes === true
  const parent = user.role === 'PARENT'
  const tone = muleyTone(user.role)
  // An image is for the school's own stamp, logo or signature: School Assets' permission.
  const canAttach = writes && (isFullAdmin(user) || can(user, 'school_setup'))

  const page = pageContextFor(pathname)
  const streaming = thread.status === 'streaming'
  const scrollRef = useRef<HTMLDivElement>(null)
  const pinned = useRef(true)
  const [announce, setAnnounce] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const wasStreaming = useRef(false)

  // Stay at the newest message unless the person has scrolled up to read.
  useEffect(() => {
    const el = scrollRef.current
    if (el && pinned.current) el.scrollTop = el.scrollHeight
  }, [thread])

  // Screen readers hear one short line when an answer is complete, not every word as it streams.
  useEffect(() => {
    if (wasStreaming.current && !streaming) setAnnounce(thread.error ? 'Muley could not finish.' : 'Muley replied.')
    wasStreaming.current = streaming
  }, [streaming, thread.error])

  const pageContext = { route: page.route, classId: page.classId }
  const submit = (text: string) => {
    pinned.current = true
    void send(text, { pageContext })
  }
  const choose = (block: Extract<Block, { kind: 'choices' }>, option: ChoiceOption) => {
    pinned.current = true
    void send(option.label, { choice: { ref: option.ref }, choicesId: block.id, optionId: option.id, pageContext })
  }
  const followLink = () => {
    if (window.matchMedia('(max-width: 767px)').matches) onClose()
  }
  const act = (actionId: string, step: 'apply' | 'undo' | 'dismiss') => {
    if (step === 'apply') void applyAction(actionId)
    else if (step === 'undo') void undoAction(actionId)
    else void dismissAction(actionId)
  }

  const label = thread.contextLabel || pageLabel(page)
  const empty = thread.messages.length === 0

  return (
    <>
      {/* The phone sheet dims the page behind it; the side panel does not. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[58] bg-slate-900/30 md:hidden print:hidden"
        aria-hidden="true"
      />
      <motion.aside
        role="complementary"
        aria-label="Muley"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 32 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 32 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !e.nativeEvent.isComposing) {
            e.stopPropagation()
            onClose()
          }
        }}
        className="fixed inset-x-0 bottom-0 top-3 z-[59] flex flex-col overflow-hidden rounded-t-2xl border-slate-200 bg-white shadow-2xl md:inset-x-auto md:inset-y-0 md:right-0 md:top-0 md:w-[420px] md:rounded-none md:border-l print:hidden"
      >
        <header className={`flex items-center gap-3 border-b ${tone.header} px-4 py-3`}>
          <MuleyAvatar size={30} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-semibold leading-tight text-slate-900">Muley</h2>
            <p className={`truncate text-xs ${tone.headerText}`}>{label ? `On this page: ${label}` : 'Your School Mule assistant'}</p>
          </div>
          {view === 'chat' ? (
            <>
              <button type="button" onClick={() => setView('history')} aria-label="Earlier conversations" title="Earlier conversations" className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-800">
                <ClockIcon className="h-5 w-5" />
              </button>
              <button type="button" onClick={newConversation} disabled={empty} aria-label="New conversation" title="New conversation" className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-40">
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setView('chat')} aria-label="Back to the conversation" className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-800">
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close Muley" className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-800">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        {view === 'history' ? (
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <h3 className="px-1 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Earlier conversations</h3>
            {conversations === null ? (
              <p className="px-1 text-sm text-slate-500">Loading…</p>
            ) : conversations.length === 0 ? (
              <p className="px-1 text-sm text-slate-500">No conversations yet.</p>
            ) : (
              <ul className="space-y-1">
                {conversations.map((c) => (
                  <li key={c.id} className="group flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-slate-50">
                    <button type="button" onClick={() => void openConversation(c.id)} className="min-w-0 flex-1 cursor-pointer text-left">
                      <span className="block truncate text-sm font-medium text-slate-900">{c.title || 'Untitled conversation'}</span>
                      <span className="block text-xs text-slate-500">{relative(c.lastMessageAt)}</span>
                    </button>
                    {confirmDelete === c.id ? (
                      <span className="flex items-center gap-1">
                        <button type="button" onClick={() => { setConfirmDelete(null); void deleteConversation(c.id) }} className="cursor-pointer rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
                        <button type="button" onClick={() => setConfirmDelete(null)} className="cursor-pointer rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">Keep</button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setConfirmDelete(c.id)} aria-label={`Delete "${c.title || 'Untitled conversation'}"`} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-white hover:text-rose-600">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div
            ref={scrollRef}
            onScroll={(e) => {
              const el = e.currentTarget
              pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
            }}
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            {empty ? (
              <div className="flex flex-col items-center pt-6 text-center">
                <MuleyAvatar size={88} framed={false} />
                <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">{firstName ? `Hi ${firstName}, I'm Muley` : "Hi, I'm Muley"}</h3>
                <p className="mt-1 max-w-[30ch] text-sm leading-relaxed text-slate-600">
                  {parent
                    ? 'I can tell you how your children are doing, what is due, what is coming up at school, and where anything is in the parent portal.'
                    : writes
                    ? 'I can look up your classes, marks and attendance, tell you how a class or a student is doing, get attendance and marks ready for you to check and save, and show you where anything is in School Mule.'
                    : 'I can look up your classes, marks and attendance, tell you how a class or a student is doing, and show you where anything is in School Mule.'}
                </p>
                <div className="mt-5 flex w-full flex-col gap-2">
                  {startersFor(page, writes).map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => submit(starter)}
                      className={`cursor-pointer rounded-xl border bg-white px-3 py-2 text-left text-sm ${tone.starter}`}
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {thread.messages.map((message) => (
                  <MuleyMessage
                    key={message.id}
                    message={message}
                    onChoose={choose}
                    onNavigate={followLink}
                    streaming={streaming}
                    actions={thread.actions || {}}
                    onAction={act}
                    onAsk={submit}
                    tone={tone}
                  />
                ))}
                {thread.error && (
                  <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    <p>{thread.error.message}</p>
                    {thread.error.retryable && (
                      <button type="button" onClick={() => void retry()} className="mt-1.5 cursor-pointer font-medium text-amber-800 underline underline-offset-2 hover:text-amber-950">
                        Try again
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-slate-100 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <MuleyComposer
            value={draft}
            onChange={setDraft}
            onSend={() => submit(draft)}
            onStop={stop}
            streaming={streaming}
            maxLength={config.status === 'ready' && config.maxMessageLength ? config.maxMessageLength : 4000}
            autoFocus={view === 'chat'}
            attachments={attachments}
            canAttach={canAttach}
            onAttach={(file) => void attach(file, { name: file.name, previewUrl: URL.createObjectURL(file) })}
            onRemoveAttachment={removeAttachment}
            tone={tone}
          />
          <p className="mt-2 text-center text-[11px] text-slate-400">
            {parent
              ? 'Muley sees only what the school shares with you, and can\u2019t change anything.'
              : writes ? 'Muley works with your access, and saves nothing until you press Save.' : 'Muley reads with your access. It can\u2019t change anything yet.'}
          </p>
        </div>
        <div className="sr-only" aria-live="polite">{announce}</div>
      </motion.aside>
    </>
  )
}

export function MuleyPresence({ open, children }: { open: boolean; children: React.ReactNode }) {
  return <AnimatePresence>{open ? children : null}</AnimatePresence>
}
