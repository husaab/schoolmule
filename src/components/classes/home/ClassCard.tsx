// src/components/classes/home/ClassCard.tsx
// One class on the Classes home (the Teacher-Home board). The whole card is
// a link to the class; the ⋮ menu sits beside the link (not inside it), so
// opening the menu never opens the class.
'use client'

import Link from 'next/link'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import ClassBanner from '@/components/classes/identity/ClassBanner'
import ClassIcon from '@/components/classes/identity/ClassIcon'
import { classHref } from '@/lib/classroomRoutes'
import { cardMeta, cardNextLine, reviewPill } from '@/lib/classesHome'
import type { ClassCard as ClassCardData } from '@/services/types/classroom'
import ClassCardMenu from './ClassCardMenu'

export interface ClassCardActions {
  /** False when the viewer may not change classes (a past school year, for teachers). */
  canWrite: boolean
  onChangeBanner: (card: ClassCardData) => void
  onCopy: (card: ClassCardData) => void
  onArchive: (card: ClassCardData) => void
}

interface ClassCardProps extends ClassCardActions {
  card: ClassCardData
}

const PILL_TONE = {
  review: 'bg-cyan-100 text-cyan-800',
  calm: 'bg-slate-100 text-slate-600',
} as const

export default function ClassCard({ card, canWrite, onChangeBanner, onCopy, onArchive }: ClassCardProps) {
  const meta = cardMeta(card)
  const next = cardNextLine(card.next)
  const pill = reviewPill(card.toReviewCount)

  return (
    <div className="relative">
      <Link
        href={classHref(card.classId)}
        aria-label={`Open ${card.subject}, ${meta}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[box-shadow,border-color] hover:border-slate-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
      >
        <ClassBanner identity={card.identity} subject={card.subject} meta={meta} metaBackdrop className="h-28 shrink-0" />
        <span className="relative -mt-6 flex px-5">
          <ClassIcon
            identity={card.identity}
            size={48}
            className="border-[3px] border-white shadow-[0_2px_6px_rgba(15,23,42,0.08)]"
          />
        </span>
        <span className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-2.5">
          {/* pr-10 keeps the line clear of the ⋮ button beside it */}
          <span className="flex items-start gap-2.5 pr-10 text-sm text-slate-700">
            <DocumentTextIcon className="mt-px h-[18px] w-[18px] shrink-0 text-slate-500" aria-hidden="true" />
            <span className="min-w-0">
              <span className="text-slate-500">{next.when}</span> {next.what}
            </span>
          </span>
          <span className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold ${PILL_TONE[pill.tone]}`}>
            {pill.label}
          </span>
        </span>
      </Link>
      <ClassCardMenu
        classId={card.classId}
        label={`${card.subject}, ${meta}`}
        canWrite={canWrite}
        onChangeBanner={() => onChangeBanner(card)}
        onCopy={() => onCopy(card)}
        onArchive={() => onArchive(card)}
        className="absolute right-3 top-[122px]"
      />
    </div>
  )
}
