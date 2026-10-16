// src/components/classes/identity/ClassIdentityModal.tsx
// Settings → Change banner (the Banners board): pick a library banner or
// upload one, the class color and the icon, with a live preview. Library
// picks are a draft until Save, which sends one PATCH. An upload is saved the
// moment it is picked (the file has to reach storage anyway); closing the
// window afterwards still reports it, so the page never shows the old banner.
'use client'

import { useRef, useState } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button } from '@/components/shared/modalKit'
import {
  CLASS_COLORS,
  CLASS_COLOR_KEYS,
  CLASS_FAMILIES,
  DEFAULT_DRAFT,
  FAMILY_LABELS,
  draftOf,
  identityPatch,
  isDefaultDraft,
  pickBanner,
  pickColor,
  pickIcon,
  previewIdentity,
  type IdentityDraft,
} from '@/lib/classIdentity'
import { updateClassIdentity, uploadClassBanner } from '@/services/classroomService'
import type { ClassIdentity } from '@/services/types/classroom'
import ClassBanner from './ClassBanner'
import { cropBanner } from './bannerCrop'

interface ClassIdentityModalProps {
  classId: string
  subject: string
  /** e.g. "Grade 5" or "SK". */
  gradeLabel: string
  /** The lead teacher's name, for the preview's meta line. */
  teacherName: string
  identity: ClassIdentity
  isOpen: boolean
  onClose: () => void
  /** The identity the server now holds. */
  onSaved: (identity: ClassIdentity) => void
}

const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

const label = 'text-[13px] font-medium text-slate-600'
const labelNote = 'font-normal text-slate-500'

export default function ClassIdentityModal({
  classId,
  subject,
  gradeLabel,
  teacherName,
  identity,
  isOpen,
  onClose,
  onSaved,
}: ClassIdentityModalProps) {
  // `saved` is what the server holds (an upload changes it before Save).
  const [saved, setSaved] = useState<ClassIdentity>(identity)
  const [draft, setDraft] = useState<IdentityDraft>(() => draftOf(identity))
  const [uploaded, setUploaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // Each opening starts from the class as saved.
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    if (isOpen) {
      setSaved(identity)
      setDraft(draftOf(identity))
      setUploaded(false)
      setUploading(false)
      setSaving(false)
      setError(null)
    }
  }

  const busy = uploading || saving
  const preview = previewIdentity(saved, draft)
  const familyLabel = FAMILY_LABELS[saved.family]
  const meta = [gradeLabel, teacherName].filter(Boolean).join(' · ')

  const close = () => {
    if (busy) return
    if (uploaded) onSaved(saved)
    onClose()
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const banner = await cropBanner(file)
      const res = await uploadClassBanner(classId, banner)
      setSaved(res.data.identity)
      setDraft((d) => ({ ...d, banner: { kind: 'upload' } }))
      setUploaded(true)
    } catch (err) {
      setError(errorText(err, "The image couldn't be uploaded. Try again."))
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const save = async () => {
    const patch = identityPatch(saved, draft)
    if (!patch) {
      if (uploaded) onSaved(saved)
      onClose()
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await updateClassIdentity(classId, patch)
      setSaving(false)
      onSaved(res.data.identity)
      onClose()
    } catch (err) {
      setSaving(false)
      setError(errorText(err, "The changes couldn't be saved. Try again."))
    }
  }

  const bannerPressed = (key: string) =>
    draft.banner.kind !== 'upload' && preview.bannerKey === key
  const tileBorder = (on: boolean) => (on ? 'border-cyan-500' : 'border-transparent hover:border-slate-200')

  return (
    <Modal isOpen={isOpen} onClose={close} style="w-full max-w-5xl">
      <header className="border-b border-slate-100 px-6 py-[18px] pr-16">
        <h2 className="text-[17px] font-semibold text-slate-900">Class banner, color and icon</h2>
        <p className="text-[13px] text-slate-500">
          {gradeLabel} {subject} · students and parents see this too
        </p>
      </header>

      <div className="flex flex-wrap gap-6 p-6">
        {/* Preview and the upload/reset actions */}
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-2.5">
          <span className={label}>Preview</span>
          <ClassBanner
            identity={preview}
            subject={subject}
            meta={meta}
            withIcon
            className="aspect-[3.2/1] rounded-2xl"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-400 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" aria-hidden />
              ) : (
                <ArrowUpTrayIcon className="h-4 w-4 text-slate-500" aria-hidden />
              )}
              {uploading ? 'Uploading…' : 'Upload your own (1200 × 300, JPG or PNG)'}
            </button>
            <button
              type="button"
              onClick={() => setDraft(DEFAULT_DRAFT)}
              disabled={busy || isDefaultDraft(draft)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset to {familyLabel} default
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>
          {uploaded && (
            <p className="text-xs text-slate-500">Your image is saved. Pick a library banner to replace it.</p>
          )}
          {error && (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          )}
        </div>

        {/* Pickers */}
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className={label}>
              Class color <span className={labelNote}>· header, cards and tabs</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {CLASS_COLOR_KEYS.map((key) => {
                const c = CLASS_COLORS[key]
                const on = preview.color === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={c.label}
                    aria-pressed={on}
                    disabled={busy}
                    onClick={() => setDraft((d) => pickColor(saved, d, key))}
                    className={`h-9 w-9 cursor-pointer rounded-[10px] border-[3px] p-0 ${c.swatch} ${
                      on ? 'border-slate-900' : 'border-white ring-1 ring-slate-200'
                    } disabled:cursor-not-allowed`}
                  />
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={label}>
              Banner <span className={labelNote}>· pick one, or upload your own image</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {saved.bannerIsUpload && (
                <button
                  type="button"
                  aria-label="Your image"
                  aria-pressed={draft.banner.kind === 'upload'}
                  disabled={busy}
                  onClick={() => setDraft((d) => ({ ...d, banner: { kind: 'upload' } }))}
                  className={`block cursor-pointer overflow-hidden rounded-[10px] border-2 bg-white p-0 ${tileBorder(
                    draft.banner.kind === 'upload',
                  )}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- public school-assets upload */}
                  <img src={saved.bannerUrl} alt="" className="block aspect-[4/1] w-full object-cover" />
                </button>
              )}
              {CLASS_FAMILIES.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={FAMILY_LABELS[key]}
                  aria-pressed={bannerPressed(key)}
                  disabled={busy}
                  onClick={() => setDraft((d) => pickBanner(saved, d, key))}
                  className={`block cursor-pointer overflow-hidden rounded-[10px] border-2 bg-white p-0 ${tileBorder(
                    bannerPressed(key),
                  )}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- static SVG from public/class-banners */}
                  <img src={`/class-banners/${key}.svg`} alt="" className="block aspect-[4/1] w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={label}>Icon</span>
            <div className="flex flex-wrap gap-2">
              {CLASS_FAMILIES.map((key) => {
                const on = preview.iconKey === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={`${FAMILY_LABELS[key]} icon`}
                    aria-pressed={on}
                    disabled={busy}
                    onClick={() => setDraft((d) => pickIcon(saved, d, key))}
                    className={`flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-0 ${tileBorder(on)}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- static SVG from public/class-icons */}
                    <img src={`/class-icons/${key}.svg`} alt="" className="block h-10 w-10" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className="sticky bottom-0 flex justify-end gap-2.5 border-t border-slate-100 bg-white px-6 py-4">
        <Button variant="secondary" onClick={close} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={save} loading={saving} disabled={uploading}>
          Save
        </Button>
      </footer>
    </Modal>
  )
}
