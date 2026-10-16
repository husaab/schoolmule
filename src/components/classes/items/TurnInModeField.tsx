// src/components/classes/items/TurnInModeField.tsx
// "How do students turn it in?" (the Teacher-Assign board): four cards, one
// per way of handing work in.
'use client'

import type { SubmissionMode } from '@/services/types/classwork'
import { CardTitle } from './formParts'

const MODES: { value: SubmissionMode; title: string; detail: string }[] = [
  { value: 'file', title: 'File or photo', detail: 'Upload, or snap a photo on a phone' },
  { value: 'text', title: 'Typed answer', detail: 'A text box on the page' },
  { value: 'done', title: 'Mark as done', detail: 'Work stays on paper' },
  { value: 'none', title: 'Nothing to turn in', detail: 'Done in class, graded on paper' },
]

interface TurnInModeFieldProps {
  value: SubmissionMode
  onChange: (mode: SubmissionMode) => void
  disabled?: boolean
}

export default function TurnInModeField({ value, onChange, disabled }: TurnInModeFieldProps) {
  return (
    <fieldset className="m-0 flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6">
      <legend className="sr-only">How do students turn it in?</legend>
      <CardTitle>How do students turn it in?</CardTitle>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-2.5">
        {MODES.map((m) => {
          const on = m.value === value
          return (
            <label
              key={m.value}
              className={`flex cursor-pointer items-start gap-3 rounded-[14px] p-3.5 transition-colors ${
                on ? 'border-2 border-cyan-400 bg-cyan-50' : 'border border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="submission-mode"
                value={m.value}
                checked={on}
                disabled={disabled}
                onChange={() => onChange(m.value)}
                className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-cyan-600"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-medium text-slate-900">{m.title}</span>
                <span className="text-[13px] text-slate-600">{m.detail}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
