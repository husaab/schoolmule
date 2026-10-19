'use client'

// One piece of classwork as the student sees it (Student-Assignment board):
// the teacher's instructions and files on the left; "Your work" and the
// messages about it on the right. An assignment shows photo / file / typed
// answer / mark-as-done and Turn in, in every state (assigned, ready, turned
// in, late, missing, closed, graded). A plain assessment shows the item and,
// once published, the grade; a material shows only the item. A quiz shows its
// place in the quiz (Start quiz / Continue / waiting / the results); it is
// answered on /student/items/{id}/quiz. `?from=todo` makes Back return to the
// To-do with its filters.

import { Suspense, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import ItemDetail from '@/components/classroom/ItemDetail'
import LoadError from '@/components/classroom/LoadError'
import StudentShell from '@/components/studentPortal/StudentShell'
import QuizIntro from '@/components/studentPortal/quiz/QuizIntro'
import { studentTone } from '@/components/studentPortal/studentTone'
import { refreshTodoBadge } from '@/components/studentPortal/useStudentBadges'
import WorkMessages from '@/components/studentPortal/work/WorkMessages'
import YourWorkCard, { type WorkActions } from '@/components/studentPortal/work/YourWorkCard'
import BackLink from '@/components/shared/BackLink'
import { useLoad } from '@/hooks/useLoad'
import { turnInModeOf } from '@/lib/itemPageText'
import { studentClassHref, studentTodoHref } from '@/lib/portalRoutes'
import { isApiError } from '@/services/apiClient'
import { getStudentQuiz } from '@/services/quizService'
import {
  deleteStudentFile,
  getStudentFileUrl,
  getStudentItem,
  saveStudentAnswer,
  turnInStudentItem,
  unsubmitStudentItem,
  uploadStudentFiles,
} from '@/services/studentPortalService'
import type { Attachment } from '@/services/types/classwork'
import type { StudentItem, SubmissionFile } from '@/services/types/studentPortal'
import { useImpersonationStore } from '@/store/useImpersonationStore'
import { useUserStore } from '@/store/useUserStore'

const PREVIEW_NOTE = "This is a preview, so nothing here can be changed."

function StudentItemContent() {
  const { itemId } = useParams() as { itemId: string }
  const fromTodo = useSearchParams().get('from') === 'todo'
  const userId = useUserStore((s) => s.user.id)
  const role = useUserStore((s) => s.user.role)
  const previewing = useImpersonationStore((s) => s.session !== null)

  const item = useLoad(role === 'STUDENT' && userId ? `item:${userId}:${itemId}` : null, () => getStudentItem(itemId).then((r) => r.data))
  const { patch, reload } = item
  // A quiz: where the student stands in it (never the answer key; the results once the grade is out).
  const isQuiz = item.data?.kind === 'quiz'
  const quiz = useLoad(isQuiz && userId ? `quiz:${userId}:${itemId}` : null, () => getStudentQuiz(itemId).then((r) => r.data))

  // Everything the student can do to their work, from the student's own routes. A preview gets none.
  const actions = useMemo<WorkActions | null>(
    () =>
      previewing
        ? null
        : {
            saveAnswer: async (text, opts) => {
              await saveStudentAnswer(itemId, text, opts)
            },
            uploadFiles: async (files) => (await uploadStudentFiles(itemId, files)).data.files,
            deleteFile: async (fileId) => {
              await deleteStudentFile(fileId)
            },
            turnIn: async () => (await turnInStudentItem(itemId)).data,
            unsubmit: async () => (await unsubmitStudentItem(itemId)).data,
          },
    [itemId, previewing],
  )

  const setFiles = (files: SubmissionFile[]) =>
    patch((d: StudentItem) => (d.submission ? { ...d, submission: { ...d.submission, files } } : d))

  // Attachment links are signed for an hour: ask for a fresh one when a file is previewed.
  const resolveAttachmentUrl = async (a: Attachment): Promise<string> => {
    if (a.kind === 'link') {
      if (!a.url) throw new Error("This link couldn't be opened.")
      return a.url
    }
    const fresh = (await getStudentItem(itemId)).data
    const url = fresh.attachments.find((x) => x.attachmentId === a.attachmentId)?.url
    if (!url) throw new Error("This file couldn't be opened.")
    return url
  }

  const data = item.data

  const back = (
    <div>
      {fromTodo ? (
        <BackLink to={studentTodoHref()} className="inline-flex min-h-11 items-center gap-2 rounded-xl py-2 pr-3 text-[15px] font-medium text-slate-700 hover:text-indigo-700">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          Back to To-do
        </BackLink>
      ) : data ? (
        <Link
          href={studentClassHref(data.classId, 'classwork')}
          aria-label={`Back to ${data.subject}`}
          className="inline-flex min-h-11 items-center gap-3 rounded-xl py-2 pr-3 text-[15px] text-slate-700 hover:text-indigo-700"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
            <ArrowLeftIcon className="h-5 w-5 text-slate-700" aria-hidden="true" />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element -- static class icon */}
          <img src={data.identity.iconUrl} alt="" className="h-[30px] w-[30px] rounded-[9px]" />
          {data.subject}
        </Link>
      ) : null}
    </div>
  )

  if (item.error && !data) {
    const missing = isApiError(item.error) && item.error.status === 404
    return (
      <StudentShell title="Classwork">
        <LoadError
          title={missing ? "We couldn't find this" : "We couldn't open this"}
          message={missing ? "It may have been taken down, or it isn't yours." : item.error.message}
          onRetry={missing ? undefined : reload}
        >
          <Link href={studentTodoHref()} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${studentTone.primary}`}>
            Go to To-do
          </Link>
        </LoadError>
      </StudentShell>
    )
  }

  if (!data) {
    return (
      <StudentShell title="Classwork">
        <div className="flex flex-wrap gap-7" aria-label="Loading">
          <div className="flex min-w-0 flex-[999_1_520px] basis-full flex-col gap-4 lg:basis-[520px]">
            <div className="h-16 w-2/3 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div className="h-72 flex-1 basis-full animate-pulse rounded-[20px] bg-slate-100 lg:basis-[340px]" />
        </div>
      </StudentShell>
    )
  }

  const takesWork = data.kind !== 'material'
  const takesThread = data.kind === 'assignment' || data.kind === 'quiz'

  return (
    <StudentShell title={data.subject}>
      <div className="flex max-w-[1240px] flex-col gap-5">
        {back}
        <div className="flex flex-wrap items-start gap-7">
          <div className={`min-w-0 flex-[999_1_520px] basis-full lg:basis-[520px] ${takesWork ? '' : 'max-w-3xl'}`}>
            <ItemDetail item={data} resolveAttachmentUrl={resolveAttachmentUrl} />
          </div>
          {takesWork && (
            <aside className="flex min-w-0 flex-1 basis-full flex-col gap-4 lg:basis-[340px]">
              <YourWorkCard
                item={data}
                owner={{ you: true }}
                userId={userId || null}
                actions={actions}
                readOnlyNote={previewing ? PREVIEW_NOTE : null}
                mode={turnInModeOf(data)}
                quiz={
                  data.kind === 'quiz' ? (
                    <QuizIntro item={data} quiz={quiz.data} error={quiz.error} onRetry={quiz.reload} previewing={previewing} />
                  ) : undefined
                }
                resolveFileUrl={async (file) => (await getStudentFileUrl(file.fileId)).data.url}
                onItem={(next) => patch(() => next)}
                onFiles={setFiles}
                onReload={() => {
                  reload()
                  if (isQuiz) quiz.reload()
                }}
                onCountsChanged={() => {
                  if (userId) void refreshTodoBadge(userId)
                }}
              />
              {takesThread && userId && (
                <WorkMessages
                  itemId={data.itemId}
                  teacherName={data.teacher?.name ?? null}
                  thread={data.thread}
                  userId={userId}
                  readOnly={previewing}
                  parentsCanRead={data.parentsCanRead}
                />
              )}
            </aside>
          )}
        </div>
      </div>
    </StudentShell>
  )
}

export default function StudentItemPage() {
  return (
    <Suspense fallback={null}>
      <StudentItemContent />
    </Suspense>
  )
}
