'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/shared/modal'
import CategoryTag from './CategoryTag'
import ImageLightbox from './ImageLightbox'
import { dismissPatchNotes } from '@/services/patchNoteService'
import { usePatchNotesStore } from '@/store/usePatchNotesStore'
import type { PatchNote } from '@/services/types/patchNote'
import DOMPurify from 'dompurify'

interface PatchNotesModalProps {
  isOpen: boolean
  onClose: () => void
  notes: PatchNote[]
}

export default function PatchNotesModal({ isOpen, onClose, notes }: PatchNotesModalProps) {
  const router = useRouter()
  const clearUnread = usePatchNotesStore((s) => s.clearUnread)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  if (notes.length === 0) return null

  const latestVersion = notes[0].version
  const latestDate = new Date(notes[0].publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const handleDismiss = async () => {
    try {
      await dismissPatchNotes(notes[0].patchNoteId)
      clearUnread()
      onClose()
    } catch {
      onClose()
    }
  }

  const handleViewAll = () => {
    handleDismiss()
    router.push('/whats-new')
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleDismiss} size="lg">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-900">What&apos;s New</h2>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {latestVersion}
              </span>
            </div>
            <p className="text-sm text-slate-500">{latestDate}</p>
          </div>

          {/* Notes list */}
          <div className="flex flex-col gap-4 mb-8 max-h-[55vh] overflow-y-auto pr-1">
            {notes.map((note) => (
              <div
                key={note.patchNoteId}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CategoryTag category={note.category} />
                </div>
                <h3 className="font-semibold text-base text-slate-900">{note.title}</h3>
                <div
                  className="text-sm text-slate-600 mt-1.5 prose prose-sm max-w-none leading-relaxed break-words overflow-wrap-anywhere"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.body) }}
                />
                {note.imageUrl && (
                  <button
                    onClick={() => setLightboxImage(note.imageUrl)}
                    className="mt-3 w-full rounded-lg overflow-hidden border border-slate-200 hover:border-slate-300 transition-colors bg-white"
                  >
                    <img
                      src={note.imageUrl}
                      alt={note.title}
                      className="w-full max-h-48 object-contain"
                    />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={handleViewAll}
              className="text-cyan-600 text-sm font-medium hover:text-cyan-700 transition-colors"
            >
              View all updates →
            </button>
            <button
              onClick={handleDismiss}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-cyan-500 hover:to-teal-500 transition-all shadow-sm"
            >
              Got it!
            </button>
          </div>
        </div>
      </Modal>

      <ImageLightbox
        src={lightboxImage || ''}
        alt="Patch note screenshot"
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </>
  )
}
