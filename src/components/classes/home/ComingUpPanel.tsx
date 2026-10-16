// src/components/classes/home/ComingUpPanel.tsx
// The Classes home rail: what is dated in the next two weeks across the
// caller's classes, each with a weekday tile. Always shown.
'use client'

import Link from 'next/link'
import { classHref } from '@/lib/classroomRoutes'
import { comingUpClassLine, comingUpTitle, dateTile } from '@/lib/classesHome'
import type { ComingUpRow } from '@/services/types/classroom'

interface ComingUpPanelProps {
  rows: ComingUpRow[]
  /** Students per class, for "10 of 22 still to turn in". */
  classSizes: Map<string, number>
}

export default function ComingUpPanel({ rows, classSizes }: ComingUpPanelProps) {
  return (
    <section className="flex flex-col gap-3.5 rounded-2xl border border-slate-200/70 bg-white p-5">
      <h2 className="font-display text-lg font-semibold text-slate-900">Coming up</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing in the next two weeks.</p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {rows.map((row) => {
            const tile = dateTile(row.date)
            return (
              <li key={`${row.classId}:${row.itemId ?? row.assessmentId}`}>
                <Link
                  href={classHref(row.classId)}
                  className="flex items-start gap-3 rounded-xl px-2 py-1.5 text-slate-900 transition-colors hover:bg-slate-50"
                >
                  <span className="flex w-11 shrink-0 flex-col rounded-[10px] bg-slate-100 py-1 text-center">
                    <span className="text-[10px] font-semibold uppercase text-slate-500">{tile.dow}</span>
                    <span className="font-display text-[17px] font-semibold leading-tight">{tile.day}</span>
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium">{comingUpTitle(row)}</span>
                    <span className="text-xs text-slate-500">{comingUpClassLine(row, classSizes.get(row.classId))}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
