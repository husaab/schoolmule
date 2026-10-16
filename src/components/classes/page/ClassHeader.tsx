// src/components/classes/page/ClassHeader.tsx
// The top of every class page (the class boards): a back link to the Classes
// list as the user left it, then the class banner tinted with the class
// color, with the icon, the subject, "Grade 5 · Term 1 · lead, with co" and
// "Change banner" for those who may edit. The tab bar goes in as children so
// it sits at the bottom of the banner. `actions` is where the student and
// parent variants put "Message {teacher}"; the teacher page passes none.
'use client'

import { useState, type ReactNode } from 'react'
import { ChevronRightIcon, PhotoIcon } from '@heroicons/react/24/outline'
import BackLink from '@/components/shared/BackLink'
import ClassIcon from '@/components/classes/identity/ClassIcon'
import { CLASS_COLORS } from '@/lib/classIdentity'
import { classTitle, headerMeta } from '@/lib/classesHome'
import type { ClassPageData } from '@/services/types/classroom'

interface ClassHeaderProps {
  data: ClassPageData
  /** Opens the banner, color and icon window; shown only when the viewer may edit. */
  onChangeBanner?: () => void
  actions?: ReactNode
  /** The tab bar. */
  children?: ReactNode
  /** The list the back link returns to (with its remembered filters). */
  backTo?: string
  backLabel?: string
}

export default function ClassHeader({
  data,
  onChangeBanner,
  actions,
  children,
  backTo = '/classes',
  backLabel = 'Classes',
}: ClassHeaderProps) {
  const cls = data.class
  const { identity } = cls
  const color = CLASS_COLORS[identity.color] ?? CLASS_COLORS.slate
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showImage = !!identity.bannerUrl && identity.bannerUrl !== failedUrl
  // A server-rendered <img> can fail before React attaches onError.
  const watch = (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) setFailedUrl(identity.bannerUrl)
  }
  const canChangeBanner = !!onChangeBanner && data.permissions.canEdit

  return (
    <header>
      <div className="flex min-w-0 items-center gap-2 border-b border-slate-200 bg-white px-6 py-4 text-[15px] lg:px-8">
        <BackLink to={backTo} className="shrink-0 text-slate-500 transition-colors hover:text-slate-800">
          {backLabel}
        </BackLink>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <h1 className="truncate text-lg font-semibold text-slate-900">{classTitle(cls.grade, cls.subject)}</h1>
      </div>

      <div className={`relative overflow-hidden ${color.tint} ${color.ink}`}>
        {showImage && (
          // eslint-disable-next-line @next/next/no-img-element -- static SVG or a public school-assets upload
          <img
            ref={watch}
            src={identity.bannerUrl}
            alt=""
            // On a phone the art sits behind the title, so it is faded there.
            className="absolute inset-0 h-full w-full object-cover object-right opacity-35 sm:opacity-100"
            onError={() => setFailedUrl(identity.bannerUrl)}
          />
        )}
        <div className={`relative flex max-w-[1180px] flex-col gap-5 px-6 pt-7 lg:px-8 ${children ? '' : 'pb-7'}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <ClassIcon
                identity={identity}
                size={60}
                className="border-[3px] border-white shadow-[0_2px_6px_rgba(15,23,42,0.08)]"
              />
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="font-display text-[28px] font-semibold leading-tight sm:text-[34px]">{cls.subject}</h2>
                <span className="text-[15px]">{headerMeta(cls, data.teachers)}</span>
              </div>
            </div>
            {(actions || canChangeBanner) && (
              <div className="flex flex-wrap items-center gap-2">
                {actions}
                {canChangeBanner && (
                  <button
                    type="button"
                    onClick={onChangeBanner}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/85 px-3 py-2 text-[13px] font-medium transition-colors hover:bg-white"
                  >
                    <PhotoIcon className="h-4 w-4" aria-hidden="true" />
                    Change banner
                  </button>
                )}
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
    </header>
  )
}
