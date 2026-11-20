// src/components/reports/reportDocs.ts
// What differs between the two term rosters (progress reports and report
// cards): their words and the API calls behind them. Everything else, the
// roster, its dialogs and filters, is shared and reads it from here.
// Generating goes through report generation runs (`type`,
// src/hooks/useReportGenerationRuns.ts).

import {
  deleteBulkProgressReports,
  deleteProgressReport,
  getProgressReportsByTermAndSchool,
  getSignedProgressReportUrl,
} from '@/services/progressReportService'
import {
  deleteBulkReportCards,
  deleteReportCard,
  getGeneratedReportCards,
  getReportCardCommentsStatus,
  getSignedReportCardUrl,
} from '@/services/reportCardService'
import type { CommentsStatus, RawReport } from '@/lib/reportRoster'

export type ReportType = 'progress_report' | 'report_card'

export interface ReportDoc {
  type: ReportType
  /** "progress report" */
  noun: string
  /** "progress reports" */
  nouns: string
  /** The page heading: "Progress reports" */
  title: string
  /** The page's line before a term is picked. */
  blurb: string
  /** Under the Generate missing list: what a report prints. `term` is the chosen term. */
  printsNote: (term: string) => string
  /** The bulk email's default subject names the documents like this. */
  emailSubject: string
  /** Fallback PDF and ZIP names: "progress-report.pdf", "progress-reports-Term_1.zip". */
  fileStem: string
  /** What deleting a report leaves in place. */
  keeps: string
  /** The page sits under Reports (a Back link) or stands alone in the sidebar. */
  back?: { href: string; label: string }
  /** JK and SK progress reports print a report date; the page asks for it. */
  reportDate: boolean
  list: (term: string, school: string) => Promise<RawReport[]>
  signedUrl: (filePath: string) => Promise<string | null>
  remove: (filePath: string) => Promise<unknown>
  removeMany: (filePaths: string[]) => Promise<{ status: string }>
  /** Whose teacher comments are in (report cards). */
  commentsStatus?: (term: string) => Promise<CommentsStatus[]>
}

export const PROGRESS_REPORTS: ReportDoc = {
  type: 'progress_report',
  noun: 'progress report',
  nouns: 'progress reports',
  title: 'Progress reports',
  blurb: 'Core standards, work habits and behaviour for every student, emailed to each family.',
  printsNote: (term) => `Each report prints the ratings and comments teachers have entered for ${term} so far.`,
  emailSubject: 'Progress Reports',
  fileStem: 'progress-report',
  keeps: 'the saved feedback',
  back: { href: '/reports', label: 'Reports' },
  reportDate: true,
  list: async (term, school) => {
    const res = await getProgressReportsByTermAndSchool(term, school)
    return res.status === 'success' ? (res.data as unknown as RawReport[]) : []
  },
  signedUrl: getSignedProgressReportUrl,
  remove: deleteProgressReport,
  removeMany: deleteBulkProgressReports,
}

export const REPORT_CARDS: ReportDoc = {
  type: 'report_card',
  noun: 'report card',
  nouns: 'report cards',
  title: 'Report cards',
  blurb: "Every student's term marks and their teachers' comments, emailed to each family.",
  printsNote: (term) => `Each report card prints the marks and teacher comments in for ${term} when you generate it.`,
  emailSubject: 'Report Cards',
  fileStem: 'report-card',
  keeps: 'grades and teacher comments',
  reportDate: false,
  list: async (term, school) => {
    const res = await getGeneratedReportCards(term, school)
    return res.status === 'success' ? (res.data as RawReport[]) : []
  },
  signedUrl: getSignedReportCardUrl,
  remove: deleteReportCard,
  removeMany: deleteBulkReportCards,
  commentsStatus: async (term) => {
    const res = await getReportCardCommentsStatus(term)
    return res.status === 'success' ? res.data : []
  },
}
