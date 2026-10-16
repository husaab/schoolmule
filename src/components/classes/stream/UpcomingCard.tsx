// src/components/classes/stream/UpcomingCard.tsx
// The Stream's left rail: what is dated in the next two weeks in this class
// ("Due Fri, Oct 16" / "Fri, Oct 23 · in class"), each opening where it is
// worked on (an assessment's column in Grades), then a link to all classwork.
'use client'

import Link from 'next/link'
import { classHref, teacherItemHref } from '@/lib/classroomRoutes'
import { upcomingLabel } from '@/lib/classStream'
import type { ComingUpRow } from '@/services/types/classroom'

interface UpcomingCardProps {
  classId: string
  rows: ComingUpRow[]
}

export default function UpcomingCard({ classId, rows }: UpcomingCardProps) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-[18px]">
      <h2 className="text-[15px] font-semibold text-slate-900">Upcoming</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing due in the next two weeks.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.itemId ?? row.assessmentId ?? `${row.date}:${row.title}`}>
              <Link
                href={
                  row.itemId
                    ? teacherItemHref(classId, { itemId: row.itemId, kind: row.kind, assessmentId: row.assessmentId })
                    : classHref(classId, 'classwork')
                }
                className="flex flex-col gap-0.5 rounded-lg text-slate-900 transition-colors hover:text-cyan-800"
              >
                <span className="text-xs text-slate-500">{upcomingLabel(row)}</span>
                <span className="text-sm font-medium">{row.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href={classHref(classId, 'classwork')} className="text-[13px] font-medium text-cyan-700 hover:text-cyan-900">
        View all classwork
      </Link>
    </section>
  )
}
