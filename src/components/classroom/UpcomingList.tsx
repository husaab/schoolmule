// src/components/classroom/UpcomingList.tsx
// "Coming up" (Student-Class board): what is next in the class, soonest first.
// Today and tomorrow read in amber. Hidden when nothing is coming up.
'use client'

import Link from 'next/link'
import { upcomingLabel } from '@/lib/classroomText'
import type { TodoItem } from '@/services/types/studentPortal'

interface UpcomingListProps {
  items: TodoItem[]
  /** Where a row goes; null leaves it as plain text (a dated test has no page). */
  hrefFor: (item: TodoItem) => string | null
  now?: Date
}

export default function UpcomingList({ items, hrefFor, now = new Date() }: UpcomingListProps) {
  if (items.length === 0) return null
  return (
    <aside aria-label="Coming up" className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-[18px]">
      <h2 className="text-[15px] font-semibold text-slate-900">Coming up</h2>
      {items.map((item) => {
        const label = upcomingLabel(item, now)
        const href = hrefFor(item)
        const body = (
          <>
            <span className={`text-xs ${label.soon ? 'font-semibold text-amber-800' : 'text-slate-500'}`}>{label.text}</span>
            <span className="text-[15px] font-medium text-slate-900">{item.title}</span>
          </>
        )
        const className = 'flex flex-col gap-0.5 rounded-lg'
        return href ? (
          <Link key={item.itemId} href={href} className={`${className} hover:opacity-80`}>
            {body}
          </Link>
        ) : (
          <div key={item.itemId} className={className}>
            {body}
          </div>
        )
      })}
    </aside>
  )
}
