// src/components/classes/home/ClassesToolbar.tsx
// The Classes home's filter bar: the Grade row (All · JK · SK · Gr 1–8, each
// with its count) once the classes span two or more grades, then, for
// admins, Subject and Teacher, then Show archived and Collapse all. Every
// value lives in the URL, so it survives Back and a refresh.
'use client'

import SearchableSelect, { type SearchableOption } from '@/components/ui/SearchableSelect'
import type { GradeFilterOption } from '@/lib/classGradeSections'

interface ClassesToolbarProps {
  grades: GradeFilterOption[]
  /** Every class the row's "All" covers. */
  total: number
  /** The `grade` URL value; '' = All. */
  grade: string
  onGrade: (grade: string) => void
  admin?: {
    subjects: SearchableOption[]
    subject: string
    onSubject: (subject: string) => void
    teachers: SearchableOption[]
    teacher: string
    onTeacher: (teacher: string) => void
  }
  showArchived: boolean
  onShowArchived: (on: boolean) => void
  /** Present while there are sections to collapse. */
  collapse?: { all: boolean; onToggleAll: () => void }
  /** Present while a filter narrows the classes. */
  filtered?: { shown: number; total: number; onClear: () => void }
}

const pill =
  'inline-flex h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-cyan-600 focus-visible:ring-offset-2'

const linkButton =
  'cursor-pointer whitespace-nowrap rounded text-sm font-medium text-cyan-700 outline-none hover:text-cyan-800 hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-cyan-600 focus-visible:ring-offset-2'

export default function ClassesToolbar({
  grades,
  total,
  grade,
  onGrade,
  admin,
  showArchived,
  onShowArchived,
  collapse,
  filtered,
}: ClassesToolbarProps) {
  const options = [{ value: '', label: 'All', count: total }, ...grades]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {grades.length > 1 && (
          // Below sm the row runs edge to edge and scrolls sideways.
          <div
            role="group"
            aria-label="Grade"
            className="-mx-4 flex w-[calc(100%+2rem)] min-w-0 gap-1.5 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:max-w-full sm:px-1 [&::-webkit-scrollbar]:hidden"
          >
            {options.map((o) => {
              const on = o.value === grade
              return (
                <button
                  key={o.value || 'all'}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${o.value ? o.label.replace(/^Gr /, 'Grade ') : 'All grades'}, ${o.count} ${o.count === 1 ? 'class' : 'classes'}`}
                  onClick={() => onGrade(o.value)}
                  className={`${pill} ${
                    on
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {o.label}
                  <span className={`text-xs tabular-nums ${on ? 'text-slate-300' : 'text-slate-400'}`}>{o.count}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2.5 sm:ml-auto sm:w-auto">
          {admin && (
            <>
              <SearchableSelect
                options={admin.subjects}
                value={admin.subject}
                onChange={admin.onSubject}
                allLabel="All subjects"
                ariaLabel="Subject"
                searchPlaceholder="Find a subject"
                size="sm"
                className="min-w-[9.5rem] flex-1 sm:flex-none"
              />
              <SearchableSelect
                options={admin.teachers}
                value={admin.teacher}
                onChange={admin.onTeacher}
                allLabel="All teachers"
                ariaLabel="Teacher"
                searchPlaceholder="Find a teacher"
                size="sm"
                className="min-w-[9.5rem] flex-1 sm:flex-none"
              />
            </>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2.5 whitespace-nowrap text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => onShowArchived(e.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="relative h-5 w-[34px] shrink-0 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-cyan-600 peer-checked:after:translate-x-3.5 peer-focus-visible:ring-[3px] peer-focus-visible:ring-cyan-600 peer-focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:after:transition-none"
            />
            Show archived
          </label>
          {collapse && (
            <button type="button" onClick={collapse.onToggleAll} className={linkButton}>
              {collapse.all ? 'Expand all' : 'Collapse all'}
            </button>
          )}
        </div>
      </div>

      {filtered && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span>
            Showing {filtered.shown} of {filtered.total} classes
          </span>
          <button type="button" onClick={filtered.onClear} className={linkButton}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
