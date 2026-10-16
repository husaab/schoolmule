// File: src/app/(user)/classes/[classId]/edit/page.tsx
// The old class edit page now lives on the class page: details, teachers and
// students under Settings, the grading setup under Grades. Old links (and
// their #section hashes) land in the right place.
'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { legacyEditRedirect } from '@/lib/classroomRoutes'

export default function LegacyClassEdit() {
  const { classId } = useParams() as { classId: string }
  const router = useRouter()
  useEffect(() => {
    router.replace(legacyEditRedirect(classId, window.location.hash))
  }, [classId, router])
  return <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />
}
