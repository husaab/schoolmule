'use client'

import React, { useMemo, useState } from 'react'
import { ArrowPathIcon, ChatBubbleBottomCenterTextIcon, DocumentTextIcon, EnvelopeIcon, EyeIcon } from '@heroicons/react/24/outline'
import ReportCardViewerModal from '@/components/report-cards/view/reportCardViewerModal'
import { getSignedReportCardUrl } from '@/services/reportCardService'
import { getSignedProgressReportUrl } from '@/services/progressReportService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { formatStamp, groupByTerm } from '@/lib/studentProfile'
import type { ReportFile, StudentOverview } from '@/services/types/studentProfile'
import { Card, EmptyState } from './ui'

type ReportKind = 'report' | 'progress'

const ReportsTab: React.FC<{ overview: StudentOverview }> = ({ overview }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [viewingUrl, setViewingUrl] = useState<string | null>(null)
  const [opening, setOpening] = useState<string | null>(null)
  const { reportCards, progressReports, reportCardFeedback, progressFeedback } = overview.reports

  const open = async (kind: ReportKind, file: ReportFile) => {
    setOpening(file.filePath)
    try {
      const url = kind === 'report' ? await getSignedReportCardUrl(file.filePath) : await getSignedProgressReportUrl(file.filePath)
      if (url) setViewingUrl(url)
      else showNotification('Could not open that file', 'error')
    } catch (err) {
      console.error('Error opening report', err)
      showNotification('Could not open that file', 'error')
    } finally {
      setOpening(null)
    }
  }

  // Report-card and progress-report comments together, one block per term.
  const comments = useMemo(
    () =>
      groupByTerm([
        ...reportCardFeedback.map((c) => ({
          key: `rc-${c.classId}-${c.term}`,
          term: c.term,
          source: 'Report card',
          subject: c.subject,
          teacherName: c.teacherName,
          ratings: [
            ['Work habits', c.workHabits],
            ['Behavior', c.behavior],
          ] as [string, string | null][],
          comment: c.comment,
        })),
        ...progressFeedback.map((c) => ({
          key: `pr-${c.classId}-${c.term}`,
          term: c.term,
          source: 'Progress report',
          subject: c.subject,
          teacherName: c.teacherName,
          ratings: [
            ['Core standards', c.coreStandards],
            ['Work habits', c.workHabit],
            ['Behavior', c.behavior],
          ] as [string, string | null][],
          comment: c.comment,
        })),
      ]),
    [reportCardFeedback, progressFeedback]
  )

  const fileList = (kind: ReportKind, files: ReportFile[], emptyText: string) =>
    files.length === 0 ? (
      <p className="px-6 pb-5 text-sm text-slate-400">{emptyText}</p>
    ) : (
      <ul className="divide-y divide-slate-50 pb-2">
        {files.map((f) => (
          <li key={f.filePath} className="flex items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{f.term}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                Generated {formatStamp(f.generatedAt)}
                {f.emailSent && (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <EnvelopeIcon className="h-3.5 w-3.5" />
                    Emailed{f.emailSentAt ? ` ${formatStamp(f.emailSentAt, { month: 'short', day: 'numeric' })}` : ''}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => open(kind, f)}
              disabled={opening === f.filePath}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              {opening === f.filePath ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <EyeIcon className="h-4 w-4" />}
              View
            </button>
          </li>
        ))}
      </ul>
    )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Report cards" subtitle="Generated PDFs, newest first" flush>
          {fileList('report', reportCards, 'No report cards generated yet.')}
        </Card>
        <Card title="Progress reports" subtitle="Generated PDFs, newest first" flush>
          {fileList('progress', progressReports, 'No progress reports generated yet.')}
        </Card>
      </div>

      <Card title="Teacher comments" subtitle="Learning skills and comments written for report cards and progress reports">
        {comments.length === 0 ? (
          <EmptyState icon={ChatBubbleBottomCenterTextIcon} title="No comments yet">
            Comments teachers write for report cards and progress reports will collect here.
          </EmptyState>
        ) : (
          <div className="space-y-6">
            {comments.map((group) => (
              <section key={group.term}>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.term}</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {group.items.map((c) => (
                    <article key={c.key} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{c.subject}</p>
                          <p className="truncate text-xs text-slate-500">{c.teacherName ?? 'Teacher'}</p>
                        </div>
                        <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500 ring-1 ring-slate-200">
                          <DocumentTextIcon className="h-3 w-3" />
                          {c.source}
                        </span>
                      </div>
                      {c.ratings.some(([, v]) => v) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {c.ratings
                            .filter(([, v]) => v)
                            .map(([label, v]) => (
                              <span key={label} className="rounded-md bg-white px-1.5 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200">
                                {label}: <span className="font-semibold text-slate-800">{v}</span>
                              </span>
                            ))}
                        </div>
                      )}
                      {c.comment && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{c.comment}</p>}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>

      {viewingUrl && <ReportCardViewerModal url={viewingUrl} onClose={() => setViewingUrl(null)} />}
    </div>
  )
}

export default ReportsTab
