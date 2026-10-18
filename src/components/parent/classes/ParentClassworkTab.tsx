// src/components/parent/classes/ParentClassworkTab.tsx
// The Classwork tab of the parent's lens (Parent-Lens board): the same list the
// child sees, read-only, with a note that only the child can turn work in and
// where to ask the teacher. Each row opens the child's item page.
'use client'

import ClassworkList from '@/components/classroom/ClassworkList'
import LoadError from '@/components/classroom/LoadError'
import NothingHere from '@/components/classroom/NothingHere'
import { useEffect } from 'react'
import { useLoad } from '@/hooks/useLoad'
import { rememberSubmissionModes } from '@/lib/submissionModeCache'
import { lensClassworkNote } from '@/lib/itemPageText'
import { parentItemHref } from '@/lib/portalRoutes'
import { getLensClasswork } from '@/services/parentClassroomService'
import type { ClassColor } from '@/services/types/classroom'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'

interface ParentClassworkTabProps {
  studentId: string
  classId: string
  childName: string
  color: ClassColor
  /** The lead teacher the "Message" button at the top writes to. */
  teacherName: string | null
}

export default function ParentClassworkTab({ studentId, classId, childName, color, teacherName }: ParentClassworkTabProps) {
  const yearId = useSchoolYearStore((s) => s.selectedYearId)
  const classwork = useLoad(`lens-classwork:${studentId}:${classId}:${yearId ?? ''}`, () =>
    getLensClasswork(studentId, classId).then((r) => r.data),
  )

  const items = classwork.data?.items
  useEffect(() => {
    if (items) rememberSubmissionModes(items)
  }, [items])

  if (classwork.error && !classwork.data) {
    return <LoadError tone="parent" title="We couldn't load the classwork" message={classwork.error.message} onRetry={classwork.reload} />
  }
  if (!classwork.data) return <div className="h-40 animate-pulse rounded-2xl bg-stone-100" aria-label="Loading" />

  return (
    <>
      {classwork.data.items.length === 0 ? (
        <NothingHere />
      ) : (
        <ClassworkList
          tone="parent"
          topics={classwork.data.topics}
          items={classwork.data.items}
          color={color}
          hrefFor={(item) => parentItemHref(studentId, item.itemId)}
        />
      )}
      <p className="text-[13px] leading-relaxed text-stone-500">{lensClassworkNote(childName, teacherName)}</p>
    </>
  )
}
