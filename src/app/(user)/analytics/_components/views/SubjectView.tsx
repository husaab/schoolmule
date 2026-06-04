'use client'

import React from 'react'
import {
  ChartBarIcon,
  PresentationChartLineIcon,
  AcademicCapIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline'
import { OverviewData, SubjectClassRow } from '@/services/types/analytics'
import { UseAnalyticsParams } from '../../_hooks/useAnalyticsParams'
import { useAnalyticsTermComparison } from '../../_hooks/useAnalyticsData'
import StatCard from '../StatCard'
import HistogramChart from '../charts/HistogramChart'
import TermComparisonChart from '../charts/TermComparisonChart'
import AnalyticsTable, { Column } from '../tables/AnalyticsTable'
import TermComparisonSection from './TermComparisonSection'

interface SubjectViewProps {
  overview: OverviewData
  params: UseAnalyticsParams
  aiPanel: React.ReactNode
}

const fmtPct = (v: number | null | undefined) => (v == null ? '—' : `${v}%`)

const SubjectView: React.FC<SubjectViewProps> = ({ overview, params, aiPanel }) => {
  // Cross-term comparison only in all-terms + grade + subject. Hook is called
  // unconditionally (rules of hooks); it self-disables otherwise.
  const wantComparison = params.termId === 'all' && params.grade != null && params.subject != null
  const comparison = useAnalyticsTermComparison(
    wantComparison,
    params.subject,
    params.grade,
    params.engine
  )

  const subject = overview.bySubject.find((s) => s.subject === params.subject)

  if (!subject) {
    return (
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center text-slate-500">
        No data for {params.subject} in this term.
      </div>
    )
  }

  // Combined mode: a grade is also selected, so scope to that grade's classes.
  const gradeScoped = params.grade != null
  const classes = gradeScoped
    ? subject.classes.filter((c) => c.grade === params.grade)
    : subject.classes

  if (gradeScoped && classes.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center text-slate-500">
        No {subject.subject} classes in Grade {params.grade} this term.
      </div>
    )
  }

  const s = subject.stats

  // Enrollment-weighted mean of class averages = the true student average for
  // the scope (each classAvg is itself a student mean). Exact, unlike a plain
  // mean of medians, so we only surface an aggregate median when it's a single
  // class.
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0)
  const weightedAvg =
    totalStudents > 0
      ? Math.round(
          (classes.reduce((sum, c) => sum + (c.classAvg ?? 0) * c.studentCount, 0) / totalStudents) * 10
        ) / 10
      : null
  const singleClassMedian = classes.length === 1 ? classes[0].classMedian : null

  // When the same grade+subject spans multiple terms, show the cross-term
  // comparison and use its pooled (exact) avg/median for the headline cards.
  const cmp = comparison.data
  const multiTerm = !!cmp && cmp.terms.length >= 2
  const headlineAvg = cmp?.combined.avg ?? weightedAvg
  const headlineMedian = cmp?.combined.median ?? singleClassMedian

  const classColumns: Column<SubjectClassRow>[] = [
    { key: 'grade', label: 'Grade', accessor: (c) => Number(c.grade), numeric: true, render: (c) => <span className="font-semibold text-slate-900">Grade {c.grade}</span> },
    { key: 'teacherName', label: 'Teacher' },
    { key: 'studentCount', label: 'Students', numeric: true, lowPriority: true },
    { key: 'classAvg', label: 'Class Avg', numeric: true, render: (c) => fmtPct(c.classAvg) },
    { key: 'classMedian', label: 'Median', numeric: true, render: (c) => fmtPct(c.classMedian) },
  ]

  // One bar per class, labelled by grade, so a teacher can eyeball which
  // grade levels are strong/weak in this subject (school-wide mode only).
  const byGradeBars = subject.classes
    .slice()
    .sort((a, b) => Number(a.grade) - Number(b.grade))
    .map((c) => ({ label: `Gr ${c.grade}`, current: c.classAvg }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        {gradeScoped ? (
          <>
            <StatCard
              label={multiTerm ? 'Combined Average' : 'Average'}
              value={fmtPct(headlineAvg)}
              icon={ChartBarIcon}
              color="from-cyan-500 to-cyan-600"
              sub={multiTerm ? `across ${cmp!.terms.length} terms` : undefined}
            />
            <StatCard
              label={multiTerm ? 'Combined Median' : 'Median'}
              value={fmtPct(headlineMedian)}
              icon={PresentationChartLineIcon}
              color="from-teal-500 to-teal-600"
              sub={!multiTerm && classes.length > 1 ? 'open a class for its median' : undefined}
            />
            <StatCard label="Classes" value={classes.length} icon={AcademicCapIcon} color="from-indigo-500 to-indigo-600" />
            <StatCard
              label="Students"
              value={multiTerm ? cmp!.combined.studentCount : totalStudents}
              icon={ArrowsUpDownIcon}
              color="from-violet-500 to-violet-600"
            />
          </>
        ) : (
          <>
            <StatCard label="Subject Average" value={fmtPct(s?.avg)} icon={ChartBarIcon} color="from-cyan-500 to-cyan-600" />
            <StatCard label="Subject Median" value={fmtPct(s?.median)} icon={PresentationChartLineIcon} color="from-teal-500 to-teal-600" />
            <StatCard label="Classes" value={subject.classCount} icon={AcademicCapIcon} color="from-indigo-500 to-indigo-600" />
            <StatCard
              label="Spread (σ)"
              value={s ? `${s.stdDev}` : '—'}
              icon={ArrowsUpDownIcon}
              color="from-violet-500 to-violet-600"
              sub={s ? `Range ${s.min}%–${s.max}%` : undefined}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* School-wide distribution charts only make sense across all grades.
              In combined mode the per-class detail lives one click away. */}
          {!gradeScoped && (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">{subject.subject} — Grade Distribution</h2>
                <p className="text-sm text-slate-500 mb-4">Student grades across every {subject.subject} class</p>
                <HistogramChart data={subject.histogram} />
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Class Averages by Grade</h2>
                <p className="text-sm text-slate-500 mb-4">How {subject.subject} performs at each grade level</p>
                <TermComparisonChart data={byGradeBars} currentName="Class average" />
              </div>
            </>
          )}

          {/* Cross-term comparison sits above the class list in combined mode. */}
          {gradeScoped && multiTerm && cmp && <TermComparisonSection data={cmp} />}

          <AnalyticsTable
            title={gradeScoped ? `Grade ${params.grade} ${subject.subject} Classes` : `${subject.subject} Classes`}
            subtitle="Click a class for its full distribution & assessment breakdown"
            columns={classColumns}
            data={classes}
            rowKey={(c) => c.classId}
            exportFilename={`${subject.subject}-classes`}
            defaultSort={{ key: 'classAvg', dir: 'desc' }}
            onRowClick={(c) => params.drillTo('class', { classId: c.classId, grade: c.grade })}
          />
        </div>

        <div className="space-y-6">{aiPanel}</div>
      </div>
    </div>
  )
}

export default SubjectView
