'use client'

import React from 'react'
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline'
import { OverviewData, GradeLevelStats, SubjectClassRow } from '@/services/types/analytics'
import { UseAnalyticsParams } from '../../_hooks/useAnalyticsParams'
import StatCard from '../StatCard'
import HistogramChart from '../charts/HistogramChart'
import TermComparisonChart from '../charts/TermComparisonChart'
import QuartileChart from '../charts/QuartileChart'
import AnalyticsTable, { Column } from '../tables/AnalyticsTable'

interface SchoolOverviewViewProps {
  overview: OverviewData
  params: UseAnalyticsParams
  aiPanel: React.ReactNode
  atRiskPanel: React.ReactNode
}

const SchoolOverviewView: React.FC<SchoolOverviewViewProps> = ({
  overview,
  params,
  aiPanel,
  atRiskPanel,
}) => {
  const s = overview.school.stats

  const gradeColumns: Column<GradeLevelStats>[] = [
    { key: 'grade', label: 'Grade', accessor: (g) => Number(g.grade), numeric: true, render: (g) => <span className="font-semibold text-slate-900">Grade {g.grade}</span> },
    { key: 'studentCount', label: 'Students', numeric: true },
    { key: 'avg', label: 'Average', numeric: true, accessor: (g) => g.stats?.avg ?? null, render: (g) => fmtPct(g.stats?.avg) },
    { key: 'median', label: 'Median', numeric: true, accessor: (g) => g.stats?.median ?? null, render: (g) => fmtPct(g.stats?.median) },
    { key: 'q1', label: 'Q1', numeric: true, lowPriority: true, accessor: (g) => g.stats?.q1 ?? null, render: (g) => fmtPct(g.stats?.q1) },
    { key: 'q3', label: 'Q3', numeric: true, lowPriority: true, accessor: (g) => g.stats?.q3 ?? null, render: (g) => fmtPct(g.stats?.q3) },
    { key: 'min', label: 'Min', numeric: true, lowPriority: true, accessor: (g) => g.stats?.min ?? null, render: (g) => fmtPct(g.stats?.min) },
    { key: 'max', label: 'Max', numeric: true, lowPriority: true, accessor: (g) => g.stats?.max ?? null, render: (g) => fmtPct(g.stats?.max) },
    ...(overview.termDiff
      ? [{
          key: 'diff',
          label: 'vs Compare',
          numeric: true,
          accessor: (g: GradeLevelStats) =>
            overview.termDiff!.byGrade.find((d) => d.grade === g.grade)?.avgDiff ?? null,
          render: (g: GradeLevelStats) => {
            const diff = overview.termDiff!.byGrade.find((d) => d.grade === g.grade)?.avgDiff
            if (diff == null) return '—'
            return (
              <span className={diff >= 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                {diff >= 0 ? '+' : ''}{diff}
              </span>
            )
          },
        } satisfies Column<GradeLevelStats>]
      : []),
  ]

  const subjectFiltered = params.subject
    ? overview.bySubject.filter((sub) => sub.subject === params.subject)
    : overview.bySubject

  const classRows: Array<SubjectClassRow & { subject: string }> = subjectFiltered.flatMap((sub) =>
    sub.classes.map((c) => ({ ...c, subject: sub.subject }))
  )

  const classColumns: Column<SubjectClassRow & { subject: string }>[] = [
    { key: 'subject', label: 'Subject' },
    { key: 'grade', label: 'Grade', accessor: (c) => Number(c.grade), numeric: true, render: (c) => `Grade ${c.grade}` },
    { key: 'teacherName', label: 'Teacher', lowPriority: true },
    { key: 'studentCount', label: 'Students', numeric: true, lowPriority: true },
    { key: 'classAvg', label: 'Class Avg', numeric: true, render: (c) => fmtPct(c.classAvg) },
    { key: 'classMedian', label: 'Median', numeric: true, render: (c) => fmtPct(c.classMedian) },
  ]

  const comparisonData = overview.byGrade.map((g) => ({
    label: `Gr ${g.grade}`,
    current: g.stats?.avg ?? null,
    previous: overview.termDiff?.byGrade.find((d) => d.grade === g.grade)?.previousAvg ?? null,
  }))

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        <StatCard label="School Average" value={fmtPct(s?.avg)} icon={ChartBarIcon} color="from-cyan-500 to-cyan-600" />
        <StatCard label="School Median" value={fmtPct(s?.median)} icon={PresentationChartLineIcon} color="from-teal-500 to-teal-600" />
        <StatCard label="Students" value={overview.school.totalStudents} icon={UserGroupIcon} color="from-blue-500 to-blue-600" />
        <StatCard label="Classes" value={overview.school.totalClasses} icon={AcademicCapIcon} color="from-indigo-500 to-indigo-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Grade-Level Averages</h2>
            <p className="text-sm text-slate-500 mb-4">
              {overview.compareTermId ? 'Current vs compared term' : 'Average of student overall grades per cohort'}
            </p>
            <TermComparisonChart data={comparisonData} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">School Grade Distribution</h2>
            <p className="text-sm text-slate-500 mb-4">All students&apos; overall averages</p>
            <HistogramChart data={overview.school.histogram} />
          </div>

          <AnalyticsTable
            title="Grade Cohorts"
            subtitle="Click a grade to drill into its cohort"
            columns={gradeColumns}
            data={overview.byGrade}
            rowKey={(g) => g.grade}
            searchable={false}
            exportFilename="grade-cohorts"
            defaultSort={{ key: 'grade', dir: 'asc' }}
            onRowClick={(g) => params.drillTo('grade', { grade: g.grade })}
          />

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Subject Performance</h2>
            <p className="text-sm text-slate-500 mb-4">Distribution of student grades per subject</p>
            <QuartileChart
              rows={subjectFiltered.map((sub) => ({
                label: sub.subject,
                stats: sub.stats,
                onClick: () => params.setParams({ subject: sub.subject }),
              }))}
            />
          </div>

          <AnalyticsTable
            title="All Classes"
            subtitle="Click a class for assessment-level analytics"
            columns={classColumns}
            data={classRows}
            rowKey={(c) => c.classId}
            exportFilename="classes"
            defaultSort={{ key: 'classAvg', dir: 'desc' }}
            initialLimit={12}
            onRowClick={(c) => params.drillTo('class', { classId: c.classId, grade: c.grade })}
          />
        </div>

        {/* AI column. On xl the inner wrapper is absolutely positioned so the
            column never contributes to the row height — it ends exactly where
            the left column's last card ends, and the watchlist scrolls
            internally for anything beyond that. */}
        <div className="xl:relative">
          <div className="space-y-6 xl:space-y-0 xl:absolute xl:inset-0 xl:flex xl:flex-col xl:gap-6">
            {aiPanel}
            <div className="xl:flex-1 xl:min-h-0">{atRiskPanel}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function fmtPct(v: number | null | undefined): string {
  return v == null ? '—' : `${v}%`
}

export default SchoolOverviewView
