// The All Messages badges for a conversation's reply reminders: "Reminded
// 2×", "Office told Oct 28", "Parent nudged Oct 21". Empty when none went out.

import type { ReplyReminderBadges } from '@/services/types/messaging'

export type ReplyReminderTone = 'reminded' | 'office' | 'nudged'

export interface ReplyReminderBadge {
  key: ReplyReminderTone
  label: string
}

const shortDay = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', month: 'short', day: 'numeric' }).format(new Date(iso))

export function replyReminderBadges(r: ReplyReminderBadges | null | undefined): ReplyReminderBadge[] {
  if (!r) return []
  const badges: ReplyReminderBadge[] = []
  if (r.reminders > 0) badges.push({ key: 'reminded', label: `Reminded ${r.reminders}×` })
  if (r.officeToldAt) badges.push({ key: 'office', label: `Office told ${shortDay(r.officeToldAt)}` })
  if (r.nudgedAt) badges.push({ key: 'nudged', label: `Parent nudged ${shortDay(r.nudgedAt)}` })
  return badges
}
