// src/components/avatar/AvatarPickerModal.tsx
// The avatar picker in a modal: for "Change avatar" on Settings and the
// student menu, and for a teacher picking for a child who doesn't sign in.
// It keeps its own draft; onSave persists it, and the modal closes once that
// succeeds (a failure stays open with the server's message).
'use client'

import { useState } from 'react'
import Modal from '@/components/shared/modal'
import { DEFAULT_AVATAR, isAvatarSpec } from '@/lib/avatar'
import { drawnAvatar } from '@/lib/studentAvatar'
import type { AvatarSpec } from '@/services/types/profile'
import AvatarPicker from './AvatarPicker'

interface AvatarPickerModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** The saved avatar; null starts the picker on the one their name draws (what they show now). */
  value: AvatarSpec | null
  onSave: (avatar: AvatarSpec) => Promise<void>
  /** Whose avatar this is, shown under the preview. */
  name?: string
  photosAllowed?: boolean
  /** "Use a photo instead": the modal closes first. */
  onUsePhoto?: () => void
}

export default function AvatarPickerModal({
  isOpen,
  onClose,
  title,
  subtitle,
  value,
  onSave,
  name,
  photosAllowed = false,
  onUsePhoto,
}: AvatarPickerModalProps) {
  const start = (): AvatarSpec => (isAvatarSpec(value) ? value : drawnAvatar(name) ?? DEFAULT_AVATAR)
  const [draft, setDraft] = useState<AvatarSpec>(start)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Every opening starts from what is saved, not from an abandoned draft
  // (reset while rendering, so the first open frame already shows it).
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    if (isOpen) {
      setDraft(start())
      setError(null)
      setSaving(false)
    }
  }

  const close = () => {
    if (!saving) onClose()
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      setSaving(false)
      onClose()
    } catch (err) {
      setSaving(false)
      setError(err instanceof Error && err.message ? err.message : "Your avatar couldn't be saved. Try again.")
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} style="w-full max-w-3xl">
      <header className="border-b border-slate-100 px-6 py-5 pr-16">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </header>
      <div className="px-6 py-6">
        <AvatarPicker
          value={draft}
          onChange={setDraft}
          onSave={save}
          saving={saving}
          name={name}
          error={error}
          photosAllowed={photosAllowed}
          onUsePhoto={
            onUsePhoto
              ? () => {
                  onClose()
                  onUsePhoto()
                }
              : undefined
          }
        />
      </div>
    </Modal>
  )
}
