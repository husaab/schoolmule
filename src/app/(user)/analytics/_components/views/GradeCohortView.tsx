'use client'

import React from 'react'
import {
  UserGroupIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline'
import { OverviewData, GradeStudentRow, SubjectClassRow } from '@/services/types/analytics'
import { UseAnalyticsParams } from '../../_hooks/useAnalyticsParams'
import StatCard from '../StatCard'
import HistogramChart from '../charts/HistogramChart'
import AnalyticsTable, { Column } from '../tables/AnalyticsTable'

interface GradeCohortViewProps {
  overview: OverviewData
  params: UseAnalyticsParams
  aiPanel: React.ReactNode
  atRiskPanel: React.ReactNode
}

const GradeCohortView: React.FC<GradeCohortViewProps> = ({ overview, params, aiPanel, atRiskPanel }) => {
  const cohort = overview.byGrade.find((g) => g.grade === params.grade)

  if (!cohort) {
    return (
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center text-slate-500">
        No data for Grade {params.grade} in this term.
      </div>
    )
  }

  const s = cohort.stats
  const diff = overview.termDiff?.byGrade.find((d) => d.grade === cohort.grade)?.avgDiff ?? null

  // Classes serving this grade, across all subjects (respect subject filter).
  const classRows: Array<SubjectClassRow & { subject: string }> = overview.bySubject
    .filter((sub) => !params.subject || sub.subject === params.subject)
    .flatMap((sub) =>
      sub.classes.filter((c) => c.grade === cohort.grade).map((c) => ({ ...c, subject: sub.subject }))
    )

  const classColumns: Column<SubjectClassRow & { subject: string }>[] = [
    { key: 'subject', label: 'Subject' },
    { key: 'teacherName', label: 'Teacher', lowPriority: true },
    { key: 'studentCount', label: 'Students', numeric: true, lowPriority: true },
    { key: 'classAvg', label: 'Class Avg', numeric: true, render: (c) => (c.classAvg == null ? '—' : `${c.classAvg}%`) },
    { key: 'classMedian', label: 'Median', numeric: true, render: (c) => (c.classMedian == null ? '—' : `${c.classMedian}%`) },
  ]

  const studentColumns: Column<GradeStudentRow>[] = [
    { key: 'studentName', label: 'Student', render: (r) => <span className="font-medium text-slate-900">{r.studentName}</span> },
    { key: 'overallAvg', label: 'Overall Avg', numeric: true, render: (r) => (r.overallAvg == null ? '—' : `${r.overallAvg}%`) },
    { key: 'classCount', label: 'Classes', numeric: true, lowPriority: true },
    {
      key: 'missingCount',
      label: 'Missing Work',
      numeric: true,
      render: (r) =>
        r.missingCount > 0 ? (
          <span className={`font-medium ${r.missingCount >= 3 ? 'text-rose-600' : 'text-amber-600'}`}>{r.missingCount}</span>
        ) : (
          <span className="text-slate-400">0</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        <StatCard label="Cohort Average" value={s ? `${s.avg}%` : '—'} icon={ChartBarIcon} color="from-cyan-500 to-cyan-600" delta={diff} deltaLabel="vs compared term" />
        <StatCard label="Cohort Median" value={s ? `${s.median}%` : '—'} icon={PresentationChartLineIcon} color="from-teal-500 to-teal-600" />
        <StatCard label="Students" value={cohort.studentCount} icon={UserGroupIcon} color="from-blue-500 to-blue-600" />
        <StatCard label="Spread (σ)" value={s ? `${s.stdDev}` : '—'} icon={ArrowsUpDownIcon} color="from-violet-500 to-violet-600" sub={s ? `Range ${s.min}%–${s.max}%` : undefined} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Grade {cohort.grade} Distribution</h2>
            <p className="text-sm text-slate-500 mb-4">Overall averages of every student in the cohort</p>
            <HistogramChart data={cohort.histogram} />
          </div>

          <AnalyticsTable
            title={`Grade ${cohort.grade} Classes`}
            subtitle="Click a class for assessment-level analytics"
            columns={classColumns}
            data={classRows}
            rowKey={(c) => c.classId}
            exportFilename={`grade-${cohort.grade}-classes`}
            defaultSort={{ key: 'classAvg', dir: 'desc' }}
            onRowClick={(c) => params.drillTo('class', { classId: c.classId, subject: c.subject })}
          />

          <AnalyticsTable
            title={`Grade ${cohort.grade} Students`}
            subtitle="Every student's overall average — click for full detail"
            columns={studentColumns}
            data={cohort.students}
            rowKey={(r) => r.studentId}
            exportFilename={`grade-${cohort.grade}-students`}
            defaultSort={{ key: 'overallAvg', dir: 'desc' }}
            onRowClick={(r) => params.drillTo('student', { studentId: r.studentId })}
          />
        </div>

        {/* AI column — absolutely positioned on xl so it never extends the
            page past the left column; the watchlist caps + scrolls inside. */}
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

export default GradeCohortView
