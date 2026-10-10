'use client'

import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  PresentationChartLineIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { StudentData, StudentClassBreakdown, AssessmentCellStatus } from '@/services/types/analytics'
import { UseAnalyticsParams } from '../../_hooks/useAnalyticsParams'
import { computeAtRiskScore, coverageTitle, notYetGradedOf, shortCoverage } from '@/lib/analyticsUtils'
import StatCard from '../StatCard'
import TermComparisonChart from '@/components/analytics/charts/TermComparisonChart'
import AnalyticsTable, { Column } from '../tables/AnalyticsTable'

interface StudentViewProps {
  student: StudentData
  params: UseAnalyticsParams
  aiPanel: React.ReactNode
}

const fmtPct = (v: number | null | undefined) => (v == null ? '—' : `${v}%`)

const StudentView: React.FC<StudentViewProps> = ({ student, params, aiPanel }) => {
  const [expandedClass, setExpandedClass] = useState<string | null>(null)

  // Overall coverage = the sum across classes; blank cells are "not yet
  // graded" and carry no weight, so they are reported but never scored.
  const overallCoverage = useMemo(() => {
    const sum = { assessed: 0, graded: 0, missing: 0, excused: 0, blank: 0, total: 0, countedWeight: 0, totalWeight: 0 }
    let any = false
    for (const c of student.classes) {
      if (!c.coverage) continue
      any = true
      sum.assessed += c.coverage.assessed
      sum.graded += c.coverage.graded
      sum.missing += c.coverage.missing
      sum.excused += c.coverage.excused
      sum.blank += c.coverage.blank
      sum.total += c.coverage.total
      sum.countedWeight += c.coverage.countedWeight
      sum.totalWeight += c.coverage.totalWeight
    }
    return any ? sum : null
  }, [student.classes])
  const notYetGraded = student.overall.notYetGradedCount ?? overallCoverage?.blank ?? 0

  const risk = useMemo(
    () =>
      computeAtRiskScore({
        gradePercent: student.overall.avg,
        attendancePercent: student.attendance?.pct ?? null,
        missingWorkCount: student.overall.missingCount,
        notYetGradedCount: notYetGraded,
        trajectoryDelta: student.termTrajectory?.diff ?? 0,
      }),
    [student, notYetGraded]
  )

  const classColumns: Column<StudentClassBreakdown>[] = [
    {
      key: 'subject',
      label: 'Class',
      render: (c) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
          {expandedClass === c.classId ? <ChevronUpIcon className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />}
          {c.subject}
        </span>
      ),
    },
    { key: 'teacherName', label: 'Teacher', lowPriority: true },
    {
      key: 'finalPct',
      label: 'Grade',
      numeric: true,
      // null = nothing counts yet (never 0); the muted line is the coverage.
      render: (c) =>
        c.finalPct == null ? (
          <span className="text-slate-400" title={coverageTitle(c.coverage)}>no graded work yet</span>
        ) : (
          <span className="inline-flex flex-col items-end leading-tight" title={coverageTitle(c.coverage)}>
            <span className={`font-semibold ${c.finalPct >= 80 ? 'text-emerald-600' : c.finalPct >= 60 ? 'text-slate-900' : 'text-rose-600'}`}>{c.finalPct}%</span>
            {c.coverage && <span className="text-[10px] font-normal text-slate-400">{shortCoverage(c.coverage)}</span>}
          </span>
        ),
    },
    { key: 'classAvg', label: 'Class Avg', numeric: true, render: (c) => fmtPct(c.classAvg) },
    { key: 'percentileInClass', label: 'Percentile', numeric: true, lowPriority: true, render: (c) => (c.percentileInClass == null ? '—' : Math.round(c.percentileInClass)) },
    {
      key: 'missingCount',
      label: 'Missing (flagged)',
      numeric: true,
      render: (c) =>
        c.missingCount > 0 ? <span className="font-medium text-rose-600">{c.missingCount}</span> : <span className="text-slate-400">0</span>,
    },
    {
      key: 'notYetGraded',
      label: 'Not yet graded',
      numeric: true,
      lowPriority: true,
      accessor: (c) => notYetGradedOf(c),
      render: (c) => {
        const n = notYetGradedOf(c)
        return n > 0 ? <span className="text-slate-500">{n}</span> : <span className="text-slate-400">0</span>
      },
    },
  ]

  const vsClassData = student.classes.map((c) => ({
    label: c.subject.length > 12 ? `${c.subject.slice(0, 11)}…` : c.subject,
    current: c.finalPct,
    previous: c.classAvg,
  }))

  const expanded = student.classes.find((c) => c.classId === expandedClass)

  return (
    <div className="space-y-6">
      {/* Risk banner */}
      {risk.tier !== 'low' && (
        <div
          className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border animate-fade-in-up ${
            risk.tier === 'high' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
          }`}
        >
          <ExclamationTriangleIcon className={`w-5 h-5 flex-shrink-0 ${risk.tier === 'high' ? 'text-rose-500' : 'text-amber-500'}`} />
          <div className="text-sm">
            <span className={`font-semibold ${risk.tier === 'high' ? 'text-rose-700' : 'text-amber-700'}`}>
              {risk.tier === 'high' ? 'Needs attention' : 'Worth monitoring'} — risk score {risk.score}/100.
            </span>{' '}
            <span className="text-slate-600">{risk.flags.join(' · ')}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in-up">
        <StatCard
          label="Overall Average"
          value={fmtPct(student.overall.avg)}
          icon={ChartBarIcon}
          color="from-cyan-500 to-cyan-600"
          delta={student.termTrajectory?.diff ?? null}
          deltaLabel="vs compared term"
          sub={
            student.overall.avg == null
              ? 'no graded work yet'
              : overallCoverage
                ? `based on ${overallCoverage.assessed} of ${overallCoverage.total} assessments · ${student.overall.classCount} classes`
                : `across ${student.overall.classCount} classes`
          }
        />
        <StatCard
          label="Grade Percentile"
          value={student.overall.percentileInGrade == null ? '—' : Math.round(student.overall.percentileInGrade)}
          icon={PresentationChartLineIcon}
          color="from-teal-500 to-teal-600"
          sub={`within Grade ${student.gradeLevel}`}
        />
        <StatCard
          label="Attendance"
          value={fmtPct(student.attendance?.pct)}
          icon={ClipboardDocumentCheckIcon}
          color={student.attendance?.pct != null && student.attendance.pct < 85 ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600'}
          sub={student.attendance ? `${student.attendance.presentDays}/${student.attendance.totalDays} days` : 'no records'}
        />
        <StatCard
          label="Missing (flagged)"
          value={student.overall.missingCount}
          icon={ExclamationTriangleIcon}
          color={student.overall.missingCount >= 3 ? 'from-rose-500 to-rose-600' : 'from-slate-400 to-slate-500'}
          sub="marked by the teacher · counts as 0"
        />
        <StatCard
          label="Not yet graded"
          value={notYetGraded}
          icon={ClockIcon}
          color="from-slate-400 to-slate-500"
          sub="carries no weight"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              {student.studentName} vs Class Averages
            </h2>
            <p className="text-xs text-slate-500 mb-3">Per-subject grade compared to each class&apos;s average</p>
            <TermComparisonChart data={vsClassData} currentName={student.studentName} previousName="Class average" />
          </div>

          <AnalyticsTable
            title="Class Breakdown"
            subtitle="Click a class to expand every assessment score"
            columns={classColumns}
            data={student.classes}
            rowKey={(c) => c.classId}
            exportFilename={`${student.studentName.replace(/\s+/g, '-').toLowerCase()}-classes`}
            searchable={false}
            defaultSort={{ key: 'finalPct', dir: 'desc' }}
            onRowClick={(c) => setExpandedClass((cur) => (cur === c.classId ? null : c.classId))}
          />

          {expanded && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-cyan-100 ring-1 ring-cyan-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-900">{expanded.subject} — all scores</h3>
                <button onClick={() => params.drillTo('class', { classId: expanded.classId })} className="text-sm font-medium text-cyan-600 hover:text-cyan-700">
                  Open class analytics →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                      <th className="text-left py-2 pr-4">Assessment</th>
                      <th className="text-right py-2 px-4">Score</th>
                      <th className="text-right py-2 px-4">Out of</th>
                      <th className="text-right py-2 px-4">%</th>
                      <th className="text-right py-2 pl-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expanded.assessmentScores
                      .filter((a) => !a.isParent)
                      .map((a) => {
                        // Status is the API's resolved cell state — never inferred
                        // from a null score (a blank cell is "not yet graded").
                        const status: AssessmentCellStatus =
                          a.status ?? (a.isExcluded ? 'excused' : a.score == null ? 'blank' : 'graded')
                        const pct =
                          status === 'graded' && a.score != null && a.maxScore
                            ? Math.round((a.score / a.maxScore) * 1000) / 10
                            : null
                        return (
                          <tr key={a.assessmentId} className="border-b border-slate-50">
                            <td className="py-2 pr-4 text-slate-800">{a.name}</td>
                            <td className="py-2 px-4 text-right tabular-nums">{status === 'graded' ? (a.score ?? '—') : '—'}</td>
                            <td className="py-2 px-4 text-right tabular-nums text-slate-500">{a.maxScore ?? '—'}</td>
                            <td className={`py-2 px-4 text-right tabular-nums font-medium ${pct == null ? 'text-slate-400' : pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-slate-900' : 'text-rose-600'}`}>
                              {pct == null ? (status === 'missing' ? '0%' : '—') : `${pct}%`}
                            </td>
                            <td className="py-2 pl-4 text-right">
                              {status === 'excused' ? (
                                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">excused</span>
                              ) : status === 'missing' ? (
                                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-full">missing</span>
                              ) : status === 'blank' ? (
                                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded-full">not yet graded</span>
                              ) : (
                                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">graded</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {student.missingWork.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-base font-semibold text-slate-900 mb-1">
                Missing work (flagged by the teacher){' '}
                <span className="text-slate-400 font-normal">({student.missingWork.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mb-3">Each counts as 0 until handed in. Work not yet graded is not listed and carries no weight.</p>
              <ul className="divide-y divide-slate-50">
                {student.missingWork.map((m) => (
                  <li key={`${m.classId}-${m.assessmentId}`} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{m.assessmentName}</p>
                      <p className="text-xs text-slate-500">{m.subject}{m.assessmentDate ? ` · ${format(new Date(m.assessmentDate), 'MMM d')}` : ''}</p>
                    </div>
                    {m.weightPoints != null && (
                      <span className="text-xs font-semibold text-amber-600 whitespace-nowrap">{m.weightPoints} pts</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">{aiPanel}</div>
      </div>
    </div>
  )
}

export default StudentView
