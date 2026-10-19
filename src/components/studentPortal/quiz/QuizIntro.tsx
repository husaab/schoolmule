// src/components/studentPortal/quiz/QuizIntro.tsx
// A quiz on the student's item page, inside "Your work": how long it is and
// that there is one try, then Start quiz, Continue (answers so far), "turned
// in, waiting to be graded", or the results once the grade is out. Closed,
// excused and empty quizzes say so instead. The quiz itself is answered on
// its own page (/student/items/{id}/quiz).
'use client'

import Link from 'next/link'
import { lateNote } from '@/lib/itemPageText'
import { answeredCount, confirmCounts, doneCopy, pointsWord, quizIntroState } from '@/lib/quizPlayer'
import { studentQuizHref } from '@/lib/portalRoutes'
import type { StudentQuiz } from '@/services/types/quiz'
import type { StudentItem } from '@/services/types/studentPortal'
import QuizResults from './QuizResults'

interface QuizIntroProps {
  item: StudentItem
  quiz: StudentQuiz | null
  error: Error | null
  onRetry: () => void
  /** An admin's "View as": the quiz opens read-only. */
  previewing: boolean
  now?: Date
}

const BUTTON =
  'flex min-h-[52px] items-center justify-center rounded-[14px] bg-indigo-600 px-4 py-3.5 text-[17px] font-semibold text-white transition-colors hover:bg-indigo-700'

export default function QuizIntro({ item, quiz, error, onRetry, previewing, now = new Date() }: QuizIntroProps) {
  if (!quiz) {
    if (error) {
      return (
        <p className="text-sm text-rose-700">
          We couldn&apos;t load the quiz.{' '}
          <button type="button" onClick={onRetry} className="cursor-pointer font-semibold underline underline-offset-2">
            Try again
          </button>
        </p>
      )
    }
    return <div className="h-24 animate-pulse rounded-[14px] bg-slate-100" aria-label="Loading the quiz" />
  }

  const sub = item.submission
  const status = sub?.status ?? 'assigned'
  const state = quizIntroState({ status, canEdit: Boolean(sub?.canEdit) }, quiz)
  const teacher = quiz.quiz.teacher?.name ?? item.teacher?.name ?? null
  const count = quiz.questions.length
  const meta = `${count} ${count === 1 ? 'question' : 'questions'} · ${pointsWord(quiz.quiz.totalPoints)} · one try`
  const written = quiz.questions.filter((q) => q.kind === 'long').length

  if (state === 'results') return <QuizResults quiz={quiz} teacherName={teacher} />
  if (state === 'excused' || state === 'graded') return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">{meta}</p>
      {state === 'waiting' && (
        <p className="text-sm leading-relaxed text-slate-700">
          {doneCopy({ first: '', teacher, writtenCount: written, release: quiz.quiz.release }).body}
        </p>
      )}
      {state === 'closed' && <p className="text-sm leading-relaxed text-slate-700">This quiz is closed. Ask your teacher.</p>}
      {state === 'empty' && <p className="text-sm leading-relaxed text-slate-700">This quiz has no questions yet. Ask your teacher.</p>}
      {(state === 'start' || state === 'continue') && (
        <>
          {status === 'missing' && <p className="text-sm leading-relaxed text-amber-800">{lateNote(item, teacher, now)}</p>}
          <p className="text-sm leading-relaxed text-slate-600">
            {state === 'continue'
              ? `You've started this quiz: ${confirmCounts(answeredCount(quiz.questions, quiz.attempt?.answers ?? {}), count)} answered so far. Your answers are saved.`
              : 'One question at a time. Your answers save as you go, so you can finish later. You get one try.'}
          </p>
          <Link href={studentQuizHref(item.itemId)} className={BUTTON}>
            {previewing ? 'Open the quiz' : state === 'continue' ? 'Continue' : 'Start quiz'}
          </Link>
        </>
      )}
    </div>
  )
}
