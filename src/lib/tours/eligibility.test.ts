import { describe, expect, it } from 'vitest'
import { isAudience, isOfferable, listForMenu, TOURS_LAUNCH_AT } from './eligibility'
import { pickOffer } from './queue'
import type { TourCtx, TourDefinition, TourProgress } from './types'

const step = (id: string, platforms?: Array<'web' | 'app'>) => ({ id, kind: 'look' as const, target: null, title: id, body: id, platforms })
const tour = (over: Partial<TourDefinition> & { id: string }): TourDefinition => ({
  version: 1,
  audience: { roles: ['TEACHER'] },
  offer: { kind: 'feature', title: 'New', blurb: 'New.' },
  steps: [step('a')],
  ...over,
})
const ctx = (over: Partial<TourCtx> = {}): TourCtx => ({
  now: new Date('2026-12-01T12:00:00Z'),
  platform: 'web',
  user: { role: 'TEACHER', permissions: ['students'], isFullAdmin: false, school: 'ALHAADIACADEMY' },
  userCreatedAt: '2026-12-01T09:00:00Z',
  impersonating: false,
  blocked: false,
  here: 'home',
  ...over,
})
const progress = (tourId: string, over: Partial<TourProgress>): TourProgress => ({
  tourId, version: 1, status: 'offered', stepIndex: 0, snoozedUntil: null, completedAt: null, ...over,
})

describe('isAudience', () => {
  it('matches the active view, case-insensitively', () => {
    expect(isAudience(tour({ id: 'x' }), ctx())).toBe(true)
    expect(isAudience(tour({ id: 'x', audience: { roles: ['teacher'] } }), ctx())).toBe(true)
    expect(isAudience(tour({ id: 'x' }), ctx({ user: { role: 'PARENT' } }))).toBe(false)
  })
  it('checks permissions and schools', () => {
    expect(isAudience(tour({ id: 'x', audience: { roles: ['TEACHER'], anyPermission: ['report_cards'] } }), ctx())).toBe(false)
    expect(isAudience(tour({ id: 'x', audience: { roles: ['TEACHER'], anyPermission: ['students'] } }), ctx())).toBe(true)
    expect(isAudience(tour({ id: 'x', audience: { roles: ['TEACHER'], schools: ['OTHER'] } }), ctx())).toBe(false)
  })
  it('needs at least one step on this platform', () => {
    expect(isAudience(tour({ id: 'x', steps: [step('a', ['app'])] }), ctx())).toBe(false)
  })
})

describe('isOfferable', () => {
  it('respects the offer window', () => {
    expect(isOfferable(tour({ id: 'x', offer: { kind: 'feature', title: 'N', blurb: 'N', from: '2026-12-02' } }), ctx(), undefined)).toBe(false)
    expect(isOfferable(tour({ id: 'x', offer: { kind: 'feature', title: 'N', blurb: 'N', until: '2026-11-30' } }), ctx(), undefined)).toBe(false)
    expect(isOfferable(tour({ id: 'x', offer: { kind: 'feature', title: 'N', blurb: 'N', from: '2026-11-30', until: '2026-12-30' } }), ctx(), undefined)).toBe(true)
  })
  it('offers welcome tours to new accounts only', () => {
    const welcome = tour({ id: 'w', offer: { kind: 'welcome', title: 'W', blurb: 'W', newAccountsOnly: true } })
    expect(isOfferable(welcome, ctx(), undefined)).toBe(true)
    expect(isOfferable(welcome, ctx({ userCreatedAt: '2025-09-01T00:00:00Z' }), undefined)).toBe(false)
    expect(isOfferable(welcome, ctx({ userCreatedAt: null }), undefined)).toBe(false)
    expect(isOfferable(welcome, ctx({ userCreatedAt: TOURS_LAUNCH_AT }), undefined)).toBe(true)
  })
  it('never during a "View as" preview', () => {
    expect(isOfferable(tour({ id: 'x' }), ctx({ impersonating: true }), undefined)).toBe(false)
  })
  it('only while the row still says offered and isn\'t snoozed', () => {
    const t = tour({ id: 'x' })
    expect(isOfferable(t, ctx(), progress('x', { status: 'offered' }))).toBe(true)
    expect(isOfferable(t, ctx(), progress('x', { status: 'in_progress' }))).toBe(false)
    expect(isOfferable(t, ctx(), progress('x', { status: 'completed' }))).toBe(false)
    expect(isOfferable(t, ctx(), progress('x', { status: 'dismissed' }))).toBe(false)
    expect(isOfferable(t, ctx(), progress('x', { snoozedUntil: '2026-12-03T00:00:00Z' }))).toBe(false)
    expect(isOfferable(t, ctx(), progress('x', { snoozedUntil: '2026-11-30T00:00:00Z' }))).toBe(true)
  })
  it('a new tour version is offered again', () => {
    expect(isOfferable(tour({ id: 'x', version: 2 }), ctx(), progress('x', { status: 'completed' }))).toBe(true)
  })
})

