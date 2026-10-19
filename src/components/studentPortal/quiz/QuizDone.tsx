// src/components/studentPortal/quiz/QuizDone.tsx
// After a quiz is turned in (Student-Quiz board): a check, "Turned in. Nice
// work, {first}!", then who grades it first (a quiz the teacher publishes, the
// default), or the score when the quiz releases results right after submit,
// and "Back to Home". The words come from doneCopy (lib/quizPlayer.ts).
'use client'

import Link from 'next/link'
import { CheckIcon } from '@heroicons/react/24/outline'
import type { DoneCopy } from '@/lib/quizPlayer'

interface QuizDoneProps {
  copy: DoneCopy
  /** "Back to Home" for a student; the preview's own way out. */
  action: { label: string; href?: string; onClick?: () => void }
  /** A second link (the quiz's own page, to see the answers). */
  secondary?: { label: string; href: string } | null
}

const PRIMARY =
  'inline-flex min-h-[50px] items-center rounded-[14px] bg-indigo-600 px-[22px] py-3.5 text-base font-semibold text-white transition-colors hover:bg-indigo-700'

export default function QuizDone({ copy, action, secondary = null }: QuizDoneProps) {
  return (
    <section
      aria-labelledby="quiz-done-title"
      className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center sm:px-9"
    >
      <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-emerald-100">
        <CheckIcon className="h-[38px] w-[38px] text-emerald-700" strokeWidth={2.2} aria-hidden="true" />
      </span>
      <h2 id="quiz-done-title" className="font-display m-0 text-[26px] font-semibold text-slate-900 sm:text-[30px]">
        {copy.title}
      </h2>
      {copy.score && <p className="font-display m-0 text-[40px] font-semibold leading-none text-indigo-800">{copy.score}</p>}
      <p className="m-0 max-w-[520px] text-lg leading-normal text-slate-700">{copy.body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {action.href ? (
          <Link href={action.href} className={PRIMARY}>
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={`${PRIMARY} cursor-pointer`}>
            {action.label}
          </button>
        )}
        {secondary && (
          <Link
            href={secondary.href}
            className="inline-flex min-h-[50px] items-center rounded-[14px] border border-slate-200 bg-white px-5 py-3.5 text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </section>
  )
}
