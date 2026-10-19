// src/components/classes/home/GradeGroupHeader.tsx
// A grade section's header on the Classes home (cards and List): the grade
// token, "Grade 5", "6 classes · 25 to review" and a chevron. It sticks under
// the navbar while its grade scrolls by, and a collapsed one still shows its
// classes' icons.

import { ArchiveBoxIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import type { GradeSection } from '@/lib/classGradeSections'

interface GradeGroupHeaderProps {
  section: GradeSection<{ classId: string; identity: { iconUrl: string } }>
  /** The Archived section (an archive-box token, no review count). */
  archived?: boolean
  collapsed: boolean
  onToggle: () => void
}

export default function GradeGroupHeader({ section, archived = false, collapsed, onToggle }: GradeGroupHeaderProps) {
  const count = section.cards.length
  const kinder = section.token.length > 1

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="group sticky top-20 z-10 flex w-full cursor-pointer select-none items-center gap-3 border-b border-slate-200 bg-slate-50/95 py-2.5 pl-0.5 pr-1.5 text-left backdrop-blur-sm outline-none focus-visible:rounded-lg focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-cyan-600"
    >
      <span
        aria-hidden="true"
        className={`grid h-[34px] min-w-[34px] shrink-0 place-items-center rounded-[10px] border px-1.5 font-display font-semibold tabular-nums ${
          archived ? 'border-amber-200 bg-amber-100 text-amber-800' : 'border-slate-300 bg-white text-slate-900'
        } ${kinder ? 'text-[13px]' : 'text-base'}`}
      >
        {archived ? <ArchiveBoxIcon className="h-[18px] w-[18px]" /> : section.token}
      </span>
      <span className="whitespace-nowrap font-display text-lg font-semibold text-slate-900 group-hover:text-cyan-700 sm:text-xl">
        {section.label}
      </span>
      <span className="min-w-0 truncate text-sm text-slate-500">
        {count} {count === 1 ? 'class' : 'classes'}
        {section.reviewCount > 0 && (
          <span className="hidden sm:inline">
            {' · '}
            <span className="font-medium text-cyan-700">{section.reviewCount} to review</span>
          </span>
        )}
      </span>
      {collapsed && (
        <span aria-hidden="true" className="hidden shrink-0 gap-1 sm:flex">
          {section.cards.slice(0, 6).map((c) => (
            // eslint-disable-next-line @next/next/no-img-element -- static class icon SVG
            <img key={c.classId} src={c.identity.iconUrl} alt="" className="h-[22px] w-[22px] rounded-md" />
          ))}
        </span>
      )}
      <ChevronDownIcon
        className={`ml-auto h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 motion-reduce:transition-none ${collapsed ? '-rotate-90' : 'rotate-0'}`}
        aria-hidden="true"
      />
    </button>
  )
}
