// src/components/studentPortal/class/StudentClassworkTab.tsx
// The Classwork tab of a student's class page: every assignment, quiz,
// material and assessment the student can see, grouped by topic, with where
// each one stands for them. A row opens the item.
'use client'

import ClassworkList from '@/components/classroom/ClassworkList'
import LoadError from '@/components/classroom/LoadError'
import NothingHere from '@/components/classroom/NothingHere'
import { useLoad } from '@/hooks/useLoad'
import { studentItemHref } from '@/lib/portalRoutes'
import { getStudentClasswork } from '@/services/studentPortalService'
import type { ClassIdentity } from '@/services/types/classroom'

export default function StudentClassworkTab({ classId, identity }: { classId: string; identity: ClassIdentity }) {
  const classwork = useLoad(`classwork:${classId}`, () => getStudentClasswork(classId).then((r) => r.data))

  if (classwork.error && !classwork.data) {
    return <LoadError title="We couldn't load the classwork" message={classwork.error.message} onRetry={classwork.reload} />
  }
  if (!classwork.data) {
    return (
      <div className="flex flex-col gap-3" aria-label="Loading">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[68px] animate-pulse rounded-[14px] bg-slate-100" />
        ))}
      </div>
    )
  }
  if (classwork.data.items.length === 0) return <NothingHere />
  return (
    <ClassworkList
      topics={classwork.data.topics}
      items={classwork.data.items}
      color={identity.color}
      hrefFor={(item) => studentItemHref(item.itemId)}
    />
  )
}
