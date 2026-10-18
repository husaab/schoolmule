// src/components/studentPortal/work/TurnInBar.tsx
// The bottom of "Your work" (Student-Assignment board), in its four states:
//  - open:      a big Turn in button (Mark as done for "mark as done" work),
//               off with a hint until there is something to turn in
//  - turned in: who will grade it, and Unsubmit while that is still allowed
//  - closed:    "This assignment is closed. Ask your teacher."
//  - none:      nothing (graded, excused, or someone is only looking)
// Turn in and Unsubmit stay explicit buttons; only the answer autosaves (D17).
'use client'

import { ArrowPathIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'

export type TurnInBarView =
  | { kind: 'open'; label: string; disabled: boolean; hint: string; busy: boolean; note?: string | null; onTurnIn: () => void }
  | { kind: 'turnedIn'; note: string; canUnsubmit: boolean; busy: boolean; onUnsubmit: () => void }
  | { kind: 'closed'; note: string }

export default function TurnInBar({ view }: { view: TurnInBarView }) {
  if (view.kind === 'closed') {
    return <p className="rounded-xl bg-stone-100 px-3.5 py-3 text-sm leading-relaxed text-stone-700">{view.note}</p>
  }

  if (view.kind === 'turnedIn') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed text-slate-700">{view.note}</p>
        {view.canUnsubmit && (
          <button
            type="button"
            onClick={view.onUnsubmit}
            disabled={view.busy}
            className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            {view.busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />}
            Unsubmit
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {view.note && <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-900">{view.note}</p>}
      <button
        type="button"
        onClick={view.onTurnIn}
        disabled={view.disabled || view.busy}
        className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-indigo-600 px-4 py-3.5 text-[17px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      >
        {view.busy && <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />}
        {view.label}
      </button>
      <span className="text-center text-[13px] text-slate-500">{view.hint}</span>
    </div>
  )
}
