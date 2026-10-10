'use client'

import React from 'react'
import { AssessmentStatus } from '@/lib/assessmentGrouping'

// Full literal class strings — never assembled dynamically (see childColors.ts).
//
// Three distinct looks on purpose: "Missing" is the only one that costs marks
// (it counts as 0), so it is the only one in a warning colour. "Not yet
// graded" and "Awaiting scores" are neutral — that work carries no weight —
// and "Excused" is quiet slate because it never counts either way.
const STYLES: Record<Exclude<AssessmentStatus, null>, { label: string; className: string }> = {
  excused: {
    label: 'Excused',
    className: 'bg-slate-100 text-slate-500',
  },
  missing: {
    label: 'Missing',
    className: 'bg-rose-50 text-rose-700 border border-rose-100',
  },
  not_graded: {
    label: 'Not yet graded',
    className: 'bg-stone-100 text-stone-500',
  },
  awaiting: {
    label: 'Awaiting scores',
    className: 'bg-stone-100 text-stone-500',
  },
}

const AssessmentStatusBadge: React.FC<{ status: AssessmentStatus }> = ({ status }) => {
  if (!status) return null
  const { label, className } = STYLES[status]
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${className}`}
    >
      {label}
    </span>
  )
}

export default AssessmentStatusBadge
