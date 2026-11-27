// Payment requests (Finance → Payments → Requests): the office asks families
// to pay for something without a form. Pure helpers shared by the web and the
// app: who a request goes to, how far along it is, and its due date in words.

import type {
  PaymentRequest,
  PaymentRequestStats,
  PaymentRequestTarget,
  PaymentsMonth,
  PaymentsRoster,
  RosterStudent,
} from '@/services/types/payments';
import type { TaxMode } from '@/services/types/registration';
import { formatCents, parseDollars } from './paymentField';
import { linesWithTax, type PriceWithTax } from './paymentTax';

export const GRADE_ORDER = ['JK', 'SK', '1', '2', '3', '4', '5', '6', '7', '8'];

/** "Grade 5", "JK". */
export const gradeLabel = (grade: string | null | undefined): string =>
  !grade ? '' : /^\d+$/.test(grade) ? `Grade ${grade}` : grade;

/** The grades that have students, in school order. */
export const rosterGrades = (roster: PaymentsRoster): string[] => {
  const present = new Set(roster.students.map((s) => s.grade));
  return [...GRADE_ORDER.filter((g) => present.has(g)), ...[...present].filter((g) => !GRADE_ORDER.includes(g)).sort()];
};

export const emptyTarget = (): Required<PaymentRequestTarget> => ({ grades: [], classIds: [], studentIds: [] });

export const targetIsEmpty = (t: PaymentRequestTarget): boolean =>
  !(t.grades?.length || t.classIds?.length || t.studentIds?.length);

/** Everyone a request would go to: whole grades, whole classes and picked students, once each. */
export function audienceStudents(roster: PaymentsRoster, target: PaymentRequestTarget): RosterStudent[] {
  const grades = new Set(target.grades || []);
  const classes = new Set(target.classIds || []);
  const picked = new Set(target.studentIds || []);
  return roster.students.filter(
    (s) => grades.has(s.grade) || picked.has(s.studentId) || s.classIds.some((id) => classes.has(id))
  );
}

/** "Grade 5, Science (Grade 6) and 2 more students". */
export function audienceSummary(roster: PaymentsRoster, target: PaymentRequestTarget): string {
  const parts = [
    ...(target.grades || []).map(gradeLabel),
    ...(target.classIds || []).map((id) => {
      const c = roster.classes.find((x) => x.classId === id);
      return c ? `${c.name} (${gradeLabel(c.grade)})` : null;
    }).filter((x): x is string => Boolean(x)),
  ];
  const picked = (target.studentIds || []).length;
  if (picked > 0) parts.push(`${picked} ${picked === 1 ? 'student' : 'students'}`);
  if (parts.length === 0) return 'Nobody yet';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

export interface RequestDraft {
  title: string;
  amountText: string;
  dueDate: string;
}

/** What to fix before a request can be sent, or null. Mirrors the server. */
export function requestDraftProblem(draft: RequestDraft): string | null {
  if (!draft.title.trim()) return 'Give the request a name, like “Grade 5 trip to the museum”.';
  const cents = parseDollars(draft.amountText);
  if (cents === null || cents < 50 || cents > 1000000) return 'Enter an amount between $0.50 and $10,000.00.';
  if (draft.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate)) return 'Enter the due date as a date.';
  return null;
}

// ─── A request's tax ─────────────────────────────────────────────────

/**
 * What each family pays: the amount as typed with the request's rate, added
 * on top or already in it. No rate is the amount alone.
 */
export const requestPrice = (
  amountCents: number,
  rate: { name: string; rateMilli: number } | null | undefined,
  mode: TaxMode,
): PriceWithTax => linesWithTax([{ amountCents, tax: rate ?? null }], mode);

/**
 * "$35.00 per student"; with tax "$35.00 + $4.55 HST per student", or
 * "$35.00 per student (includes $4.03 HST)". The server's figures.
 */
