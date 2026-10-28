import { describe, expect, it } from 'vitest'
import type { AlertIncident, AlertRule } from '@/services/types/observe'
import {
  buildTimeline, checkParam, fmtDuration, fmtParam, muteUntil, mutePresetsFor, readIncident, ruleStateOf, sortIncidents,
  thresholdText, withIncident, withoutIncident,
} from './observeAlerts'

const NOW = Date.parse('2026-10-28T16:00:00Z')

const rule = (over: Partial<AlertRule> = {}): AlertRule => ({
  id: 'errors_burst', name: 'Server errors burst', tier: 'critical', description: '', source: '', window: '5 min',
  locked: true, external: false, defaultMode: 'live',
  params: [
    { key: 'serverErrors', label: 'Failed responses', unit: '5xx', default: 5, min: 1, max: 1000, value: 5 },
    { key: 'loggedErrors', label: 'Logged errors', unit: 'errors', default: 10, min: 1, max: 1000, value: 10 },
  ],
  enabled: true, mode: 'live', mutedUntil: null, customized: false,
  current: { tripped: false, value: 0, summary: '' }, lastTrip: null, trips7d: { live: 0, watch: 0, muted: 0 },
  ...over,
})

const incident = (over: Partial<AlertIncident> = {}): AlertIncident => ({
  id: 'i1', status: 'resolved', tier: 'critical', title: 'Database unreachable',
  openedAt: '2026-10-22T02:02:00.000Z', lastTripAt: '2026-10-22T13:25:00.000Z', resolvedAt: '2026-10-22T13:42:00.000Z',
  durationMs: 700 * 60 * 1000, reopenCount: 0, notifiedAt: '2026-10-22T02:02:00.000Z', held: false,
  rules: [
    { id: 'db_unreachable', name: 'Database unreachable', tier: 'critical', firstAt: '2026-10-22T02:02:00.000Z', lastAt: '2026-10-22T13:25:00.000Z', peak: 40, summary: 'x' },
    { id: 'failure_rate', name: 'High failure rate', tier: 'critical', firstAt: '2026-10-22T12:56:00.000Z', lastAt: '2026-10-22T13:10:00.000Z', peak: 82, summary: '82% failed' },
  ],
  stats: { failedRequests: 758, loggedErrors: 900, peopleAffected: 13, peakErrors5m: 192, topErrors: [] },
  notifications: [
    { ts: '2026-10-22T02:02:01.000Z', channel: 'email', kind: 'opened', ok: true, recipients: 1, subject: 's', error: null },
    { ts: '2026-10-22T02:02:01.000Z', channel: 'push', kind: 'opened', ok: false, recipients: 0, subject: 's', error: 'DeviceNotRegistered' },
    { ts: '2026-10-22T13:42:00.000Z', channel: 'email', kind: 'recovered', ok: true, recipients: 1, subject: 's', error: null },
  ],
  ...over,
})

describe('incident param', () => {
  it('opens and closes without touching other params', () => {
    const open = withIncident('window=7d', 'abc')
    expect(open).toBe('window=7d&incident=abc')
    expect(readIncident(new URLSearchParams(open))).toBe('abc')
    expect(withoutIncident(open)).toBe('window=7d')
    expect(readIncident(new URLSearchParams('window=7d'))).toBeNull()
  })
})

describe('fmtDuration', () => {
  it.each([[30_000, 'under a minute'], [47 * 60_000, '47 min'], [120 * 60_000, '2 h'], [700 * 60_000, '11 h 40 min']])('%i → %s', (ms, text) => {
    expect(fmtDuration(ms)).toBe(text)
  })
})

describe('ruleStateOf', () => {
  it.each([
    [rule({ external: true }), 'external'],
    [rule({ enabled: false }), 'off'],
    [rule({ mutedUntil: new Date(NOW + 1000).toISOString() }), 'muted'],
    [rule({ mutedUntil: new Date(NOW - 1000).toISOString(), current: { tripped: true, value: 8, summary: '' } }), 'firing'],
    [rule({ mode: 'watch' }), 'watch'],
    [rule({ current: null }), 'no-data'],
    [rule({ current: { tripped: null, value: null, summary: '' } }), 'no-data'],
    [rule(), 'ok'],
  ])('%#', (r, state) => {
    expect(ruleStateOf(r, NOW)).toBe(state)
  })
})

describe('mute presets', () => {
  it('critical rules mute for a day at most', () => {
    expect(mutePresetsFor({ locked: true }).map((p) => p.key)).toEqual(['1h', '8h', '24h'])
    expect(mutePresetsFor({ locked: false }).map((p) => p.key)).toEqual(['1h', '8h', '24h', '7d'])
    expect(muteUntil(2, NOW)).toBe('2026-10-28T18:00:00.000Z')
  })
})

describe('checkParam', () => {
  const p = rule().params[0]
  it.each([['8', { value: 8 }], [' 12 ', { value: 12 }], ['', { error: 'Failed responses is required' }], ['abc', { error: 'Failed responses must be a number' }], ['0', { error: 'Failed responses must be between 1 and 1000' }]])('%j', (raw, out) => {
    expect(checkParam(p, raw)).toEqual(out)
  })
  it('describes thresholds', () => {
    expect(thresholdText(rule())).toBe('5 5xx · 10 errors')
    expect(fmtParam({ value: 10, unit: '%' })).toBe('10%')
    expect(fmtParam({ value: 1, unit: 'emails' })).toBe('1 email')
    expect(fmtParam({ value: 500, unit: 'ms' })).toBe('500 ms')
  })
})

describe('buildTimeline', () => {
  it('lists the opening, later trips, every send (failed ones marked) and recovery, oldest first', () => {
    expect(buildTimeline(incident()).map((e) => [e.kind, e.label])).toEqual([
      ['opened', 'Opened'],
      ['sent', 'Alert sent · email'],
      ['sent', 'Alert sent · push failed'],
      ['tripped', 'High failure rate tripped'],
      ['recovered', 'Recovered'],
      ['sent', 'Recovery sent · email'],
    ])
  })
  it('an open incident has no recovery entry', () => {
    expect(buildTimeline(incident({ status: 'open', resolvedAt: null, notifications: [] })).map((e) => e.kind)).toEqual(['opened', 'tripped'])
  })
})

describe('sortIncidents', () => {
  it('puts the open one first, then newest', () => {
    const a = incident({ id: 'a', openedAt: '2026-10-20T00:00:00Z' })
    const b = incident({ id: 'b', openedAt: '2026-10-25T00:00:00Z' })
    const c = incident({ id: 'c', status: 'open', openedAt: '2026-10-10T00:00:00Z' })
    expect(sortIncidents([a, b, c]).map((i) => i.id)).toEqual(['c', 'b', 'a'])
  })
})
