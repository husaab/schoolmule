// src/components/classroom/GradeItemRow.tsx
// One published grade (Student-Grades board): the title and "Assignment ·
// graded today", the score on the right ("8/10", "Missing" in rose, "Excused"),
// the teacher's comment beside their avatar, and a link when the work can be
// opened. Students and parents see "Graded", never a publish state.
'use client'

import Link from 'next/link'
import Avatar from '@/components/avatar/Avatar'
import { gradeMeta, isNewToday, scoreText } from '@/lib/classroomText'
import type { PersonLite } from '@/services/types/profile'
import type { GradeItem } from '@/services/types/studentPortal'

interface GradeItemRowProps {
  item: GradeItem
  /** Who wrote the comment, for the avatar. */
  teacher?: PersonLite | null
  href?: string | null
  linkLabel?: string | null
  tone?: 'student' | 'parent'
  now?: Date
}

export default function GradeItemRow({ item, teacher = null, href = null, linkLabel = null, tone = 'student', now = new Date() }: GradeItemRowProps) {
  const missing = item.status === 'missing'
  const fresh = item.status === 'graded' && isNewToday(item, now)
  const border = missing ? 'border-rose-200' : fresh ? (tone === 'parent' ? 'border-amber-200' : 'border-indigo-200') : 'border-slate-200/70'
  const quote = fresh ? (tone === 'parent' ? 'bg-amber-50' : 'bg-indigo-50') : 'bg-slate-50'
  const scoreInk = missing ? 'text-rose-700' : item.status === 'excused' ? 'text-stone-600' : 'text-slate-900'

  return (
    <article className={`flex flex-col gap-3 rounded-2xl border bg-white px-5 py-[18px] ${border}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-[17px] font-medium text-slate-900">{item.title}</h3>
          <span className="text-[13px] text-slate-500">{gradeMeta(item, now)}</span>
        </div>
        <span className={`font-display text-[26px] font-semibold ${scoreInk}`}>{scoreText(item)}</span>
      </div>

      {item.feedback && (
        <div className={`flex gap-3 rounded-[14px] px-4 py-3.5 ${quote}`}>
          <Avatar name={teacher?.name ?? item.teacherName ?? 'Teacher'} avatar={teacher?.avatar ?? null} photoUrl={teacher?.photoUrl ?? null} size={32} />
          <p className="min-w-0 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-800">{item.feedback}</p>
        </div>
      )}

      {href && linkLabel && (
        <Link href={href} className={`w-fit text-sm font-medium hover:underline ${tone === 'parent' ? 'text-amber-800' : 'text-indigo-700'}`}>
          {linkLabel}
        </Link>
      )}
    </article>
  )
}
