// src/components/classes/items/AttachmentRow.tsx
// One attachment in the item form (the Teacher-Assign board): the type badge
// or a thumbnail, the name and size, then Preview, Rename and Replace (files)
// or Edit (links), and remove. A file still waiting to go up, or one that
// failed, says so beside its name.
'use client'

import { useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { AttachmentThumb } from '@/components/classroom/AttachmentList'
import { ATTACHMENT_ACCEPT, attachmentMeta, attachmentName, previewKind } from '@/lib/attachments'
import type { AttachmentEditorRow } from './AttachmentsEditor'

interface AttachmentRowProps {
  row: AttachmentEditorRow
  disabled?: boolean
  onPreview: () => void
  onReplace: (file: File) => void
  /** Edit a link, or rename a file. */
  onEdit: () => void
  onRemove: () => void
  onRetry: () => void
}

const BUTTON =
  'cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

export default function AttachmentRow({ row, disabled = false, onPreview, onReplace, onEdit, onRemove, onRetry }: AttachmentRowProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const a = row.attachment
  const name = attachmentName(a)
  const meta = attachmentMeta(a)
  const working = row.state === 'working'
  const plainLink = previewKind(a) === 'link'

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 py-2.5 pl-3 pr-2.5">
      <AttachmentThumb attachment={a} thumbUrl={row.localUrl ?? null} />
      <span className="flex min-w-0 flex-[1_1_200px] flex-col">
        <span className="truncate text-sm font-medium text-slate-900">{name}</span>
        <span className="text-xs text-slate-500">
          {working ? (
            row.saved ? 'Saving…' : 'Uploading…'
          ) : row.state === 'error' ? (
            <span className="text-rose-700">{row.error ?? "This didn't save."}</span>
          ) : !row.saved ? (
            [meta, 'adds when the item saves'].filter(Boolean).join(' · ')
          ) : (
            meta
          )}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        {row.state === 'error' && !row.saved && (
          <button type="button" onClick={onRetry} disabled={disabled} className={BUTTON}>
            Retry
          </button>
        )}
        {plainLink && a.url ? (
          <a href={a.url} target="_blank" rel="noopener noreferrer" className={BUTTON}>
            Open
          </a>
        ) : (
          <button type="button" onClick={onPreview} disabled={working} className={BUTTON} aria-label={`Preview ${name}`}>
            Preview
          </button>
        )}
        {a.kind === 'file' ? (
          <>
            <button type="button" onClick={onEdit} disabled={disabled || working} className={BUTTON} aria-label={`Rename ${name}`}>
              Rename
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={disabled || working}
              className={BUTTON}
              aria-label={`Replace ${name}`}
            >
              Replace
            </button>
            <input
              ref={fileInput}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) onReplace(file)
              }}
            />
          </>
        ) : (
          <button type="button" onClick={onEdit} disabled={disabled || working} className={BUTTON} aria-label={`Edit ${name}`}>
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled || working}
          aria-label={`Remove ${name}`}
          className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XMarkIcon className="h-4 w-4" strokeWidth={2} />
        </button>
      </span>
    </div>
  )
}
