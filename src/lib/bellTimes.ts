// Copy with new times: client helpers for a schedule's bell times — the
// breaks and school hours it was made for. The moving and checking happen on
// the server (services/scheduleRetime); these only shape what the admin types
// or pastes. Shared verbatim with the mobile app.

import type {
  BellTimes,
  PlannerConfig,
  RetimeBell,
  RetimeEdits,
  RetimePreview,
  RetimeRow,
  TimeRange,
} from '@/services/types/schedulePlanner'

/** A copy with new times shows its own breaks and school hours, not the year's live ones. */
export function withBellTimes(config: PlannerConfig, bellTimes: BellTimes | null | undefined): PlannerConfig {
  if (!bellTimes) return config
  return {
    ...config,
    fixedBlocks: bellTimes.fixedBlocks?.map((b, i) => ({ ...b, fixedBlockId: `bell-${i}` })) ?? config.fixedBlocks,
    dayTemplates: bellTimes.dayTemplates ?? config.dayTemplates,
  }
}

export const isTimeChanged = (a: TimeRange, b: TimeRange) => a.startMin !== b.startMin || a.endMin !== b.endMin

/** 520 → "8:40", 805 → "1:25": 12-hour without AM/PM, how bell schedules are written. */
export const bellClock = (min: number): string => {
  const h = Math.floor(min / 60) % 24
  return `${((h + 11) % 12) + 1}:${String(min % 60).padStart(2, '0')}`
}

export const bellRange = (startMin: number, endMin: number) => `${bellClock(startMin)}–${bellClock(endMin)}`

/** Today in America/Toronto as yyyy-mm-dd (go-live dates are school-local days). */
export const torontoToday = (now: Date = new Date()): string =>
  now.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })

/** A go-live date before today can't be used. */
export const isPastDay = (ymd: string, now: Date = new Date()) => !!ymd && ymd < torontoToday(now)

/** "2026-11-02" → "Mon, Nov 2" (or "Mon, Nov 2, 2027" outside the current year). */
export function formatDay(ymd: string, now: Date = new Date()): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(y !== now.getFullYear() ? { year: 'numeric' } : {}),
  })
}

// ─── Pasting a bell list ──────────────────────────────────────────────────

export interface PastedBell {
  label: string
  startMin: number
  endMin: number
}

const TIME_RANGE =
  /(\d{1,2})[:.](\d{2})\s*(am|pm|a\.m\.|p\.m\.)?\s*(?:-|–|—|to)\s*(\d{1,2})[:.](\d{2})\s*(am|pm|a\.m\.|p\.m\.)?/i

const meridiemOf = (text: string | undefined) => text?.toLowerCase().replace(/\./g, '') as 'am' | 'pm' | undefined

const toMinutes = (hour: number, min: number, meridiem: 'am' | 'pm' | undefined) => {
  if (meridiem === 'pm') return ((hour % 12) + 12) * 60 + min
  if (meridiem === 'am') return (hour % 12) * 60 + min
  // No AM/PM: 13:05 is already 24-hour, and school days don't start before 7,
  // so 1:25 is the afternoon.
  if (hour >= 13 || hour === 0) return hour * 60 + min
  return (hour < 7 ? hour + 12 : hour) * 60 + min
}

/**
 * Reads a bell list as schools send it, one line per bell:
 * "8:40–8:50 — Assembly", "• 12:55–1:25 — Salaat", "1st Period 8:50-9:40".
 * Lines without a time range are skipped.
 */
export function parseBellText(text: string): PastedBell[] {
  const out: PastedBell[] = []
  for (const line of text.split(/\r?\n/)) {
    const match = TIME_RANGE.exec(line)
    if (!match) continue
    const startMeridiem = meridiemOf(match[3])
    const endMeridiem = meridiemOf(match[6])
    const startMin = toMinutes(Number(match[1]), Number(match[2]), startMeridiem)
    let endMin = toMinutes(Number(match[4]), Number(match[5]), endMeridiem ?? startMeridiem)
    // "11:30 am–12:10": an end without its own AM/PM that lands before the start is the afternoon.
    if (!endMeridiem && endMin <= startMin) endMin = toMinutes(Number(match[4]), Number(match[5]), 'pm')
    // Bullets and dashes around the label go; a hyphen inside it ("Clean-up") stays.
    const label = line
      .replace(match[0], ' ')
      .replace(/\s+[-–—:|]+\s+/g, ' ')
      .replace(/^[\s•*·\-–—:|]+|[\s•*·\-–—:|]+$/g, '')
      .replace(/\s+/g, ' ')
    if (endMin > startMin) out.push({ label: label || 'Break', startMin, endMin })
  }
  return out
}

const normalize = (label: string) =>
  label
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** "1st Period", "Period 1", "P1" → 1. */
const periodNumber = (label: string): number | null => {
  const n = normalize(label)
  const match = /^(\d+)(?:st|nd|rd|th)? period$/.exec(n) ?? /^period (\d+)$/.exec(n) ?? /^p ?(\d+)$/.exec(n)
  return match ? Number(match[1]) : null
}

const distance = (a: string, b: string) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return dp[a.length][b.length]
}

