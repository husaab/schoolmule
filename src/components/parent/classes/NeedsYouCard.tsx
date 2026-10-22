// src/components/parent/classes/NeedsYouCard.tsx
// "Needs you" at the top of the parent's Classes page (Parent-Classes board):
// posts that ask for a "Got it", and work a child has missing with a link to
// ask the teacher (the title opens the child's work, read-only). Hidden when
// nothing needs the parent. On a phone only the chosen child's rows show.
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/avatar/Avatar'
import { firstNameOf, needsYouMissingSubline } from '@/lib/classroomText'
import { parentItemHref } from '@/lib/portalRoutes'
import type { ChildClassroomSummary, NeedsYouAck, NeedsYouItem, NeedsYouMissing } from '@/services/types/parentClassroom'

interface NeedsYouCardProps {
  items: NeedsYouItem[]
  kids: ChildClassroomSummary[]
  onGotIt: (item: NeedsYouAck) => Promise<void>
  onAsk: (item: NeedsYouMissing) => void
  /** On a phone, rows about other children are hidden. */
  phoneChildId?: string | null
  now?: Date
}

function GotItButton({ onClick }: { onClick: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await onClick()
        } finally {
          setBusy(false)
        }
      }}
      className="min-h-11 cursor-pointer rounded-xl bg-amber-700 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:cursor-wait disabled:opacity-70"
    >
      Got it
    </button>
  )
}

export default function NeedsYouCard({ items, kids, onGotIt, onAsk, phoneChildId = null, now = new Date() }: NeedsYouCardProps) {
  if (items.length === 0) return null
  const child = (id: string) => kids.find((k) => k.studentId === id)
  const showNames = kids.length > 1

  return (
    <section className="flex flex-col gap-3 rounded-[18px] border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-[22px] py-5">
      <h3 className="text-[15px] font-semibold text-amber-800">Needs you</h3>
      {items.map((item) => {
        if (item.kind === 'ack') {
          const about = item.studentIds.map(child).filter((c): c is ChildClassroomSummary => !!c)
          const hiddenOnPhone = !!phoneChildId && !item.studentIds.includes(phoneChildId)
          return (
            <div
              key={`ack:${item.announcementId}`}
              className={`flex-wrap items-center justify-between gap-3 rounded-[14px] border border-amber-200 bg-white px-3.5 py-3 ${hiddenOnPhone ? 'hidden md:flex' : 'flex'}`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex shrink-0 -space-x-2">
                  {about.slice(0, 2).map((c) => (
                    <Avatar student key={c.studentId} name={c.name} avatar={c.avatar} photoUrl={c.photoUrl} size={28} className="ring-2 ring-white" />
                  ))}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[15px] font-medium text-slate-900">{item.title}</span>
                  <span className="text-[13px] text-stone-500">
                    {[item.classSubject, item.authorName, showNames ? about.map((c) => firstNameOf(c.name)).join(', ') : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </span>
              <GotItButton onClick={() => onGotIt(item)} />
            </div>
          )
        }
        const kid = child(item.studentId)
        const hiddenOnPhone = !!phoneChildId && item.studentId !== phoneChildId
        return (
          <div
            key={`missing:${item.studentId}:${item.itemId ?? item.assessmentId ?? item.title}`}
            className={`flex-wrap items-center justify-between gap-3 rounded-[14px] border border-rose-200 bg-white px-3.5 py-3 ${hiddenOnPhone ? 'hidden md:flex' : 'flex'}`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Avatar student name={kid?.name ?? 'Child'} avatar={kid?.avatar ?? null} photoUrl={kid?.photoUrl} size={28} />
              <span className="flex min-w-0 flex-col">
                {item.itemId ? (
                  <Link href={parentItemHref(item.studentId, item.itemId)} className="text-[15px] font-medium text-slate-900 hover:underline">
                    Missing: {item.title}
                  </Link>
                ) : (
                  <span className="text-[15px] font-medium text-slate-900">Missing: {item.title}</span>
                )}
                <span className="text-[13px] text-rose-800">{needsYouMissingSubline(item, now)}</span>
              </span>
            </span>
            {item.teacher && (
              <button
                type="button"
                onClick={() => onAsk(item)}
                className="min-h-11 cursor-pointer px-1 text-sm font-medium text-amber-800 underline-offset-2 hover:text-amber-950 hover:underline"
              >
                Ask {item.teacher.name}
              </button>
            )}
          </div>
        )
      })}
    </section>
  )
}
