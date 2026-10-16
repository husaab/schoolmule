// src/components/classes/home/DraftsPanel.tsx
// The Classes home rail: classwork still in draft or waiting to post.
// Hidden when there is none.
'use client'

import Link from 'next/link'
import { classItemHref } from '@/lib/classroomRoutes'
import { draftWhen } from '@/lib/classesHome'
import type { DraftOrScheduledRow } from '@/services/types/classroom'

export default function DraftsPanel({ rows }: { rows: DraftOrScheduledRow[] }) {
  if (rows.length === 0) return null
  return (
    <section className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/70 bg-white p-5">
      <h2 className="font-display text-lg font-semibold text-slate-900">Drafts &amp; scheduled</h2>
      <ul className="-mx-2 flex flex-col">
        {rows.map((row) => (
          <li key={row.itemId}>
            <Link
              href={classItemHref(row.classId, row.itemId, 'edit')}
              className="flex justify-between gap-3 rounded-lg px-2 py-1 text-sm text-slate-900 transition-colors hover:bg-slate-50"
            >
              <span className="min-w-0 truncate" title={row.classLabel}>
                {row.title}
              </span>
              <span className="shrink-0 text-slate-500">{draftWhen(row)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
