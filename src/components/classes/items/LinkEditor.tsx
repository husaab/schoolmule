// src/components/classes/items/LinkEditor.tsx
// Adding or editing a link attachment in place (the Teacher-Assign board's
// "Editing link" box): a title and the address, then Cancel or Save link. A
// bare address gets https:// added; YouTube links play in the viewer.
'use client'

import { useEffect, useRef, useState } from 'react'
import { LinkIcon, PlayIcon } from '@heroicons/react/24/solid'
import { LINK_TITLE_MAX, normalizeLinkUrl, youtubeIdOf } from '@/lib/attachments'

interface LinkEditorProps {
  mode: 'add' | 'edit'
  initialTitle?: string
  initialUrl?: string
  /** Saves the link; resolves to an error message to show, or null once saved. */
  onSave: (title: string | null, url: string) => Promise<string | null>
  onCancel: () => void
}

const INPUT =
  'w-full rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500'

export default function LinkEditor({ mode, initialTitle = '', initialUrl = '', onSave, onCancel }: LinkEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [url, setUrl] = useState(initialUrl)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const urlRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    urlRef.current?.focus()
  }, [])

  const normalized = normalizeLinkUrl(url)
  const isVideo = normalized ? youtubeIdOf(normalized) !== null : false

  const save = async () => {
    if (saving) return
    if (!normalized) {
      setError('Enter a link that starts with http:// or https://')
      return
    }
    if (title.trim().length > LINK_TITLE_MAX) {
      setError(`Keep the link title to ${LINK_TITLE_MAX} characters`)
      return
    }
    setSaving(true)
    setError(null)
    const problem = await onSave(title.trim() || null, normalized)
    setSaving(false)
    if (problem) setError(problem)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void save()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border-2 border-cyan-300 bg-cyan-50/30 p-3" onKeyDown={onKey}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-16 shrink-0 items-center justify-center rounded-md ${isVideo ? 'bg-slate-900' : 'border border-sky-200 bg-sky-50'}`}
          aria-hidden="true"
        >
          {isVideo ? <PlayIcon className="h-[18px] w-[18px] text-white" /> : <LinkIcon className="h-[18px] w-[18px] text-sky-700" />}
        </span>
        <span className="text-[13px] font-semibold text-cyan-700">{mode === 'edit' ? 'Editing link' : 'New link'}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={LINK_TITLE_MAX}
            placeholder="e.g. Video: Inside a plant cell (4 min)"
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600">Link</span>
          <input
            ref={urlRef}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            inputMode="url"
            placeholder="https://"
            className={INPUT}
            aria-invalid={error ? true : undefined}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="cursor-pointer rounded-[10px] bg-cyan-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save link'}
        </button>
      </div>
    </div>
  )
}
