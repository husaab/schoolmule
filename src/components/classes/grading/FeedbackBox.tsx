// src/components/classes/grading/FeedbackBox.tsx
// Feedback for one student (Teacher-Grading board): "Feedback · {first} and
// parents see this". It autosaves into the draft as the teacher types and
// shows with the grade once published.
'use client'

import { FEEDBACK_MAX } from './quickComments'

interface FeedbackBoxProps {
  first: string
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onCommit: () => void
  /** A line under the box (an item with no gradebook column says here whether it is published). */
  hint?: string | null
}

export default function FeedbackBox({ first, value, disabled, onChange, onCommit, hint }: FeedbackBoxProps) {
  const near = value.length > FEEDBACK_MAX - 300
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="grading-feedback" className="text-[13px] font-medium text-slate-600">
        Feedback <span className="font-normal text-slate-500">· {first} and parents see this</span>
      </label>
      <textarea
        id="grading-feedback"
        rows={4}
        value={value}
        maxLength={FEEDBACK_MAX}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        className="resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[15px] leading-relaxed text-slate-900 outline-none transition-colors focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {(hint || near) && (
        <span className="flex justify-between gap-3 text-[13px] text-slate-600">
          <span>{hint}</span>
          {near && <span className="tabular-nums text-slate-500">{value.length} / {FEEDBACK_MAX}</span>}
        </span>
      )}
    </div>
  )
}
