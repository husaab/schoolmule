// src/components/classes/home/ClassesHomeHeader.tsx
// The Classes home heading (the Teacher-Home board): "Your classes" with the
// term, class and student counts, then the term picker, the Cards | List
// switch and "Add class" (for anyone who can change the year's classes).
'use client'

import { PlusIcon } from '@heroicons/react/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect'
import type { TermPayload } from '@/services/types/term'

export type ClassesView = 'cards' | 'list'

interface ClassesHomeHeaderProps {
  /** "Term 1 · 4 classes · 87 students" */
  summary: string
  /** 'active' | 'all' | a term name (the `term` URL filter). */
  term: string
  terms: TermPayload[]
  activeTerm?: TermPayload
  onTermChange: (term: string) => void
  view: ClassesView
  onViewChange: (view: ClassesView) => void
  /** Omitted when the viewer may not add classes (a past school year, for teachers). */
  onAdd?: () => void
}

const VIEWS: { id: ClassesView; label: string }[] = [
  { id: 'cards', label: 'Cards' },
  { id: 'list', label: 'List' },
]

export default function ClassesHomeHeader({
  summary,
  term,
  terms,
  activeTerm,
  onTermChange,
  view,
  onViewChange,
  onAdd,
}: ClassesHomeHeaderProps) {
  const termOptions = [
    { value: 'active', label: activeTerm ? `Active term (${activeTerm.name})` : 'Active term' },
    { value: 'all', label: 'All terms' },
    ...terms.map((t) => ({ value: t.name, label: t.name })),
  ]

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="font-display text-[30px] font-semibold leading-tight text-slate-900">Your classes</h1>
        <p className="text-[15px] text-slate-600">{summary}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchableSelect
          options={termOptions}
          value={term}
          onChange={onTermChange}
          ariaLabel="Term"
          searchPlaceholder="Find a term"
          size="sm"
          className="min-w-[11rem]"
        />
        <div role="group" aria-label="View" className="flex rounded-xl bg-slate-100 p-[3px]">
          {VIEWS.map((v) => {
            const on = view === v.id
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={on}
                onClick={() => onViewChange(v.id)}
                className={`cursor-pointer rounded-[9px] px-3 py-1.5 text-[13px] transition-colors ${
                  on ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v.label}
              </button>
            )
          })}
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Add class
          </button>
        )}
      </div>
    </div>
  )
}
