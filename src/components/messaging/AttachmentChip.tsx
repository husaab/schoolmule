'use client'

import React from 'react'
import { DocumentIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline'
import type { Attachment } from '@/services/types/messaging'
import { canView } from '@/components/media/useMediaViewer'
import { formatBytes, isImage } from './formatters'

/**
 * One attachment on a message. Images show as a thumbnail, documents as a
 * named chip. A picture or PDF opens in the media viewer (`onView`), which
 * recovers from a dead signed link; other documents are plain links, and with a
 * null URL (signing failed) a chip without a link rather than a broken one.
 */
const AttachmentChip: React.FC<{ attachment: Attachment; onView: () => void }> = ({ attachment, onView }) => {
  const { url, fileName, mimeType, sizeBytes } = attachment
  const Icon = mimeType === 'application/pdf' ? DocumentTextIcon : isImage(mimeType) ? PhotoIcon : DocumentIcon

  if (isImage(mimeType) && url) {
    return (
      <button
        type="button"
        onClick={onView}
        title={`${fileName} · ${formatBytes(sizeBytes)}`}
        className="group block w-40 cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Supabase URL */}
        <img src={url} alt={fileName} className="h-28 w-full object-cover transition-transform group-hover:scale-[1.02]" />
        <span className="block truncate px-2 py-1 text-[11px] text-slate-600">{fileName}</span>
      </button>
    )
  }

  const inner = (
    <>
      <Icon className={`h-5 w-5 flex-shrink-0 ${mimeType === 'application/pdf' ? 'text-rose-500' : 'text-slate-400'}`} />
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-slate-700">{fileName}</span>
        <span className="block text-[11px] text-slate-400">{formatBytes(sizeBytes)}</span>
      </span>
    </>
  )
  const chip = 'inline-flex max-w-xs items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5'

  if (canView({ name: fileName, mimeType })) {
    return (
      <button type="button" onClick={onView} className={`${chip} cursor-pointer text-left hover:bg-slate-50`}>
        {inner}
      </button>
    )
  }

  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`${chip} hover:bg-slate-50`}>
      {inner}
    </a>
  ) : (
    <span className={`${chip} opacity-70`}>{inner}</span>
  )
}

export default AttachmentChip
