'use client'

import React from 'react'
import { AssessmentScore } from '@/services/types/parentPortal'
import { gradeTextColor } from './childColors'

const formatDate = (date: string | null) => {
  if (!date) return '—'
  const d = new Date(date)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Per-assessment score table shown inside an expanded class card. */
const ParentAssessmentTable: React.FC<{ scores: AssessmentScore[] }> = ({ scores }) => {
  if (scores.length === 0) {
    return <p className="text-sm text-slate-500 py-3">No assessments recorded yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-stone-200/70">
            <th className="py-2 pr-4 font-semibold">Assessment</th>
            <th className="py-2 pr-4 font-semibold">Date</th>
            <th className="py-2 pr-4 font-semibold text-right">Score</th>
            <th className="py-2 pr-4 font-semibold text-right">Out of</th>
            <th className="py-2 pr-4 font-semibold text-right">%</th>
            <th className="py-2 pr-4 font-semibold text-right">Weight</th>
            <th className="py-2 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {scores.map((s) => {
            const pct =
              s.score != null && s.maxScore ? Math.round((s.score / s.maxScore) * 1000) / 10 : null
            return (
              <tr key={s.assessmentId} className="border-b border-stone-100 last:border-0">
                <td className="py-2.5 pr-4 text-slate-700">{s.name}</td>
                <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap">{formatDate(s.date)}</td>
                <td className="py-2.5 pr-4 text-right text-slate-700">{s.score ?? '—'}</td>
                <td className="py-2.5 pr-4 text-right text-slate-500">{s.maxScore ?? '—'}</td>
                <td className={`py-2.5 pr-4 text-right font-medium ${gradeTextColor(pct)}`}>
                  {pct != null ? `${pct}%` : '—'}
                </td>
                <td className="py-2.5 pr-4 text-right text-slate-500">{s.weightPoints ?? '—'}</td>
                <td className="py-2.5 text-right">
                  {s.isExcluded ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">
                      Excluded
                    </span>
                  ) : s.score == null ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-100">
                      Missing
                    </span>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ParentAssessmentTable
