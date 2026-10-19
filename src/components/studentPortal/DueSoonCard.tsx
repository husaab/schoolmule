// src/components/studentPortal/DueSoonCard.tsx
// "Due soon" on the student's Home (Student-Home board): work that is missing
// first, highlighted in rose with "Do it now", then up to three things due in
// the coming week with a pill ("Due tomorrow" in amber, otherwise the date).
// Desktop only: a phone lays the same work out as the Student-Phone board
// (PhoneHome). Hidden when there is nothing to show.
'use client'

import Link from 'next/link'
import { duePill, missingSubline } from '@/lib/classroomText'
import { studentItemHref, studentTodoHref } from '@/lib/portalRoutes'
import type { TodoItem } from '@/services/types/studentPortal'

interface DueSoonCardProps {
  missing: TodoItem[]
  dueSoon: TodoItem[]
  now?: Date
}

const MAX_DUE_ROWS = 3

const PILL = {
  amber: 'bg-amber-100 text-amber-800',
  slate: 'bg-slate-100 text-slate-600',
}

function ClassIconTile({ item }: { item: TodoItem }) {
  // eslint-disable-next-line @next/next/no-img-element -- static class icon
  return <img src={item.iconUrl} alt="" className="h-11 w-11 shrink-0 rounded-xl" />
}

export default function DueSoonCard({ missing, dueSoon, now = new Date() }: DueSoonCardProps) {
  const due = dueSoon.slice(0, MAX_DUE_ROWS)
  if (missing.length === 0 && due.length === 0) return null
  return (
    <section className="flex flex-[999_1_520px] basis-full flex-col gap-3.5 rounded-[18px] border border-slate-200/70 bg-white p-[22px] md:basis-[520px]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xl font-semibold text-slate-900">Due soon</h3>
        <Link href={studentTodoHref()} className="text-sm font-medium text-indigo-700 hover:text-indigo-900">
          See all to-do
        </Link>
      </div>

      {missing.map((item) => (
        <Link
          key={item.itemId}
          href={studentItemHref(item.itemId)}
          className="flex items-center gap-3.5 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3.5 text-slate-900 transition-colors hover:bg-rose-100/70"
        >
          <ClassIconTile item={item} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-medium">{item.title}</span>
            <span className="text-[13px] text-rose-800">{missingSubline(item, now)}</span>
          </span>
          <span className="hidden shrink-0 text-sm font-medium text-rose-700 sm:block">Do it now</span>
        </Link>
      ))}

      {due.map((item) => {
        const pill = duePill(item, now)
        return (
          <div key={item.itemId} className="flex flex-col gap-2">
            <Link
              href={studentItemHref(item.itemId)}
              className="flex items-center gap-3.5 rounded-[14px] border border-slate-200 px-4 py-3.5 text-slate-900 transition-colors hover:bg-slate-50"
            >
              <ClassIconTile item={item} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15px] font-medium">{item.title}</span>
                <span className="truncate text-[13px] text-slate-500">
                  {[item.subject, item.teacherName].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${PILL[pill.tone]}`}>{pill.text}</span>
            </Link>
          </div>
        )
      })}
    </section>
  )
}
