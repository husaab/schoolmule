// src/components/progress-report/roster/ProgressOverview.tsx
// How far the term's progress reports have got: one bar for the school
// (emailed, ready to email, not generated) and a tile per grade with its own
// bar. The tiles are also the grade filter: pick one or more to narrow the
// list below, pick again to drop one.
'use client'

import { gradeLabel, type ProgressCounts } from '@/lib/progressReportRoster'

interface Props {
  term: string
  counts: ProgressCounts
  grades: { grade: string; counts: ProgressCounts }[]
  selectedGrades: string[]
  onToggleGrade: (grade: string) => void
  onClearGrades: () => void
  loading?: boolean
}

const pct = (n: number, total: number) => `${total > 0 ? (n / total) * 100 : 0}%`

// Darker = further along: emailed (teal-700), ready to email (cyan-400), not generated (slate-200).
function SegmentBar({ counts, className }: { counts: ProgressCounts; className: string }) {
  return (
    <div className={`flex overflow-hidden rounded-full bg-slate-200 ${className}`}>
      <div className="bg-teal-700 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: pct(counts.emailed, counts.total) }} />
      <div className="bg-cyan-400 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: pct(counts.ready, counts.total) }} />
    </div>
  )
}

export default function ProgressOverview({ term, counts, grades, selectedGrades, onToggleGrade, onClearGrades, loading = false }: Props) {
  if (loading) {
    return (
      <section aria-label="Term progress" className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:p-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-4 h-2.5 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[62px] animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </section>
    )
  }

  const label = `${counts.emailed} emailed, ${counts.ready} ready to email, ${counts.none} not generated`

  return (
    <section aria-label="Term progress" className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="flex items-baseline gap-2.5">
          <span className="font-display text-3xl font-semibold tabular-nums text-slate-900">{counts.generated}</span>
          <span className="text-[15px] text-slate-600">
            of {counts.total} {counts.total === 1 ? 'student has' : 'students have'} a {term} report
          </span>
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-600">
          <li className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-teal-700" aria-hidden="true" />
            Emailed to family <span className="font-medium tabular-nums text-slate-900">{counts.emailed}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-cyan-400" aria-hidden="true" />
            Ready to email <span className="font-medium tabular-nums text-slate-900">{counts.ready}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-slate-200" aria-hidden="true" />
            Not generated <span className="font-medium tabular-nums text-slate-900">{counts.none}</span>
          </li>
        </ul>
      </div>

      <div role="img" aria-label={label} className="mt-4">
        <SegmentBar counts={counts} className="h-2.5" />
      </div>

      {grades.length > 1 && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6" role="group" aria-label="Show grades">
            {grades.map(({ grade, counts: g }) => {
              const on = selectedGrades.includes(grade)
              return (
                <button
                  key={grade}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onToggleGrade(grade)}
                  className={`flex cursor-pointer flex-col gap-2 rounded-xl border px-3.5 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    on ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex w-full items-baseline justify-between gap-2">
                    <span className={`text-sm font-medium ${on ? 'text-cyan-900' : 'text-slate-900'}`}>{gradeLabel(grade)}</span>
                    <span className="text-xs tabular-nums text-slate-500">
                      {g.generated} of {g.total}
                    </span>
                  </span>
                  <SegmentBar counts={g} className="h-1.5 w-full" />
                </button>
              )
            })}
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            {selectedGrades.length > 0 ? (
              <>
                Showing {selectedGrades.map(gradeLabel).join(', ')}.
                <button type="button" onClick={onClearGrades} className="cursor-pointer rounded font-medium text-cyan-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                  Show every grade
                </button>
              </>
            ) : (
              'Pick one or more grades to narrow the list.'
            )}
          </p>
        </>
      )}
    </section>
  )
}
