// src/components/classes/quiz/OptionsEditor.tsx
// The choices of a one-answer or several-answers question (Teacher-Quiz
// board): each row has its letter, the words, a "Correct" toggle (tagged in
// green when on; one answer moves the mark, several toggle it), move up /
// down and remove. "+ Add a choice" up to 8. Several answers also offers
// partial points. Empty choices are left out of what students see.
'use client'

import { ArrowDownIcon, ArrowUpIcon, CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { MAX_OPTIONS, moveInList, nextOptionId, OPTION_TEXT_MAX, removeOption, toggleCorrect, type DraftQuestion } from '@/lib/quizBuilder'

interface OptionsEditorProps {
  question: DraftQuestion
  /** "Question 2", for the inputs' names. */
  label: string
  /** The choice ids the question had when saved (a student may have picked one): a new choice avoids them. */
  reserved: string[]
  disabled: boolean
  onChange: (next: DraftQuestion) => void
}

const letterAt = (i: number) => String.fromCharCode(65 + i)

const ICON_BUTTON =
  'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'

export default function OptionsEditor({ question: q, label, reserved, disabled, onChange }: OptionsEditorProps) {
  const several = q.kind === 'many'
  const nextId = nextOptionId(q.options, reserved)
  const hasBlank = q.options.some((o) => o.text.trim() === '')

  const setText = (id: string, text: string) => onChange({ ...q, options: q.options.map((o) => (o.id === id ? { ...o, text } : o)) })

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2" aria-label={`${label} choices`}>
        {q.options.map((o, i) => {
          const right = q.correct.includes(o.id)
          return (
            <li
              key={o.id}
              className={`flex items-center gap-2 rounded-xl border py-1.5 pl-3 pr-1.5 transition-colors ${
                right ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center border-2 text-[11px] font-semibold ${
                  several ? 'rounded-[6px]' : 'rounded-full'
                } ${right ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 text-slate-500'}`}
              >
                {letterAt(i)}
              </span>
              <input
                type="text"
                value={o.text}
                maxLength={OPTION_TEXT_MAX}
                disabled={disabled}
                onChange={(e) => setText(o.id, e.target.value)}
                aria-label={`${label}, choice ${letterAt(i)}`}
                placeholder={`Choice ${letterAt(i)}`}
                className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1.5 py-1.5 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-300 focus:bg-white disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => onChange(toggleCorrect(q, o.id))}
                disabled={disabled}
                aria-pressed={right}
                aria-label={`${label}: ${right ? 'choice ' + letterAt(i) + ' is marked right' : 'mark choice ' + letterAt(i) + ' right'}`}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                  right ? 'text-emerald-700 hover:bg-emerald-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {right && <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />}
                {right ? 'Correct' : 'Mark correct'}
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...q, options: moveInList(q.options, i, -1) })}
                disabled={disabled || i === 0}
                aria-label={`${label}: move choice ${letterAt(i)} up`}
                className={ICON_BUTTON}
              >
                <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...q, options: moveInList(q.options, i, 1) })}
                disabled={disabled || i === q.options.length - 1}
                aria-label={`${label}: move choice ${letterAt(i)} down`}
                className={ICON_BUTTON}
              >
                <ArrowDownIcon className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onChange(removeOption(q, o.id))}
                disabled={disabled}
                aria-label={`${label}: remove choice ${letterAt(i)}`}
                className={`${ICON_BUTTON} hover:!text-rose-700`}
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={() => nextId && onChange({ ...q, options: [...q.options, { id: nextId, text: '' }] })}
          disabled={disabled || !nextId || q.options.length >= MAX_OPTIONS}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-1 text-[13px] font-medium text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add a choice
        </button>
        {hasBlank && <span className="text-xs text-slate-500">Empty choices aren&apos;t shown to students.</span>}
      </div>
      {several && (
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-slate-600">
          <input
            type="checkbox"
            checked={q.partialCredit}
            disabled={disabled}
            onChange={(e) => onChange({ ...q, partialCredit: e.target.checked })}
            className="h-4 w-4 cursor-pointer accent-cyan-600"
          />
          Give partial points for some right answers
        </label>
      )}
    </div>
  )
}
