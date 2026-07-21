'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChatBubbleLeftRightIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { ChildLite, useVisibleChildren } from '@/store/useSelectedChildStore'
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
import ChildJumpNav from '@/components/parent/ChildJumpNav'
import ParentFilterBar from '@/components/parent/ParentFilterBar'
import ParentEmptyState from '@/components/parent/ParentEmptyState'
import Spinner from '@/components/Spinner'

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

interface ChildFeedbackSectionProps {
  child: ChildLite
  termFilter: string
  subjectFilter: string
  onSubjectsLoaded: (studentId: string, subjects: string[]) => void
}

const ChildFeedbackSection: React.FC<ChildFeedbackSectionProps> = ({
  child,
  termFilter,
  subjectFilter,
  onSubjectsLoaded,
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
      .then((res) => {
        const data = res.data || null
        setFeedback(data)
        const subjects = [
          ...(data?.progressFeedback.map((f) => f.subject) ?? []),
          ...(data?.reportCardFeedback.map((f) => f.subject) ?? []),
        ]
        onSubjectsLoaded(child.studentId, [...new Set(subjects)])
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load feedback.')
      })
      .finally(() => setLoading(false))
  }, [child.studentId, selectedYearId, onSubjectsLoaded])

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

  const matches = <T extends { term: string; subject?: string }>(items: T[]) =>
    items
      .filter((i) => !termFilter || i.term === termFilter)
      .filter((i) => !subjectFilter || i.subject === subjectFilter)

  // Progress report PDFs are whole-student documents — term filter applies,
  // subject filter doesn't.
  const progressReports = (feedback?.progressReports ?? []).filter(
    (r) => !termFilter || r.term === termFilter,
  )
  const progressFeedback = matches(feedback?.progressFeedback ?? [])
  const reportCardFeedback = matches(feedback?.reportCardFeedback ?? [])

  if (
    progressReports.length === 0 &&
    progressFeedback.length === 0 &&
    reportCardFeedback.length === 0
  ) {
    const filtered = termFilter || subjectFilter
    return (
      <ParentEmptyState
        icon={filtered ? FunnelIcon : ChatBubbleLeftRightIcon}
        title={filtered ? 'Nothing matches these filters' : 'No feedback yet'}
        message={
          filtered
            ? `No feedback for ${child.name.split(' ')[0]} matches the selected filters.`
            : "Teachers haven't added feedback yet. It will appear here as progress reports and report cards are prepared."
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

/** Term-name filter (feedback rows store term names, not ids). */
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
  const [termFilter, setTermFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [subjectsByChild, setSubjectsByChild] = useState<Record<string, string[]>>({})
  const visibleChildren = useVisibleChildren()
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)

  // Filter values from one year may not exist in another — reset on year change.
  useEffect(() => {
    setTermFilter('')
    setSubjectFilter('')
  }, [selectedYearId])

  const onSubjectsLoaded = useCallback((studentId: string, subjects: string[]) => {
    setSubjectsByChild((prev) =>
      prev[studentId]?.join('|') === subjects.join('|')
        ? prev
        : { ...prev, [studentId]: subjects },
    )
  }, [])

  const subjects = useMemo(() => {
    const all = visibleChildren.flatMap((c) => subjectsByChild[c.studentId] ?? [])
    return [...new Set(all)].sort((a, b) => a.localeCompare(b))
  }, [visibleChildren, subjectsByChild])

  useEffect(() => {
    if (subjectFilter && subjects.length > 0 && !subjects.includes(subjectFilter)) {
      setSubjectFilter('')
    }
  }, [subjects, subjectFilter])

  return (
    <ParentPageShell
      title="Teacher Feedback"
      subtitle="Work habits, behavior and comments from your children's teachers."
      badge={{ icon: ChatBubbleLeftRightIcon, label: 'Feedback' }}
    >
      <ParentFilterBar>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
        >
          <option value="">All classes</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <TermNameFilter value={termFilter} onChange={setTermFilter} />
      </ParentFilterBar>

      <ChildSections
        renderChild={(child) => (
          <ChildFeedbackSection
            child={child}
            termFilter={termFilter}
            subjectFilter={subjectFilter}
            onSubjectsLoaded={onSubjectsLoaded}
          />
        )}
      />
      <ChildJumpNav />
    </ParentPageShell>
  )
}

export default ParentFeedbackPage
