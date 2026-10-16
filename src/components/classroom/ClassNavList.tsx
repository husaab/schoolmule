// src/components/classroom/ClassNavList.tsx
// A list of classes to pick from (the parent lens' "{name}'s classes"): a
// column on a wide screen, a sideways strip of chips on a phone. Each class is
// a real link; a "1 missing" flag shows beside a class with work missing.
'use client'

import Link from 'next/link'

export interface ClassNavEntry {
  classId: string
  subject: string
  iconUrl: string
  /** "1 missing". */
  flag?: string | null
}

interface ClassNavListProps {
  classes: ClassNavEntry[]
  selectedId?: string | null
  hrefFor: (classId: string) => string
  /** "Yusuf's classes". */
  title?: string
  tone?: 'student' | 'parent'
}

const SELECTED = { student: 'bg-indigo-50', parent: 'bg-amber-50' }
const BORDER = { student: 'border-slate-200/70', parent: 'border-stone-200' }

export default function ClassNavList({ classes, selectedId, hrefFor, title, tone = 'student' }: ClassNavListProps) {
  return (
    <>
      <nav
        aria-label={title ?? 'Classes'}
        className={`hidden flex-col rounded-[18px] border bg-white p-2 md:flex ${BORDER[tone]}`}
      >
        {title && <span className="px-3 pb-1.5 pt-2.5 text-xs font-medium text-stone-500">{title}</span>}
        {classes.map((c) => {
          const on = c.classId === selectedId
          return (
            <Link
              key={c.classId}
              href={hrefFor(c.classId)}
              scroll={false}
              aria-current={on ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-900 transition-colors hover:bg-stone-50 ${
                on ? `${SELECTED[tone]} font-medium` : ''
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static class icon */}
              <img src={c.iconUrl} alt="" className="h-6 w-6 shrink-0 rounded-[7px]" />
              <span className="min-w-0 flex-1 truncate">{c.subject}</span>
              {c.flag && (
                <span className="shrink-0 rounded-full bg-rose-50 px-[7px] py-0.5 text-[11px] font-semibold text-rose-700">
                  {c.flag}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <nav aria-label={title ?? 'Classes'} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
        {classes.map((c) => {
          const on = c.classId === selectedId
          return (
            <Link
              key={c.classId}
              href={hrefFor(c.classId)}
              scroll={false}
              aria-current={on ? 'page' : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm ${
                on
                  ? `${tone === 'parent' ? 'border-amber-200 bg-amber-50' : 'border-indigo-200 bg-indigo-50'} font-medium text-slate-900`
                  : 'border-stone-200 bg-white text-slate-700'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static class icon */}
              <img src={c.iconUrl} alt="" className="h-6 w-6 shrink-0 rounded-[7px]" />
              {c.subject}
              {c.flag && <span className="rounded-full bg-rose-50 px-1.5 text-[11px] font-semibold text-rose-700">{c.flag}</span>}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
