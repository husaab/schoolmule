'use client'

// The principal's academic view: how each cohort is doing against last
// term, how the whole school's marks are spread, and which subjects need a
// conversation. Everything here is a door into /analytics; the charts are the
// same components that page uses, so the numbers match exactly.
//
// This card owns its own loading, error and empty states so an analytics
// outage never takes the rest of the dashboard with it.

import React, { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, BookOpenIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import Card from '@/components/ui/Card'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import HistogramChart from '@/components/analytics/charts/HistogramChart'
import TermComparisonChart from '@/components/analytics/charts/TermComparisonChart'
import type { HookState } from '@/components/analytics/useAnalyticsData'
import type { OverviewData } from '@/services/types/analytics'
import SubjectStrip from './SubjectStrip'
import { ChartSkeleton, RowsSkeleton } from './DashboardSkeletons'
import { analyticsHref } from './dashboardPaths'

interface AcademicsPanelProps {
  overview: HookState<OverviewData>
  termId: string | null
  termName: string | null
  previousTermName: string | null
  /** True until the active term is known and analytics can be requested. */
  pending: boolean
  /** False when the school has no term set up at all. */
  hasTerm: boolean
}

const CHART_HEIGHT = 220

const OpenAnalytics: React.FC<{ termId: string | null }> = ({ termId }) => (
  <Link
    href={analyticsHref({ termId })}
    className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-800"
  >
    Open analytics
    <ArrowRightIcon className="h-4 w-4" />
  </Link>
)

const AcademicsPanel: React.FC<AcademicsPanelProps> = ({
  overview,
  termId,
  termName,
  previousTermName,
  pending,
  hasTerm,
}) => {
  // Memoised so recharts sees the same array across unrelated re-renders
  // (e.g. the attendance window changing) and does not replay its entrance
  // animation each time.
  const byGrade = useMemo(() => {
    const data = overview.data
    if (!data) return []
    return data.byGrade.map((g) => ({
      label: `Gr ${g.grade}`,
      current: g.stats?.avg ?? null,
      previous: data.termDiff?.byGrade.find((d) => d.grade === g.grade)?.previousAvg ?? null,
    }))
  }, [overview.data])

  if (pending || overview.loading) {
    return (
      <>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartSkeleton height={CHART_HEIGHT} />
          <ChartSkeleton height={CHART_HEIGHT} />
        </div>
        <RowsSkeleton rows={4} />
      </>
    )
  }

  if (overview.error) {
    return (
      <Card>
        <SectionHeader title="Academics" hint={termName ?? undefined} />
        <EmptyState
          icon={ChartBarIcon}
          iconClassName="text-rose-300"
          title="Couldn't load this term's grades"
          description={overview.error}
          action={
            <button
              onClick={overview.retry}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-colors cursor-pointer"
            >
              Try again
            </button>
          }
        />
      </Card>
    )
  }

  const data = overview.data
  if (!hasTerm || !data || !data.school.stats) {
    return (
      <Card>
        <SectionHeader title="Academics" hint={termName ?? undefined} />
        <EmptyState
          icon={BookOpenIcon}
          iconClassName="text-cyan-400"
          title={hasTerm ? 'Grades appear once assessments are entered' : 'No term set up yet'}
          description={
            hasTerm
              ? 'Enter scores in the gradebook and this term’s averages, distribution and subject strengths show up here.'
              : 'Create the school year’s terms first; grades and analytics are organised by term.'
          }
          action={
            hasTerm ? (
              <Link
                href="/gradebook"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-700 transition"
              >
                Open the gradebook
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : undefined
          }
        />
      </Card>
    )
  }

  const compared = Boolean(data.termDiff && previousTermName)

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <SectionHeader
            title="Average by grade"
            hint={compared ? `${termName} against ${previousTermName}` : `Student overall averages, ${termName}`}
          />
          <TermComparisonChart
            data={byGrade}
            height={CHART_HEIGHT}
            currentName={termName ?? 'Current term'}
            previousName={previousTermName ?? 'Previous term'}
          />
        </Card>
        <Card>
          <SectionHeader title="Grade distribution" hint="Every student's overall average" />
          <HistogramChart data={data.school.histogram} height={CHART_HEIGHT} />
        </Card>
      </div>
      <Card>
        <SectionHeader
          title="Subjects, weakest first"
          hint="School-wide average per subject. Click one to drill in."
          action={<OpenAnalytics termId={termId} />}
        />
        <SubjectStrip subjects={data.bySubject} termId={termId} />
      </Card>
    </>
  )
}

export default AcademicsPanel
