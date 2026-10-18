// src/components/studentPortal/work/WorkStatusPill.tsx
// The small pill that names where a piece of work stands: Assigned, Ready to
// turn in, Turned in (· late), Graded (· 8/10), Missing, Excused, To read. The
// words and colors come from workStatusLabels.ts; work with nothing to turn
// in has no pill. Used on the To-do, the Classwork list, the assignment page
// and the parent's lens.
'use client'

import type { WorkStatusLabel } from '@/lib/workStatusLabels'

interface WorkStatusPillProps {
  label: WorkStatusLabel
  /** The assignment page's pill is a little bigger than a list row's. */
  size?: 'sm' | 'md'
  className?: string
}

export default function WorkStatusPill({ label, size = 'sm', className = '' }: WorkStatusPillProps) {
  if (!label.label) return null
  const sizing = size === 'md' ? 'px-[11px] py-[5px] text-[13px]' : 'px-2.5 py-1 text-xs'
  // inline-block, not a flex box: the space in " · late" must stay between the words.
  return (
    <span className={`inline-block shrink-0 whitespace-nowrap rounded-full font-semibold leading-snug ${sizing} ${label.pill} ${className}`}>
      {label.label}
      {label.suffix && <span className={label.suffixClass ?? ''}>{label.suffix}</span>}
    </span>
  )
}
