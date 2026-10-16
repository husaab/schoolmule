// src/components/classes/identity/ClassBanner.tsx
// A class's banner: the picked or uploaded image over the class color's tint,
// with the subject (and a meta line) on top in the color's ink. The tint is
// what shows while the image loads, or if it fails to. The caller sets the
// height or aspect ratio through className.
'use client'

import { useState, type ReactNode } from 'react'
import { CLASS_COLORS } from '@/lib/classIdentity'
import type { ClassIdentity } from '@/services/types/classroom'
import ClassIcon from './ClassIcon'

interface ClassBannerProps {
  identity: ClassIdentity
  subject: string
  /** e.g. "Grade 5 · Amal Haddad". */
  meta?: ReactNode
  /** Show the class icon beside the subject (the header and preview layout). */
  withIcon?: boolean
  className?: string
  children?: ReactNode
}

export default function ClassBanner({ identity, subject, meta, withIcon = false, className = '', children }: ClassBannerProps) {
  const color = CLASS_COLORS[identity.color] ?? CLASS_COLORS.slate
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showImage = identity.bannerUrl && identity.bannerUrl !== failedUrl
  // A server-rendered <img> can fail before React attaches onError, so the
  // ref checks once it is attached too.
  const watch = (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) setFailedUrl(identity.bannerUrl)
  }

  return (
    <div className={`relative overflow-hidden ${color.tint} ${color.ink} ${className}`}>
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element -- static SVG or a public school-assets upload
        <img
          ref={watch}
          src={identity.bannerUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-right"
          onError={() => setFailedUrl(identity.bannerUrl)}
        />
      )}
      <div className="relative flex items-center gap-3.5 px-5 py-[18px]">
        {withIcon && (
          <ClassIcon identity={identity} size={52} className="shadow-[0_1px_2px_rgba(15,23,42,0.08)]" />
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-display text-[22px] font-semibold leading-tight">{subject}</span>
          {meta && <span className="truncate text-sm">{meta}</span>}
        </div>
      </div>
      {children}
    </div>
  )
}
