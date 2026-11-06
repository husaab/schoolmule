'use client'

// The family's sign that a mark is for a different version of an assessment.
// It sits beside the mark, not in place of it: the number still counts. That's
// why this isn't an AssessmentStatusBadge, which replaces the number.

import React from 'react'
import { modifiedExplainer } from '@/lib/modifiedMark'

export const ModifiedChip: React.FC<{ text?: string }> = ({ text = 'Modified' }) => (
  <span className="inline-block whitespace-nowrap rounded-full border border-violet-200 bg-violet-50 px-2 py-px text-[11px] font-medium text-violet-700">
    {text}
  </span>
)

/** What the word means, tucked away until someone asks. */
export const ModifiedExplainer: React.FC<{ firstName: string }> = ({ firstName }) => (
  <details className="mt-1 text-xs">
    <summary className="w-fit cursor-pointer text-violet-700 hover:underline">What does this mean?</summary>
    <p className="mt-1 leading-relaxed text-slate-600">{modifiedExplainer(firstName)}</p>
  </details>
)
