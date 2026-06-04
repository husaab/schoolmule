'use client'

// Cross-term comparison for a grade+subject in all-terms mode:
//   • term-vs-term class average + median bars
//   • per-student grade in each term with a change column
// Rendered above the classes table in the combined SubjectView.

import React from 'react'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { TermComparisonData, TermComparisonStudent } from '@/services/types/analytics'
import TermComparisonChart from '../charts/TermComparisonChart'
import AnalyticsTable, { Column } from '../tables/AnalyticsTable'

interface TermComparisonSectionProps {
  data: TermComparisonData
}

const fmtPct = (v: number | null | undefined) => (v == null ? '—' : `${v}%`)

const TermComparisonSection: React.FC<TermComparisonSectionProps> = ({ data }) => {
  // Term-vs-term: one category per term, average + median series.
  const termBars = data.terms.map((t) => ({
    label: t.termName,
    current: t.stats?.avg ?? null,
    previous: t.stats?.median ?? null,
  }))

  // Per-student table: a column per term + a change column (last − first).
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

  const firstTerm = data.terms[0]?.termName ?? 'first term'
  const lastTerm = data.terms[data.terms.length - 1]?.termName ?? 'latest term'

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-base font-semibold text-slate-900 mb-1 inline-flex items-center gap-2">
          <ArrowTrendingUpIcon className="w-4 h-4 text-cyan-500" />
          Term-over-Term Comparison
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          {data.subject}, Grade {data.grade} — class average &amp; median per term
        </p>
        <TermComparisonChart data={termBars} currentName="Average" previousName="Median" />
      </div>

      <AnalyticsTable
        title={`Students — ${firstTerm} vs ${lastTerm}`}
        subtitle="Each student's grade in this course per term · sorted by biggest drop"
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
