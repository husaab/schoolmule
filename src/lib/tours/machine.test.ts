import { describe, expect, it } from 'vitest'
import { IDLE, MISSING_MS, OPTIONAL_MS, PLACE_TIMEOUT_MS, reduce, type TourAction, type TourState } from './machine'
import type { RunnableTour, TourDefinition } from './types'

const def: TourDefinition = {
  id: 'demo',
  version: 1,
  audience: { roles: ['TEACHER'] },
  offer: { kind: 'feature', title: 'New: Demo', blurb: 'A demo.' },
  surfaces: { publish: { openTarget: 'gb.publish' } },
  steps: [
    { id: 'hello', kind: 'look', target: null, title: 'Hi', body: 'Hello.' },
    { id: 'nav', kind: 'click', target: 'nav.classes', where: { nav: 'sidebar' }, title: 'Classes', body: 'Open it.' },
    { id: 'col', kind: 'look', target: 'gb.col', where: { route: 'home' }, title: 'Drafts', body: 'Private.' },
    { id: 'email', kind: 'look', target: 'pub.email', where: { surface: 'publish' }, title: 'Email', body: 'One email.' },
    { id: 'note', kind: 'type', target: 'msg.body', title: 'Write', body: 'Type.' },
    { id: 'send', kind: 'click', target: 'msg.send', realAction: true, title: 'Send', body: 'Send it.' },
  ],
}
const rt: RunnableTour = { def, steps: def.steps }
const env = (now = 0) => ({ now, tour: (id: string) => (id === 'demo' ? rt : undefined) })
const run = (state: TourState, ...actions: Array<TourAction | [TourAction, number]>) =>
  actions.reduce<{ state: TourState; effects: ReturnType<typeof reduce>['effects'] }>(
    (acc, a) => {
      const [action, now] = Array.isArray(a) ? a : [a, 0]
      const r = reduce(acc.state, action, env(now))
      return { state: r.state, effects: [...acc.effects, ...r.effects] }
    },
    { state, effects: [] }
  )
const at = (i: number, extra: Partial<Extract<TourState, { phase: 'running' }>> = {}): TourState => ({
  phase: 'running', tourId: 'demo', i, sub: 'ready', since: 0, typed: false, ...extra,
})

