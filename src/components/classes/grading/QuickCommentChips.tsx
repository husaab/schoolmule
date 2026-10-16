// src/components/classes/grading/QuickCommentChips.tsx
// The quick-comment chips under the feedback box (Teacher-Grading board):
// "+ Great labelling", "+ Check your spelling", "+ See me in class". A click
// adds the comment to the feedback.
'use client'

import { QUICK_COMMENTS } from './quickComments'

export default function QuickCommentChips({ disabled, onAdd }: { disabled: boolean; onAdd: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Quick comments">
      {QUICK_COMMENTS.map((c) => (
        <button
          key={c.label}
          type="button"
          disabled={disabled}
          onClick={() => onAdd(c.text)}
          className="cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + {c.label}
        </button>
      ))}
    </div>
  )
}
