'use client'

import React from 'react'
import type { MeetingPhase } from '@/services/types/meetings'

const STYLES: Record<MeetingPhase, { label: string; className: string }> = {
  draft: { label: 'Draft · booking not open yet', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  scheduled: { label: 'Opens on schedule', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  open: { label: 'Booking open', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  closed: { label: 'Booking closed', className: 'border-slate-200 bg-slate-100 text-slate-600' },
  finished: { label: 'Finished', className: 'border-slate-200 bg-slate-50 text-slate-500' },
}

/** Where a meetings event is: draft, opening on schedule, open, closed, finished. */
const MeetingPhasePill: React.FC<{ phase: MeetingPhase }> = ({ phase }) => (
  <span className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium ${STYLES[phase].className}`}>
    {STYLES[phase].label}
  </span>
)

export default MeetingPhasePill