describe('pickOffer', () => {
  const a = tour({ id: 'a', offer: { kind: 'feature', title: 'A', blurb: 'A', from: '2026-11-01' } })
  const b = tour({ id: 'b', offer: { kind: 'feature', title: 'B', blurb: 'B', from: '2026-11-20' } })
  const p = tour({ id: 'p', offer: { kind: 'feature', title: 'P', blurb: 'P', priority: 5 } })
  const w = tour({ id: 'w', offer: { kind: 'welcome', title: 'W', blurb: 'W', newAccountsOnly: true, on: 'home' } })

  it('offers welcome first, then priority, then the newest', () => {
    expect(pickOffer(ctx(), {}, [a, b, p, w], false)?.id).toBe('w')
    expect(pickOffer(ctx(), {}, [a, b, p], false)?.id).toBe('p')
    expect(pickOffer(ctx(), {}, [a, b], false)?.id).toBe('b')
  })
  it('waits while something else has the screen', () => {
    expect(pickOffer(ctx({ blocked: true }), {}, [a], false)).toBeNull()
    expect(pickOffer(ctx(), {}, [a], true)).toBeNull()
    expect(pickOffer(ctx({ impersonating: true }), {}, [a], false)).toBeNull()
  })
  it('only on the page the tour asks for', () => {
    expect(pickOffer(ctx({ here: null }), {}, [w], false)).toBeNull()
  })
})

describe('listForMenu', () => {
  it('lists every tour for the person, unfinished first, welcome always', () => {
    const w = tour({ id: 'w', offer: { kind: 'welcome', title: 'W', blurb: 'W', newAccountsOnly: true } })
    const done = tour({ id: 'done', steps: [step('a'), step('b')] })
    const later = tour({ id: 'later', offer: { kind: 'feature', title: 'L', blurb: 'L', from: '2027-01-01' } })
    const going = tour({ id: 'going', steps: [step('a'), step('b'), step('c')] })
    const menu = listForMenu(ctx({ userCreatedAt: '2020-01-01T00:00:00Z' }), {
      done: progress('done', { status: 'completed' }),
      going: progress('going', { status: 'in_progress', stepIndex: 2 }),
    }, [w, done, later, going])
    expect(menu.map((m) => [m.def.id, m.status])).toEqual([['going', 'in_progress'], ['w', 'new'], ['done', 'done']])
    expect(menu[0]).toMatchObject({ stepIndex: 2, stepCount: 3 })
  })
  it('resumes by step id, so the other platform picks up at the same step', () => {
    const t = tour({ id: 'x', steps: [step('a'), step('web-only', ['web']), step('b'), step('c')] })
    const row = progress('x', { status: 'in_progress', stepIndex: 2, stepId: 'b' })
    expect(listForMenu(ctx({ platform: 'app' }), { x: row }, [t])[0]).toMatchObject({ stepIndex: 1, stepCount: 3 })
    expect(listForMenu(ctx(), { x: row }, [t])[0]).toMatchObject({ stepIndex: 2, stepCount: 4 })
    expect(listForMenu(ctx({ platform: 'app' }), { x: { ...row, stepId: 'gone' } }, [t])[0]).toMatchObject({ stepIndex: 2 })
  })

  it('is empty during a preview', () => {
    expect(listForMenu(ctx({ impersonating: true }), {}, [tour({ id: 'x' })])).toEqual([])
  })
})
