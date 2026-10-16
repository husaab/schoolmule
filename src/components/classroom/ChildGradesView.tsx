// src/components/classroom/ChildGradesView.tsx
// Published grades, for the student's Grades page and My grades tab and the
// parent lens' Grades tab (Student-Grades and Parent-Lens boards). Every
// number comes from the server's grade engine, published work only.
//  - page:     a list of classes on the left (icon, subject, a note, the
//              average), and the chosen class on the right under its banner
//  - embedded: just the chosen class, as a summary line and its grades
// A JK or SK child has no marks: a short note takes the place of the grades.
'use client'

import ClassBannerHeader from '@/components/classroom/ClassBannerHeader'
import GradeItemRow from '@/components/classroom/GradeItemRow'
import { classDetailLine, classNote, gradeLinkLabel, pctText, pickClass } from '@/lib/classroomText'
import type { PersonLite } from '@/services/types/profile'
import type { ChildClassGrades, ChildGrades, GradeItem } from '@/services/types/studentPortal'

interface ChildGradesViewProps {
  grades: ChildGrades
  selectedClassId: string | null
  onSelectClass: (classId: string) => void
  /** The line under the grades ("Grades show here once your teacher publishes them…"). */
  footnote?: string
  /** Where a grade's work opens; null leaves the grade without a link. */
  itemHref?: (grade: GradeItem) => string | null
  /** The teacher of a class, for the avatar beside a comment. */
  teacherOf?: (classId: string) => PersonLite | null
  layout?: 'page' | 'embedded'
  /** Shown instead of the grades for a JK or SK child. */
  noMarksNote: string
  tone?: 'student' | 'parent'
  now?: Date
}

const NOTE_INK = { new: 'text-indigo-800', missing: 'text-rose-700', plain: 'text-slate-500' }

function PctBox({ cls }: { cls: ChildClassGrades }) {
  return (
    <div className="flex flex-col items-end rounded-[14px] bg-white/90 px-3.5 py-2.5">
      <span className="font-display text-[34px] font-semibold leading-none sm:text-[40px]">{pctText(cls.finalPct)}</span>
      <span className="text-[13px]">{cls.finalPct == null ? 'nothing graded yet' : 'from published grades'}</span>
      {cls.classAvg != null && <span className="mt-1 text-[12px]">Class average {pctText(cls.classAvg)}</span>}
    </div>
  )
}

function ClassList({
  classes,
  selectedId,
  onSelect,
  now,
}: {
  classes: ChildClassGrades[]
  selectedId: string
  onSelect: (id: string) => void
  now: Date
}) {
  return (
    <nav
      aria-label="Classes"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-1 md:basis-[280px] md:flex-col md:gap-0 md:overflow-visible md:rounded-[18px] md:border md:border-slate-200/70 md:bg-white md:p-2 md:pb-2"
    >
      {classes.map((cls) => {
        const on = cls.classId === selectedId
        const note = classNote(cls, now)
        return (
          <button
            key={cls.classId}
            type="button"
            aria-current={on ? 'true' : undefined}
            onClick={() => onSelect(cls.classId)}
            className={`flex shrink-0 cursor-pointer items-center gap-3 rounded-xl border p-3 text-left text-slate-900 transition-colors md:border-transparent ${
              on ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50 md:bg-transparent'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static class icon */}
            <img src={cls.identity.iconUrl} alt="" className="h-9 w-9 shrink-0 rounded-[10px]" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[15px] font-medium">{cls.subject}</span>
              <span className={`text-xs ${NOTE_INK[note.tone]}`}>{note.text}</span>
            </span>
            <span className="pl-2 font-display text-xl font-semibold">{pctText(cls.finalPct)}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default function ChildGradesView({
  grades,
  selectedClassId,
  onSelectClass,
  footnote,
  itemHref,
  teacherOf,
  layout = 'page',
  noMarksNote,
  tone = 'student',
  now = new Date(),
}: ChildGradesViewProps) {
  if (!grades.usesMarks) {
    return <p className="rounded-[14px] bg-stone-50 p-[18px] text-[15px] leading-relaxed text-stone-700">{noMarksNote}</p>
  }

  const cls = pickClass(grades.classes, selectedClassId)
  if (!cls) {
    return (
      <p className="rounded-2xl border border-slate-200/70 bg-white p-6 text-center text-[15px] text-slate-500">
        No classes to show for this term.
      </p>
    )
  }

  const detail = (
    <div className="flex min-w-0 flex-col gap-4">
      {layout === 'page' ? (
        <ClassBannerHeader
          variant="panel"
          identity={cls.identity}
          title={cls.subject}
          meta={classDetailLine(cls)}
          actions={<PctBox cls={cls} />}
        />
      ) : (
        <div className="flex items-baseline justify-between gap-3 rounded-[14px] bg-stone-50 px-[18px] py-4">
          <span className="text-[15px]">{cls.subject}, from published grades</span>
          <span className="font-display text-[30px] font-semibold">{pctText(cls.finalPct)}</span>
        </div>
      )}

      {cls.items.length === 0 ? (
        <p className="rounded-2xl border border-slate-200/70 bg-white p-6 text-center text-[15px] text-slate-500">
          No grades in {cls.subject} yet.
        </p>
      ) : (
        cls.items.map((item) => {
          const href = itemHref?.(item) ?? null
          return (
            <GradeItemRow
              key={item.assessmentId}
              item={item}
              teacher={teacherOf?.(cls.classId) ?? null}
              href={href}
              linkLabel={href ? gradeLinkLabel(item) : null}
              tone={tone}
              now={now}
            />
          )
        })
      )}

      {footnote && <p className="text-[13px] text-slate-500">{footnote}</p>}
    </div>
  )

  if (layout === 'embedded') return detail

  return (
    <div className="flex flex-wrap items-start gap-6">
      <ClassList classes={grades.classes} selectedId={cls.classId} onSelect={onSelectClass} now={now} />
      <section className="min-w-0 flex-[999_1_520px] basis-full md:basis-[520px]">{detail}</section>
    </div>
  )
}
