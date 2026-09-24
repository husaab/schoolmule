// Small formatting helpers shared by the pay-period UI. Dates from the API are
// YYYY-MM-DD keys; parse them as local dates so nothing shifts a day.

import { addDays, format, parseISO } from 'date-fns'

/** "Sep 25" or "Sep 25, 2026" */
export const shortDate = (key: string, withYear = false) =>
  format(parseISO(key.substring(0, 10)), withYear ? 'MMM d, yyyy' : 'MMM d')

/** "Tue, Sep 2" */
export const weekdayDate = (key: string) => format(parseISO(key.substring(0, 10)), 'EEE, MMM d')

/** "Aug 26 – Sep 25" */
export const dateRange = (start: string, end: string) => `${shortDate(start)} – ${shortDate(end)}`

/** 7 → "7", 7.5 → "7.5", 10.25 → "10.25" */
export const formatHours = (n: number | null | undefined) => {
  const v = Number(n ?? 0)
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
}

/** Today as a YYYY-MM-DD key (local). */
export const todayKey = () => format(new Date(), 'yyyy-MM-dd')

/** A YYYY-MM-DD key moved by some days: "2026-09-25" + 1 → "2026-09-26". */
export const shiftDate = (key: string, days: number) =>
  format(addDays(parseISO(key.substring(0, 10)), days), 'yyyy-MM-dd')

/** Whole days until a YYYY-MM-DD date, from today (local). */
export const daysUntil = (key: string) => {
  const target = parseISO(key.substring(0, 10))
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** "today", "tomorrow", "in 12 days", "3 days ago" */
export const relativeDays = (days: number) => {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  return days > 1 ? `in ${days} days` : `${-days} days ago`
}

/** "Amina Rahman", falling back to the username when a name is missing. */
export const staffName = (t: { firstName?: string | null; lastName?: string | null; username?: string | null }) =>
  `${t.firstName || ''} ${t.lastName || t.username || ''}`.trim() || 'Staff member'
