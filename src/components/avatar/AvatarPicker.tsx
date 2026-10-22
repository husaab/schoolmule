// src/components/avatar/AvatarPicker.tsx
// The avatar builder from the Photos board: a big preview, then style chips,
// skin tone and background swatches, and Save. Controlled: the caller holds
// the value and does the saving.
'use client'

import { useId } from 'react'
import { AVATAR_BGS, AVATAR_SKINS, AVATAR_SKIN_ORDER, AVATAR_STYLES } from '@/lib/avatar'
import type { AvatarSpec } from '@/services/types/profile'
import Avatar from './Avatar'

interface AvatarPickerProps {
  value: AvatarSpec
  onChange: (value: AvatarSpec) => void
  onSave: () => void
  saving?: boolean
  /** Shows "Use a photo instead" (adults, or students when the school allows photos). */
  photosAllowed?: boolean
  onUsePhoto?: () => void
  /** Whose avatar this is, shown under the preview. */
  name?: string
  /** Shown under the actions when saving failed. */
  error?: string | null
}

const sectionLabel = 'text-[13px] font-semibold text-slate-600'
const selectedRing = 'border-indigo-600'

export default function AvatarPicker({
  value,
  onChange,
  onSave,
  saving = false,
  photosAllowed = false,
  onUsePhoto,
  name,
  error,
}: AvatarPickerProps) {
  const id = useId()
  return (
    <div className="flex flex-wrap items-start gap-7">
      <div className="flex flex-none flex-col items-center gap-3">
        <div className="overflow-hidden rounded-full shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)]">
          <Avatar name={name ? `${name}'s avatar` : 'Avatar preview'} avatar={value} size={168} />
        </div>
        {name && <span className="text-base font-semibold text-slate-900">{name}</span>}
        <span className="text-[13px] text-slate-500">Pick yours. You can change it any time.</span>
      </div>

      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className={sectionLabel} id={`${id}-style`}>
            Style
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${id}-style`}>
            {AVATAR_STYLES.map((style) => {
              const on = value.style === style.id
              return (
                <button
                  key={style.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ ...value, style: style.id })}
                  className={`min-h-11 cursor-pointer rounded-xl border-2 px-3.5 py-2 text-sm font-medium text-slate-900 transition-colors ${
                    on ? `${selectedRing} bg-indigo-50` : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {style.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={sectionLabel} id={`${id}-skin`}>
            Skin tone
          </span>
          <div className="flex flex-wrap gap-2.5" role="group" aria-labelledby={`${id}-skin`}>
            {AVATAR_SKIN_ORDER.map((i) => {
              const skin = AVATAR_SKINS[i]
              const on = value.skin === i
              return (
                <button
                  key={skin.hex}
                  type="button"
                  aria-label={skin.label}
                  aria-pressed={on}
                  onClick={() => onChange({ ...value, skin: i })}
                  style={{ backgroundColor: skin.hex }}
                  className={`h-11 w-11 cursor-pointer rounded-full border-[3px] p-0 ring-1 ring-slate-200 ${
                    on ? selectedRing : 'border-white'
                  }`}
                />
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={sectionLabel} id={`${id}-bg`}>
            Background
          </span>
          <div className="flex flex-wrap gap-2.5" role="group" aria-labelledby={`${id}-bg`}>
            {AVATAR_BGS.map((bg, i) => {
              const on = value.bg === i
              return (
                <button
                  key={bg.label}
                  type="button"
                  aria-label={bg.label}
                  aria-pressed={on}
                  onClick={() => onChange({ ...value, bg: i as AvatarSpec['bg'] })}
                  style={{ backgroundColor: bg.bg }}
                  className={`h-11 w-11 cursor-pointer rounded-xl border-[3px] p-0 ring-1 ring-slate-200 ${
                    on ? selectedRing : 'border-white'
                  }`}
                />
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
            )}
            {saving ? 'Saving…' : 'Save avatar'}
          </button>
          {photosAllowed && onUsePhoto && (
            <button
              type="button"
              onClick={onUsePhoto}
              disabled={saving}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Use a photo instead
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
