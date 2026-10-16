// src/components/classes/home/GradeGroupHeader.tsx
// The collapsible grade header the Classes list has always used, shared by
// the admin card grid and the List view.

import { AcademicCapIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface GradeGroupHeaderProps {
  /** "Junior Kindergarten", "Grade 5". */
  label: string
  count: number
  collapsed: boolean
  onToggle: () => void
}

export default function GradeGroupHeader({ label, count, collapsed, onToggle }: GradeGroupHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="flex w-full cursor-pointer select-none items-center justify-between rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
          <AcademicCapIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-semibold">{label}</span>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-sm">
          {count} {count === 1 ? 'class' : 'classes'}
        </span>
      </span>
      <ChevronDownIcon
        className={`h-5 w-5 transition-transform duration-200 ${collapsed ? '-rotate-90' : 'rotate-0'}`}
        aria-hidden="true"
      />
    </button>
  )
}