export function perStudentLabel(
  r: Pick<PaymentRequest, 'amountCents'> & Partial<Pick<PaymentRequest, 'taxPerStudentCents' | 'taxName' | 'taxMode'>>,
): string {
  const tax = r.taxPerStudentCents || 0;
  if (tax <= 0 || !r.taxName) return `${formatCents(r.amountCents)} per student`;
  return r.taxMode === 'included'
    ? `${formatCents(r.amountCents)} per student (includes ${formatCents(tax)} ${r.taxName})`
    : `${formatCents(r.amountCents)} + ${formatCents(tax)} ${r.taxName} per student`;
}

/** The editor's line under the tax choice: "Each family pays $39.55 ($35.00 + $4.55 HST)". Null without tax. */
export function requestPriceLine(price: PriceWithTax): string | null {
  const [tax] = price.taxes;
  if (!tax) return null;
  return tax.included
    ? `Each family pays ${formatCents(price.totalCents)} (includes ${formatCents(tax.cents)} ${tax.name})`
    : `Each family pays ${formatCents(price.totalCents)} (${formatCents(price.subtotalCents)} + ${formatCents(tax.cents)} ${tax.name})`;
}

/**
 * The tax fields to send with a request. New: only when a rate is chosen, so
 * an untaxed request is sent as before. Edit: only when the rate or mode
 * changed, since the server counts that as changing the amount.
 */
export function requestTaxFields(
  current: Pick<PaymentRequest, 'taxRateId' | 'taxMode'> | null | undefined,
  next: { taxRateId: string | null; taxMode: TaxMode },
): { taxRateId?: string | null; taxMode?: TaxMode } {
  const taxRateId = next.taxRateId || null;
  if (!current) return taxRateId ? { taxRateId, taxMode: next.taxMode } : {};
  const changed = taxRateId !== (current.taxRateId || null) || (taxRateId !== null && next.taxMode !== (current.taxMode || 'added'));
  return changed ? { taxRateId, taxMode: next.taxMode } : {};
}

/** How many families have settled, as a whole percent. */
export const settledPercent = (stats: Pick<PaymentRequestStats, 'settled'> & { students?: number; count?: number }): number => {
  const total = stats.students ?? stats.count ?? 0;
  return total > 0 ? Math.round((stats.settled / total) * 100) : 0;
};

/** Today in school time (Toronto), "YYYY-MM-DD". */
export const todayIso = (now: Date = new Date()): string =>
  now.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);

/** A date column ("2026-12-12") as "Dec 12, 2026", with no time zone shift. */
export const formatDay = (iso: string | null | undefined): string =>
  !iso ? '' : new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-CA', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });

export type DueTone = 'neutral' | 'soon' | 'overdue';

/**
 * A due date in words, for something still owed: "Due Dec 12", "Due tomorrow",
 * "Due today", "3 days overdue". Null without a due date.
 */
export function dueStatus(dueDate: string | null | undefined, today: string = todayIso()): { label: string; tone: DueTone } | null {
  if (!dueDate) return null;
  const days = daysBetween(today, dueDate.slice(0, 10));
  if (days < 0) return { label: `${-days} ${days === -1 ? 'day' : 'days'} overdue`, tone: 'overdue' };
  if (days === 0) return { label: 'Due today', tone: 'soon' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'soon' };
  const short = new Date(`${dueDate.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-CA', { timeZone: 'UTC', month: 'short', day: 'numeric' });
  return { label: `Due ${short}`, tone: days <= 3 ? 'soon' : 'neutral' };
}

/** "Nov" for "2026-11". */
export const monthShort = (month: string): string =>
  new Date(`${month}-15T12:00:00Z`).toLocaleDateString('en-CA', { timeZone: 'UTC', month: 'short' });

/** Money in for a month: card and office, before refunds. */
export const monthIn = (m: PaymentsMonth): number => m.cardCents + m.officeCents;

/** The tallest month, for scaling the bars (never zero). */
export const monthsPeak = (months: PaymentsMonth[]): number =>
  Math.max(1, ...months.map(monthIn));
