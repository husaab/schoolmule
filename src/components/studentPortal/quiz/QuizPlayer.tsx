// src/components/studentPortal/quiz/QuizPlayer.tsx
// Taking a quiz (Student-Quiz board, S5): the header ("{title}", "{Subject} ·
// 8 points · one try", the Saved pill, Finish later), the progress bar, then
// one question per screen, the confirm step and the done screen.
//
// The player only holds what is on screen (lib/quizPlayer's reducer). Saving
// is the page's: every pick and every keystroke is handed to `onChange` (the
// page's useDebouncedSave, 600 ms), and moving between questions (Next, Back,
// a dot, leaving a text box) asks for an immediate save (`onFlush`). The
// teacher's "Preview as a student" runs this same player with neither, so
// nothing is saved and nothing reaches the server.
//
// An answer the quiz will never take (a 400: the teacher removed the question
// or a choice) is shown on its question with the server's words and "Clear my
// answer" (`rejected`); Turn in waits until it is changed or cleared
// (`turnInBlock`). When the page reads the quiz again, the player takes the
// questions as they now stand.
'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import SaveStatusPill from '@/components/classroom/SaveStatusPill'
import type { DebouncedSaveStatus } from '@/lib/debouncedSaver'
import {
  answeredCount,
  initPlayer,
  isAnswered,
  nextLabel,
  progressPct,
  quizReducer,
  type AnswerMap,
  type PlayerAction,
} from '@/lib/quizPlayer'
import type { StudentQuestion } from '@/services/types/quiz'
import QuestionView from './QuestionView'
import QuizConfirm from './QuizConfirm'

interface QuizPlayerProps {
  title: string
  /** "Science · 8 points · one try" */
  subline: string
  questions: StudentQuestion[]
  initialAnswers: AnswerMap
  /** The answers that changed (autosave). Omitted in a preview: nothing is saved. */
  onChange?: (change: AnswerMap) => void
  /** Save what is waiting, now. */
  onFlush?: () => void
  /** The Saved pill; null hides it (a preview). */
  saveStatus?: DebouncedSaveStatus | null
  onRetrySave?: () => void
  /** Turn in; resolves true once the quiz is in (the done screen shows). */
  onTurnIn: () => Promise<boolean>
  /** Why Turn in is off (a preview), shown under it. */
  turnInDisabledReason?: string | null
  /** The done screen, once turned in. */
  done: ReactNode
  /** "Finish later": back to the item page (or, in a preview, close it). */
  finishLater: { label: string; href?: string; onClick?: () => void }
  /** A note under the header (a preview, a refused save). */
  notice?: ReactNode
  /** Inside a modal: the player fills the box instead of the page. */
  embedded?: boolean
  /** Answers the quiz refused for good, by question: shown on the question until changed or cleared. */
  rejected?: Record<string, string>
  /** Turn in waits for this question (a refused answer). */
  turnInBlock?: { index: number; message: string } | null
}

const FINISH =
  'inline-flex min-h-11 items-center rounded-[10px] border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800'

export default function QuizPlayer({
  title,
  subline,
  questions,
  initialAnswers,
  onChange,
  onFlush,
  saveStatus = null,
  onRetrySave,
  onTurnIn,
  turnInDisabledReason = null,
  done,
  finishLater,
  notice,
  embedded = false,
  rejected = {},
  turnInBlock = null,
}: QuizPlayerProps) {
  const [state, setState] = useState(() => initPlayer(questions, initialAnswers))
  // The quiz read again (after a refused answer): take the questions as they now stand.
  const [shownQuestions, setShownQuestions] = useState(questions)
  if (questions !== shownQuestions) {
    setShownQuestions(questions)
    setState((s) => quizReducer(s, { type: 'questions', questions }))
  }
  // The latest state, for event handlers between renders (a pick is saved with the answer it made).
  const latest = useRef(state)
  useEffect(() => {
    latest.current = state
  })
  const [busy, setBusy] = useState(false)
  // After the first move, each question takes the focus as it opens.
  const [moved, setMoved] = useState(false)

  const step = (action: PlayerAction) => {
    const next = quizReducer(latest.current, action)
    if (next === latest.current) return
    latest.current = next
    setState(next)
    if (action.type === 'pick' || action.type === 'text' || action.type === 'clear') {
      onChange?.({ [action.questionId]: next.answers[action.questionId] ?? null })
    } else if (action.type !== 'submitted' && action.type !== 'questions') {
      setMoved(true)
      onFlush?.()
    }
  }

  const turnIn = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (await onTurnIn()) step({ type: 'submitted' })
    } finally {
      setBusy(false)
    }
  }

  const count = state.questions.length
  const question = state.questions[state.index]
  const answered = state.questions.map((q) => isAnswered(q, state.answers[q.questionId]))
  const isDone = state.stage === 'done'

  return (
    <div className={`flex flex-col bg-slate-50 text-slate-900 ${embedded ? 'min-h-full' : 'min-h-screen'}`}>
      <header className="flex flex-col border-b border-slate-200 bg-white">
        <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100" aria-hidden="true">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-indigo-800" />
            </span>
            <div className="flex min-w-0 flex-col">
              <h1 className="m-0 truncate text-lg font-semibold">{title}</h1>
              <span className="truncate text-[13px] text-slate-500">{subline}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {saveStatus && <SaveStatusPill status={saveStatus} onRetry={() => onRetrySave?.()} />}
            {!isDone &&
              (finishLater.href ? (
                <Link href={finishLater.href} className={FINISH}>
                  {finishLater.label}
                </Link>
              ) : (
                <button type="button" onClick={finishLater.onClick} className={`${FINISH} cursor-pointer`}>
                  {finishLater.label}
                </button>
              ))}
          </div>
        </div>
        <div
          className="h-1.5 bg-indigo-50"
          role="progressbar"
          aria-label="Progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct(state))}
        >
          <div className="h-1.5 rounded-r-full bg-indigo-600 transition-[width] duration-300" style={{ width: `${progressPct(state)}%` }} />
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-14 pt-8 sm:px-6 sm:pt-10">
        <div className="flex w-full max-w-[760px] flex-col gap-6">
          {notice}
          {isDone ? (
            done
          ) : state.stage === 'review' || !question ? (
            <QuizConfirm
              answered={answeredCount(state.questions, state.answers)}
              count={count}
              busy={busy}
              disabledReason={turnInDisabledReason}
              block={turnInBlock}
              onGoTo={(index) => step({ type: 'go', index })}
              onCheck={() => step({ type: 'go', index: 0 })}
              onTurnIn={() => void turnIn()}
            />
          ) : (
            <QuestionView
              key={question.questionId}
              question={question}
              index={state.index}
              count={count}
              answer={state.answers[question.questionId]}
              answered={answered}
              problems={state.questions.map((q) => rejected[q.questionId] !== undefined)}
              rejected={rejected[question.questionId] ?? null}
              onClear={() => step({ type: 'clear', questionId: question.questionId })}
              nextLabel={nextLabel(state)}
              focusOnMount={moved}
              onPick={(optionId) => step({ type: 'pick', questionId: question.questionId, optionId })}
              onText={(value) => step({ type: 'text', questionId: question.questionId, value })}
              onTextBlur={() => onFlush?.()}
              onBack={() => step({ type: 'back' })}
              onNext={() => step({ type: 'next' })}
              onGo={(index) => step({ type: 'go', index })}
            />
          )}
        </div>
      </main>
    </div>
  )
}
