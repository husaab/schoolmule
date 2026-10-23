import { describe, expect, it } from 'vitest'
import { deliveryLine, emailingLine, failedCount, familiesLabel, isDelivering, sendProgress, studentDeliveryLabel } from './emailDelivery'
import type { DeliveryStudent } from '@/services/types/assessmentPublication'

const counts = (c: Partial<Record<'pending' | 'sent' | 'failed' | 'skipped', number>>) => ({
  pending: 0, sent: 0, failed: 0, skipped: 0, ...c,
})
const student = (s: Partial<DeliveryStudent>): DeliveryStudent => ({
  studentId: 's1', studentName: 'Amal Haddad', status: 'pending', reason: null, recipients: [], ...s,
})
const recipient = (email: string, status: 'pending' | 'sent' | 'failed' | 'skipped', error: string | null = null) => ({
  email, status, error, reason: null, sentAt: null,
})

describe('emailDelivery', () => {
  it('says "Emailing N families", never a time', () => {
    expect(emailingLine(22)).toBe('Emailing 22 families')
    expect(emailingLine(1)).toBe('Emailing 1 family')
    expect(emailingLine(0)).toBe('No families to email')
    expect(familiesLabel(2)).toBe('2 families')
  })

  it('counts every family still to email while any wait, then what was sent and what failed', () => {
    expect(deliveryLine(counts({ pending: 20, sent: 2 }))).toBe('Emailing 22 families')
    expect(deliveryLine(counts({ pending: 1, failed: 1, sent: 20 }))).toBe("Emailing 22 families · 1 didn't send")
    expect(deliveryLine(counts({ sent: 21, failed: 1, skipped: 2 }))).toBe("Emailed 21 families · 1 didn't send")
    expect(deliveryLine(counts({ sent: 1 }))).toBe('Emailed 1 family')
    expect(deliveryLine(counts({ skipped: 3 }))).toBe('No families to email')
  })

  it('keeps refreshing only while something waits', () => {
    expect(isDelivering(counts({ pending: 1 }))).toBe(true)
    expect(isDelivering(counts({ sent: 3, failed: 1 }))).toBe(false)
    expect(isDelivering(null)).toBe(false)
    expect(failedCount(counts({ failed: 2 }))).toBe(2)
    expect(failedCount(undefined)).toBe(0)
  })

  it("labels each student's row", () => {
    expect(studentDeliveryLabel(student({ status: 'pending' }))).toEqual({ tone: 'muted', text: 'Queued', detail: null })
    expect(studentDeliveryLabel(student({
      status: 'sent', recipients: [recipient('a@example.com', 'sent'), recipient('b@example.com', 'sent')],
    })).text).toBe('Sent to 2')
    expect(studentDeliveryLabel(student({
      status: 'failed', recipients: [recipient('a@example.com', 'sent'), recipient('b@example.com', 'failed', 'Invalid `to` field.')],
    }))).toEqual({ tone: 'danger', text: "Sent to 1 · 1 didn't send", detail: 'b@example.com: Invalid `to` field.' })
    expect(studentDeliveryLabel(student({ status: 'failed', recipients: [recipient('b@example.com', 'failed')] })).text).toBe("Didn't send")
    expect(studentDeliveryLabel(student({ status: 'skipped', reason: 'No guardian email on file' })).text).toBe('No guardian email on file')
    expect(studentDeliveryLabel(student({ status: 'skipped' })).text).toBe('Not sent')
  })

  it("says how far a report card send is, then what went and what didn't", () => {
    expect(sendProgress(counts({ pending: 46, sent: 35, failed: 1, skipped: 1 }), 'report_card')).toEqual({
      done: 37, total: 83, pct: 45, line: 'Sending report cards · 37 of 83', finished: false,
    })
    expect(sendProgress(counts({ sent: 81, failed: 1, skipped: 1 }), 'report_card').line).toBe(
      "Sent 81 report cards · 1 didn't send · 1 not sent",
    )
    expect(sendProgress(counts({ sent: 1 }), 'progress_report')).toMatchObject({ line: 'Sent 1 progress report', pct: 100, finished: true })
    expect(sendProgress(counts({ skipped: 2 }), 'report_card').line).toBe('Nothing sent · 2 not sent')
    expect(sendProgress(counts({ pending: 1 }), 'progress_report').line).toBe('Sending progress report · 0 of 1')
  })
})
