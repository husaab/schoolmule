'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  HomeIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useVisibleChildren, useSelectedChildStore } from '@/store/useSelectedChildStore'
import { getParentSummary } from '@/services/parentPortalService'
import { ChildSummary } from '@/services/types/parentPortal'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ParentEmptyState from '@/components/parent/ParentEmptyState'
import Spinner from '@/components/Spinner'
import { childColor, childInitial, gradeTextColor } from '@/components/parent/childColors'

const timeGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const formatEventDate = (date: string) => {
  const d = new Date(date.slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })
}

const ChildOverviewCard: React.FC<{ summary: ChildSummary }> = ({ summary }) => {
  const router = useRouter()
  const selectChild = useSelectedChildStore((s) => s.selectChild)
  const color = childColor(summary.studentId)

  const goTo = (path: string) => {
    selectChild(summary.studentId)
    router.push(path)
  }

  const quickLinks = [
    { label: 'Grades', icon: BookOpenIcon, path: '/parent/grades' },
    { label: 'Attendance', icon: ClipboardDocumentCheckIcon, path: '/parent/attendance' },
    { label: 'Feedback', icon: ChatBubbleLeftRightIcon, path: '/parent/feedback' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-6">
      {/* Child identity */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${color.solid} flex items-center justify-center text-white text-lg font-semibold flex-shrink-0`}
        >
          {childInitial(summary.name)}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 truncate">{summary.name}</h3>
          <p className="text-sm text-slate-500">
            {summary.grade != null && `Grade ${summary.grade}`}
            {summary.homeroomTeacher && ` · ${summary.homeroomTeacher}`}
          </p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-stone-50 border border-stone-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
            Overall Average
          </p>
          <p className={`text-2xl font-bold ${gradeTextColor(summary.overallAvg)}`}>
            {summary.overallAvg != null ? `${summary.overallAvg}%` : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {summary.classCount > 0
              ? `across ${summary.classCount} ${summary.classCount === 1 ? 'class' : 'classes'}`
              : 'no classes this term'}
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 border border-stone-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
            Attendance
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {summary.attendance?.pct != null ? `${summary.attendance.pct}%` : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {summary.attendance
              ? `${summary.attendance.presentDays} of ${summary.attendance.totalDays} days`
              : 'no records yet'}
          </p>
        </div>
      </div>

      {/* Latest feedback */}
      {summary.latestFeedback?.comment && (
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-4 mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-600 mb-1">
            Latest Teacher Feedback
          </p>
          <p className="text-sm text-slate-700 line-clamp-2">
            &ldquo;{summary.latestFeedback.comment}&rdquo;
          </p>
          <p className="text-xs text-slate-500 mt-1.5">
            {summary.latestFeedback.subject}
            {summary.latestFeedback.teacherName && ` · ${summary.latestFeedback.teacherName}`}
          </p>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        {quickLinks.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => goTo(path)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 bg-stone-50 border border-stone-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 transition-colors cursor-pointer"
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

const ParentDashboardPage: React.FC = () => {
  const user = useUserStore((state) => state.user)
  const visibleChildren = useVisibleChildren()
  const [summaries, setSummaries] = useState<ChildSummary[]>([])
  const [nextEvent, setNextEvent] = useState<{
    title: string
    startDate: string
    category: string
    isSchoolClosed: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId) // refetch when the selected school year changes

  useEffect(() => {
    if (!user.id) return
    setLoading(true)
    getParentSummary()
      .then((res) => {
        setSummaries(res.data?.children || [])
        setNextEvent(res.data?.nextEvent || null)
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load your overview. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [user.id, selectedYearId])

  const visibleIds = new Set(visibleChildren.map((c) => c.studentId))
  const visibleSummaries =
    visibleChildren.length > 0
      ? summaries.filter((s) => visibleIds.has(s.studentId))
      : summaries

  return (
    <ParentPageShell
      title={`${timeGreeting()}, ${user.username || 'there'}!`}
      subtitle="Here's how your children are doing."
      badge={{ icon: HomeIcon, label: 'Parent Portal' }}
    >
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <ParentEmptyState icon={UserGroupIcon} title="Something went wrong" message={error} />
      )}

      {!loading && !error && (
        <>
          {/* Next event banner */}
          {nextEvent && (
            <Link
              href="/parent/calendar"
              className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 mb-8 hover:shadow-md transition-shadow group"
            >
              <span className="w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
                <CalendarDaysIcon className="w-6 h-6 text-amber-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-amber-600">
                  Coming up · {formatEventDate(nextEvent.startDate)}
                </p>
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {nextEvent.title}
                  {nextEvent.isSchoolClosed && (
                    <span className="ml-2 text-xs font-medium text-rose-600">School closed</span>
                  )}
                </p>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </Link>
          )}

          {visibleSummaries.length === 0 ? (
            <ParentEmptyState
              icon={AcademicCapIcon}
              title="No Children Linked"
              message="No children are linked to your account yet. Please contact the school office to get set up."
            />
          ) : (
            <div
              className={`grid grid-cols-1 gap-5 ${visibleSummaries.length > 1 ? 'lg:grid-cols-2' : ''}`}
            >
              {visibleSummaries.map((summary) => (
                <ChildOverviewCard key={summary.studentId} summary={summary} />
              ))}
            </div>
          )}
        </>
      )}
    </ParentPageShell>
  )
}

export default ParentDashboardPage
