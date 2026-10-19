// File: src/app/(user)/classes/[classId]/items/[itemId]/quiz/page.tsx
// A quiz's questions, for the teacher (the Teacher-Quiz board): loads the
// class, the item and its questions, then the quiz builder. Says why instead
// when the quiz is gone, not this teacher's, from a past school year
// (read-only), or not a quiz. ?from=grading sends Close back to the grading view.
'use client'

import { Suspense, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import QuizBuilder from '@/components/classes/quiz/QuizBuilder'
import { useLoad } from '@/hooks/useLoad'
import { classHref, classItemHref } from '@/lib/classroomRoutes'
import { isApiError } from '@/services/apiClient'
import { getClassPage } from '@/services/classroomService'
import { getItem } from '@/services/classworkService'
import { getQuestions } from '@/services/quizService'
import type { ClassPageData } from '@/services/types/classroom'
import type { Item } from '@/services/types/classwork'
import type { QuizBuilderData } from '@/services/types/quiz'

interface Loaded {
  page: ClassPageData
  item: Item
  data: QuizBuilderData | null
}

function Notice({ classId, children, action }: { classId: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <ClipboardDocumentListIcon className="h-7 w-7 text-slate-400" aria-hidden="true" />
        </div>
        <div className="mb-6 text-slate-600">{children}</div>
        <div className="flex flex-wrap justify-center gap-2">
          {action}
          <Link
            href={classHref(classId, 'classwork')}
            className="inline-flex rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 font-medium text-white hover:from-cyan-600 hover:to-teal-600"
          >
            Back to Classwork
          </Link>
        </div>
      </div>
    </div>
  )
}

function QuizBuilderContent() {
  const { classId, itemId } = useParams() as { classId: string; itemId: string }
  const from = useSearchParams().get('from') === 'grading' ? 'grading' : null
  const { data, error, loading, reload } = useLoad<Loaded>(`${classId}:${itemId}:quiz`, async () => {
    const [page, item] = await Promise.all([getClassPage(classId), getItem(itemId)])
    // Only a quiz has questions: the rest is told so below, without asking.
    const questions = item.data.kind === 'quiz' && item.data.classId === classId ? (await getQuestions(itemId)).data : null
    return { page: page.data, item: item.data, data: questions }
  })

  if (loading || (!data && !error)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data) {
    const status = isApiError(error) ? error.status : null
    if (status === 404 || status === 400) return <Notice classId={classId}>This quiz doesn&apos;t exist, or it was deleted.</Notice>
    if (status === 403) {
      return <Notice classId={classId}>You don&apos;t teach this class, so its quizzes can&apos;t be changed from your account.</Notice>
    }
    return (
      <Notice
        classId={classId}
        action={
          <button
            type="button"
            onClick={reload}
            className="cursor-pointer rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200"
          >
            Try again
          </button>
        }
      >
        {error?.message || "The quiz couldn't be loaded."}
      </Notice>
    )
  }

  if (data.item.classId !== classId) return <Notice classId={classId}>This quiz belongs to another class.</Notice>
  if (data.item.kind !== 'quiz' || !data.data) {
    return (
      <Notice
        classId={classId}
        action={
          <Link
            href={classItemHref(classId, itemId, 'edit')}
            className="inline-flex rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200"
          >
            Open it
          </Link>
        }
      >
        Only a quiz has questions.
      </Notice>
    )
  }
  if (!data.page.permissions.canEdit) {
    return <Notice classId={classId}>This class is from a past school year, so its quizzes are read-only.</Notice>
  }

  return <QuizBuilder key={itemId} classId={classId} page={data.page} item={data.item} data={data.data} from={from} />
}

export default function QuizBuilderPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <QuizBuilderContent />
    </Suspense>
  )
}
