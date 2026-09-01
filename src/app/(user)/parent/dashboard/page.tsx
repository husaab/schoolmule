'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  HomeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useVisibleChildren } from '@/store/useSelectedChildStore'
import { getParentSummary } from '@/services/parentPortalService'
import { ChildSummary } from '@/services/types/parentPortal'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ParentFilterBar from '@/components/parent/ParentFilterBar'
import ParentEmptyState from '@/components/parent/ParentEmptyState'
import ChildOverviewCard from '@/components/parent/ChildOverviewCard'
import ChildSectionHeader from '@/components/parent/ChildSectionHeader'
import RecentPublicationsFeed from '@/components/parent/RecentPublicationsFeed'
import AiWeeklySummaryCard from '@/components/parent/AiWeeklySummaryCard'
import Spinner from '@/components/Spinner'

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
    // Switching school year refires this; without the guard a slower response
    // for the previous year can land last and overwrite the current one.
    let cancelled = false
    setLoading(true)
    getParentSummary()
      .then((res) => {
        if (cancelled) return
        setSummaries(res.data?.children || [])
        setNextEvent(res.data?.nextEvent || null)
      })
      .catch((err) => {
        if (cancelled) return
        console.error(err)
        setError('Failed to load your overview. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
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
      <ParentFilterBar />

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

          {/* What's new, across every child */}
          <RecentPublicationsFeed limit={8} />

          {visibleSummaries.length === 0 ? (
            <ParentEmptyState
              icon={AcademicCapIcon}
              title="No Children Linked"
              message="No children are linked to your account yet. Please contact the school office to get set up."
            />
          ) : (
            /*
             * One full-width row per child rather than a grid of cards: with
             * four children a 2-up grid of paired cards ends up four across
             * and unreadable, while a vertical list scales cleanly from one
             * child to many.
             */
            <div className="space-y-8">
              {visibleSummaries.map((summary) => (
                <div key={summary.studentId}>
                  {visibleSummaries.length > 1 && (
                    <ChildSectionHeader
                      child={{
                        studentId: summary.studentId,
                        name: summary.name,
                        grade: summary.grade,
                      }}
                    />
                  )}
                  <div className="flex flex-col lg:flex-row gap-5 items-stretch">
                    <div className="lg:w-[380px] flex-shrink-0">
                      <ChildOverviewCard summary={summary} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <AiWeeklySummaryCard
                        studentId={summary.studentId}
                        childFirstName={summary.name.split(' ')[0]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </ParentPageShell>
  )
}

export default ParentDashboardPage
