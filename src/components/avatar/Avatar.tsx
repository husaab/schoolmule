// src/components/avatar/Avatar.tsx
// The one way a person is pictured in SchoolMule: their photo when they have
// one, otherwise the illustrated avatar they picked (style, skin tone,
// background), otherwise one drawn from their name (lib/studentAvatar). Never
// initials. `neutral` shows the blank avatar instead of a drawn one.
'use client'

import { createElement, useState } from 'react'
import { isAvatarSpec, reactAttrs, resolveShapes } from '@/lib/avatar'
import { drawnAvatar } from '@/lib/studentAvatar'
import type { AvatarSpec } from '@/services/types/profile'

interface AvatarProps {
  /** Who this is; read out by screen readers. */
  name: string
  avatar?: AvatarSpec | null
  /** A signed photo URL. A photo that fails to load (an expired link) falls back to the avatar. */
  photoUrl?: string | null
  /** Pixels, width and height. */
  size?: number
  className?: string
  /** No pick shows the blank neutral avatar rather than one drawn from the name. */
  neutral?: boolean
}

export default function Avatar({ name, avatar = null, photoUrl = null, size = 32, className = '', neutral = false }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  // Server names can be missing (a removed sender): never let that throw.
  const label = (name ?? '').trim() || 'Avatar'
  const box = `inline-block shrink-0 rounded-full ${className}`

  // A server-rendered <img> can fail before React attaches onError, so the
  // ref checks once it is attached too.
  const watch = (el: HTMLImageElement | null) => {
    if (photoUrl && el && el.complete && el.naturalWidth === 0) setFailedUrl(photoUrl)
  }

  if (photoUrl && photoUrl !== failedUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not a static asset
      <img
        ref={watch}
        src={photoUrl}
        alt={label}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`${box} bg-slate-100 object-cover`}
        onError={() => setFailedUrl(photoUrl)}
      />
    )
  }

  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={`${box} overflow-hidden`}
    >
      {resolveShapes(isAvatarSpec(avatar) ? avatar : neutral ? null : drawnAvatar(name)).map((shape, i) =>
        createElement(shape.tag, { key: i, ...reactAttrs(shape.attrs) })
      )}
    </svg>
  )
}
