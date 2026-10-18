// src/components/studentPortal/work/FileRow.tsx
// One file in "Your work" (Student-Assignment board): a tile, the name, "Photo ·
// 2.1 MB", and on the right whatever the row allows: a remove ✕ while the work
// can change, or Retry / Remove for a file that did not upload. Clicking the
// name opens the file. A photo's tile is the board's striped swatch; other
// files wear their type badge.
'use client'

import { ArrowPathIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { attachmentBadge } from '@/lib/attachments'
import { fileKindLabel } from '@/lib/itemPageText'
import type { SubmissionFile } from '@/services/types/studentPortal'

type FileShape = Pick<SubmissionFile, 'fileName' | 'mimeType' | 'sizeBytes'>

interface FileRowProps {
  file: FileShape
  /** Opens the file (a server file); absent while it is still on this device. */
  onOpen?: () => void
  /** The ✕. */
  onRemove?: () => void
  /** A file that is going up, or did not. */
  upload?: { status: 'uploading' } | { status: 'failed'; message: string; onRetry: () => void }
}

function Tile({ file }: { file: FileShape }) {
  const badge = attachmentBadge({ kind: 'file', mimeType: file.mimeType, fileName: file.fileName, youtubeId: null })
  if (badge.label === 'IMG') {
    return (
      <span
        aria-hidden="true"
        className="h-11 w-11 shrink-0 rounded-[10px]"
        style={{ background: 'repeating-linear-gradient(45deg, #e0e7ff 0 6px, #eef2ff 6px 12px)' }}
      />
    )
  }
  return (
    <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border text-[10px] font-bold ${badge.className}`}>
      {badge.label}
    </span>
  )
}

export default function FileRow({ file, onOpen, onRemove, upload }: FileRowProps) {
  const failed = upload?.status === 'failed'
  const meta = upload?.status === 'uploading' ? 'Uploading…' : fileKindLabel(file)
  const body = (
    <>
      <span className="truncate text-sm font-medium text-slate-900">{file.fileName}</span>
      <span className={`text-xs ${failed ? 'text-rose-700' : 'text-slate-500'}`}>
        {failed ? upload.message : meta}
      </span>
    </>
  )

  return (
    <li className={`flex items-center gap-3 rounded-[14px] border px-3.5 py-3 ${failed ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200'}`}>
      <Tile file={file} />
      {onOpen ? (
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 cursor-pointer flex-col text-left hover:opacity-80">
          {body}
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 flex-col">{body}</span>
      )}
      {upload?.status === 'uploading' && <ArrowPathIcon className="h-5 w-5 shrink-0 animate-spin text-indigo-500" aria-label="Uploading" />}
      {failed && (
        <button
          type="button"
          onClick={upload.onRetry}
          className="flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-rose-700 hover:text-rose-900"
        >
          <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      )}
      {onRemove && upload?.status !== 'uploading' && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.fileName}`}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <XMarkIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      )}
    </li>
  )
}
