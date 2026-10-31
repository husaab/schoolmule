// src/components/reports/PdfViewerModal.tsx
// A generated PDF in a large modal: whose it is and which term in the header,
// the actions that fit it (Download, Email…) beside the title, and the
// browser's own PDF viewer below. A spinner covers the frame until it loads.
'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { ModalHeader } from '@/components/shared/modalKit'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** A signed URL or a blob: URL. */
  src: string | null
  title: string
  subtitle?: string
  /** Buttons shown at the right of the header. */
  actions?: ReactNode
}

export default function PdfViewerModal({ isOpen, onClose, src, title, subtitle, actions }: Props) {
  // Keyed by src so a new document shows the spinner again.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const loading = !!src && loadedSrc !== src

  // Some browsers never fire load for a PDF frame; don't hide it behind the spinner for good.
  useEffect(() => {
    if (!src) return
    const t = setTimeout(() => setLoadedSrc(src), 4000)
    return () => clearTimeout(t)
  }, [src])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnEscape
      fullScreenOnMobile
      maxHeightClass="max-h-[100dvh] sm:max-h-[92vh]"
      style="w-full max-w-5xl h-[100dvh] sm:h-[90vh]"
      ariaLabel={title}
    >
      <div className="flex h-full flex-col">
        <ModalHeader title={title} subtitle={subtitle} icon={DocumentTextIcon} actions={actions} />
        <div className="relative flex-1 bg-slate-100">
          {src ? (
            <iframe src={src} title={title} onLoad={() => setLoadedSrc(src)} className="h-full w-full border-0" />
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">This PDF couldn&apos;t be loaded.</p>
          )}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100" aria-hidden="true">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-cyan-100 border-t-cyan-600" />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
