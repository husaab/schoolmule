// src/components/classes/items/LinkEditor.tsx
// Adding or editing a link attachment in place (the Teacher-Assign board's
// "Editing link" box): a title and the address, then Cancel or Save link. A
// bare address gets https:// added; YouTube links play in the viewer. In
// "rename" mode it edits a file's display title only (blank = the file's own
// name).
'use client'

import { useEffect, useRef, useState } from 'react'
import { DocumentIcon, LinkIcon, PlayIcon } from '@heroicons/react/24/solid'
import { LINK_TITLE_MAX, normalizeLinkUrl, youtubeIdOf } from '@/lib/attachments'

interface LinkEditorProps {
  mode: 'add' | 'edit' | 'rename'
  initialTitle?: string
  initialUrl?: string
  /** Rename mode: the file's own name, shown when the title is blank. */
  fileName?: string | null
  /** Saves the link (or the file's title; `url` is '' then); resolves to an error message to show, or null once saved. */
  onSave: (title: string | null, url: string) => Promise<string | null>
  onCancel: () => void
}

const INPUT =
  'w-full rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500'

export default function LinkEditor({ mode, initialTitle = '', initialUrl = '', fileName = null, onSave, onCancel }: LinkEditorProps) {
  const renaming = mode === 'rename'
  const [title, setTitle] = useState(initialTitle)
  const [url, setUrl] = useState(initialUrl)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const urlRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ;(renaming ? titleRef : urlRef).current?.focus()
  }, [renaming])

  const normalized = normalizeLinkUrl(url)
  const isVideo = !renaming && normalized ? youtubeIdOf(normalized) !== null : false

  const save = async () => {
    if (saving) return
    if (!renaming && !normalized) {
      setError('Enter a link that starts with http:// or https://')
      return
    }
    if (title.trim().length > LINK_TITLE_MAX) {
      setError(`Keep the link title to ${LINK_TITLE_MAX} characters`)
      return
    }
    setSaving(true)
    setError(null)
    const problem = await onSave(title.trim() || null, renaming ? '' : normalized!)
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
          {isVideo ? (
            <PlayIcon className="h-[18px] w-[18px] text-white" />
          ) : renaming ? (
            <DocumentIcon className="h-[18px] w-[18px] text-sky-700" />
          ) : (
            <LinkIcon className="h-[18px] w-[18px] text-sky-700" />
          )}
        </span>
        <span className="text-[13px] font-semibold text-cyan-700">
          {renaming ? 'Renaming file' : mode === 'edit' ? 'Editing link' : 'New link'}
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600">{renaming ? 'Name students see' : 'Title'}</span>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setError(null)
            }}
            maxLength={LINK_TITLE_MAX}
            placeholder={renaming ? fileName ?? 'File name' : 'e.g. Video: Inside a plant cell (4 min)'}
            className={INPUT}
          />
          {renaming && <span className="text-[11px] text-slate-500">Leave it blank to use the file&apos;s name.</span>}
        </label>
        {!renaming && (
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
        )}
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
          {saving ? 'Saving…' : renaming ? 'Save name' : 'Save link'}
        </button>
      </div>
    </div>
  )
}
