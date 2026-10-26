import { describe, it, expect } from 'vitest'
import {
  bellClock,
  formatDay,
  goLiveNote,
  isPastDay,
  retimeSummary,
  matchPastedBells,
  mergeAddedBreaks,
  parseBellText,
  torontoToday,
  withBellTimes,
} from './bellTimes'
import type { PlannerConfig, RetimeBell } from '@/services/types/schedulePlanner'

const t = (hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  return (h < 7 ? h + 12 : h) * 60 + m
}

// The Junior bell as the server describes it (times as they are today).
const junior: RetimeBell = {
  bellId: 'bell-jr',
  label: 'Grades 1–4 · JK · SK',
  classGroupIds: ['jk', 'sk', 'g1', 'g2', 'g3', 'g4'],
  rows: [
    ['p1', 'period', 'Period 1', '8:55', '9:40'],
    ['s1', 'break', 'Snack', '9:40', '9:55'],
    ['p2', 'period', 'Period 2', '9:55', '10:40'],
    ['p3', 'period', 'Period 3', '10:40', '11:25'],
    ['l', 'break', 'Lunch (Grade 1-4)', '11:25', '12:00'],
    ['p4', 'period', 'Period 4', '12:00', '12:45'],
    ['p5', 'period', 'Period 5', '12:45', '1:30'],
    ['s2', 'break', 'Snack 2 (Grade 1-4)', '1:30', '1:40'],
    ['sal', 'break', 'Salat', '1:40', '2:10'],
    ['p6', 'period', 'Period 6', '2:10', '2:55'],
  ].map(([rowId, kind, label, s, e]) => ({
    rowId,
    kind: kind as 'period' | 'break',
    label,
    startMin: t(s),
    endMin: t(e),
    days: [1, 2, 3, 4, 5],
  })),
}

// The Junior list exactly as the school sent it.
const JUNIOR_PASTE = `*Junior Schedule (Grades 1–4)*

•  8:40–8:50 — Assembly
•  8:50–9:40 — 1st Period
•  9:40–9:55 — Snack
•  9:55–10:40 — 2nd Period
•  10:40–11:25 — 3rd Period
•  11:25–12:00 — Lunch
•  12:00–12:45 — 4th Period
•  12:45–12:55 — Snack
•  12:55–1:25 — Salaat
•  1:25–2:10 — 5th Period
•  2:10–2:55 — 6th Period
•  2:55–3:00 — Clean-up`

describe('parseBellText', () => {
  it('reads the list the way schools send it', () => {
    const lines = parseBellText(JUNIOR_PASTE)
    expect(lines).toHaveLength(12)
    expect(lines[0]).toEqual({ label: 'Assembly', startMin: t('8:40'), endMin: t('8:50') })
    expect(lines[8]).toEqual({ label: 'Salaat', startMin: t('12:55'), endMin: t('1:25') })
    expect(lines[11]).toEqual({ label: 'Clean-up', startMin: t('2:55'), endMin: t('3:00') })
  })

  it('reads 24-hour times and an end time without its own AM/PM', () => {
    expect(parseBellText('13:05–13:35 Period 5')).toEqual([{ label: 'Period 5', startMin: 785, endMin: 815 }])
    expect(parseBellText('11:30 am–12:10 Lunch')).toEqual([{ label: 'Lunch', startMin: 690, endMin: 730 }])
    expect(parseBellText('10:00 am – 1:00 Trip')).toEqual([{ label: 'Trip', startMin: 600, endMin: 780 }])
    expect(parseBellText('12:00–12:45 Period 4')).toEqual([{ label: 'Period 4', startMin: 720, endMin: 765 }])
    expect(parseBellText('7:30–8:15 Early bird')).toEqual([{ label: 'Early bird', startMin: 450, endMin: 495 }])
  })

  it('takes hyphens, "to", AM/PM and a label before the time', () => {
    expect(parseBellText('Period 1 8:50-9:40')).toEqual([{ label: 'Period 1', startMin: 530, endMin: 580 }])
    expect(parseBellText('Lunch 11:30 am to 12:05 pm')).toEqual([{ label: 'Lunch', startMin: 690, endMin: 725 }])
    expect(parseBellText('no times here\n\n')).toEqual([])
  })
})

describe('matchPastedBells', () => {
  it('matches periods by number and breaks by name, in time order', () => {
    const { rows, added, untouched } = matchPastedBells(parseBellText(JUNIOR_PASTE), junior)
    const byId = Object.fromEntries(rows.map((r) => [r.rowId, `${bellClock(r.startMin)}–${bellClock(r.endMin)}`]))
    expect(byId).toEqual({
      p1: '8:50–9:40',
      s1: '9:40–9:55',
      p2: '9:55–10:40',
      p3: '10:40–11:25',
      l: '11:25–12:00',
      p4: '12:00–12:45',
      s2: '12:45–12:55',
      sal: '12:55–1:25',
      p5: '1:25–2:10',
      p6: '2:10–2:55',
    })
    expect(added.map((a) => a.label)).toEqual(['Assembly', 'Clean-up'])
    expect(untouched).toEqual([])
  })

  it('leaves bells the list does not mention untouched', () => {
    const { rows, untouched } = matchPastedBells(parseBellText('9:00-9:45 Period 1'), junior)
    expect(rows).toEqual([{ rowId: 'p1', startMin: 540, endMin: 585 }])
    expect(untouched).toHaveLength(9)
  })
})

