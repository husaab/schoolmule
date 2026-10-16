'use client'

// One class as a student sees it (Student-Class board): the class banner with
// the one "Message {teacher}" button at the top right, then Stream · Classwork
// · My grades · People (?tab=). The Stream is the bare URL and a class always
// opens on it (the tab is not remembered). Students see their teachers and
// their own work only, never a classmate's.

import { Suspense } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import ClassBannerHeader from '@/components/classroom/ClassBannerHeader'
import LoadError from '@/components/classroom/LoadError'
import MessageTeacherButton from '@/components/classroom/MessageTeacherButton'
import NothingHere from '@/components/classroom/NothingHere'
import ClassTabs from '@/components/classes/page/ClassTabs'
import StudentGradesTab from '@/components/studentPortal/class/StudentGradesTab'
import StudentPeopleTab from '@/components/studentPortal/class/StudentPeopleTab'
import StudentStreamTab from '@/components/studentPortal/class/StudentStreamTab'
import StudentShell from '@/components/studentPortal/StudentShell'
import { studentTone } from '@/components/studentPortal/studentTone'
import { useFilterParams, type FilterPatch } from '@/hooks/useFilterParams'
import { useLoad } from '@/hooks/useLoad'
import { classPageMeta } from '@/lib/classroomText'
import {
  STUDENT_CLASS_TABS,
  parseStudentClassTab,
  studentClassHref,
  studentMessageHref,
  type StudentClassTab,
} from '@/lib/portalRoutes'
import { isApiError } from '@/services/apiClient'
import { getStudentClass } from '@/services/studentPortalService'
import { useUserStore } from '@/store/useUserStore'

function StudentClassContent() {
  const { classId } = useParams() as { classId: string }
  const role = useUserStore((s) => s.user.role)
  const filters = useFilterParams({ remember: false })
  const tab = parseStudentClassTab(filters.get('tab'))
  const focusId = filters.get('announcement') || null
  const page = useLoad(role === 'STUDENT' ? `class:${classId}` : null, () => getStudentClass(classId).then((r) => r.data))

  // A tab owns its own params: switching tabs starts clean (the email's
  // ?announcement= is used once, on the Stream).
  const selectTab = (next: string) => {
    const patch: FilterPatch = {}
    for (const key of Array.from(filters.params.keys())) patch[key] = null
    const nextTab = parseStudentClassTab(next)
    patch.tab = nextTab === 'stream' ? null : nextTab
    filters.setParams(patch)
  }

  if (page.error && !page.data) {
    const notEnrolled = isApiError(page.error) && page.error.code === 'NOT_ENROLLED'
    return (
      <StudentShell title="My classes">
        <LoadError
          title={notEnrolled ? "This class isn't yours" : "We couldn't open this class"}
          message={notEnrolled ? "You aren't in this class." : page.error.message}
          onRetry={notEnrolled ? undefined : page.reload}
        >
          <Link href="/student" className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${studentTone.primary}`}>
            Back to Home
          </Link>
        </LoadError>
      </StudentShell>
    )
  }

  if (!page.data) {
    return (
      <StudentShell title="My classes">
        <div className="flex flex-col gap-6" aria-label="Loading">
          <div className="h-40 animate-pulse rounded-[18px] bg-slate-100" />
          <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </StudentShell>
    )
  }

  const header = page.data.class
  const teacher = header.messageTeacher

  return (
    <StudentShell title="My classes">
      <ClassBannerHeader
        variant="page"
        identity={header.identity}
        title={header.subject}
        meta={classPageMeta(header.grade, header.teachers)}
        actions={
          teacher?.userId ? (
            <MessageTeacherButton
              tone="student"
              teacher={teacher}
              href={studentMessageHref({ teacherId: teacher.userId, classId: header.classId })}
            />
          ) : undefined
        }
      >
        <ClassTabs
          tabs={STUDENT_CLASS_TABS}
          active={tab}
          hrefFor={(t) => studentClassHref(classId, t as StudentClassTab)}
          onSelect={selectTab}
        />
      </ClassBannerHeader>

      <div className="pt-6">
        {tab === 'stream' && <StudentStreamTab key={classId} classId={classId} upcoming={page.data.upcoming} focusId={focusId} />}
        {tab === 'classwork' && <NothingHere />}
        {tab === 'grades' && <StudentGradesTab key={classId} header={header} />}
        {tab === 'people' && <StudentPeopleTab teachers={header.teachers} />}
      </div>
    </StudentShell>
  )
}

export default function StudentClassPage() {
  return (
    <Suspense fallback={null}>
      <StudentClassContent />
    </Suspense>
  )
}
