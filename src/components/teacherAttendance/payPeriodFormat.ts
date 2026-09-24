// Small formatting helpers shared by the pay-period UI. Dates from the API are
// YYYY-MM-DD keys; parse them as local dates so nothing shifts a day.

import { format, parseISO } from 'date-fns'

/** "Sep 25" or "Sep 25, 2026" */
export const shortDate = (key: string, withYear = false) =>
  format(parseISO(key.substring(0, 10)), withYear ? 'MMM d, yyyy' : 'MMM d')

/** "Aug 26 – Sep 25" */
export const dateRange = (start: string, end: string) => `${shortDate(start)} – ${shortDate(end)}`

/** 7 → "7", 7.5 → "7.5", 10.25 → "10.25" */
export const formatHours = (n: number | null | undefined) => {
  const v = Number(n ?? 0)
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
}

/** Whole days until a YYYY-MM-DD date, from today (local). */
export const daysUntil = (key: string) => {
  const target = parseISO(key.substring(0, 10))
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}
