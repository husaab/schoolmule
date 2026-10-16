// src/components/classroom/AttachmentPreviewModal.tsx
// The one viewer for a classwork attachment, for teachers, students and
// parents alike: an image, a PDF or a video opens right here, a YouTube link
// plays through youtube-nocookie, any other link opens in a new tab and any
// other file downloads. The address is asked for when the window opens
// (`resolveUrl`), so a signed link is always fresh.
'use client'

import { useEffect, useState } from 'react'
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalHeader } from '@/components/shared/modalKit'
import Spinner from '@/components/Spinner'
import { attachmentMeta, attachmentName, previewKind, youtubeEmbedUrl } from '@/lib/attachments'
import type { Attachment } from '@/services/types/classwork'

interface AttachmentPreviewModalProps {
  attachment: Attachment
  /** The address to show: a fresh signed URL for a file, the link itself for a link. */
  resolveUrl: () => Promise<string>
  onClose: () => void
}

type Loaded = { status: 'loading' } | { status: 'ready'; url: string } | { status: 'error'; message: string }

export default function AttachmentPreviewModal({ attachment, resolveUrl, onClose }: AttachmentPreviewModalProps) {
  const kind = previewKind(attachment)
  const name = attachmentName(attachment)
  const meta = attachmentMeta(attachment)
  // A YouTube video needs no address from the server.
  const needsUrl = kind !== 'youtube'
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  // resolveUrl is usually an inline closure; ask again only for a new attachment or a retry.
  const id = attachment.attachmentId
  useEffect(() => {
    if (!needsUrl) return
    let cancelled = false
    resolveUrl().then(
      (url) => !cancelled && setLoaded({ status: 'ready', url }),
      (err: unknown) =>
        !cancelled &&
        setLoaded({ status: 'error', message: err instanceof Error && err.message ? err.message : "This file couldn't be opened." }),
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, needsUrl, attempt])

  const url = loaded.status === 'ready' ? loaded.url : null

  const action =
    url && (kind === 'link' ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
        Open link
      </a>
    ) : (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download={attachment.fileName ?? undefined}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
        Download
      </a>
    ))

  return (
    <Modal isOpen onClose={onClose} size="4xl">
      <ModalHeader title={name} subtitle={meta || undefined} icon={PaperClipIcon} actions={kind !== 'youtube' ? action : undefined} />
      <ModalBody className="!space-y-0">
        {kind === 'youtube' && attachment.youtubeId ? (
          <div className="relative w-full overflow-hidden rounded-xl bg-slate-900 pt-[56.25%]">
            <iframe
              src={youtubeEmbedUrl(attachment.youtubeId)}
              title={name}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        ) : loaded.status === 'loading' ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : loaded.status === 'error' ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm text-slate-600">{loaded.message}</p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setLoaded({ status: 'loading' })
                setAttempt((n) => n + 1)
              }}
            >
              Try again
            </Button>
          </div>
        ) : kind === 'image' ? (
          <div className="flex justify-center rounded-xl bg-slate-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not a static asset */}
            <img src={url!} alt={name} className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain" />
          </div>
        ) : kind === 'pdf' ? (
          <iframe src={url!} title={name} className="h-[68vh] w-full rounded-xl border border-slate-200 bg-slate-50" />
        ) : kind === 'video' ? (
          <video src={url!} controls className="max-h-[68vh] w-full rounded-xl bg-slate-900">
            <track kind="captions" />
          </video>
        ) : (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <p className="text-sm text-slate-600">
              {kind === 'link' ? 'This link opens in a new tab.' : "This file can't be shown here. Download it to open it."}
            </p>
            {action}
          </div>
        )}
      </ModalBody>
    </Modal>
  )
}
