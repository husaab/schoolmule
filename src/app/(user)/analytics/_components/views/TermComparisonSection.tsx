'use client'

// Cross-term comparison for a grade+subject in all-terms mode. Built to read
// as a clear Term 1 vs Term 2 side-by-side:
//   • two term summary cards (avg / median / students) with the change between
//   • a per-student grouped bar — each student's grade in Term 1 vs Term 2
//   • a precise, exportable per-student table with a change column

import React from 'react'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { TermComparisonData, TermComparisonStudent } from '@/services/types/analytics'
import TermComparisonChart from '../charts/TermComparisonChart'
import AnalyticsTable, { Column } from '../tables/AnalyticsTable'

interface TermComparisonSectionProps {
  data: TermComparisonData
}

const fmtPct = (v: number | null | undefined) => (v == null ? '—' : `${v}%`)
const firstName = (full: string) => full.split(' ')[0]

const TermComparisonSection: React.FC<TermComparisonSectionProps> = ({ data }) => {
  // Compare the earliest vs latest term that has a class for this course.
  const first = data.terms[0]
  const last = data.terms[data.terms.length - 1]
  const classDelta =
    first?.stats?.avg != null && last?.stats?.avg != null
      ? Math.round((last.stats.avg - first.stats.avg) * 10) / 10
      : null

  // Per-student grouped bar: Term 1 bar vs Term 2 bar, side by side.
  const studentBars = data.students
    .filter((s) => s.byTerm[first.termId] != null || s.byTerm[last.termId] != null)
    .map((s) => ({
      label: firstName(s.studentName),
      current: s.byTerm[first.termId] ?? null,
      previous: s.byTerm[last.termId] ?? null,
    }))
  // Keep bars legible: ~52px per student, horizontal scroll past that.
  const barMinWidth = Math.max(studentBars.length * 52, 480)

  const termColumns: Column<TermComparisonStudent>[] = data.terms.map((t) => ({
    key: t.termId,
    label: t.termName,
    numeric: true,
    accessor: (r) => r.byTerm[t.termId] ?? null,
    render: (r) => fmtPct(r.byTerm[t.termId]),
  }))

  const studentColumns: Column<TermComparisonStudent>[] = [
    { key: 'studentName', label: 'Student', render: (r) => <span className="font-medium text-slate-900">{r.studentName}</span> },
    ...termColumns,
    {
      key: 'delta',
      label: 'Change',
      numeric: true,
      accessor: (r) => r.delta,
      render: (r) =>
        r.delta == null ? (
          <span className="text-slate-400">—</span>
        ) : (
          <span className={`font-semibold ${r.delta > 0 ? 'text-emerald-600' : r.delta < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
            {r.delta > 0 ? '▲' : r.delta < 0 ? '▼' : ''} {r.delta > 0 ? '+' : ''}
            {r.delta}
          </span>
        ),
    },
  ]

  return (
    <>
      {/* Two term summary cards, side by side */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-base font-semibold text-slate-900 mb-1 inline-flex items-center gap-2">
          <ArrowTrendingUpIcon className="w-4 h-4 text-cyan-500" />
          {first.termName} vs {last.termName}
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          {data.subject}, Grade {data.grade} — how the same course moved between terms
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[first, last].map((t, i) => {
            const isLast = i === 1
            return (
              <div
                key={t.termId}
                className={`rounded-xl border p-4 ${isLast ? 'border-teal-200 bg-teal-50/40' : 'border-cyan-200 bg-cyan-50/40'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wide ${isLast ? 'text-teal-700' : 'text-cyan-700'}`}>
                    {t.termName}
                  </span>
                  {isLast && classDelta != null && (
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        classDelta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {classDelta >= 0 ? '▲ +' : '▼ '}
                      {classDelta} vs {first.termName}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-slate-900">{fmtPct(t.stats?.avg)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  median {fmtPct(t.stats?.median)} · {t.studentCount} student{t.studentCount === 1 ? '' : 's'}
                  {t.teacherName ? ` · ${t.teacherName}` : ''}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-student grouped bar — Term 1 vs Term 2 side by side */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Every Student — {first.termName} vs {last.termName}</h2>
        <p className="text-xs text-slate-500 mb-4">Each student&apos;s grade in this course, both terms side by side</p>
        <div className="overflow-x-auto">
          <div style={{ minWidth: barMinWidth }}>
            <TermComparisonChart
              data={studentBars}
              currentName={first.termName}
              previousName={last.termName}
              height={300}
            />
          </div>
        </div>
      </div>

      <AnalyticsTable
        title="Student Detail"
        subtitle="Grade per term with change · sorted by biggest drop first"
        columns={studentColumns}
        data={data.students}
        rowKey={(r) => r.studentId}
        exportFilename={`${data.subject}-grade${data.grade}-term-comparison`}
        defaultSort={{ key: 'delta', dir: 'asc' }}
      />
    </>
  )
}

export default TermComparisonSection
