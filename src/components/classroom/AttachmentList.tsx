// src/components/classroom/AttachmentList.tsx
// Read-only attachment rows (type badge or thumbnail, name, size or site)
// with Preview, which opens the shared viewer in place. Used wherever an item
// is read rather than edited: the student's and the parent's item pages, the
// messages about a piece of work. A plain web link opens in a new tab.
'use client'

import { useState } from 'react'
import { ArrowTopRightOnSquareIcon, PlayIcon } from '@heroicons/react/24/solid'
import AttachmentPreviewModal from '@/components/classroom/AttachmentPreviewModal'
import { attachmentBadge, attachmentMeta, attachmentName, previewKind } from '@/lib/attachments'
import type { Attachment } from '@/services/types/classwork'

/** The small picture at the start of a row: a photo's thumbnail, a video tile, or the type badge. */
export function AttachmentThumb({ attachment, thumbUrl }: { attachment: Attachment; thumbUrl?: string | null }) {
  const kind = previewKind(attachment)
  if (kind === 'youtube') {
    return (
      <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-md bg-slate-900" aria-hidden="true">
        <PlayIcon className="h-[18px] w-[18px] text-white" />
      </span>
    )
  }
  const src = thumbUrl ?? (kind === 'image' ? attachment.url : null)
  if (kind === 'image' && src) {
    // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not a static asset
    return <img src={src} alt="" className="h-10 w-16 shrink-0 rounded-md bg-slate-100 object-cover" />
  }
  const badge = attachmentBadge(attachment)
  return (
    <span
      className={`flex h-12 w-10 shrink-0 items-end justify-center rounded-md border pb-1.5 text-[10px] font-bold ${badge.className}`}
      aria-hidden="true"
    >
      {badge.label}
    </span>
  )
}

interface AttachmentListProps {
  attachments: Attachment[]
  /** A fresh address for one attachment (the caller's endpoint: teacher, student or parent). */
  resolveUrl: (attachment: Attachment) => Promise<string>
  className?: string
}

const BUTTON =
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 transition-colors hover:bg-slate-50'

export default function AttachmentList({ attachments, resolveUrl, className = '' }: AttachmentListProps) {
  const [previewing, setPreviewing] = useState<Attachment | null>(null)
  if (attachments.length === 0) return null

  return (
    <>
      <ul className={`flex flex-col gap-2 ${className}`}>
        {attachments.map((a) => {
          const name = attachmentName(a)
          const meta = attachmentMeta(a)
          const plainLink = previewKind(a) === 'link'
          return (
            <li
              key={a.attachmentId}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 py-2.5 pl-3 pr-2.5"
            >
              <AttachmentThumb attachment={a} />
              <span className="flex min-w-0 flex-[1_1_180px] flex-col">
                <span className="truncate text-sm font-medium text-slate-900">{name}</span>
                {meta && <span className="text-xs text-slate-500">{meta}</span>}
              </span>
              {plainLink && a.url ? (
                <a href={a.url} target="_blank" rel="noopener noreferrer" className={BUTTON}>
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Open
                </a>
              ) : (
                <button type="button" onClick={() => setPreviewing(a)} className={BUTTON} aria-label={`Preview ${name}`}>
                  Preview
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {previewing && (
        <AttachmentPreviewModal
          attachment={previewing}
          resolveUrl={() => resolveUrl(previewing)}
          onClose={() => setPreviewing(null)}
        />
      )}
    </>
  )
}
