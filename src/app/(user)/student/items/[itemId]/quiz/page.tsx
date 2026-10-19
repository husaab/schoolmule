'use client'

// Taking a quiz (Student-Quiz board, S5): one question per screen, answers
// autosaved, a confirm before Turn in, then the done screen. Opening the page
// starts the student's one attempt (idempotent: the shuffled order is kept).
//
// Saving: every change goes through useDebouncedSave (600 ms, latest wins),
// kept for the session under "quiz:{user}:{item}", so answers still saving or
// failed when the student leaves are not lost (pagehide sends them with
// keepalive, and a later visit shows them again). Next, Back, a dot and
// leaving a text box save at once; Turn in saves first, then submits. A save
// the server refuses for good (turned in elsewhere, closed) is not retried:
// the student is told why and the page shows where the quiz stands.
//
// A quiz that can't be taken (closed, excused, turned in, no questions) says
// why with a way back. An admin's "View as" sees the quiz read-only: nothing
// starts and nothing is saved.

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ClipboardDocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import LoadError from '@/components/classroom/LoadError'
import QuizDone from '@/components/studentPortal/quiz/QuizDone'
import QuizPlayer from '@/components/studentPortal/quiz/QuizPlayer'
import QuizResults from '@/components/studentPortal/quiz/QuizResults'
import { refreshTodoBadge } from '@/components/studentPortal/useStudentBadges'
import { useStudentMe } from '@/components/studentPortal/useStudentMe'
import { useDebouncedSave } from '@/hooks/useDebouncedSave'
import { useLoad } from '@/hooks/useLoad'
import { studentItemHref } from '@/lib/portalRoutes'
import { doneCopy, playerSubline, quizIntroState, quizSaveVerdict, toAnswerPayload, type AnswerMap } from '@/lib/quizPlayer'
import { isApiError } from '@/services/apiClient'
import { getStudentQuiz, saveStudentQuizAnswers, startStudentQuiz, submitStudentQuiz } from '@/services/quizService'
import { getStudentItem } from '@/services/studentPortalService'
import type { StudentQuiz } from '@/services/types/quiz'
import type { StudentItem } from '@/services/types/studentPortal'
import { useImpersonationStore } from '@/store/useImpersonationStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

const messageOf = (err: unknown, fallback: string): string => (err instanceof Error && err.message ? err.message : fallback)

const mergeAnswers = (older: AnswerMap, newer: AnswerMap): AnswerMap => ({ ...older, ...newer })

/** A full-page note: why the quiz can't be taken now, and the way back. */
function Notice({ itemId, title, children }: { itemId: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50" aria-hidden="true">
          <ClipboardDocumentCheckIcon className="h-7 w-7 text-indigo-700" />
        </span>
        <h1 className="font-display text-xl font-semibold text-slate-900">{title}</h1>
        {children && <div className="text-[15px] leading-relaxed text-slate-600">{children}</div>}
        <Link
          href={studentItemHref(itemId)}
          className="inline-flex min-h-11 items-center rounded-[14px] bg-indigo-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-indigo-700"
        >
          Back to the quiz page
        </Link>
      </div>
    </div>
  )
}

interface PlayerScreenProps {
  itemId: string
  userId: string
  item: StudentItem
  quiz: StudentQuiz
  previewing: boolean
  first: string
  /** Read the item and the quiz again (the server says the quiz changed under us). */
  onReload: () => void
}

/** The player with its autosave. Mounted once the attempt exists (or read-only for a preview). */
function PlayerScreen({ itemId, userId, item, quiz, previewing, first, onReload }: PlayerScreenProps) {
  const notify = useNotificationStore((s) => s.showNotification)
  // Set when a save was refused for good, so Turn in does not go on after it.
  const refusal = useRef<string | null>(null)
  const [refused, setRefused] = useState<string | null>(null)
  // The quiz as the submit came back: results only when it releases them right after submit.
  const [submitted, setSubmitted] = useState<StudentQuiz | null>(null)

  const saver = useDebouncedSave<AnswerMap>({
    key: previewing ? undefined : `quiz:${userId}:${itemId}`,
    merge: mergeAnswers,
    failedAway: () => `Your answers on "${quiz.quiz.title}" didn't save. Open the quiz again to retry.`,
    save: async (value, opts) => {
      if (previewing) return
      try {
        await saveStudentQuizAnswers(itemId, toAnswerPayload(value), opts)
      } catch (err) {
        // A browser refusing a keepalive request: the saver sends it again as a plain one.
        if (opts.keepalive && err instanceof TypeError) throw err
        const verdict = quizSaveVerdict(err)
        if (!verdict) throw err // a server error or no connection: a failed save to retry
        refusal.current = verdict.message
        setRefused(verdict.message)
        notify(verdict.message, 'error', 9000)
        onReload()
      }
    },
  })

  // The saved answers, with anything from an earlier visit that has not reached the server yet.
  const [initialAnswers] = useState<AnswerMap>(() => ({ ...(quiz.attempt?.answers ?? {}), ...(saver.peek() ?? {}) }))
  const written = quiz.questions.filter((q) => q.kind === 'long').length
  const teacher = quiz.quiz.teacher?.name ?? item.teacher?.name ?? null

  const turnIn = async (): Promise<boolean> => {
    if (previewing) return false
    refusal.current = null
    await saver.flush()
    // The server refused an answer for good: it has said why and the page is reloading. Do not go on.
    if (refusal.current) return false
    if (saver.hasFailures()) {
      notify("Your answers didn't save yet. Try Turn in again in a moment.", 'error')
      return false
    }
    try {
      const res = await submitStudentQuiz(itemId)
      setSubmitted(res.data)
      void refreshTodoBadge(userId)
      return true
    } catch (err) {
      notify(messageOf(err, "Your quiz didn't turn in. Try again."), 'error')
      if (isApiError(err) && (err.code === 'ALREADY_SUBMITTED' || err.code === 'ITEM_CLOSED')) onReload()
      return false
    }
  }

  return (
    <QuizPlayer
      title={quiz.quiz.title}
      subline={playerSubline(quiz.quiz.subject || item.subject, quiz.quiz.totalPoints)}
      questions={quiz.questions}
      initialAnswers={initialAnswers}
      onChange={previewing ? undefined : (change) => saver.schedule(change)}
      onFlush={previewing ? undefined : () => void saver.flush()}
      saveStatus={previewing ? null : saver.status}
      onRetrySave={() => void saver.retry()}
      onTurnIn={turnIn}
      turnInDisabledReason={previewing ? "This is a preview, so it can't be turned in." : null}
      finishLater={{ label: 'Finish later', href: studentItemHref(itemId) }}
      notice={
        previewing ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            This is a preview, so answers here aren&apos;t saved.
          </p>
        ) : refused ? (
          <p role="alert" className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />
            {refused}
          </p>
        ) : null
      }
      done={
        <>
          <QuizDone
            copy={doneCopy({ first, teacher, writtenCount: written, release: quiz.quiz.release, results: submitted?.results ?? null })}
            action={{ label: 'Back to Home', href: '/student' }}
            secondary={{ label: 'See the quiz page', href: studentItemHref(itemId) }}
          />
          {quiz.quiz.release === 'on_submit' && submitted?.results && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <QuizResults quiz={submitted} teacherName={teacher} />
            </div>
          )}
        </>
      }
    />
  )
}

