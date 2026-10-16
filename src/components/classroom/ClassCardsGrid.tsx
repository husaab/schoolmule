// src/components/classroom/ClassCardsGrid.tsx
// "My classes" on the student's Home (Student-Home board): one card per
// class with its banner, the subject and teacher on the banner, the icon
// overlapping its bottom edge, what is next, and a "New announcement" pill
// when there is a post the student has not opened. The whole card is a link.
'use client'

import Link from 'next/link'
import ClassIcon from '@/components/classes/identity/ClassIcon'
import { CLASS_COLORS } from '@/lib/classIdentity'
import { cardLines } from '@/lib/classroomText'
import type { StudentClassCard } from '@/services/types/studentPortal'

interface ClassCardsGridProps {
  classes: StudentClassCard[]
  hrefFor: (classId: string) => string
  now?: Date
}

function ClassCardTile({ card, href, now }: { card: StudentClassCard; href: string; now: Date }) {
  const color = CLASS_COLORS[card.identity.color] ?? CLASS_COLORS.slate
  const lines = cardLines(card.next, card.missingCount, now)
  return (
    <Link
      href={href}
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white text-slate-900 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-indigo-500"
    >
      <span className={`relative block h-[88px] overflow-hidden ${color.tint} ${color.ink}`}>
        {card.identity.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- static SVG or a public school-assets upload
          <img src={card.identity.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-right" />
        )}
        <span className="relative flex flex-col gap-0.5 px-4 py-3.5">
          <span className="truncate font-display text-[19px] font-semibold">{card.subject}</span>
          <span className="truncate text-[13px]">{card.teacher?.name ?? ''}</span>
        </span>
      </span>
      <span className="relative -mt-5 flex px-4">
        <ClassIcon identity={card.identity} size={40} className="border-[3px] border-white shadow-[0_2px_6px_rgba(15,23,42,0.08)]" />
      </span>
      <span className="flex flex-col gap-1.5 px-4 pb-3.5 pt-2 text-[13px] text-slate-600">
        {lines.missing && <span className="font-medium text-rose-700">{lines.missing}</span>}
        {lines.next && <span>{lines.next}</span>}
        {card.hasNewPost && (
          <span className="self-start rounded-full bg-indigo-50 px-[9px] py-[3px] text-xs font-semibold text-indigo-800">
            New announcement
          </span>
        )}
      </span>
    </Link>
  )
}

export default function ClassCardsGrid({ classes, hrefFor, now = new Date() }: ClassCardsGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
      {classes.map((c) => (
        <ClassCardTile key={c.classId} card={c} href={hrefFor(c.classId)} now={now} />
      ))}
    </div>
  )
}
