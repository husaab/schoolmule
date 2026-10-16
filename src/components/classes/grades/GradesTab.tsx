// src/components/classes/grades/GradesTab.tsx
// The class's grades. Until the gradebook moves into this tab (T9), it links
// to the gradebook page as it is today (the JK and SK classes to theirs).
'use client'

import Link from 'next/link'
import { ArrowRightIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import { isJK, isSK } from '@/lib/schoolUtils'
import type { ClassTabProps } from '@/components/classes/page/tabs'

const gradebookHref = (classId: string, grade: string) =>
  isJK(grade) ? `/gradebook/jk/${classId}` : isSK(grade) ? `/gradebook/sk/${classId}` : `/gradebook/${classId}`

export default function GradesTab({ classId, data }: ClassTabProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-6 py-6">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50">
          <BookOpenIcon className="h-6 w-6 text-cyan-700" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-[19px] font-semibold text-slate-900">Open the gradebook</h3>
          <p className="text-sm text-slate-500">Scores, categories and report card comments for {data.class.subject}.</p>
        </div>
      </div>
      <Link
        href={gradebookHref(classId, data.class.grade)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600"
      >
        Open the gradebook
        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
