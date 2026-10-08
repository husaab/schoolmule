'use client'

import React, { useEffect, useRef, useState } from 'react'
import { EllipsisHorizontalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { Message } from '@/services/types/messaging'
import AttachmentChip from './AttachmentChip'
import { formatTime, initials } from './formatters'
import { toneClasses, type Tone } from './tones'

interface MessageBubbleProps {
  message: Message
  mine: boolean
  tone: Tone
  canEdit: boolean
  canDelete: boolean
  onEdit: (body: string) => Promise<void>
  onDelete: () => Promise<void>
}

/**
 * One message. The caller's own messages sit on the right in the tone's
 * accent; everyone else's on the left with an avatar. A removed message
 * keeps its place as a quiet "Message removed" line so the conversation
 * still reads in order.
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, mine, tone, canEdit, canDelete, onEdit, onDelete }) => {
  const t = toneClasses(tone)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.body ?? '')
  const [busy, setBusy] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const removed = Boolean(message.deletedAt)
  const senderLabel = message.senderRelation ? `${message.senderName} (${message.senderRelation})` : message.senderName
  const avatarClass = message.senderRole === 'PARENT' ? t.avatarParent : t.avatarStaff

  const saveEdit = async () => {
    const text = draft.trim()
    if (!text || text === message.body) {
      setEditing(false)
      return
    }
    setBusy(true)
    try {
      await onEdit(text)
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  const bubble = removed ? (
    <div className="rounded-2xl border border-dashed border-slate-200 px-3.5 py-2 text-sm italic text-slate-400">
      Message removed
    </div>
  ) : editing ? (
    <div className={`rounded-2xl border p-2 ${mine ? t.bubbleMine : t.bubbleTheirs}`}>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        autoFocus
        className={`w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${t.focus}`}
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setDraft(message.body ?? '')
            setEditing(false)
          }}
          className={`rounded-lg px-3 py-1 text-xs ${t.secondary} cursor-pointer`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={saveEdit}
          disabled={busy}
          className={`rounded-lg px-3 py-1 text-xs ${t.primary} cursor-pointer disabled:opacity-60`}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  ) : (
    <div
      className={`whitespace-pre-wrap break-words px-3.5 py-2.5 text-sm leading-relaxed ${
        mine ? `${t.bubbleMine} rounded-2xl rounded-br-md` : `${t.bubbleTheirs} rounded-2xl rounded-bl-md`
      }`}
    >
      {message.body}
    </div>
  )

  const actions =
    !removed && !editing && (canEdit || canDelete) ? (
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label="Message options"
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg p-1 text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
        >
          <EllipsisHorizontalIcon className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setDraft(message.body ?? '')
                  setEditing(true)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <PencilSquareIcon className="h-4 w-4 text-slate-400" /> Edit
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false)
                  setBusy(true)
                  try {
                    await onDelete()
                  } finally {
                    setBusy(false)
                  }
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <TrashIcon className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
        )}
      </div>
    ) : null

  return (
    <div className={`group flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
      {!mine && (
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarClass}`}
          title={senderLabel}
        >
          {initials(message.senderName)}
        </span>
      )}
      <div className={`flex max-w-[78%] flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-end gap-1 ${mine ? 'flex-row-reverse' : ''}`}>
          {bubble}
          {actions}
        </div>
        {!removed && message.attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${mine ? 'justify-end' : ''}`}>
            {message.attachments.map((a) => (
              <AttachmentChip key={a.attachmentId} attachment={a} />
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-400">
          {mine ? 'You' : senderLabel} · {formatTime(message.createdAt)}
          {message.editedAt && !removed && <span> · edited</span>}
        </p>
      </div>
    </div>
  )
}

export default MessageBubble
