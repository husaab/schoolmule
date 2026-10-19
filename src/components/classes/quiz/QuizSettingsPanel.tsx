// src/components/classes/quiz/QuizSettingsPanel.tsx
// The quiz builder's right column (Teacher-Quiz board): "When" (posts, due),
// "Gradebook" ("{category} · out of {total}"), "Show scores" (after the
// teacher reviews and publishes: the default, results only with a Publish; or
// right after they submit, only when every question is auto-graded) and "Settings" (one attempt, shuffle, show
// right answers once published). Each change saves at once through the
// item's PATCH; a refusal is said under its card.
'use client'

import Link from 'next/link'
import { canReleaseOnSubmit, quizGradebookLine, quizWhenLines, writtenHint } from '@/lib/quizBuilder'
import type { Item } from '@/services/types/classwork'
import type { QuestionKind, QuizSettings } from '@/services/types/quiz'

interface QuizSettingsPanelProps {
  item: Item
  settings: QuizSettings
  questions: { kind: QuestionKind }[]
  totalPoints: number
  /** The item's details (title, due, gradebook) are edited in the item form. */
  editHref: string | null
  /** A setting is saving: which one. */
  busy: keyof QuizSettings | null
  error: string | null
  disabled: boolean
  onChange: (patch: Partial<QuizSettings>) => void
}

const CARD = 'flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-5'
const TITLE = 'font-display m-0 text-[17px] font-semibold text-slate-900'

export default function QuizSettingsPanel({
  item,
  settings,
  questions,
  totalPoints,
  editHref,
  busy,
  error,
  disabled,
  onChange,
}: QuizSettingsPanelProps) {
  const when = quizWhenLines(item)
  const autoOnly = canReleaseOnSubmit(questions)
  const handGraded = writtenHint(questions)

  return (
    <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
      <div className={CARD}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className={TITLE}>When</h2>
          {editHref && (
            <Link href={editHref} className="text-[13px] font-medium text-cyan-700 hover:text-cyan-800">
              Edit details
            </Link>
          )}
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-slate-600">{when.postsLabel}</span>
          <span className="text-right text-slate-900">{when.posts}</span>
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-slate-600">Due</span>
          <span className="text-right text-slate-900">{when.due}</span>
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-slate-600">Gradebook</span>
          <span className="text-right text-slate-900">{quizGradebookLine(item.gradebook, totalPoints)}</span>
        </div>
      </div>

      <fieldset className={`${CARD} m-0`} disabled={disabled}>
        <legend className={`${TITLE} float-left mb-1 p-0`}>Show scores</legend>
        <label className="clear-both flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-800">
          <input
            type="radio"
            name="quiz-release"
            checked={settings.release === 'after_review'}
            disabled={busy !== null}
            onChange={() => onChange({ release: 'after_review' })}
            className="mt-px h-[18px] w-[18px] shrink-0 cursor-pointer accent-cyan-600"
          />
          <span>
            After I review and publish
            {handGraded && <span className="block text-[13px] text-slate-500">{handGraded}</span>}
          </span>
        </label>
        <label
          className={`flex items-start gap-2.5 text-sm leading-snug ${autoOnly ? 'cursor-pointer text-slate-800' : 'cursor-not-allowed text-slate-500'}`}
        >
          <input
            type="radio"
            name="quiz-release"
            checked={settings.release === 'on_submit'}
            disabled={!autoOnly || busy !== null}
            onChange={() => onChange({ release: 'on_submit' })}
            className="mt-px h-[18px] w-[18px] shrink-0 cursor-pointer accent-cyan-600 disabled:cursor-not-allowed"
          />
          <span>
            Right after they submit
            <span className="block text-[13px] text-slate-500">
              {autoOnly ? 'Results show as soon as a student turns it in.' : 'Only when every question is auto-graded'}
            </span>
          </span>
        </label>
      </fieldset>

      <div className={CARD}>
        <h2 className={TITLE}>Settings</h2>
        <div className="flex items-center justify-between text-sm text-slate-800">
          <span>Attempts</span>
          <span className="rounded-[10px] bg-slate-100 px-2.5 py-1">1</span>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-800">
          Shuffle question order
          <input
            type="checkbox"
            checked={settings.shuffle}
            disabled={disabled || busy !== null}
            onChange={(e) => onChange({ shuffle: e.target.checked })}
            className="h-[18px] w-[18px] cursor-pointer accent-cyan-600"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-800">
          Show right answers once published
          <input
            type="checkbox"
            checked={settings.showAnswers}
            disabled={disabled || busy !== null}
            onChange={(e) => onChange({ showAnswers: e.target.checked })}
            className="h-[18px] w-[18px] cursor-pointer accent-cyan-600"
          />
        </label>
        <p className="m-0 text-[13px] leading-normal text-slate-500">Not in v1: timers, locked browser, question banks.</p>
      </div>

      {busy && <p className="text-[13px] text-slate-500">Saving…</p>}
      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-800">
          {error}
        </p>
      )}
    </aside>
  )
}
