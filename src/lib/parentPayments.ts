// The parent portal's Payments page: what the family owes the school and what
// it has paid. Built, but switched off until schools are ready for it. Turning
// it on takes this flag here, the same one in the app
// (schoolmule-mobile/src/lib/parentPayments.ts), and PARENT_PAYMENTS_ENABLED=true
// on the server.

import type { ParentPaymentEntry } from '@/services/types/payments';
import { dueStatus, todayIso } from './paymentRequests';

export const PARENT_PAYMENTS_ENABLED = false;

/** The page's route, for the nav (shown only when the page is on). */
export const PARENT_PAYMENTS_PATH = '/parent/payments';

/** Whether anything is overdue, for the summary at the top. */
export const overdueCount = (owing: ParentPaymentEntry[], today: string = todayIso()): number =>
  owing.filter((e) => dueStatus(e.dueDate, today)?.tone === 'overdue').length;

/** "Paid", "Refunded", "Settled", "Part paid", "To pay". */
export function entryStatusLabel(status: ParentPaymentEntry['status']): string {
  switch (status) {
    case 'paid': return 'Paid';
    case 'partially_refunded': return 'Part refunded';
    case 'refunded': return 'Refunded';
    case 'settled':
    case 'waived': return 'Settled';
    case 'partially_paid': return 'Part paid';
    default: return 'To pay';
  }
}