describe('tour machine', () => {
  it('offers, then Show me how starts at the first step', () => {
    const offered = reduce(IDLE, { t: 'OFFER', tourId: 'demo' }, env())
    expect(offered.state).toEqual({ phase: 'offer', tourId: 'demo' })
    expect(offered.effects).toEqual([{ e: 'record', tourId: 'demo', event: 'offered', stepIndex: null, stepId: null }])
    const started = reduce(offered.state, { t: 'ACCEPT' }, env())
    expect(started.state).toMatchObject({ phase: 'running', i: 0, sub: 'ready' })
    expect(started.effects).toContainEqual({ e: 'record', tourId: 'demo', event: 'started', stepIndex: 0, stepId: 'hello' })
  })

  it('Later snoozes and Don\'t show again dismisses', () => {
    const offer: TourState = { phase: 'offer', tourId: 'demo' }
    expect(reduce(offer, { t: 'LATER' }, env())).toEqual({ state: IDLE, effects: [expect.objectContaining({ event: 'snoozed' })] })
    expect(reduce(offer, { t: 'NEVER' }, env())).toEqual({ state: IDLE, effects: [expect.objectContaining({ event: 'dismissed' })] })
  })

  it('ignores an offer for an unknown tour', () => {
    expect(reduce(IDLE, { t: 'OFFER', tourId: 'nope' }, env()).state).toBe(IDLE)
  })

  it('a nav step opens the nav, then looks for its target', () => {
    const r = reduce(at(0), { t: 'NEXT' }, env(5))
    expect(r.state).toMatchObject({ i: 1, sub: 'opening', since: 5 })
    expect(r.effects).toEqual([
      { e: 'record', tourId: 'demo', event: 'step', stepIndex: 1, stepId: 'nav' },
      { e: 'openNav' },
    ])
    const arrived = reduce(r.state, { t: 'ARRIVED' }, env(9))
    expect(arrived.state).toMatchObject({ sub: 'waiting', since: 9 })
    expect(arrived.effects).toEqual([{ e: 'resolve', target: 'nav.classes' }])
    expect(reduce(arrived.state, { t: 'PLACED', ok: true }, env(10)).state).toMatchObject({ sub: 'ready' })
  })

  it('a click step waits for the real click (Next does nothing)', () => {
    expect(reduce(at(1), { t: 'NEXT' }, env()).state).toEqual(at(1))
    const clicked = reduce(at(1), { t: 'ACTION_DONE' }, env(3))
    expect(clicked.state).toMatchObject({ i: 2, sub: 'navigating' })
    expect(clicked.effects).toContainEqual({ e: 'navigate', route: 'home' })
    expect(clicked.effects).toContainEqual({ e: 'closeNav' })
  })

  it('a route step navigates, then a surface step opens its dialog', () => {
    const nav = run(at(2, { sub: 'navigating' }), { t: 'ARRIVED' })
    expect(nav.state).toMatchObject({ sub: 'waiting' })
    const surf = run(at(2), { t: 'NEXT' })
    expect(surf.state).toMatchObject({ i: 3, sub: 'opening' })
    expect(surf.effects).toContainEqual({ e: 'openSurface', surface: 'publish', opener: 'gb.publish' })
  })

  it('a type step unlocks Next once enough is typed', () => {
    expect(reduce(at(4), { t: 'NEXT' }, env()).state).toEqual(at(4))
    const typed = reduce(at(4), { t: 'ACTION_DONE' }, env())
    expect(typed.state).toMatchObject({ i: 4, typed: true })
    expect(reduce(typed.state, { t: 'NEXT' }, env()).state).toMatchObject({ i: 5 })
  })

  it('a type step that needs nothing typed (typeMin 0) starts unlocked', () => {
    const form: RunnableTour = {
      def: { ...def, id: 'form', steps: [{ id: 'days', kind: 'type', target: 'f.days', typeMin: 0, title: 'Days', body: 'Check them.' }, def.steps[0]] },
      steps: [{ id: 'days', kind: 'type', target: 'f.days', typeMin: 0, title: 'Days', body: 'Check them.' }, def.steps[0]],
    }
    const started = reduce(IDLE, { t: 'START', tourId: 'form' }, { now: 0, tour: () => form })
    expect(started.state).toMatchObject({ i: 0, typed: true })
    const ready = reduce(started.state, { t: 'PLACED', ok: true }, { now: 0, tour: () => form })
    expect(reduce(ready.state, { t: 'NEXT' }, { now: 0, tour: () => form }).state).toMatchObject({ i: 1 })
  })

  it('Do it for me clicks and moves on, focuses a type field, and never runs a real action', () => {
    const click = reduce(at(1), { t: 'DO_IT' }, env())
    expect(click.effects[0]).toEqual({ e: 'doIt', target: 'nav.classes', kind: 'click' })
    expect(click.state).toMatchObject({ i: 2 })
    expect(reduce(at(4), { t: 'DO_IT' }, env())).toEqual({ state: at(4), effects: [{ e: 'doIt', target: 'msg.body', kind: 'type' }] })
    expect(reduce(at(5), { t: 'DO_IT' }, env())).toEqual({ state: at(5), effects: [] })
  })

  it('finishes after the last step', () => {
    const r = reduce(at(5), { t: 'ACTION_DONE' }, env())
    expect(r.state).toEqual({ phase: 'done', tourId: 'demo' })
    expect(r.effects).toContainEqual({ e: 'record', tourId: 'demo', event: 'completed', stepIndex: 5, stepId: 'send' })
    expect(reduce(r.state, { t: 'CLOSE' }, env()).state).toBe(IDLE)
  })

  it('Back re-enters the previous step, restoring its page', () => {
    const r = reduce(at(3), { t: 'BACK' }, env())
    expect(r.state).toMatchObject({ i: 2, sub: 'navigating' })
    expect(r.effects).toContainEqual({ e: 'navigate', route: 'home' })
    expect(reduce(at(0), { t: 'BACK' }, env()).state).toEqual(at(0))
  })

  it('a target that never shows becomes missing, and can be skipped', () => {
    const waiting = at(2, { sub: 'waiting', since: 100 })
    expect(reduce(waiting, { t: 'TICK' }, env(100 + MISSING_MS)).state).toEqual(waiting)
    const missing = reduce(waiting, { t: 'TICK' }, env(101 + MISSING_MS)).state
    expect(missing).toMatchObject({ sub: 'missing' })
    expect(reduce(missing, { t: 'PLACED', ok: true }, env()).state).toMatchObject({ sub: 'ready' })
    expect(reduce(missing, { t: 'SKIP_MISSING' }, env()).state).toMatchObject({ i: 3 })
  })

  it('navigating has its own, longer limit', () => {
    const nav = at(2, { sub: 'navigating', since: 0 })
    expect(reduce(nav, { t: 'TICK' }, env(MISSING_MS + 1)).state).toEqual(nav)
    expect(reduce(nav, { t: 'TICK' }, env(PLACE_TIMEOUT_MS + 1)).state).toMatchObject({ sub: 'missing' })
  })

  it('an optional step skips itself quietly', () => {
    const optional: TourDefinition = { ...def, steps: [def.steps[0], { ...def.steps[2], optional: true, where: undefined }, def.steps[0]].map((s, i) => ({ ...s, id: `s${i}` })) }
    const ort: RunnableTour = { def: optional, steps: optional.steps }
    const s: TourState = { phase: 'running', tourId: 'demo', i: 1, sub: 'waiting', since: 0, typed: false }
    const r = reduce(s, { t: 'TICK' }, { now: OPTIONAL_MS + 1, tour: () => ort })
    expect(r.state).toMatchObject({ i: 2 })
  })

  it('a target that disappears goes back to waiting', () => {
    expect(reduce(at(2), { t: 'PLACED', ok: false }, env(50)).state).toMatchObject({ sub: 'waiting', since: 50 })
  })

  it('pauses and resumes at the same step', () => {
    const paused = reduce(at(3), { t: 'PAUSE' }, env())
    expect(paused.state).toEqual({ phase: 'paused', tourId: 'demo', i: 3 })
    expect(paused.effects).toContainEqual(expect.objectContaining({ event: 'paused', stepIndex: 3 }))
    const resumed = reduce(paused.state, { t: 'RESUME' }, env())
    expect(resumed.state).toMatchObject({ phase: 'running', i: 3, sub: 'opening' })
    expect(resumed.effects).toContainEqual(expect.objectContaining({ event: 'resumed', stepIndex: 3 }))
  })

  it('START jumps in from anywhere, clamped to the tour', () => {
    const r = reduce({ phase: 'done', tourId: 'demo' }, { t: 'START', tourId: 'demo', from: 99 }, env())
    expect(r.state).toMatchObject({ phase: 'running', i: 5 })
    expect(r.effects).toContainEqual(expect.objectContaining({ event: 'started', stepIndex: 5 }))
    expect(reduce(IDLE, { t: 'START', tourId: 'nope' }, env()).state).toBe(IDLE)
  })

  it('STOP drops everything', () => {
    expect(reduce(at(3), { t: 'STOP' }, env())).toEqual({ state: IDLE, effects: [{ e: 'closeNav' }] })
    expect(reduce(IDLE, { t: 'STOP' }, env())).toEqual({ state: IDLE, effects: [] })
  })
})
