import { describe, it, expect } from 'vitest'
import type { NotificationPrefs } from '@/services/types/parentClassroom'
import {
  ANNOUNCEMENTS_NOTE,
  changeFor,
  dayOptions,
  draftOf,
  isDirty,
  parseSetParam,
  setChange,
  setConfirmation,
} from './notificationPrefs'

const saved: NotificationPrefs = { weeklySummary: true, summaryFrequency: 'weekly', summaryDow: 5, missingAlerts: true, schoolDefaultDow: 5 }

describe('what Save sends', () => {
  it('sends nothing when nothing changed', () => {
    expect(changeFor(draftOf(saved), saved)).toEqual({})
    expect(isDirty(draftOf(saved), saved)).toBe(false)
  })

  it('sends only what changed', () => {
    expect(changeFor({ ...draftOf(saved), missingAlerts: false }, saved)).toEqual({ missingAlerts: false })
    expect(changeFor({ ...draftOf(saved), weeklySummary: false }, saved)).toEqual({ weeklySummary: false })
    expect(changeFor({ ...draftOf(saved), summaryDow: 1 }, saved)).toEqual({ summaryDow: 1 })
  })

  it('sends the day with a weekly summary, including a return to the school\'s day', () => {
    const own = { ...saved, summaryDow: 1 as const }
    expect(changeFor({ ...draftOf(own), summaryDow: 5 }, own)).toEqual({ summaryDow: 5 })
  })

  it('does not send the day for a daily summary', () => {
    expect(changeFor({ ...draftOf(saved), summaryFrequency: 'daily', summaryDow: 2 }, saved)).toEqual({ summaryFrequency: 'daily' })
  })

  it('sends several changes together', () => {
    expect(changeFor({ weeklySummary: false, summaryFrequency: 'daily', summaryDow: 5, missingAlerts: false }, saved)).toEqual({
      weeklySummary: false,
      summaryFrequency: 'daily',
      missingAlerts: false,
    })
  })

  it('is dirty exactly when something would be sent', () => {
    expect(isDirty({ ...draftOf(saved), missingAlerts: false }, saved)).toBe(true)
    expect(isDirty({ ...draftOf(saved), summaryFrequency: 'daily', summaryDow: 2 }, saved)).toBe(true)
  })
})

describe('the day choices', () => {
  it('lists Sunday to Saturday and marks the school\'s day', () => {
    const options = dayOptions(5)
    expect(options.map((o) => o.value)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(options[0].label).toBe('Sunday')
    expect(options[5].label).toBe("Friday (school's usual day)")
    expect(options.filter((o) => o.label.includes('school')).length).toBe(1)
    expect(dayOptions(0)[0].label).toBe("Sunday (school's usual day)")
  })
})

describe('the email links', () => {
  it('reads ?set= and ignores anything else', () => {
    expect(parseSetParam('daily')).toBe('daily')
    expect(parseSetParam('off')).toBe('off')
    expect(parseSetParam('weekly')).toBeNull()
    expect(parseSetParam('')).toBeNull()
    expect(parseSetParam(null)).toBeNull()
    expect(parseSetParam(undefined)).toBeNull()
  })

  it('"daily" turns the summary on and daily; "off" turns it off', () => {
    expect(setChange('daily')).toEqual({ weeklySummary: true, summaryFrequency: 'daily' })
    expect(setChange('off')).toEqual({ weeklySummary: false })
  })

  it('confirms each in plain words, without naming a weekday', () => {
    expect(setConfirmation('daily')).toBe("Done. You'll get the summary every day.")
    expect(setConfirmation('off')).toBe('Done. The summary email is off. Announcements still arrive right away.')
    for (const s of ['daily', 'off'] as const) expect(setConfirmation(s)).not.toMatch(/sunday|monday|tuesday|wednesday|thursday|friday|saturday/i)
  })

  it('says announcements always arrive right away', () => {
    expect(ANNOUNCEMENTS_NOTE).toBe('Announcements always arrive right away.')
  })
})
