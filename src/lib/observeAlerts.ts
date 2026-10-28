// Observe → Alerts, the parts with no React in them: the ?incident= modal
// param, what state a rule is in, mute presets, durations, an incident's
// timeline and threshold checks. Shared with the app (copied verbatim).
import type { AlertIncident, AlertRule, AlertRuleParam, AlertTier } from '@/services/types/observe'

/** The incident open in the modal, over whatever Observe page is showing. */
export const INCIDENT_PARAM = 'incident'

export function withIncident(search: string, id: string): string {
  const params = new URLSearchParams(search)
  params.set(INCIDENT_PARAM, id)
  return params.toString()
}

export function withoutIncident(search: string): string {
  const params = new URLSearchParams(search)
  params.delete(INCIDENT_PARAM)
  return params.toString()
}

export const readIncident = (params: Pick<URLSearchParams, 'get'>): string | null => params.get(INCIDENT_PARAM) || null

export const TIER_LABEL: Record<AlertTier, string> = { critical: 'Critical', warning: 'Warning', info: 'Notice' }

/** The rules list on Observe → Alerts, by tier. */
export const TIER_GROUPS: { tier: AlertTier; title: string; subtitle: string }[] = [
  { tier: 'critical', title: 'Critical', subtitle: 'Emailed and pushed right away, at any hour' },
  { tier: 'warning', title: 'Warning', subtitle: 'Emailed 7 am–10 pm Toronto time; overnight ones wait for the morning' },
  { tier: 'info', title: 'Notice', subtitle: 'One email, no reminders' },
]

/** The rule that tripped most recently: what the incident is doing now. */
export const latestRule = (incident: Pick<AlertIncident, 'rules'>) =>
  [...incident.rules].sort((a, b) => b.lastAt.localeCompare(a.lastAt))[0] ?? null

/** "under a minute", "47 min", "11 h 40 min". */
export function fmtDuration(ms: number): string {
  const mins = Math.floor(Math.max(0, ms) / 60000)
  if (mins < 1) return 'under a minute'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export type RuleState = 'firing' | 'muted' | 'watch' | 'off' | 'external' | 'ok' | 'no-data'

/** What a rule is doing right now, for its pill. */
export function ruleStateOf(rule: AlertRule, now = Date.now()): RuleState {
  if (rule.external) return 'external'
  if (!rule.enabled) return 'off'
  if (rule.mutedUntil && new Date(rule.mutedUntil).getTime() > now) return 'muted'
  if (rule.mode === 'watch') return 'watch'
  if (!rule.current || rule.current.tripped === null) return 'no-data'
  return rule.current.tripped ? 'firing' : 'ok'
}

export const MUTE_PRESETS = [
  { key: '1h', label: '1 hour', hours: 1 },
  { key: '8h', label: '8 hours', hours: 8 },
  { key: '24h', label: '24 hours', hours: 24 },
  { key: '7d', label: '7 days', hours: 24 * 7 },
] as const

/** Presets a rule may use: critical rules mute for 24 hours at most. */
export const mutePresetsFor = (rule: Pick<AlertRule, 'locked'>) => MUTE_PRESETS.filter((p) => !rule.locked || p.hours <= 24)

export const muteUntil = (hours: number, now = Date.now()): string => new Date(now + hours * 3600 * 1000).toISOString()

/** A typed threshold → the number to save, or the reason it can't be. */
export function checkParam(param: AlertRuleParam, raw: string): { value: number } | { error: string } {
  const text = raw.trim()
  if (!text) return { error: `${param.label} is required` }
  const n = Number(text)
  if (!Number.isFinite(n)) return { error: `${param.label} must be a number` }
  if (n < param.min || n > param.max) return { error: `${param.label} must be between ${param.min} and ${param.max}` }
  return { value: n }
}

/** One setting with its unit: "10%", "500 ms", "1 email", "20 errors". */
export function fmtParam(p: Pick<AlertRuleParam, 'value' | 'unit'>): string {
  if (p.unit === '%') return `${p.value}%`
  const unit = p.value === 1 && p.unit.endsWith('s') ? p.unit.slice(0, -1) : p.unit
  return `${p.value} ${unit}`
}

/** A rule's thresholds in a line: "5 5xx · 10 errors". */
export const thresholdText = (rule: Pick<AlertRule, 'params'>): string => rule.params.map(fmtParam).join(' · ')

export interface TimelineEntry {
  at: string
  kind: 'opened' | 'tripped' | 'sent' | 'recovered'
  label: string
  detail?: string
  ok?: boolean
}

const SENT_LABEL: Record<string, string> = {
  opened: 'Alert sent',
  escalated: 'Escalated to critical',
  reminder: 'Reminder sent',
  reopened: 'Back again: sent',
  recovered: 'Recovery sent',
}

/** What happened, oldest first: when it opened, each rule's first trip, every send, recovery. */
export function buildTimeline(incident: AlertIncident): TimelineEntry[] {
  const entries: TimelineEntry[] = [{ at: incident.openedAt, kind: 'opened', label: 'Opened', detail: incident.title }]
  for (const r of incident.rules) {
    if (r.firstAt !== incident.openedAt) entries.push({ at: r.firstAt, kind: 'tripped', label: `${r.name} tripped`, detail: r.summary })
  }
  for (const n of incident.notifications ?? []) {
    const label = `${SENT_LABEL[n.kind] ?? 'Sent'} · ${n.channel === 'email' ? 'email' : 'push'}`
    entries.push({ at: n.ts, kind: 'sent', label: n.ok ? label : `${label} failed`, detail: n.ok ? undefined : n.error ?? undefined, ok: n.ok })
  }
  if (incident.resolvedAt) entries.push({ at: incident.resolvedAt, kind: 'recovered', label: 'Recovered', detail: `after ${fmtDuration(incident.durationMs)}` })
  // Same instant: the event before the email about it.
  const order = { opened: 0, tripped: 1, recovered: 2, sent: 3 }
  return entries.sort((a, b) => a.at.localeCompare(b.at) || order[a.kind] - order[b.kind])
}

/** Firing first, then newest. */
export const sortIncidents = (list: AlertIncident[]): AlertIncident[] =>
  [...list].sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.openedAt.localeCompare(a.openedAt))
