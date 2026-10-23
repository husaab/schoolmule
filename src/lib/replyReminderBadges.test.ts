import { describe, expect, it } from 'vitest'
import { replyReminderBadges } from './replyReminderBadges'

describe('replyReminderBadges', () => {
  it('shows nothing when no reminder went out', () => {
    expect(replyReminderBadges(null)).toEqual([])
    expect(replyReminderBadges({ reminders: 0, officeToldAt: null, nudgedAt: null })).toEqual([])
  })

  it('counts the teacher reminders and dates the office email in Toronto time', () => {
    // 1:30 am UTC on Oct 29 is still Oct 28 in Toronto.
    expect(replyReminderBadges({ reminders: 2, officeToldAt: '2026-10-29T01:30:00.000Z', nudgedAt: null })).toEqual([
      { key: 'reminded', label: 'Reminded 2×' },
      { key: 'office', label: 'Office told Oct 28' },
    ])
  })

  it('dates the parent nudge', () => {
    expect(replyReminderBadges({ reminders: 0, officeToldAt: null, nudgedAt: '2026-10-21T11:00:00.000Z' })).toEqual([
      { key: 'nudged', label: 'Parent nudged Oct 21' },
    ])
  })
})
