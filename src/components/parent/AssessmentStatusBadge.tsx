'use client'

import React from 'react'
import { AssessmentStatus } from '@/lib/assessmentGrouping'

// Full literal class strings — never assembled dynamically (see childColors.ts).
const STYLES: Record<Exclude<AssessmentStatus, null>, { label: string; className: string }> = {
  excluded: {
    label: 'Excluded',
    className: 'bg-slate-100 text-slate-500',
  },
  missing: {
    label: 'Missing',
    className: 'bg-amber-50 text-amber-700 border border-amber-100',
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
