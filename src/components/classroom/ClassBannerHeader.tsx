// src/components/classroom/ClassBannerHeader.tsx
// A class's banner as a student or parent sees it (Student-Class, Student-Grades
// and Parent-Lens boards): the picked image over the class color's tint, the
// icon, the subject, a meta line, an `actions` slot on the right (the "Message
// {teacher}" button, or a grade) and the tab bar as children at the bottom.
//  - page:  the top of the student's class page (large title, tabs at the bottom)
//  - card:  the top of the parent lens' card (the card clips it)
//  - panel: a standalone rounded block (the Grades page header)
'use client'

import { useState, type ReactNode } from 'react'
import ClassIcon from '@/components/classes/identity/ClassIcon'
import { CLASS_COLORS } from '@/lib/classIdentity'
import type { ClassIdentity } from '@/services/types/classroom'

type Variant = 'page' | 'card' | 'panel'

interface ClassBannerHeaderProps {
  identity: ClassIdentity
  /** The subject. */
  title: string
  /** "Grade 5 · Ms. Siddiqui and Mr. Haddad". */
  meta: ReactNode
  actions?: ReactNode
  /** The tab bar. */
  children?: ReactNode
  variant?: Variant
  /** The page's top bar already holds the h1; the class page uses h2. */
  headingLevel?: 'h1' | 'h2'
}

const FRAME: Record<Variant, string> = {
  page: 'rounded-t-[18px]',
  card: '',
  panel: 'rounded-[18px]',
}

const INNER: Record<Variant, string> = {
  page: 'px-5 pt-6 sm:px-8 sm:pt-8',
  card: 'px-5 pt-5 sm:px-6 sm:pt-[22px]',
  panel: 'px-5 py-5 sm:px-6 sm:py-[22px]',
}

const ICON_SIZE: Record<Variant, number> = { page: 64, card: 52, panel: 52 }

const TITLE: Record<Variant, string> = {
  page: 'text-[30px] sm:text-[38px]',
  card: 'text-[24px] sm:text-[28px]',
  panel: 'text-[22px] sm:text-[26px]',
}

export default function ClassBannerHeader({
  identity,
  title,
  meta,
  actions,
  children,
  variant = 'page',
  headingLevel = 'h2',
}: ClassBannerHeaderProps) {
  const color = CLASS_COLORS[identity.color] ?? CLASS_COLORS.slate
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showImage = !!identity.bannerUrl && identity.bannerUrl !== failedUrl
  // A server-rendered <img> can fail before React attaches onError.
  const watch = (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) setFailedUrl(identity.bannerUrl)
  }
  const Heading = headingLevel

  return (
    <div className={`relative overflow-hidden ${color.tint} ${color.ink} ${FRAME[variant]}`}>
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
      <div className={`relative flex max-w-[1100px] flex-col gap-[18px] ${INNER[variant]} ${children ? '' : variant === 'page' ? 'pb-6' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <ClassIcon
              identity={identity}
              size={ICON_SIZE[variant]}
              className="border-[3px] border-white shadow-[0_2px_6px_rgba(15,23,42,0.08)]"
            />
            <div className="flex min-w-0 flex-col gap-1.5">
              <Heading className={`font-display font-semibold leading-[1.1] ${TITLE[variant]}`}>{title}</Heading>
              <span className="text-sm sm:text-[15px]">{meta}</span>
            </div>
          </div>
          {actions}
        </div>
        {children}
      </div>
    </div>
  )
}
