// /report-cards: one term's report cards, every student once. Generate,
// view, email the family, download and delete on one page (it replaced the
// separate Generate and View & Download pages, which redirect here).
'use client'

import { Suspense } from 'react'
import ReportRoster from '@/components/reports/roster/ReportRoster'
import { REPORT_CARDS } from '@/components/reports/reportDocs'

export default function ReportCardsPage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      <ReportRoster doc={REPORT_CARDS} />
    </Suspense>
  )
}
