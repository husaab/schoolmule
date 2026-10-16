// src/components/studentPortal/class/StudentGradesTab.tsx
// "My grades" on a student's class page: this class's published grades, with
// the same rows as the Grades page (ChildGradesView, one class).
'use client'

import ChildGradesView from '@/components/classroom/ChildGradesView'
import LoadError from '@/components/classroom/LoadError'
import { useLoad } from '@/hooks/useLoad'
import { noMarksNote } from '@/lib/classroomText'
import { studentItemHref } from '@/lib/portalRoutes'
import { getStudentGrades } from '@/services/studentPortalService'
import type { StudentClassHeader } from '@/services/types/studentPortal'

export const STUDENT_GRADES_FOOTNOTE =
  'Grades show here once your teacher publishes them. Missing work counts as 0 until you hand it in.'

export default function StudentGradesTab({ header }: { header: StudentClassHeader }) {
  const grades = useLoad(`grades:class:${header.classId}`, () => getStudentGrades().then((r) => r.data))
  const lead = header.teachers.find((t) => t.role === 'lead') ?? header.teachers[0] ?? null

  if (grades.error && !grades.data) {
    return <LoadError title="We couldn't load your grades" message={grades.error.message} onRetry={grades.reload} />
  }
  if (!grades.data) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading" />

  const cls = grades.data.classes.find((c) => c.classId === header.classId)
  if (grades.data.usesMarks && !cls) {
    return (
      <p className="rounded-2xl border border-slate-200/70 bg-white p-6 text-center text-[15px] text-slate-500">
        No grades in {header.subject} yet.
      </p>
    )
  }

  return (
    <ChildGradesView
      layout="embedded"
      grades={{ ...grades.data, classes: cls ? [cls] : [] }}
      selectedClassId={header.classId}
      onSelectClass={() => {}}
      footnote={STUDENT_GRADES_FOOTNOTE}
      itemHref={(g) => (g.itemId ? studentItemHref(g.itemId) : null)}
      teacherOf={() => lead}
      noMarksNote={noMarksNote({ grade: header.grade, teacherName: lead?.name ?? null, owner: { you: true } })}
    />
  )
}
