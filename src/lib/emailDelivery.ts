// src/lib/emailDelivery.ts
//
// What the publish window and the publish history say about a publish's
// emails to parents. A publish queues them and they go out shortly after, so
// the copy says "Emailing 22 families" (never a time) until they are out.

import type { DeliveryStatus, DeliveryStudent } from '@/services/types/assessmentPublication'

export type DeliveryCounts = Record<DeliveryStatus, number>

export const familiesLabel = (n: number): string => `${n} famil${n === 1 ? 'y' : 'ies'}`

/** Right after Publish: "Emailing 22 families", or that there is nobody to email. */
export function emailingLine(families: number): string {
  return families > 0 ? `Emailing ${familiesLabel(families)}` : 'No families to email'
}

/**
 * Where a publish's emails are: "Emailing 22 families" while any wait,
 * "Emailed 21 families" once out, with "· 1 didn't send" when one failed.
 */
export function deliveryLine(counts: DeliveryCounts): string {
  const toEmail = counts.pending + counts.sent + counts.failed
  if (toEmail === 0) return 'No families to email'
  const head = counts.pending > 0 ? `Emailing ${familiesLabel(toEmail)}` : `Emailed ${familiesLabel(counts.sent)}`
  return counts.failed > 0 ? `${head} · ${counts.failed} didn't send` : head
}

/** Still waiting on the queue: keep refreshing. */
export const isDelivering = (counts: DeliveryCounts | null | undefined): boolean => (counts?.pending ?? 0) > 0

export type DeliveryTone = 'muted' | 'success' | 'danger'

/** One student's row: "Queued", "Sent to 2", "Didn't send" (with why), or why it was skipped. */
export function studentDeliveryLabel(student: DeliveryStudent): { tone: DeliveryTone; text: string; detail: string | null } {
  const sent = student.recipients.filter((r) => r.status === 'sent').length
  const failed = student.recipients.filter((r) => r.status === 'failed')
  switch (student.status) {
    case 'pending':
      return { tone: 'muted', text: 'Queued', detail: null }
    case 'sent':
      return { tone: 'success', text: `Sent to ${sent}`, detail: null }
    case 'failed':
      return {
        tone: 'danger',
        text: sent > 0 ? `Sent to ${sent} · ${failed.length} didn't send` : "Didn't send",
        detail: failed.map((r) => `${r.email}: ${r.error || 'Email failed'}`).join('; ') || null,
      }
    default:
      return { tone: 'muted', text: student.reason || 'Not sent', detail: null }
  }
}

/** The failed emails a Retry would send again. */
export const failedCount = (counts: DeliveryCounts | null | undefined): number => counts?.failed ?? 0

const reportNoun = (reportType: 'progress_report' | 'report_card', n: number) =>
  `${reportType === 'progress_report' ? 'progress report' : 'report card'}${n === 1 ? '' : 's'}`

/**
 * A report card send's progress, per student: "Sending report cards · 37 of
 * 83" while any wait, then "Sent 82 report cards · 1 didn't send", with how
 * many had nothing to send (no report, no parent email). `pct` fills the bar.
 */
export function sendProgress(counts: DeliveryCounts, reportType: 'progress_report' | 'report_card') {
  const total = counts.pending + counts.sent + counts.failed + counts.skipped
  const done = total - counts.pending
  const pct = total === 0 ? 100 : Math.round((done / total) * 100)
  const skipped = counts.skipped > 0 ? ` · ${counts.skipped} not sent` : ''
  const failed = counts.failed > 0 ? ` · ${counts.failed} didn't send` : ''
  const line = counts.pending > 0
    ? `Sending ${reportNoun(reportType, total)} · ${done} of ${total}`
    : counts.sent > 0
      ? `Sent ${counts.sent} ${reportNoun(reportType, counts.sent)}${failed}${skipped}`
      : `Nothing sent${failed}${skipped}`
  return { done, total, pct, line, finished: counts.pending === 0 }
}