describe('mergeAddedBreaks', () => {
  const senior: RetimeBell = { bellId: 'bell-sr', label: 'Grades 5–8', classGroupIds: ['g5', 'g6'], rows: [] }

  it('turns the same break added to every bell into one whole-school break', () => {
    const merged = mergeAddedBreaks(
      [
        { label: 'Assembly', startMin: 520, endMin: 530, classGroupIds: junior.classGroupIds },
        { label: 'Assembly ', startMin: 520, endMin: 530, classGroupIds: senior.classGroupIds },
        { label: 'Recess', startMin: 600, endMin: 610, classGroupIds: senior.classGroupIds },
      ],
      [junior, senior]
    )
    expect(merged).toEqual([
      { label: 'Assembly', startMin: 520, endMin: 530, classGroupIds: [] },
      { label: 'Recess', startMin: 600, endMin: 610, classGroupIds: ['g5', 'g6'] },
    ])
  })
})

describe('dates and clock', () => {
  it('formats go-live days without shifting them', () => {
    expect(formatDay('2026-11-02', new Date(2026, 9, 26))).toBe('Mon, Nov 2')
    expect(formatDay('2027-03-15', new Date(2026, 9, 26))).toBe('Mon, Mar 15, 2027')
  })

  it("knows Toronto's date at midnight UTC", () => {
    // 03:00 UTC on Nov 2 is still Nov 1 in Toronto.
    expect(torontoToday(new Date(Date.UTC(2026, 10, 2, 3, 0)))).toBe('2026-11-01')
  })

  it('writes 12-hour bell times', () => {
    expect(bellClock(520)).toBe('8:40')
    expect(bellClock(805)).toBe('1:25')
  })
})

describe('retimeSummary and goLiveNote', () => {
  const preview = {
    totals: { sessions: 245, moved: 1 },
    movedByRow: {},
    adjustedBlocks: [{ label: 'JK not in session', days: [1], from: { startMin: 535, endMin: 640 }, to: { startMin: 530, endMin: 640 } }],
    unmatchedBlocks: [],
    unmapped: [],
    warnings: [],
  }

  it('says what moves in plain words', () => {
    const s = retimeSummary(preview)
    expect(s.moved).toBe('1 class moves')
    expect(s.adjusted).toBe('1 other block follows the new times, such as “JK not in session” 8:55–10:40 → 8:50–10:40.')
    expect(s.kept).toBeNull()
    expect(retimeSummary({ ...preview, totals: { sessions: 245, moved: 80 } }).moved).toBe('80 classes move')
  })

  it('explains when the copy goes live', () => {
    expect(goLiveNote('manual', '')).toMatch(/^It is saved as a draft/)
    expect(goLiveNote('date', '')).toMatch(/^Pick the day it goes live/)
    expect(goLiveNote('date', '2026-11-02')).toMatch(/just after midnight on Mon, Nov 2/)
  })

  it('knows a past go-live day', () => {
    const now = new Date(Date.UTC(2026, 9, 26, 16))
    expect(isPastDay('2026-10-25', now)).toBe(true)
    expect(isPastDay('2026-10-26', now)).toBe(false)
    expect(isPastDay('', now)).toBe(false)
  })
})

describe('withBellTimes', () => {
  const config = {
    fixedBlocks: [{ fixedBlockId: 'live', classGroupIds: [], label: 'Salat', dayOfWeek: 1, startMin: 820, endMin: 850 }],
    dayTemplates: [{ dayOfWeek: 1, fillableRanges: [{ startMin: 535, endMin: 900 }] }],
  } as unknown as PlannerConfig

  it("swaps in a copy's own breaks and hours", () => {
    const own = {
      fixedBlocks: [{ classGroupIds: [], label: 'Salat', dayOfWeek: 1, startMin: 775, endMin: 805 }],
      dayTemplates: [{ dayOfWeek: 1, fillableRanges: [{ startMin: 520, endMin: 900 }] }],
    }
    const next = withBellTimes(config, own)
    expect(next.fixedBlocks[0]).toMatchObject({ startMin: 775, fixedBlockId: 'bell-0' })
    expect(next.dayTemplates[0].fillableRanges[0].startMin).toBe(520)
    expect(withBellTimes(config, null)).toBe(config)
  })
})
