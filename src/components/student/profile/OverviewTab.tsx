'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PresentationChartLineIcon,
  PuzzlePieceIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline'
import StatCard from '@/app/(user)/analytics/_components/StatCard'
import TrendLineChart from '@/app/(user)/analytics/_components/charts/TrendLineChart'
import { computeAtRiskScore, shortCoverage } from '@/lib/analyticsUtils'
import {
  attendanceTone,
  fmtPct,
  formatDay,
  formatStamp,
  gradeText,
  recentMarks,
  relationLabel,
  riskFlagText,
  termDelta,
  type ProfileTab,
} from '@/lib/studentProfile'
import { clean } from './contact'
import type { StudentData } from '@/services/types/analytics'
import type { ProfileTerm, StudentOverview } from '@/services/types/studentProfile'
import { Card, ClassLinkList, EmptyState, GradeBar, linkClass, type GradebookLink } from './ui'

interface OverviewTabProps {
  overview: StudentOverview
  term: ProfileTerm | null
  /** The selected term's grades; null while none are graded. */
  detail: StudentData | null
  analyticsHref: string | null
  gradebookLink: GradebookLink
  onOpenClass: (classId: string) => void
  onTab: (tab: ProfileTab) => void
}

const OverviewTab: React.FC<OverviewTabProps> = ({ overview, term, detail, analyticsHref, gradebookLink, onOpenClass, onTab }) => {
  const competency = overview.gradingMode === 'competency'
  const termClasses = overview.enrollments.filter((e) => e.termId === term?.termId)
  const delta = termDelta(overview.terms, term?.termId ?? null)
  const marks = useMemo(() => recentMarks(detail), [detail])

  const risk = useMemo(
    () =>
      detail
        ? computeAtRiskScore({
            gradePercent: detail.overall.avg,
            attendancePercent: term?.attendance.pct ?? null,
            missingWorkCount: detail.overall.missingCount,
            notYetGradedCount: detail.overall.notYetGradedCount ?? 0,
            trajectoryDelta: delta ?? 0,
          })
        : null,
    [detail, term, delta]
  )

  const trend = overview.terms
    .filter((t) => t.avg != null || t.attendance.pct != null)
    .map((t) => ({ label: t.name, value: t.avg, compare: t.attendance.pct }))

  const termAttendance = term?.attendance
  const attendanceCard = (
    <StatCard
      label="Attendance"
      value={fmtPct(termAttendance?.pct)}
      icon={ClipboardDocumentCheckIcon}
      color={attendanceTone(termAttendance?.pct)}
      sub={termAttendance && termAttendance.totalDays ? `${termAttendance.absentDays} absent · ${termAttendance.lateDays} late this term` : 'no records this term'}
    />
  )

  return (
    <div className="space-y-6">
      {risk && risk.tier !== 'low' && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-5 py-3.5 ${
            risk.tier === 'high' ? 'border-rose-100 bg-rose-50' : 'border-amber-100 bg-amber-50'
          }`}
        >
          <ExclamationTriangleIcon className={`h-5 w-5 flex-shrink-0 ${risk.tier === 'high' ? 'text-rose-500' : 'text-amber-500'}`} />
          <p className="text-sm">
            <span className={`font-semibold ${risk.tier === 'high' ? 'text-rose-700' : 'text-amber-700'}`}>
              {risk.tier === 'high' ? 'Needs attention' : 'Worth monitoring'} — risk score {risk.score}/100.
            </span>{' '}
            <span className="text-slate-600">{risk.flags.map(riskFlagText).join(' · ')}</span>
          </p>
        </div>
      )}

      {competency && (
        <div className="flex items-start gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-5 py-3.5 text-sm text-cyan-900">
          <PuzzlePieceIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-600" />
          <p>
            {overview.student.grade} students are assessed on skills and competencies rather than percentages, so there is no average here.
            Ratings live in each class&apos;s {overview.student.grade} gradebook and on their progress reports and report cards.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {competency ? (
          <>
            {attendanceCard}
            <StatCard label="Classes" value={termClasses.length} icon={RectangleStackIcon} color="from-cyan-500 to-cyan-600" sub={term?.name ?? 'this year'} />
            <StatCard label="Report cards" value={overview.reports.reportCards.length} icon={DocumentTextIcon} color="from-teal-500 to-teal-600" sub="generated this year" />
            <StatCard label="Progress reports" value={overview.reports.progressReports.length} icon={DocumentTextIcon} color="from-slate-400 to-slate-500" sub="generated this year" />
          </>
        ) : (
          <>
            <StatCard
              label="Term average"
              value={fmtPct(detail?.overall.avg)}
              icon={ChartBarIcon}
              color="from-cyan-500 to-cyan-600"
              delta={delta}
              deltaLabel="vs the previous term"
              sub={detail ? `across ${detail.overall.classCount} classes` : 'no graded work yet'}
            />
            {attendanceCard}
            <StatCard
              label="Missing work"
              value={detail?.overall.missingCount ?? 0}
              icon={ExclamationTriangleIcon}
              color={(detail?.overall.missingCount ?? 0) >= 3 ? 'from-rose-500 to-rose-600' : 'from-slate-400 to-slate-500'}
              sub="flagged by teachers · counts as 0"
            />
            <StatCard
              label="Grade percentile"
              value={detail?.overall.percentileInGrade == null ? '—' : Math.round(detail.overall.percentileInGrade)}
              icon={PresentationChartLineIcon}
              color="from-teal-500 to-teal-600"
              sub={detail ? `within Grade ${detail.gradeLevel}` : 'needs graded work'}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card
            title={term ? `Classes · ${term.name}` : 'Classes'}
            subtitle={competency ? 'Open a gradebook to see skill ratings' : 'Bar = the student’s grade, tick = the class average. Click a class for every mark.'}
            action={analyticsHref && !competency ? <Link href={analyticsHref} className={linkClass}>Open in Analytics →</Link> : undefined}
            flush
          >
            {competency || !detail ? (
              <ClassLinkList
                classes={termClasses}
                gradebookLink={gradebookLink}
                linkLabel="Gradebook →"
                fallback={competency ? 'Skills-based' : 'Not yet graded'}
              />
            ) : (
              <ul className="divide-y divide-slate-50 pb-2">
                {[...detail.classes]
                  .sort((a, b) => a.subject.localeCompare(b.subject))
                  .map((c) => (
                    <li key={c.classId}>
                      <button
                        onClick={() => onOpenClass(c.classId)}
                        className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-6 py-3 text-left transition-colors hover:bg-slate-50 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{c.subject}</p>
                          <p className="truncate text-xs text-slate-500">{c.teacherName}</p>
                        </div>
                        <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                          <GradeBar pct={c.finalPct} average={c.classAvg} />
                        </div>
                        <div className="col-start-2 row-start-1 text-right sm:col-start-auto sm:row-start-auto">
                          <p className={`text-sm font-semibold tabular-nums ${gradeText(c.finalPct)}`}>
                            {c.finalPct == null ? 'Not graded' : `${c.finalPct}%`}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {c.missingCount > 0 ? <span className="font-medium text-rose-600">{c.missingCount} missing · </span> : null}
                            avg {fmtPct(c.classAvg)} · {shortCoverage(c.coverage)}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          {!competency && (
            <Card title="Recent marks" subtitle="Newest graded and missing work across every class" flush>
              {marks.length === 0 ? (
                <EmptyState icon={ChartBarIcon} title="No marks yet this term" />
              ) : (
                <ul className="divide-y divide-slate-50 pb-2">
                  {marks.map((m) => (
                    <li key={`${m.classId}-${m.assessmentId}`}>
                      <button
                        onClick={() => onOpenClass(m.classId)}
                        className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-2.5 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{m.name}</p>
                          <p className="text-xs text-slate-500">
                            {m.subject}
                            {m.date ? ` · ${formatDay(m.date)}` : ''}
                          </p>
                        </div>
                        {m.status === 'missing' ? (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">Missing</span>
                        ) : (
                          <span className={`text-sm font-semibold tabular-nums ${gradeText(m.pct)}`}>{fmtPct(m.pct)}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {!competency && (
            <Card title="Term by term" subtitle="Solid line: average · dashed: attendance">
              {trend.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Nothing graded yet this year</p>
              ) : (
                <TrendLineChart data={trend} height={210} seriesName="Average" compareName="Attendance" />
              )}
            </Card>
          )}

          <Card title="Reports" action={<button onClick={() => onTab('reports')} className={`${linkClass} cursor-pointer`}>All →</button>}>
            {overview.reports.reportCards.length + overview.reports.progressReports.length === 0 ? (
              <p className="text-sm text-slate-400">No report cards or progress reports yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {[...overview.reports.reportCards.map((r) => ({ ...r, kind: 'Report card' })), ...overview.reports.progressReports.map((r) => ({ ...r, kind: 'Progress report' }))]
                  .sort((a, b) => String(b.generatedAt).localeCompare(String(a.generatedAt)))
                  .slice(0, 3)
                  .map((r) => (
                    <li key={r.filePath} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-slate-700">
                        {r.kind} · {r.term}
                      </span>
                      <span className="whitespace-nowrap text-xs text-slate-400">{formatStamp(r.generatedAt, { month: 'short', day: 'numeric' })}</span>
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          <Card title="Guardians" action={<button onClick={() => onTab('profile')} className={`${linkClass} cursor-pointer`}>Details →</button>}>
            <GuardianSummary overview={overview} />
          </Card>
        </div>
      </div>
    </div>
  )
}

/** Who to call: the guardians on file, with tap-to-call/email. */
const GuardianSummary = ({ overview }: { overview: StudentOverview }) => {
  const { mother, father, emergencyContact } = overview.student
  const people = [
    { role: 'Mother', ...mother },
    { role: 'Father', ...father },
  ].filter((p) => clean(p.name) || clean(p.email) || clean(p.phone))
  const accounts = overview.guardianAccounts.filter((g) => g.status === 'linked').length

  if (people.length === 0 && !clean(emergencyContact)) {
    return <p className="text-sm text-slate-400">No guardian contacts on file.</p>
  }
  return (
    <div className="space-y-3 text-sm">
      {people.map((p) => (
        <div key={p.role}>
          <p className="font-medium text-slate-900">
            {clean(p.name) ?? 'Name not on file'} <span className="text-xs font-normal text-slate-400">· {relationLabel(p.role)}</span>
          </p>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs">
            {clean(p.phone) && (
              <a href={`tel:${clean(p.phone)!.replace(/[^\d+]/g, '')}`} className="text-cyan-700 hover:underline">
                {clean(p.phone)}
              </a>
            )}
            {clean(p.email) && (
              <a href={`mailto:${clean(p.email)}`} className="truncate text-cyan-700 hover:underline">
                {clean(p.email)}
              </a>
            )}
          </div>
        </div>
      ))}
      {clean(emergencyContact) && (
        <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
          <span className="font-semibold">Emergency:</span> {clean(emergencyContact)}
        </p>
      )}
      <p className="text-xs text-slate-400">
        {accounts === 0 ? 'No parent portal accounts linked' : `${accounts} parent portal account${accounts === 1 ? '' : 's'} linked`}
      </p>
    </div>
  )
}

export default OverviewTab
