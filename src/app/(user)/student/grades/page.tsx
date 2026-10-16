'use client'

// The student's published grades (Student-Grades board): a term picker in the
// top bar, the classes on the left with a note and an average each, and the
// chosen class on the right with its grades and the teacher's comments.
// `class` and `term` live in the URL.

import { Suspense } from 'react'
import ChildGradesView from '@/components/classroom/ChildGradesView'
import LoadError from '@/components/classroom/LoadError'
import { STUDENT_GRADES_FOOTNOTE } from '@/components/studentPortal/class/StudentGradesTab'
import StudentShell from '@/components/studentPortal/StudentShell'
import TermSelect from '@/components/studentPortal/TermSelect'
import { useStudentClasses } from '@/components/studentPortal/useStudentClasses'
import { useStudentMe } from '@/components/studentPortal/useStudentMe'
import { useFilterParams } from '@/hooks/useFilterParams'
import { useLoad } from '@/hooks/useLoad'
import { noMarksNote } from '@/lib/classroomText'
import { studentItemHref } from '@/lib/portalRoutes'
import { getStudentGrades } from '@/services/studentPortalService'
import { useUserStore } from '@/store/useUserStore'

function StudentGradesContent() {
  const userId = useUserStore((s) => s.user.id)
  const role = useUserStore((s) => s.user.role)
  const filters = useFilterParams()
  const classParam = filters.get('class') || null
  const termParam = filters.get('term') || ''
  const { classes } = useStudentClasses()
  const { me } = useStudentMe()

  const grades = useLoad(userId && role === 'STUDENT' ? `grades:${userId}:${termParam}` : null, () =>
    getStudentGrades(termParam || undefined).then((r) => r.data),
  )
  const data = grades.data
  const termValue = termParam || data?.termId || ''
  const lead = classes?.[0]?.teacher ?? null

  const picker = data ? (
    <TermSelect terms={data.terms} value={termValue} onChange={(termId) => filters.setParams({ term: termId })} />
  ) : null

  return (
    <StudentShell title="Grades" actions={picker} wide>
      <div className="max-w-6xl">
        {grades.error && !data ? (
          <LoadError title="We couldn't load your grades" message={grades.error.message} onRetry={grades.reload} />
        ) : !data ? (
          <div className="flex flex-wrap gap-6" aria-label="Loading">
            <div className="h-72 flex-1 basis-[280px] animate-pulse rounded-[18px] bg-slate-100" />
            <div className="h-72 flex-[999_1_520px] animate-pulse rounded-[18px] bg-slate-100" />
          </div>
        ) : (
          <ChildGradesView
            grades={data}
            selectedClassId={classParam}
            onSelectClass={(id) => filters.setParams({ class: id })}
            footnote={STUDENT_GRADES_FOOTNOTE}
            itemHref={(g) => (g.itemId ? studentItemHref(g.itemId) : null)}
            teacherOf={(classId) => classes?.find((c) => c.classId === classId)?.teacher ?? null}
            noMarksNote={noMarksNote({
              grade: me?.student.grade ?? 'SK',
              teacherName: lead?.name ?? null,
              owner: { you: true },
            })}
          />
        )}
      </div>
    </StudentShell>
  )
}

export default function StudentGradesPage() {
  return (
    <Suspense fallback={null}>
      <StudentGradesContent />
    </Suspense>
  )
}
