// src/components/classroom/NewGradesCard.tsx
// "New grades" on the student's Home (Student-Home board): the latest
// published grades, at most three. The newest is set in indigo; each shows the
// score, the class and teacher, and the teacher's comment in italics.
'use client'

import Link from 'next/link'
import Avatar from '@/components/avatar/Avatar'
import { scoreText } from '@/lib/classroomText'
import type { PersonLite } from '@/services/types/profile'
import type { GradeItem } from '@/services/types/studentPortal'

interface NewGradesCardProps {
  grades: GradeItem[]
  /** The teacher of a class, for the avatar on the class line. */
  teacherOf: (classId: string) => PersonLite | null
  hrefFor: (grade: GradeItem) => string
  max?: number
}

export default function NewGradesCard({ grades, teacherOf, hrefFor, max = 3 }: NewGradesCardProps) {
  const shown = grades.slice(0, max)
  if (shown.length === 0) return null
  return (
    <section className="flex flex-1 basis-[300px] flex-col gap-3.5 rounded-[18px] border border-slate-200/70 bg-white p-[22px]">
      <h3 className="font-display text-xl font-semibold text-slate-900">New grades</h3>
      {shown.map((g, i) => {
        const teacher = teacherOf(g.classId)
        const first = i === 0
        const score = scoreText(g)
        return (
          <Link
            key={g.assessmentId}
            href={hrefFor(g)}
            className={`flex flex-col gap-2 rounded-[14px] p-4 text-slate-900 transition-colors ${
              first ? 'bg-indigo-50 hover:bg-indigo-100/70' : 'border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-medium">{g.title}</span>
              <span
                className={`font-display text-2xl font-semibold ${
                  g.status === 'missing' ? 'text-rose-700' : first ? 'text-indigo-800' : 'text-slate-900'
                }`}
              >
                {score}
              </span>
            </span>
            <span className="flex items-center gap-2 text-[13px] text-slate-600">
              <Avatar name={teacher?.name ?? g.teacherName ?? 'Teacher'} avatar={teacher?.avatar ?? null} photoUrl={teacher?.photoUrl ?? null} size={22} />
              {[g.subject, g.teacherName].filter(Boolean).join(' · ')}
            </span>
            {g.feedback && <span className="line-clamp-3 text-sm italic leading-relaxed text-slate-700">&ldquo;{g.feedback}&rdquo;</span>}
          </Link>
        )
      })}
    </section>
  )
}
