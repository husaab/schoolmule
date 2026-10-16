// File: src/app/(user)/classes/[classId]/items/[itemId]/page.tsx
// A piece of classwork, for the teacher. An assignment or quiz opens its
// grading view; a plain assessment is graded in Grades (its column, focused);
// a material, and any work not posted yet, opens its edit form. ?from=grades
// (a Grades column name) sends Back to Grades.
'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import GradingView from '@/components/classes/grading/GradingView'
import { useLoad } from '@/hooks/useLoad'
import { classHref, classItemHref } from '@/lib/classroomRoutes'
import { isApiError } from '@/services/apiClient'
import { getItem } from '@/services/classworkService'
import type { Item } from '@/services/types/classwork'

const isGraded = (item: Item) => item.kind === 'assignment' || item.kind === 'quiz'

/** Where a teacher's open of this item lands, when it isn't the grading view. */
function elsewhere(classId: string, item: Item): string | null {
  if (item.kind === 'assessment') return classHref(classId, 'grades', { focus: item.gradebook?.assessmentId ?? null })
  if (item.kind === 'material' || item.effectiveStatus !== 'posted') return classItemHref(classId, item.itemId, 'edit')
  return null
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">{children}</div>
}

function ItemContent() {
  const { classId, itemId } = useParams() as { classId: string; itemId: string }
  const searchParams = useSearchParams()
  const from = searchParams.get('from') === 'grades' ? 'grades' : null
  const router = useRouter()
  const { data, error, loading, reload } = useLoad<Item>(`${classId}:${itemId}`, async () => (await getItem(itemId)).data)

  const target = data && data.classId === classId ? elsewhere(classId, data) : null
  useEffect(() => {
    if (target) router.replace(target)
  }, [target, router])

  if (data && data.classId === classId && isGraded(data) && !target) {
    return <GradingView classId={classId} itemId={itemId} from={from} />
  }

  if (loading || target) {
    return (
      <Centered>
        <Spinner size="lg" />
      </Centered>
    )
  }

  const status = isApiError(error) ? error.status : null
  const message = data
    ? 'This classwork belongs to another class.'
    : status === 404 || status === 400
      ? "This classwork doesn't exist, or it was deleted."
      : status === 403
        ? "You don't teach this class, so its work can't be graded from your account."
        : error?.message || "This couldn't be loaded."

  return (
    <Centered>
      <div className="max-w-md rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <ClipboardDocumentListIcon className="h-7 w-7 text-slate-400" aria-hidden="true" />
        </div>
        <p className="mb-6 text-slate-600">{message}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {!data && status !== 404 && status !== 400 && status !== 403 && (
            <button
              type="button"
              onClick={reload}
              className="cursor-pointer rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200"
            >
              Try again
            </button>
          )}
          <Link
            href={classHref(classId, 'classwork')}
            className="inline-flex rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 font-medium text-white hover:from-cyan-600 hover:to-teal-600"
          >
            Back to Classwork
          </Link>
        </div>
      </div>
    </Centered>
  )
}

export default function ItemPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <ItemContent />
    </Suspense>
  )
}
