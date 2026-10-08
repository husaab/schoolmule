'use client'

import React, { useRef, useState } from 'react'
import { CheckIcon, PaperAirplaneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ACCEPT_ATTR, MAX_BODY, MAX_FILES, fileProblem, formatBytes, isImage } from './formatters'
import { toneClasses, type Tone } from './tones'

interface ComposerProps {
  tone: Tone
  placeholder: string
  /** "Mr. Khan will be emailed" — who gets the digest. Empty hides the line. */
  recipientsLabel?: string
  onSend: (input: { body: string; files: File[] }) => Promise<void>
  disabled?: boolean
  /** Smaller padding for inline use (grades row, modal). */
  compact?: boolean
  autoFocus?: boolean
  submitLabel?: string
}

/**
 * The message box: text, attachments as removable chips, limits spelled out
 * next to the attach button. Enter sends, Shift+Enter breaks a line. Files are
 * validated here with the same rules as the server so a bad pick is refused
 * before it uploads.
 */
const Composer: React.FC<ComposerProps> = ({
  tone,
  placeholder,
  recipientsLabel,
  onSend,
  disabled = false,
  compact = false,
  autoFocus = false,
  submitLabel = 'Send',
}) => {
  const t = toneClasses(tone)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const addFiles = (picked: FileList | null) => {
    if (!picked) return
    const next = [...files]
    for (const f of Array.from(picked)) {
      if (next.length >= MAX_FILES) {
        showNotification(`At most ${MAX_FILES} files per message`, 'error')
        break
      }
      const problem = fileProblem(f)
      if (problem) {
        showNotification(problem, 'error')
        continue
      }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue
      next.push(f)
    }
    setFiles(next)
    if (fileInput.current) fileInput.current.value = ''
  }

  const canSend = !disabled && !sending && (body.trim().length > 0 || files.length > 0) && body.length <= MAX_BODY

  const send = async () => {
    if (!canSend) return
    setSending(true)
    try {
      await onSend({ body: body.trim(), files })
      setBody('')
      setFiles([])
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not send message', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`flex flex-col gap-2.5 ${compact ? '' : 'pt-1'}`}>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f) => (
            <span
              key={`${f.name}-${f.size}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-2 pr-1 text-xs text-slate-700"
            >
              {isImage(f.type) ? (
                <span className="h-5 w-5 overflow-hidden rounded bg-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                </span>
              ) : null}
              <span className="max-w-[160px] truncate">{f.name}</span>
              <span className="text-slate-400">{formatBytes(f.size)}</span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => setFiles(files.filter((x) => x !== f))}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void send()
          }
        }}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        autoFocus={autoFocus}
        disabled={disabled || sending}
        maxLength={MAX_BODY + 1}
        className={`w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${t.focus} disabled:opacity-60`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={disabled || sending || files.length >= MAX_FILES}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium ${t.secondary} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <PaperClipIcon className="h-4 w-4" /> Attach
        </button>
        <span className="flex-1" />
        {recipientsLabel && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> {recipientsLabel}
          </span>
        )}
        {body.length > MAX_BODY && <span className="text-[11px] text-rose-600">Too long</span>}
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium ${t.primary} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {sending ? 'Sending…' : submitLabel}
          {!sending && <PaperAirplaneIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export default Composer
