'use client'

import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  UserGroupIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import { ClassData, ClassStudentRow, AssessmentStatsRow } from '@/services/types/analytics'
import { UseAnalyticsParams } from '../../_hooks/useAnalyticsParams'
import StatCard from '../StatCard'
import HistogramChart from '../charts/HistogramChart'
import TrendLineChart from '../charts/TrendLineChart'
import ScatterDifficultyChart from '../charts/ScatterDifficultyChart'
import QuartileChart from '../charts/QuartileChart'
import AnalyticsTable, { Column } from '../tables/AnalyticsTable'

interface ClassViewProps {
  classData: ClassData
  params: UseAnalyticsParams
  aiPanel: React.ReactNode
}

const fmtPct = (v: number | null | undefined) => (v == null ? '—' : `${v}%`)

const ClassView: React.FC<ClassViewProps> = ({ classData, params, aiPanel }) => {
  const s = classData.summary.stats
  // Two analysis lenses share one space — Students leads (most actionable for
  // a teacher); Assessments is one click away with equal billing.
  const [lens, setLens] = useState<'students' | 'assessments'>('students')

  const completionAvg = useMemo(() => {
    const rates = classData.assessments.map((a) => a.completionRate)
    if (rates.length === 0) return null
    return Math.round((rates.reduce((sum, r) => sum + r, 0) / rates.length) * 100)
  }, [classData.assessments])

  const anomalousCount = classData.assessments.filter((a) => a.isAnomalous).length

  const assessmentColumns: Column<AssessmentStatsRow>[] = [
    {
      key: 'name',
      label: 'Assessment',
      render: (a) => (
        <span className="inline-flex items-center gap-2 font-medium text-slate-900">
          {a.name}
          {a.isAnomalous && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100 rounded-full">
              <ExclamationTriangleIcon className="w-3 h-3" /> anomalous
            </span>
          )}
        </span>
      ),
    },
    { key: 'date', label: 'Date', lowPriority: true, accessor: (a) => a.date, render: (a) => (a.date ? format(new Date(a.date), 'MMM d') : '—') },
    { key: 'weightPoints', label: 'Weight', numeric: true, lowPriority: true, render: (a) => (a.weightPoints == null ? '—' : `${a.weightPoints} pts`) },
    { key: 'avg', label: 'Average', numeric: true, accessor: (a) => a.stats?.avg ?? null, render: (a) => fmtPct(a.stats?.avg) },
    { key: 'median', label: 'Median', numeric: true, accessor: (a) => a.stats?.median ?? null, render: (a) => fmtPct(a.stats?.median) },
    { key: 'stdDev', label: 'σ', numeric: true, lowPriority: true, accessor: (a) => a.stats?.stdDev ?? null, render: (a) => a.stats?.stdDev ?? '—' },
    {
      key: 'completionRate',
      label: 'Completion',
      numeric: true,
      render: (a) => {
        const pctDone = Math.round(a.completionRate * 100)
        return (
          <span className="inline-flex items-center gap-2">
            <span className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden inline-block">
              <span
                className={`block h-full rounded-full ${pctDone >= 90 ? 'bg-emerald-500' : pctDone >= 70 ? 'bg-cyan-500' : 'bg-amber-500'}`}
                style={{ width: `${pctDone}%` }}
              />
            </span>
            {pctDone}%
          </span>
        )
      },
    },
  ]

  const studentColumns: Column<ClassStudentRow>[] = [
    { key: 'rank', label: '#', numeric: true, render: (r) => (r.rank == null ? '—' : r.rank) },
    { key: 'studentName', label: 'Student', render: (r) => <span className="font-medium text-slate-900">{r.studentName}</span> },
    {
      key: 'finalPct',
      label: 'Grade',
      numeric: true,
      render: (r) =>
        r.finalPct == null ? (
          <span className="text-slate-400">no grades</span>
        ) : (
          <span className={`font-semibold ${r.finalPct >= 80 ? 'text-emerald-600' : r.finalPct >= 60 ? 'text-slate-900' : 'text-rose-600'}`}>
            {r.finalPct}%
          </span>
        ),
    },
    { key: 'percentileInClass', label: 'Percentile', numeric: true, lowPriority: true, render: (r) => (r.percentileInClass == null ? '—' : `${Math.round(r.percentileInClass)}`) },
    {
      key: 'missingCount',
      label: 'Missing',
      numeric: true,
      render: (r) =>
        r.missingCount > 0 ? (
          <span className={`font-medium ${r.missingCount >= 3 ? 'text-rose-600' : 'text-amber-600'}`}>{r.missingCount}</span>
        ) : (
          <span className="text-slate-400">0</span>
        ),
    },
    { key: 'excludedCount', label: 'Excluded', numeric: true, lowPriority: true, render: (r) => (r.excludedCount > 0 ? r.excludedCount : <span className="text-slate-400">0</span>) },
  ]

  const trendData = classData.trend.map((t) => ({
    label: format(new Date(t.date), 'MMM d'),
    value: t.classAvgPct,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        <StatCard label="Class Average" value={fmtPct(s?.avg)} icon={ChartBarIcon} color="from-cyan-500 to-cyan-600" />
        <StatCard label="Class Median" value={fmtPct(s?.median)} icon={PresentationChartLineIcon} color="from-teal-500 to-teal-600" />
        <StatCard label="Students" value={classData.students.length} icon={UserGroupIcon} color="from-blue-500 to-blue-600" />
        <StatCard
          label="Avg Completion"
          value={completionAvg == null ? '—' : `${completionAvg}%`}
          icon={ClipboardDocumentCheckIcon}
          color={anomalousCount > 0 ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600'}
          sub={anomalousCount > 0 ? `${anomalousCount} anomalous assessment${anomalousCount === 1 ? '' : 's'}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Two-lens analysis. Students first — the most actionable view. */}
          <div className="inline-flex bg-slate-100 rounded-xl p-1" role="tablist" aria-label="Class analysis lens">
            {(
              [
                { key: 'students', label: 'Students', icon: UsersIcon },
                { key: 'assessments', label: 'Assessments', icon: ClipboardDocumentListIcon },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={lens === t.key}
                onClick={() => setLens(t.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  lens === t.key
                    ? 'bg-white text-cyan-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                <span
                  className={`ml-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    lens === t.key ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  {t.key === 'students' ? classData.students.length : classData.assessments.length}
                </span>
              </button>
            ))}
          </div>

          {lens === 'students' ? (
            <div key="students" className="space-y-6 animate-fade-in-up">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 mb-1">Grade Distribution</h2>
                <p className="text-xs text-slate-500 mb-3">Final grades in this class</p>
                <HistogramChart data={classData.summary.histogram} height={210} />
              </div>

              <AnalyticsTable
                title="Student Rankings"
                subtitle="Click a student for their cross-class profile"
                columns={studentColumns}
                data={classData.students}
                rowKey={(r) => r.studentId}
                exportFilename={`${classData.subject}-grade${classData.grade}-students`}
                defaultSort={{ key: 'finalPct', dir: 'desc' }}
                onRowClick={(r) => params.drillTo('student', { studentId: r.studentId })}
              />
            </div>
          ) : (
            <div key="assessments" className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Assessment Difficulty Map</h2>
                  <p className="text-xs text-slate-500 mb-3">Bottom-left = hard &amp; incomplete · dot size = weight</p>
                  <ScatterDifficultyChart assessments={classData.assessments} height={210} />
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Class Average Over Time</h2>
                  <p className="text-xs text-slate-500 mb-3">Per-assessment class averages in date order</p>
                  {trendData.length >= 2 ? (
                    <TrendLineChart data={trendData} referenceValue={s?.avg ?? null} referenceLabel={`avg ${s?.avg}%`} height={210} />
                  ) : (
                    <div className="flex items-center justify-center text-sm text-slate-400" style={{ height: 210 }}>
                      Need at least two dated assessments
                    </div>
                  )}
                </div>
              </div>

              <AnalyticsTable
                title="Assessments"
                subtitle="Spot too-hard or incomplete assessments at a glance"
                columns={assessmentColumns}
                data={classData.assessments}
                rowKey={(a) => a.assessmentId}
                exportFilename={`${classData.subject}-grade${classData.grade}-assessments`}
                searchable={false}
                defaultSort={{ key: 'date', dir: 'asc' }}
              />

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 mb-1">Per-Assessment Spread</h2>
                <p className="text-xs text-slate-500 mb-3">Score distribution per assessment</p>
                <QuartileChart
                  rows={classData.assessments
                    .filter((a) => a.stats != null)
                    .map((a) => ({ label: a.name, stats: a.stats }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">{aiPanel}</div>
      </div>
    </div>
  )
}

export default ClassView
