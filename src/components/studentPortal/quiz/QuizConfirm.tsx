// src/components/studentPortal/quiz/QuizConfirm.tsx
// The step before a quiz is turned in (Student-Quiz board): "Ready to turn it
// in?", how many questions are answered, that there is only one try, then
// "Check my answers" (back to question 1) or Turn in (an explicit button).
'use client'

import { confirmCounts } from '@/lib/quizPlayer'

interface QuizConfirmProps {
  answered: number
  count: number
  busy: boolean
  /** Why Turn in is off (a preview); null when it is on. */
  disabledReason?: string | null
  /** A refused answer: Turn in waits until it is changed or cleared. */
  block?: { index: number; message: string } | null
  onGoTo?: (index: number) => void
  onCheck: () => void
  onTurnIn: () => void
}

export default function QuizConfirm({ answered, count, busy, disabledReason = null, block = null, onGoTo, onCheck, onTurnIn }: QuizConfirmProps) {
  return (
    <section
      aria-labelledby="quiz-confirm-title"
      className="flex flex-col items-center gap-[18px] rounded-3xl border border-slate-200 bg-white px-6 py-9 text-center sm:px-9"
    >
      <h2 id="quiz-confirm-title" className="font-display m-0 text-[26px] font-semibold text-slate-900 sm:text-[30px]">
        Ready to turn it in?
      </h2>
      <p className="m-0 max-w-[560px] text-lg leading-normal text-slate-700">
        You answered <strong>{confirmCounts(answered, count)}</strong>. You only get one try, so you can&apos;t change your answers
        after this.
      </p>
      {block && (
        <div role="alert" className="flex max-w-[560px] flex-col items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[15px] text-rose-900">
          <p className="m-0">{block.message}</p>
          {onGoTo && (
            <button
              type="button"
              onClick={() => onGoTo(block.index)}
              className="min-h-11 cursor-pointer rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
            >
              Go to question {block.index + 1}
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onCheck}
          disabled={busy}
          className="min-h-[52px] cursor-pointer rounded-[14px] border border-slate-200 bg-white px-[22px] py-3.5 text-[17px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Check my answers
        </button>
        <button
          type="button"
          onClick={onTurnIn}
          disabled={busy || Boolean(disabledReason) || Boolean(block)}
          className="inline-flex min-h-[52px] cursor-pointer items-center gap-2 rounded-[14px] bg-indigo-600 px-[26px] py-3.5 text-[17px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          Turn in
        </button>
      </div>
      {disabledReason && <p className="m-0 text-sm text-slate-500">{disabledReason}</p>}
    </section>
  )
}
