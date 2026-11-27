'use client'
// Where the person types to Muley. Enter sends, Shift+Enter starts a new
// line; on a touch keyboard Enter is a new line and the button sends. Where
// Muley can use an image (a new school stamp, logo or signature), a paperclip
// attaches one; it uploads at once and goes with the next message. The
// microphone turns what the person says into text in the box, for them to
// read and send.

import { useEffect, useRef } from 'react'
import { ArrowUpIcon, StopIcon } from '@heroicons/react/24/solid'
import { CheckIcon, ExclamationTriangleIcon, MicrophoneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { canRecord, useVoiceNote } from './useVoiceNote'
import type { DraftAttachment } from '@/store/useMuleyStore'
import type { MuleyTone } from './tone'

type Props = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  streaming: boolean
  maxLength: number
  autoFocus: boolean
  attachments: DraftAttachment[]
  /** The paperclip shows only where Muley can use an image for this person. */
  canAttach: boolean
  onAttach: (file: File) => void
  onRemoveAttachment: (localId: string) => void
  tone: MuleyTone
  /** Show the microphone. */
  voice: boolean
}

const IMAGE_TYPES = 'image/png,image/jpeg,image/gif'

const touchKeyboard = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

export default function MuleyComposer({ value, onChange, onSend, onStop, streaming, maxLength, autoFocus, attachments, canAttach, onAttach, onRemoveAttachment, tone, voice }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  // What was said joins what is typed, ready to read and send.
  const note = useVoiceNote((text) => {
    onChange(value.trim() ? `${value.trimEnd()} ${text}` : text)
    requestAnimationFrame(() => ref.current?.focus())
  })
  // The panel only ever renders in the browser (it opens on a click), so this needs no server pass.
  const showMic = voice && canRecord()
  const listening = note.state.status === 'recording' || note.state.status === 'transcribing'

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  useEffect(() => {
    if (autoFocus && !touchKeyboard()) ref.current?.focus()
  }, [autoFocus])

  const uploading = attachments.some((a) => a.status === 'uploading')
  const ready = attachments.some((a) => a.status === 'ready')
  const canSend = (value.trim().length > 0 || ready) && !streaming && !uploading
  return (
    <form
      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-100"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSend) onSend()
      }}
    >
      {attachments.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label="Attached images">
          {attachments.map((a) => (
            <li key={a.localId} className={`relative flex items-center gap-2 rounded-xl border bg-white py-1 pl-1 pr-7 text-xs ${a.status === 'failed' ? 'border-rose-200 text-rose-700' : 'border-slate-200 text-slate-700'}`} title={a.error || a.name}>
              {a.previewUrl ? (
                // A local preview of the picked file (blob: URL): next/image can't load it.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.previewUrl} alt="" className={`h-9 w-9 rounded-lg object-cover ${a.status === 'uploading' ? 'opacity-50' : ''}`} />
              ) : (
                <span className="h-9 w-9 rounded-lg bg-slate-100" />
              )}
              <span className="max-w-[9rem] truncate">{a.status === 'failed' ? a.error : a.name}</span>
              {a.status === 'uploading' && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" aria-label="Uploading" />}
              {a.status === 'failed' && <ExclamationTriangleIcon className="h-4 w-4 text-rose-600" aria-hidden="true" />}
              <button type="button" onClick={() => onRemoveAttachment(a.localId)} aria-label={`Remove ${a.name}`} className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {note.state.status === 'error' && (
        <p role="alert" className="mb-2 flex items-start gap-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span className="flex-1">{note.state.message}</span>
          <button type="button" onClick={note.dismiss} aria-label="Dismiss" className="cursor-pointer text-amber-700 hover:text-amber-900"><XMarkIcon className="h-4 w-4" /></button>
        </p>
      )}
      <div className="flex items-end gap-2">
      {canAttach && (
        <>
          <input
            ref={picker}
            type="file"
            accept={IMAGE_TYPES}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onAttach(file)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => picker.current?.click()}
            disabled={attachments.length >= 3}
            aria-label="Attach an image"
            title="Attach an image (a new school stamp, logo or signature)"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
        </>
      )}
      {listening ? (
        <div className="flex min-h-[36px] flex-1 items-center gap-2 py-1 text-sm text-slate-700" aria-live="polite">
          {note.state.status === 'recording' ? (
            <>
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" aria-hidden="true" />
              <span className="font-medium">Listening</span>
              <span className="tabular-nums text-slate-500">
                {Math.floor(note.state.seconds / 60)}:{String(note.state.seconds % 60).padStart(2, '0')}
              </span>
              <button type="button" onClick={note.cancel} className="ml-auto cursor-pointer rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-white hover:text-slate-800">Cancel</button>
            </>
          ) : (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" aria-hidden="true" />
              <span>Turning it into text…</span>
            </>
          )}
        </div>
      ) : null}
      <label htmlFor="muley-input" className="sr-only">Message Muley</label>
      <textarea
        hidden={listening}
        id="muley-input"
        ref={ref}
        rows={1}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !touchKeyboard()) {
            e.preventDefault()
            if (canSend) onSend()
          }
        }}
        placeholder="Ask Muley…"
        className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
      {showMic && !streaming && note.state.status !== 'transcribing' && (
        note.state.status === 'recording' ? (
          <button type="button" onClick={note.stop} aria-label="Done speaking" title="Done speaking" className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm hover:bg-rose-600">
            <CheckIcon className="h-5 w-5" />
          </button>
        ) : (
          <button type="button" onClick={() => void note.start()} aria-label="Speak to Muley" title="Speak instead of typing" className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-slate-800">
            <MicrophoneIcon className="h-5 w-5" />
          </button>
        )
      )}
      {streaming ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-700 text-white hover:bg-slate-800"
        >
          <StopIcon className="h-4 w-4" />
        </button>
      ) : listening ? null : (
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl ${tone.send} text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <ArrowUpIcon className="h-4 w-4" />
        </button>
      )}
      </div>
    </form>
  )
}
