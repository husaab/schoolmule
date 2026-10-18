// src/lib/notificationPrefs.ts
// The parent's "Email preferences" (Parent-Digest board footer links): what the
// page offers, what a Save sends, and what `?set=daily` / `?set=off` (the links
// at the bottom of the weekly email) change. Pure, so it is unit-tested
// (notificationPrefs.test.ts). Copy is day-neutral: a weekday is named only
// where it is the parent's own chosen (or effective) day, or marks which option
// is the school's.

import type { NotificationPrefs, NotificationPrefsChange, SummaryDay, SummaryFrequency } from '@/services/types/parentClassroom'

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export const FREQUENCIES: { value: SummaryFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily', label: 'Daily' },
]

/** What the form edits: the four choices, as saved. */
export type PrefsDraft = Pick<NotificationPrefs, 'weeklySummary' | 'summaryFrequency' | 'summaryDow' | 'missingAlerts'>

export const draftOf = (prefs: NotificationPrefs): PrefsDraft => ({
  weeklySummary: prefs.weeklySummary,
  summaryFrequency: prefs.summaryFrequency,
  summaryDow: prefs.summaryDow,
  missingAlerts: prefs.missingAlerts,
})

/**
 * The PUT for a draft: only what differs from what is saved. The day only
 * matters for a weekly summary, so a daily one never sends it (the saved day is
 * kept for when they switch back).
 */
export function changeFor(draft: PrefsDraft, saved: NotificationPrefs): NotificationPrefsChange {
  const change: NotificationPrefsChange = {}
  if (draft.weeklySummary !== saved.weeklySummary) change.weeklySummary = draft.weeklySummary
  if (draft.summaryFrequency !== saved.summaryFrequency) change.summaryFrequency = draft.summaryFrequency
  if (draft.summaryFrequency === 'weekly' && draft.summaryDow !== saved.summaryDow) change.summaryDow = draft.summaryDow
  if (draft.missingAlerts !== saved.missingAlerts) change.missingAlerts = draft.missingAlerts
  return change
}

export const isDirty = (draft: PrefsDraft, saved: NotificationPrefs): boolean => Object.keys(changeFor(draft, saved)).length > 0

/** The day choices, Sunday to Saturday; the school's own day is marked. */
export const dayOptions = (schoolDefaultDow: SummaryDay): { value: SummaryDay; label: string }[] =>
  DAY_NAMES.map((name, i) => ({ value: i as SummaryDay, label: i === schoolDefaultDow ? `${name} (school's usual day)` : name }))

/** The email links' `?set=` values; anything else is ignored. */
export type SetParam = 'daily' | 'off'
export const parseSetParam = (value: string | null | undefined): SetParam | null => (value === 'daily' || value === 'off' ? value : null)

/** What `?set=` changes before anything else: "Get it daily" turns the summary on and daily; "Turn it off" switches it off. */
export const setChange = (set: SetParam): NotificationPrefsChange =>
  set === 'daily' ? { weeklySummary: true, summaryFrequency: 'daily' } : { weeklySummary: false }

/** The toast once `?set=` has been saved. */
export const setConfirmation = (set: SetParam): string =>
  set === 'daily'
    ? "Done. You'll get the summary every day."
    : 'Done. The summary email is off. Announcements still arrive right away.'

/** The line under the form's title. */
export const SUMMARY_BLURB =
  "A short email about your children's classes: what's missing, new grades and feedback, what's due, and notes from the teachers."

export const ALERT_BLURB = 'An email when work is missing, so it can be handed in.'

export const ANNOUNCEMENTS_NOTE = 'Announcements always arrive right away.'
