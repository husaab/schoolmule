'use client'

import React, { useEffect, useState } from 'react'
import {
  ChatBubbleLeftRightIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import { ChildLite } from '@/store/useSelectedChildStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import { getChildFeedback } from '@/services/parentPortalService'
import { getSignedProgressReportUrl } from '@/services/progressReportService'
import { getTermsBySchool } from '@/services/termService'
import {
  ChildFeedback,
  ProgressFeedbackItem,
  ReportCardFeedbackItem,
} from '@/services/types/parentPortal'
import { useNotificationStore } from '@/store/useNotificationStore'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ChildSections from '@/components/parent/ChildSections'
import ParentEmptyState from '@/components/parent/ParentEmptyState'
import Spinner from '@/components/Spinner'

const ALL_TERMS_FILTER = ''

const Chip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-stone-50 border border-stone-200 text-slate-600">
    <span className="font-medium text-slate-400">{label}</span>
    {value}
  </span>
)

const FeedbackCard: React.FC<{
  subject: string
  teacherName: string | null
  term: string
  workHabit?: string | null
  behavior?: string | null
  comment?: string | null
}> = ({ subject, teacherName, term, workHabit, behavior, comment }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-5">
    <div className="flex items-center justify-between gap-3 mb-2">
      <h5 className="text-sm font-semibold text-slate-900">{subject}</h5>
      <span className="text-xs text-slate-400 whitespace-nowrap">{term}</span>
    </div>
    {teacherName && <p className="text-xs text-slate-400 mb-2 -mt-1">{teacherName}</p>}
    {(workHabit || behavior) && (
      <div className="flex flex-wrap gap-2 mb-3">
        {workHabit && <Chip label="Work habits" value={workHabit} />}
        {behavior && <Chip label="Behavior" value={behavior} />}
      </div>
    )}
    {comment && <p className="text-sm text-slate-700 leading-relaxed">{comment}</p>}
  </div>
)

const ChildFeedbackSection: React.FC<{ child: ChildLite; termFilter: string }> = ({
  child,
  termFilter,
}) => {
  const [feedback, setFeedback] = useState<ChildFeedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId) // refetch when the selected school year changes

  useEffect(() => {
    setLoading(true)
    setError(null)
    getChildFeedback(child.studentId)
      .then((res) => setFeedback(res.data || null))
      .catch((err) => {
        console.error(err)
        setError('Failed to load feedback.')
      })
      .finally(() => setLoading(false))
  }, [child.studentId, selectedYearId])

  const openProgressReport = async (filePath: string | null) => {
    if (!filePath) return
    try {
      const url = await getSignedProgressReportUrl(filePath)
      if (url) window.open(url, '_blank', 'noopener')
      else showNotification('Could not open the progress report.', 'error')
    } catch {
      showNotification('Could not open the progress report.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="md" />
      </div>
    )
  }
  if (error) {
    return (
      <ParentEmptyState
        icon={ChatBubbleLeftRightIcon}
        title="Something went wrong"
        message={error}
      />
    )
  }

  const byTerm = <T extends { term: string }>(items: T[]) =>
    termFilter === ALL_TERMS_FILTER ? items : items.filter((i) => i.term === termFilter)

  const progressReports = byTerm(feedback?.progressReports ?? [])
  const progressFeedback = byTerm(feedback?.progressFeedback ?? [])
  const reportCardFeedback = byTerm(feedback?.reportCardFeedback ?? [])

  if (
    progressReports.length === 0 &&
    progressFeedback.length === 0 &&
    reportCardFeedback.length === 0
  ) {
    return (
      <ParentEmptyState
        icon={ChatBubbleLeftRightIcon}
        title="No feedback yet"
        message={
          termFilter === ALL_TERMS_FILTER
            ? "Teachers haven't added feedback yet. It will appear here as progress reports and report cards are prepared."
            : `No feedback for ${termFilter} yet.`
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress report downloads — always on top */}
      {progressReports.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 divide-y divide-stone-100">
          {progressReports.map((report, i) => (
            <button
              key={`${report.term}-${i}`}
              onClick={() => openProgressReport(report.filePath)}
              className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-stone-50/60 transition-colors cursor-pointer first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {report.term} Progress Report
                </p>
                {report.generatedAt && (
                  <p className="text-xs text-slate-400">
                    Generated{' '}
                    {new Date(report.generatedAt).toLocaleDateString('en-CA', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                Download
                <DocumentArrowDownIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
              </span>
            </button>
          ))}
        </div>
      )}

      {progressFeedback.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Progress Feedback
          </h4>
          <div className="space-y-3">
            {progressFeedback.map((item: ProgressFeedbackItem) => (
              <FeedbackCard
                key={`${item.classId}-${item.term}`}
                subject={item.subject}
                teacherName={item.teacherName}
                term={item.term}
                workHabit={item.workHabit}
                behavior={item.behavior}
                comment={item.comment}
              />
            ))}
          </div>
        </div>
      )}

      {reportCardFeedback.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Report Card Comments
          </h4>
          <div className="space-y-3">
            {reportCardFeedback.map((item: ReportCardFeedbackItem) => (
              <FeedbackCard
                key={`${item.classId}-${item.term}`}
                subject={item.subject}
                teacherName={item.teacherName}
                term={item.term}
                workHabit={item.workHabits}
                behavior={item.behavior}
                comment={item.comment}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Term-name filter for feedback (feedback rows store term names, not ids). */
const TermNameFilter: React.FC<{
  value: string
  onChange: (name: string) => void
}> = ({ value, onChange }) => {
  const user = useUserStore((s) => s.user)
  const [names, setNames] = useState<string[]>([])
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId) // term list is year-scoped server-side

  useEffect(() => {
    if (!user?.school) return
    getTermsBySchool(user.school)
      .then((res) => setNames((res.data || []).map((t) => t.name)))
      .catch(() => {})
  }, [user?.school, selectedYearId])

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
    >
      <option value="">All terms</option>
      {names.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  )
}

const ParentFeedbackPage: React.FC = () => {
  const [termFilter, setTermFilter] = useState(ALL_TERMS_FILTER)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)

  // A term name from one year may not exist in another — reset the filter
  // when the selected school year changes.
  useEffect(() => {
    setTermFilter(ALL_TERMS_FILTER)
  }, [selectedYearId])

  return (
    <ParentPageShell
      title="Teacher Feedback"
      subtitle="Work habits, behavior and comments from your children's teachers."
      badge={{ icon: ChatBubbleLeftRightIcon, label: 'Feedback' }}
      actions={<TermNameFilter value={termFilter} onChange={setTermFilter} />}
    >
      <ChildSections
        layout="grid"
        renderChild={(child) => <ChildFeedbackSection child={child} termFilter={termFilter} />}
      />
    </ParentPageShell>
  )
}

export default ParentFeedbackPage
