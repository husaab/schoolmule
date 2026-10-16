// src/components/classes/home/ToReviewPanel.tsx
// The Classes home rail: turned-in work waiting for a grade, across the
// caller's classes. Hidden when there is nothing to review.
'use client'

import Link from 'next/link'
import { classItemHref } from '@/lib/classroomRoutes'
import { toReviewTotal } from '@/lib/classesHome'
import type { ToReviewRow } from '@/services/types/classroom'

export default function ToReviewPanel({ rows }: { rows: ToReviewRow[] }) {
  if (rows.length === 0) return null
  return (
    <section className="flex flex-col gap-3.5 rounded-2xl border border-slate-200/70 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-slate-900">To review</h2>
        <span className="rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-semibold text-white">{toReviewTotal(rows)}</span>
      </div>
      <ul className="-mx-3 flex flex-col">
        {rows.map((row) => (
          <li key={row.itemId}>
            <Link
              href={classItemHref(row.classId, row.itemId)}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-slate-900 transition-colors hover:bg-slate-50"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- static class icon SVG */}
                <img src={row.iconUrl} alt="" className="h-8 w-8 shrink-0 rounded-[9px]" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{row.title}</span>
                  <span className="truncate text-xs text-slate-500">{row.classLabel}</span>
                </span>
              </span>
              <span className="whitespace-nowrap text-[13px] font-semibold text-cyan-700">
                {row.turnedInCount} turned in
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