function StudentQuizContent() {
  const { itemId } = useParams() as { itemId: string }
  const router = useRouter()
  const userId = useUserStore((s) => s.user.id)
  const role = useUserStore((s) => s.user.role)
  const previewing = useImpersonationStore((s) => s.session !== null)
  const { me } = useStudentMe()
  const ready = role === 'STUDENT' && Boolean(userId)

  const item = useLoad(ready ? `quiz-item:${userId}:${itemId}` : null, () => getStudentItem(itemId).then((r) => r.data))
  const quiz = useLoad(ready ? `quiz-take:${userId}:${itemId}` : null, () => getStudentQuiz(itemId).then((r) => r.data))
  // The quiz data is not read again after a Turn in, so the player's done screen stays on screen.
  const [startError, setStartError] = useState<Error | null>(null)
  const starting = useRef(false)

  const data = quiz.data
  const work = item.data
  const state = work && data ? quizIntroState({ status: work.submission?.status ?? 'assigned', canEdit: Boolean(work.submission?.canEdit) }, data) : null
  const canStart = state === 'start' && !previewing

  // Not a quiz (an old link): its own page.
  useEffect(() => {
    if (work && work.kind !== 'quiz') router.replace(studentItemHref(itemId))
  }, [work, itemId, router])

  // Opening the page starts the attempt, once.
  const { patch } = quiz
  useEffect(() => {
    if (!canStart || starting.current) return
    starting.current = true
    startStudentQuiz(itemId)
      .then((res) => patch(() => res.data))
      .catch((err: unknown) => setStartError(err instanceof Error ? err : new Error("The quiz couldn't start.")))
  }, [canStart, itemId, patch])

  const reloadAll = () => {
    item.reload()
    quiz.reload()
  }

  const loadError = item.error ?? quiz.error
  if (loadError && (!work || !data)) {
    const missing = isApiError(loadError) && (loadError.status === 404 || loadError.status === 400)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <LoadError
          title={missing ? "We couldn't find this quiz" : "We couldn't open this quiz"}
          message={missing ? "It may have been taken down, or it isn't yours." : loadError.message}
          onRetry={missing ? undefined : reloadAll}
        >
          <Link href="/student/todo" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Go to To-do
          </Link>
        </LoadError>
      </div>
    )
  }

  if (!work || !data || !state || !userId || work.kind !== 'quiz') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50" aria-label="Loading the quiz">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
      </div>
    )
  }

  const first = me?.student.firstName ?? ''

  // The attempt is open (or was just started): the player. A preview reads it as it stands.
  if (state === 'continue' || (previewing && state === 'start')) {
    return (
      <PlayerScreen
        key={data.attempt?.attemptId ?? 'preview'}
        itemId={itemId}
        userId={userId}
        item={work}
        quiz={data}
        previewing={previewing}
        first={first}
        onReload={reloadAll}
      />
    )
  }

  if (state === 'start') {
    if (startError) {
      return (
        <Notice itemId={itemId} title="The quiz couldn't start">
          {startError.message}
        </Notice>
      )
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50" aria-label="Starting the quiz">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
      </div>
    )
  }

  if (state === 'waiting' || state === 'results') {
    return (
      <Notice itemId={itemId} title="You've turned in this quiz">
        {state === 'results' ? 'It is graded: your answers and points are on the quiz page.' : 'You only get one try, so it is in. Your score shows on the quiz page once it is graded.'}
      </Notice>
    )
  }
  if (state === 'excused') return <Notice itemId={itemId} title="You're excused from this quiz" />
  if (state === 'graded') return <Notice itemId={itemId} title="This quiz is already graded" />
  if (state === 'empty') return <Notice itemId={itemId} title="This quiz has no questions yet">Ask your teacher.</Notice>
  return <Notice itemId={itemId} title="This quiz is closed">Ask your teacher.</Notice>
}

export default function StudentQuizPage() {
  return (
    <Suspense fallback={null}>
      <StudentQuizContent />
    </Suspense>
  )
}
