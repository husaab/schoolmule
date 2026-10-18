// src/components/studentPortal/work/GradeBlock.tsx
// The grade on an assignment once the teacher has published it
// (Student-Assignment board, "Graded" state): "Your grade 8/10", the teacher's
// comment as a quote, and who graded it and when. A parent sees the same block
// as "{name}'s grade". Missing and Excused get their own plain block, and
// feedback with no score reads as Feedback. Students and parents see "Graded",
// never "Published". The words come from itemPageText.ts.
'use client'

import { gradeBlockCopy, type Owner } from '@/lib/itemPageText'
import type { StudentItemGrade } from '@/services/types/studentPortal'

interface GradeBlockProps {
  grade: StudentItemGrade
  teacherName: string | null
  owner: Owner
  now?: Date
}

const FRAME = {
  graded: 'bg-indigo-50',
  feedback: 'bg-indigo-50',
  missing: 'bg-rose-50 border border-rose-100',
  excused: 'bg-stone-50 border border-stone-200',
}

const LABEL = {
  graded: 'text-indigo-800',
  feedback: 'text-indigo-800',
  missing: 'text-rose-800',
  excused: 'text-stone-700',
}

export default function GradeBlock({ grade, teacherName, owner, now = new Date() }: GradeBlockProps) {
  const copy = gradeBlockCopy(grade, teacherName, owner, now)
  return (
    <div className={`flex flex-col gap-2.5 rounded-2xl p-4 ${FRAME[copy.tone]}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-sm font-medium ${LABEL[copy.tone]}`}>{copy.label}</span>
        {copy.score && (
          <span className="font-display text-[34px] font-semibold leading-none text-indigo-800">
            {copy.score.value}
            <span className="text-xl text-indigo-600">{copy.score.max}</span>
          </span>
        )}
      </div>
      {copy.message && <p className="text-[15px] leading-relaxed text-slate-700">{copy.message}</p>}
      {copy.quote && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-800">&ldquo;{copy.quote}&rdquo;</p>}
      {copy.line && <span className="text-[13px] text-slate-600">{copy.line}</span>}
    </div>
  )
}
