'use client'

// Reports: the PDFs staff can make. Each card shows what the document looks
// like and what it's for; Progress reports also shows where the active term
// stands (generated, emailed), read from that term's report list. Reports
// still being built are named in one quiet line, not as dead cards.

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { getTermsBySchool } from '@/services/termService'
import { getProgressReportsByTermAndSchool } from '@/services/progressReportService'
import { normalizeReport, type RawReport } from '@/lib/reportRoster'

const PLANNED = ['Attendance summaries for a class or date range', 'Class overview with the grade spread', 'Grade trends across the year']

interface TermStatus {
  term: string
  generated: number
  emailed: number
}

/** Where the active term's progress reports stand; null until known (or when there's no active term). */
function useActiveTermStatus(): TermStatus | null {
  const school = useUserStore((s) => s.user?.school)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  // Tagged with the school and year it was read for, so a year switch never shows the old line.
  const key = `${school}|${selectedYearId}`
  const [loaded, setLoaded] = useState<{ key: string; status: TermStatus } | null>(null)

  useEffect(() => {
    if (!school) return
    let cancelled = false
    ;(async () => {
      try {
        const terms = await getTermsBySchool(school)
        const active = terms.status === 'success' ? terms.data.find((t) => t.isActive) : undefined
        if (!active) return
        const res = await getProgressReportsByTermAndSchool(active.name, school)
        if (cancelled || res.status !== 'success') return
        const rows = (res.data as unknown as RawReport[]).map(normalizeReport)
        setLoaded({ key, status: { term: active.name, generated: rows.length, emailed: rows.filter((r) => r.emailSent).length } })
      } catch {
        // The card reads fine without the line.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [school, selectedYearId, key])

  return loaded?.key === key ? loaded.status : null
}

// Two small pages, the way a progress report looks: a title bar, a table, lines of comments.
function ProgressThumb() {
  return (
    <div className="flex h-40 items-end justify-center gap-3.5 overflow-hidden bg-slate-100 pt-6" aria-hidden="true">
      {[
        'h-[150px] -rotate-[4deg] translate-y-2.5',
        'h-[160px]',
      ].map((shape, i) => (
        <div key={i} className={`flex w-[118px] flex-col gap-1.5 rounded-t bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.09)] ${shape}`}>
          <span className="h-1.5 w-3/4 rounded-sm bg-slate-800" />
          <span className="h-1 w-1/2 rounded-sm bg-slate-300" />
          <span className="mt-1.5 h-9 rounded-sm border border-slate-200" />
          <span className="h-1 w-11/12 rounded-sm bg-slate-200" />
          <span className="h-1 w-3/4 rounded-sm bg-slate-200" />
        </div>
      ))}
    </div>
  )
}

// One landscape page: name and grade, three attendance boxes, assessment rows.
function SummaryThumb() {
  return (
    <div className="flex h-40 items-end justify-center overflow-hidden bg-slate-100 pt-6" aria-hidden="true">
      <div className="flex h-[136px] w-[200px] flex-col gap-1.5 rounded-t bg-white px-3.5 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.1)]">
        <span className="flex items-center justify-between">
          <span className="h-1.5 w-[46%] rounded-sm bg-slate-800" />
          <span className="text-xs font-bold text-slate-800">84%</span>
        </span>
        <span className="grid grid-cols-3 gap-1">
          <span className="h-3.5 bg-slate-100" />
          <span className="h-3.5 bg-slate-100" />
          <span className="h-3.5 bg-slate-100" />
        </span>
        <span className="h-1 rounded-sm bg-slate-200" />
        <span className="h-1 rounded-sm bg-slate-200" />
        <span className="h-1 rounded-sm bg-slate-200" />
        <span className="h-1 w-4/5 rounded-sm bg-slate-200" />
      </div>
    </div>
  )
}

function ReportCard({ href, title, children, thumb, cta }: { href: string; title: string; children: React.ReactNode; thumb: React.ReactNode; cta: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      {thumb}
      <div className="flex flex-1 flex-col gap-2.5 p-5 lg:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900">{title}</h2>
        {children}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-cyan-700">
          {cta}
          <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

const ReportsPage = () => {
  const termStatus = useActiveTermStatus()
  const emailedPct = termStatus && termStatus.generated > 0 ? (termStatus.emailed / termStatus.generated) * 100 : 0

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="font-display text-[26px] font-semibold leading-tight text-slate-900 sm:text-[30px]">Reports</h1>
            <p className="mt-1 text-[15px] text-slate-600">PDFs for parent conferences and for families at home.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ReportCard href="/reports/progress-reports" title="Progress reports" thumb={<ProgressThumb />} cta="Open progress reports">
              <p className="text-sm leading-relaxed text-slate-600">
                Core standards, work habits and behaviour for every student this term. Generate them in one go, then email each family.
              </p>
              {termStatus && (
                <div className="space-y-2 pt-2">
                  <p className="flex justify-between gap-3 text-[13px] text-slate-600">
                    <span>
                      {termStatus.term}: {termStatus.generated} generated
                    </span>
                    <span>{termStatus.emailed} emailed</span>
                  </p>
                  <div
                    role="img"
                    aria-label={`${termStatus.emailed} of ${termStatus.generated} generated reports emailed`}
                    className="flex h-1.5 overflow-hidden rounded-full bg-cyan-100"
                  >
                    <span className="bg-teal-700" style={{ width: `${emailedPct}%` }} />
                  </div>
                </div>
              )}
            </ReportCard>

            <ReportCard href="/reports/student-summary" title="Student summary" thumb={<SummaryThumb />} cta="Open student summary">
              <p className="text-sm leading-relaxed text-slate-600">
                One student in one class: every assessment, their term grade and attendance. Made for a parent–teacher conference.
              </p>
              <p className="pt-2 text-[13px] text-slate-500">Pick a class and a student, then preview the PDF right on the page.</p>
            </ReportCard>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 rounded-2xl border border-dashed border-slate-300 px-5 py-4 text-[13px]">
            <span className="font-medium text-slate-700">Planned</span>
            {PLANNED.map((p) => (
              <span key={p} className="text-slate-500">
                {p}
              </span>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}

export default ReportsPage
