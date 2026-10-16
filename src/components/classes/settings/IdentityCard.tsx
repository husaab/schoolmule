// src/components/classes/settings/IdentityCard.tsx
// Settings → Banner, color & icon (the Teacher-Settings board): the current
// banner and icon, "Change" (the full Banners window), "Upload your own", a
// row of class colors that save the moment one is picked, and a reset to the
// subject's look. Read-only when the viewer may not edit the class.
'use client'

import { useRef, useState } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import ClassIcon from '@/components/classes/identity/ClassIcon'
import { cropBanner } from '@/components/classes/identity/bannerCrop'
import {
  CLASS_COLORS,
  CLASS_COLOR_KEYS,
  FAMILY_LABELS,
  draftOf,
  identityPatch,
  isDefaultDraft,
  pickColor,
  type ClassColor,
} from '@/lib/classIdentity'
import { resetClassIdentity, updateClassIdentity, uploadClassBanner } from '@/services/classroomService'
import type { ClassIdentity } from '@/services/types/classroom'

interface IdentityCardProps {
  classId: string
  identity: ClassIdentity
  canEdit: boolean
  /** Opens the Banners window (banner library, all colors, icons). */
  onOpenEditor: () => void
  /** The identity the server now holds. */
  onChanged: (identity: ClassIdentity) => void
}

/** The swatches shown inline; the rest are behind "More colors". */
const INLINE_COLORS = 7

const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

export default function IdentityCard({ classId, identity, canEdit, onOpenEditor, onChanged }: IdentityCardProps) {
  const [busy, setBusy] = useState<'upload' | 'color' | 'reset' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const color = CLASS_COLORS[identity.color] ?? CLASS_COLORS.slate
  const isDefault = isDefaultDraft(draftOf(identity))
  // The first seven in picker order, plus the class's own color when it is further down the list.
  const swatches: ClassColor[] = CLASS_COLOR_KEYS.slice(0, INLINE_COLORS)
  if (!swatches.includes(identity.color)) swatches.push(identity.color)

  const run = async (kind: 'upload' | 'color' | 'reset', task: () => Promise<ClassIdentity>, fallback: string) => {
    setBusy(kind)
    setError(null)
    try {
      onChanged(await task())
    } catch (err) {
      setError(errorText(err, fallback))
    } finally {
      setBusy(null)
    }
  }

  const pick = (key: ClassColor) => {
    const patch = identityPatch(identity, pickColor(identity, draftOf(identity), key))
    if (!patch) return
    void run('color', async () => (await updateClassIdentity(classId, patch)).data.identity, "The color couldn't be saved. Try again.")
  }

  const upload = (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = ''
    if (!file) return
    void run(
      'upload',
      async () => (await uploadClassBanner(classId, await cropBanner(file))).data.identity,
      "The image couldn't be uploaded. Try again.",
    )
  }

  const reset = () =>
    void run('reset', async () => (await resetClassIdentity(classId)).data.identity, "The class couldn't be reset. Try again.")

  const showImage = !!identity.bannerUrl && identity.bannerUrl !== failedUrl

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-slate-200/70 bg-white p-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-[19px] font-semibold text-slate-900">Banner, color &amp; icon</h3>
        <span className="text-xs text-slate-500">Students and parents see these</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`relative aspect-[4/1] min-w-0 max-w-[520px] flex-[1_1_360px] overflow-hidden rounded-xl ${color.tint}`}
        >
          {showImage && (
            // eslint-disable-next-line @next/next/no-img-element -- static SVG or a public school-assets upload
            <img
              src={identity.bannerUrl}
              alt="Current banner"
              className="absolute inset-0 h-full w-full object-cover object-right"
              onError={() => setFailedUrl(identity.bannerUrl)}
            />
          )}
        </div>
        <ClassIcon identity={identity} size={64} />
        {canEdit && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onOpenEditor}
              disabled={busy !== null}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy !== null}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-400 bg-slate-50 px-3.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === 'upload' ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" aria-hidden="true" />
              ) : (
                <ArrowUpTrayIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
              )}
              {busy === 'upload' ? 'Uploading…' : 'Upload your own'}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="mr-1 text-[13px] font-medium text-slate-600">Class color</span>
        {swatches.map((key) => {
          const c = CLASS_COLORS[key]
          const on = identity.color === key
          return (
            <button
              key={key}
              type="button"
              aria-label={c.label}
              aria-pressed={on}
              disabled={!canEdit || busy !== null}
              onClick={() => pick(key)}
              className={`h-8 w-8 rounded-[9px] border-[3px] p-0 ${c.swatch} ${
                on ? 'border-slate-900' : 'border-white ring-1 ring-slate-200'
              } ${canEdit ? 'cursor-pointer disabled:cursor-wait' : 'cursor-default'}`}
            />
          )
        })}
        {canEdit && (
          <button
            type="button"
            onClick={onOpenEditor}
            disabled={busy !== null}
            className="cursor-pointer text-[13px] font-medium text-cyan-700 hover:text-cyan-800 disabled:cursor-not-allowed"
          >
            More colors
          </button>
        )}
      </div>

      <p className="text-[13px] text-slate-500">
        {FAMILY_LABELS[identity.family]} default.
        {canEdit && (
          <>
            {' '}
            <button
              type="button"
              onClick={reset}
              disabled={isDefault || busy !== null}
              className="cursor-pointer font-medium text-cyan-700 hover:text-cyan-800 disabled:cursor-default disabled:text-slate-400"
            >
              {busy === 'reset' ? 'Resetting…' : 'Reset to default'}
            </button>
          </>
        )}
      </p>

      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}