/** "Salaat" matches "Salat", "Snack" matches "Snack 2 (Grade 1-4)". */
const sameBreak = (pasted: string, row: string) => {
  const a = normalize(pasted).split(' ')[0] ?? ''
  const b = normalize(row).split(' ')[0] ?? ''
  if (!a || !b) return false
  if (a === b || a.startsWith(b) || b.startsWith(a)) return true
  return Math.min(a.length, b.length) >= 4 && distance(a, b) <= 2
}

export interface PasteMatch {
  rows: { rowId: string; startMin: number; endMin: number }[]
  /** Pasted lines with no matching bell: new breaks for this bell's grades. */
  added: PastedBell[]
  /** Bells in the schedule the pasted list didn't mention; they keep their times. */
  untouched: RetimeRow[]
}

/**
 * Lines up a pasted list with one bell's rows: periods by number, breaks by
 * name (two Snacks pair up in time order), anything else becomes a new break.
 */
export function matchPastedBells(pasted: PastedBell[], bell: RetimeBell): PasteMatch {
  const periods = bell.rows.filter((r) => r.kind === 'period' && /^Period \d+$/.test(r.label))
  const breaks = bell.rows.filter((r) => r.kind === 'break').sort((a, b) => a.startMin - b.startMin)
  const used = new Set<string>()
  const rows: PasteMatch['rows'] = []
  const added: PastedBell[] = []
  for (const line of pasted) {
    const n = periodNumber(line.label)
    const row =
      n != null
        ? periods.find((r) => r.label === `Period ${n}` && !used.has(r.rowId))
        : breaks.find((r) => !used.has(r.rowId) && sameBreak(line.label, r.label))
    if (row) {
      used.add(row.rowId)
      rows.push({ rowId: row.rowId, startMin: line.startMin, endMin: line.endMin })
    } else {
      added.push(line)
    }
  }
  return { rows, added, untouched: bell.rows.filter((r) => !used.has(r.rowId)) }
}

/**
 * New breaks are entered per bell. The same break (name and time) added to
 * every bell is one whole-school break.
 */
export function mergeAddedBreaks(
  added: { label: string; startMin: number; endMin: number; classGroupIds: string[] }[],
  bells: RetimeBell[]
): NonNullable<RetimeEdits['added']> {
  const allGroups = new Set(bells.flatMap((b) => b.classGroupIds))
  const byKey = new Map<string, { label: string; startMin: number; endMin: number; classGroupIds: string[] }>()
  for (const a of added) {
    const label = a.label.trim()
    const key = `${label.toLowerCase()}|${a.startMin}|${a.endMin}`
    const prev = byKey.get(key)
    const ids = [...new Set([...(prev?.classGroupIds ?? []), ...a.classGroupIds])]
    byKey.set(key, { label, startMin: a.startMin, endMin: a.endMin, classGroupIds: ids })
  }
  return [...byKey.values()].map((a) => ({
    ...a,
    classGroupIds: a.classGroupIds.length === 0 || [...allGroups].every((id) => a.classGroupIds.includes(id)) ? [] : a.classGroupIds,
  }))
}

// ─── Words shared by the web modal and the app sheet ──────────────────────

/** The check panel's sentences for a preview. */
export function retimeSummary(preview: RetimePreview) {
  const { moved, sessions } = preview.totals
  const warnings = preview.warnings.length
  const adjusted = preview.adjustedBlocks
  const first = adjusted[0]
  return {
    moved: moved === 0 ? 'No classes move yet' : `${moved} ${moved === 1 ? 'class moves' : 'classes move'}`,
    of: `of ${sessions} in the timetable`,
    clear: 'No clashes',
    clearDetail: 'No teacher, class or room is double-booked, and no class lands in a break.',
    check: `${warnings} ${warnings === 1 ? 'thing' : 'things'} to check`,
    checkNote: "These don't stop the copy. The timetable builder works the same way.",
    adjusted: first
      ? `${adjusted.length} other ${adjusted.length === 1 ? 'block follows' : 'blocks follow'} the new times, such as “${first.label}” ${bellRange(first.from.startMin, first.from.endMin)} → ${bellRange(first.to.startMin, first.to.endMin)}.`
      : null,
    kept: preview.unmatchedBlocks.length
      ? `Kept as they are: ${preview.unmatchedBlocks.map((b) => `${b.label} ${bellRange(b.startMin, b.endMin)}`).join(', ')}.`
      : null,
    unmapped: preview.unmapped.length
      ? `${preview.unmapped.length} ${preview.unmapped.length === 1 ? 'class has' : 'classes have'} no class group and keep their times.`
      : null,
  }
}

/** What happens when the copy goes live, under the go-live choice. */
export function goLiveNote(mode: 'date' | 'manual', goLiveOn: string): string {
  const when =
    mode === 'manual'
      ? 'It is saved as a draft until you publish it.'
      : goLiveOn
        ? `It publishes itself just after midnight on ${formatDay(goLiveOn)} (Toronto time).`
        : 'Pick the day it goes live, or choose “I’ll publish it myself”.'
  return `${when} When it goes live, its breaks and school hours become the school’s. The schedule it replaces keeps its own times, so you can publish that one again later.`
}
