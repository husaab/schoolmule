'use client'

import React, { useEffect, useState } from 'react'
import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { ChildLite } from '@/store/useSelectedChildStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { getChildGrades } from '@/services/parentPortalService'
import { ChildGrades, ChildClassGrades } from '@/services/types/parentPortal'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ChildSections from '@/components/parent/ChildSections'
import ParentEmptyState from '@/components/parent/ParentEmptyState'
import ParentAssessmentTable from '@/components/parent/ParentAssessmentTable'
import TermPicker from '@/components/parent/TermPicker'
import Spinner from '@/components/Spinner'
import TrendLineChart from '@/app/(user)/analytics/_components/charts/TrendLineChart'
import { gradeTextColor } from '@/components/parent/childColors'

const ClassCard: React.FC<{ cls: ChildClassGrades }> = ({ cls }) => {
  const [expanded, setExpanded] = useState(false)

  const trendData = cls.assessmentScores
    .filter((s) => !s.isExcluded && s.score != null && s.maxScore)
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map((s) => ({
      label: s.name,
      value: Math.round(((s.score as number) / (s.maxScore as number)) * 1000) / 10,
    }))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-stone-50/60 transition-colors cursor-pointer"
      >
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-slate-900 truncate">{cls.subject}</h4>
          <p className="text-sm text-slate-500 truncate">
            {cls.teacherName || 'Teacher TBD'}
            {cls.classAvg != null && ` · Class average: ${cls.classAvg}%`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {cls.missingCount > 0 && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-100">
              {cls.missingCount} missing
            </span>
          )}
          <span className={`text-xl font-bold ${gradeTextColor(cls.finalPct)}`}>
            {cls.finalPct != null ? `${cls.finalPct}%` : '—'}
          </span>
          {expanded ? (
            <ChevronDownIcon className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-stone-100">
          {trendData.length >= 2 && (
            <div className="pt-4">
              <TrendLineChart
                data={trendData}
                height={180}
                seriesName="Score"
                referenceValue={cls.classAvg}
                referenceLabel={cls.classAvg != null ? `Class avg ${cls.classAvg}%` : undefined}
              />
            </div>
          )}
          <div className="pt-3">
            <ParentAssessmentTable scores={cls.assessmentScores} />
          </div>
        </div>
      )}
    </div>
  )
}

const ChildGradesSection: React.FC<{ child: ChildLite; termId: string }> = ({ child, termId }) => {
  const [grades, setGrades] = useState<ChildGrades | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId) // refetch when the selected school year changes

  useEffect(() => {
    setLoading(true)
    setError(null)
    getChildGrades(child.studentId, termId || undefined)
      .then((res) => setGrades(res.data || null))
      .catch((err) => {
        console.error(err)
        setError('Failed to load grades.')
      })
      .finally(() => setLoading(false))
  }, [child.studentId, termId, selectedYearId])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="md" />
      </div>
    )
  }
  if (error) {
    return <ParentEmptyState icon={BookOpenIcon} title="Something went wrong" message={error} />
  }
  if (!grades || grades.classes.length === 0) {
    return (
      <ParentEmptyState
        icon={BookOpenIcon}
        title="No grades yet"
        message="There are no graded assessments for this term yet. Check back soon!"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
            Overall Average
          </p>
          <p className={`text-2xl font-bold ${gradeTextColor(grades.overall?.avg)}`}>
            {grades.overall?.avg != null ? `${grades.overall.avg}%` : '—'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Classes</p>
          <p className="text-2xl font-bold text-slate-900">{grades.overall?.classCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
            Missing Work
          </p>
          <p
            className={`text-2xl font-bold ${grades.missingWork.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}
          >
            {grades.missingWork.length}
          </p>
        </div>
      </div>

      {/* Missing work callout */}
      {grades.missingWork.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
            <h4 className="text-sm font-semibold text-amber-800">Missing Work</h4>
          </div>
          <ul className="space-y-1">
            {grades.missingWork.map((m) => (
              <li key={`${m.classId}-${m.assessmentId}`} className="text-sm text-slate-700">
                <span className="font-medium">{m.subject}:</span> {m.assessmentName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Class cards */}
      {grades.classes.map((cls) => (
        <ClassCard key={cls.classId} cls={cls} />
      ))}
    </div>
  )
}

const ParentGradesPage: React.FC = () => {
  const [termId, setTermId] = useState('')
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)

  // A term from one year is meaningless in another — snap back to the
  // year's default term whenever the selected school year changes.
  useEffect(() => {
    setTermId('')
  }, [selectedYearId])

  return (
    <ParentPageShell
      title="Grades"
      subtitle="Every assessment, average and trend — the same numbers as the report card."
      badge={{ icon: BookOpenIcon, label: 'Grades' }}
      actions={<TermPicker value={termId} onChange={setTermId} />}
    >
      <ChildSections
        renderChild={(child) => <ChildGradesSection child={child} termId={termId} />}
      />
    </ParentPageShell>
  )
}

export default ParentGradesPage
