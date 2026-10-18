import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPollTimer, refreshDue } from './pollTimer'

const EVERY = 30_000

describe('refreshDue', () => {
  const base = { force: false, inFlight: false, sameUser: true, lastAt: 1_000_000, now: 1_010_000, everyMs: EVERY }

  it('skips an automatic refresh inside the interval and allows it after', () => {
    expect(refreshDue(base)).toBe(false)
    expect(refreshDue({ ...base, now: 1_000_000 + EVERY - 1 })).toBe(false)
    expect(refreshDue({ ...base, now: 1_000_000 + EVERY })).toBe(true)
  })

  it('always asks for a user it has not asked for yet', () => {
    expect(refreshDue({ ...base, sameUser: false })).toBe(true)
  })

  it('lets a forced refresh through the interval but never over one on its way', () => {
    expect(refreshDue({ ...base, force: true })).toBe(true)
    expect(refreshDue({ ...base, force: true, inFlight: true })).toBe(false)
    expect(refreshDue({ ...base, now: 1_000_000 + EVERY * 2, inFlight: true })).toBe(false)
  })
})

describe('createPollTimer', () => {
  let lastAt = 0
  let visible = true
  let polls = 0
  const make = () =>
    createPollTimer({
      everyMs: EVERY,
      lastAt: () => lastAt,
      isVisible: () => visible,
      poll: () => {
        polls += 1
        // What the real request does: stamp the attempt and re-arm when it ends.
        lastAt = Date.now()
        timer.rearm()
      },
    })
  let timer: ReturnType<typeof make>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
    lastAt = Date.now()
    visible = true
    polls = 0
    timer = make()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs no timer until a view asks, and none after the last one leaves', () => {
    expect(timer.armed()).toBe(false)
    const a = timer.acquire()
    expect(timer.armed()).toBe(true)
    a()
    expect(timer.armed()).toBe(false)
    vi.advanceTimersByTime(EVERY * 3)
    expect(polls).toBe(0)
  })

  it('polls once per interval, not once per view', () => {
    const sidebar = timer.acquire()
    const tabs = timer.acquire()
    vi.advanceTimersByTime(EVERY - 1)
    expect(polls).toBe(0)
    vi.advanceTimersByTime(1)
    expect(polls).toBe(1)
    vi.advanceTimersByTime(EVERY * 2)
    expect(polls).toBe(3)
    sidebar()
    tabs()
  })

  it('stays armed while one of two views remains', () => {
    const sidebar = timer.acquire()
    const tabs = timer.acquire()
    sidebar()
    sidebar() // releasing twice changes nothing
    expect(timer.armed()).toBe(true)
    vi.advanceTimersByTime(EVERY)
    expect(polls).toBe(1)
    tabs()
    expect(timer.armed()).toBe(false)
  })

  it('does not restart from zero when a page change remounts the views', () => {
    const first = timer.acquire()
    vi.advanceTimersByTime(20_000)
    first() // the old page's nav bar unmounts
    const second = timer.acquire() // the new page's nav bar mounts
    vi.advanceTimersByTime(9_999)
    expect(polls).toBe(0)
    vi.advanceTimersByTime(1) // 30 s after the last attempt, not 30 s after the remount
    expect(polls).toBe(1)
    second()
  })

  it('counts any attempt, so a focus refresh pushes the next poll out', () => {
    const view = timer.acquire()
    vi.advanceTimersByTime(25_000)
    lastAt = Date.now() // a focus event asked just now
    timer.rearm()
    vi.advanceTimersByTime(29_999)
    expect(polls).toBe(0)
    vi.advanceTimersByTime(1)
    expect(polls).toBe(1)
    view()
  })

  it('asks nothing while the tab is hidden', () => {
    const view = timer.acquire()
    visible = false
    vi.advanceTimersByTime(EVERY * 4)
    expect(polls).toBe(0)
    expect(timer.armed()).toBe(false) // the view that sees the tab come back asks, and that re-arms
    visible = true
    lastAt = Date.now()
    timer.rearm()
    vi.advanceTimersByTime(EVERY)
    expect(polls).toBe(1)
    view()
  })
})
