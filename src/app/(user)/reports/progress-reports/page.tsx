// /reports/progress-reports: one term's progress reports, every student once
// (the roster is shared with /report-cards: components/reports/roster).
'use client'

import { Suspense } from 'react'
import ReportRoster from '@/components/reports/roster/ReportRoster'
import { PROGRESS_REPORTS } from '@/components/reports/reportDocs'

export default function ProgressReportsPage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      <ReportRoster doc={PROGRESS_REPORTS} />
    </Suspense>
  )
}
