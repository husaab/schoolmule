'use client'

import React, { useEffect, useRef, useState } from 'react'
import { DocumentTextIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { joinNames } from '@/lib/classroomText'
import { getEditContext } from '@/services/messagingService'
import type { EditMessageInput, EmailedPerson, Message } from '@/services/types/messaging'
import { ACCEPT_ATTR, MAX_BODY, MAX_FILES, editDraftState } from './formatters'
import { toneClasses, type Tone } from './tones'
import { usePickedFiles } from './usePickedFiles'

interface MessageEditorProps {
  conversationId: string
  message: Message
  tone: Tone
  /** The message's own colours, so editing it still reads as that message. */
  bubbleClass: string
  /** Rejects when the save failed; the draft then stays open. */
  onSave: (input: EditMessageInput) => Promise<void>
  onClose: () => void
}

const FileRow: React.FC<{ name: string; onRemove: () => void }> = ({ name, onRemove }) => (
  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1 pl-2.5 pr-1">
    <DocumentTextIcon className="h-4 w-4 shrink-0 text-slate-500" />
    <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{name}</span>
    <button
      type="button"
      aria-label={`Remove ${name}`}
      onClick={onRemove}
      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
    >
      <XMarkIcon className="h-4 w-4" />
    </button>
  </div>
)

/**
 * Changing a sent message in place: its words, each of its files, and, when
 * someone already has the first version by email, a tick box (off by default)
 * to send them the corrected one. Inside the email's two-minute hold nobody
 * has it yet, so the tick box stays away and the email simply carries the fix.
 */
const MessageEditor: React.FC<MessageEditorProps> = ({ conversationId, message, tone, bubbleClass, onSave, onClose }) => {
  const t = toneClasses(tone)
  const [draft, setDraft] = useState(message.body ?? '')
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [emailedTo, setEmailedTo] = useState<EmailedPerson[]>([])
  const [emailCorrection, setEmailCorrection] = useState(false)
  const [busy, setBusy] = useState(false)
  const kept = message.attachments.filter((a) => !removedIds.includes(a.attachmentId))
  const { files, setFiles, preparing, fileInput, addFiles } = usePickedFiles(kept.length)
  const state = editDraftState(message.body ?? '', draft, message.attachments.length, removedIds.length, files.length)
  const canAddFile = kept.length + files.length + preparing < MAX_FILES
  const root = useRef<HTMLDivElement>(null)

  // The newest message sits at the bottom of the thread, so the editor opens
  // mostly below the fold without this; again when the tick box or a file adds height.
  useEffect(() => {
    root.current?.scrollIntoView({ block: 'end' })
  }, [emailedTo.length, kept.length, files.length])

  useEffect(() => {
    let cancelled = false
    getEditContext(conversationId, message.messageId).then(
      (res) => !cancelled && setEmailedTo(res.data?.emailedTo ?? []),
      // Without the answer there is simply no tick box; the edit itself still works.
      () => !cancelled && setEmailedTo([]),
    )
    return () => {
      cancelled = true
    }
  }, [conversationId, message.messageId])

  const save = async () => {
    if (!state.changed) {
      onClose()
      return
    }
    setBusy(true)
    try {
      await onSave({
        body: draft.trim(),
        removeAttachmentIds: removedIds,
        files,
        emailCorrection: emailedTo.length > 0 && emailCorrection,
      })
      onClose()
    } catch {
      // The thread has shown why it failed; the draft stays for another try.
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={root} className={`flex w-96 max-w-full scroll-mb-4 flex-col gap-2.5 rounded-2xl border p-2.5 ${bubbleClass}`}>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        autoFocus
        maxLength={MAX_BODY + 1}
        aria-label="Edit your message"
        className={`w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${t.focus}`}
      />

      <div className="flex flex-col gap-1.5">
        {kept.map((a) => (
          <FileRow key={a.attachmentId} name={a.fileName} onRemove={() => setRemovedIds((ids) => [...ids, a.attachmentId])} />
        ))}
        {files.map((f) => (
          <FileRow key={`${f.name}-${f.size}`} name={f.name} onRemove={() => setFiles((list) => list.filter((x) => x !== f))} />
        ))}
        <input ref={fileInput} type="file" multiple accept={ACCEPT_ATTR} className="hidden" onChange={(e) => void addFiles(e.target.files)} />
        {canAddFile && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className={`inline-flex w-fit cursor-pointer items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium ${t.accentText}`}
          >
            <PlusIcon className="h-3.5 w-3.5" /> Add a file
          </button>
        )}
        {preparing > 0 && (
          <span role="status" className="text-[11px] text-slate-500">
            Resizing {preparing === 1 ? 'a picture' : `${preparing} pictures`}…
          </span>
        )}
      </div>

      {emailedTo.length > 0 && (
        <div className="flex flex-col gap-0.5 border-t border-slate-200/70 pt-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-900">
            <input
              type="checkbox"
              checked={emailCorrection}
              onChange={(e) => setEmailCorrection(e.target.checked)}
              className={`h-4 w-4 cursor-pointer ${tone === 'parent' ? 'accent-amber-700' : 'accent-cyan-600'}`}
            />
            Email the corrected version to {joinNames(emailedTo.map((p) => p.name))}
          </label>
          <p className="ml-6 text-xs leading-snug text-slate-600">
            They were already emailed the first version{message.attachments.length > 0 ? ' and its files' : ''}.
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {draft.trim().length > MAX_BODY && <span className="mr-auto text-[11px] text-rose-600">Too long</span>}
        <button type="button" onClick={onClose} className={`cursor-pointer rounded-lg px-3 py-1 text-xs ${t.secondary}`}>
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy || preparing > 0 || !state.valid}
          className={`cursor-pointer rounded-lg px-3 py-1 text-xs ${t.primary} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

export default MessageEditor
