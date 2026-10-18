// src/components/studentPortal/work/RefusedAnswer.tsx
// What the student sees when the server refused their typed answer (the work
// was already turned in from another place, or the assignment closed while they
// were typing): why, and the words they wrote, kept here so they can be read and
// copied. Nothing typed is lost silently. When the work can be changed again
// (after Unsubmit) the words can be put back in the box.
'use client'

import { useRef, useState } from 'react'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'

interface RefusedAnswerProps {
  text: string
  message: string
  /** Put the words back in the answer box (only while the work can be changed). */
  onUse?: () => void
  onDismiss: () => void
}

export default function RefusedAnswer({ text, message, onUse, onDismiss }: RefusedAnswerProps) {
  const box = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // No clipboard access: select the words so Copy from the keyboard or the menu works.
      box.current?.focus()
      box.current?.select()
    }
  }

  return (
    <div role="alert" className="flex flex-col gap-2.5 rounded-[14px] border border-amber-200 bg-amber-50 p-3.5">
      <p className="text-sm font-medium leading-relaxed text-amber-950">{message}</p>
      <label className="flex flex-col gap-1.5 text-[13px] text-amber-900">
        The words you wrote are kept here. Copy them if you need them.
        <textarea
          ref={box}
          readOnly
          value={text}
          rows={4}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full resize-y rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-[15px] leading-relaxed text-slate-900 outline-none focus:ring-2 focus:ring-amber-200"
        />
      </label>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
        <button type="button" onClick={() => void copy()} className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-amber-900 hover:text-amber-950">
          <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
          {copied ? 'Copied' : 'Copy'}
        </button>
        {onUse && (
          <button type="button" onClick={onUse} className="min-h-10 cursor-pointer text-indigo-700 hover:text-indigo-900">
            Put these words back in the box
          </button>
        )}
        <button type="button" onClick={onDismiss} className="min-h-10 cursor-pointer text-slate-600 hover:text-slate-800">
          Hide
        </button>
      </div>
    </div>
  )
}
