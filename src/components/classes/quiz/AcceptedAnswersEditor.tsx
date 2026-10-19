// src/components/classes/quiz/AcceptedAnswersEditor.tsx
// The answers a short-text question takes as right (Teacher-Quiz board):
// "Accepted answers" as green chips you can type in, each with ✕, then "+ Add
// another" (up to 10) and the hint that capitals and extra spaces don't
// matter. An empty chip is still being typed and is not saved.
'use client'

import { useEffect, useRef } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ACCEPTED_MAX, MAX_ACCEPTED, type DraftQuestion } from '@/lib/quizBuilder'

interface AcceptedAnswersEditorProps {
  question: DraftQuestion
  label: string
  disabled: boolean
  onChange: (next: DraftQuestion) => void
}

export default function AcceptedAnswersEditor({ question: q, label, disabled, onChange }: AcceptedAnswersEditorProps) {
  const listRef = useRef<HTMLDivElement>(null)
  // "+ Add another" puts the cursor in the new chip.
  const focusLast = useRef(false)
  useEffect(() => {
    if (!focusLast.current) return
    focusLast.current = false
    const inputs = listRef.current?.querySelectorAll('input')
    inputs?.[inputs.length - 1]?.focus()
  })

  const set = (i: number, text: string) => onChange({ ...q, accepted: q.accepted.map((a, j) => (j === i ? text : a)) })
  const remove = (i: number) => {
    const rest = q.accepted.filter((_, j) => j !== i)
    onChange({ ...q, accepted: rest.length > 0 ? rest : [''] })
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={listRef} className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-slate-600">Accepted answers</span>
        {q.accepted.map((a, i) => (
          <span key={i} className="inline-flex items-center gap-0.5 rounded-[10px] border border-emerald-200 bg-emerald-50 py-0.5 pl-1 pr-0.5">
            <input
              type="text"
              value={a}
              maxLength={ACCEPTED_MAX}
              disabled={disabled}
              onChange={(e) => set(i, e.target.value)}
              aria-label={`${label}, accepted answer ${i + 1}`}
              placeholder="An answer"
              size={Math.max(8, Math.min(28, a.length + 1))}
              className="rounded-md bg-transparent px-1.5 py-1 text-sm text-emerald-800 outline-none placeholder:text-emerald-600/60 focus:bg-white disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={disabled}
              aria-label={`${label}: remove accepted answer ${i + 1}`}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => {
            focusLast.current = true
            onChange({ ...q, accepted: [...q.accepted, ''] })
          }}
          disabled={disabled || q.accepted.length >= MAX_ACCEPTED}
          className="inline-flex cursor-pointer items-center gap-1 rounded-[10px] border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-600 hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Add another
        </button>
      </div>
      <span className="text-[13px] text-slate-500">Capitals and extra spaces don&apos;t matter. Anything else, you can mark right by hand.</span>
    </div>
  )
}
