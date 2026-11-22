// src/lib/tours/machine.ts
// The tour state machine: reduce(state, action, env) → { state, effects }.
// Pure: no DOM, no React Native, no clock (env.now). The host (web
// components/tours/TourHost, app components/tours/TourHost) feeds it actions
// and carries out the effects: navigate, open the nav or a dialog, look for
// the target, click it, and record progress.
//
// A running step moves through
//   navigating → opening → waiting → ready
// skipping what it doesn't need. The host reports ARRIVED when it has reached
// the step's page or opened its surface, and PLACED when the target is (or is
// no longer) on screen. A target that never shows becomes `missing`, which
// offers "Skip this step"; an optional step skips itself.

import type { RouteName, RunnableTour, Step, TargetName, TourEvent, TourId } from './types'

/** How long a step waits for its target once on the right page. */
export const MISSING_MS = 4000
/** An optional step (a tab only phones have) gives up sooner, quietly. */
export const OPTIONAL_MS = 1200
/** How long navigating or opening a dialog may take before the step counts as missing. */
export const PLACE_TIMEOUT_MS = 10000

export type RunSub = 'navigating' | 'opening' | 'waiting' | 'ready' | 'missing'

export type TourState =
  | { phase: 'idle' }
  | { phase: 'offer'; tourId: TourId }
  | { phase: 'running'; tourId: TourId; i: number; sub: RunSub; since: number; typed: boolean }
  | { phase: 'paused'; tourId: TourId; i: number }
  | { phase: 'done'; tourId: TourId }

export type TourAction =
  | { t: 'OFFER'; tourId: TourId }
  | { t: 'ACCEPT' }
  | { t: 'LATER' }
  | { t: 'NEVER' }
  | { t: 'START'; tourId: TourId; from?: number }
  | { t: 'NEXT' }
  | { t: 'BACK' }
  | { t: 'PAUSE' }
  | { t: 'RESUME' }
  /** The host reached the step's page, or opened its nav/surface. */
  | { t: 'ARRIVED' }
  /** The target is (ok) or is no longer (!ok) on screen. */
  | { t: 'PLACED'; ok: boolean }
  /** The person clicked the target for real, or typed enough. */
  | { t: 'ACTION_DONE' }
  /** "Do it for me". */
  | { t: 'DO_IT' }
  | { t: 'TICK' }
  | { t: 'SKIP_MISSING' }
  /** Close the finished card. */
  | { t: 'CLOSE' }
  /** Drop everything (sign-out, a "View as" preview starting). */
  | { t: 'STOP' }

export type TourEffect =
  | { e: 'navigate'; route: RouteName }
  | { e: 'openNav' }
  | { e: 'closeNav' }
  | { e: 'openSurface'; surface: string; opener: TargetName }
  | { e: 'resolve'; target: TargetName }
  | { e: 'doIt'; target: TargetName; kind: 'click' | 'type' }
  | { e: 'record'; tourId: TourId; event: TourEvent; stepIndex: number | null; stepId: string | null }

export interface MachineEnv {
  now: number
  tour: (id: TourId) => RunnableTour | undefined
}

export interface Result {
  state: TourState
  effects: TourEffect[]
}

export const IDLE: TourState = { phase: 'idle' }

type Running = Extract<TourState, { phase: 'running' }>

const record = (tourId: TourId, event: TourEvent, i: number | null, step?: Step): TourEffect => ({
  e: 'record',
  tourId,
  event,
  stepIndex: i,
  stepId: step?.id ?? null,
})

const same = (state: TourState): Result => ({ state, effects: [] })

/** Look for the target, or show a centred card at once when there is none. */
function look(base: Running, step: Step, effects: TourEffect[]): Result {
  if (!step.target) return { state: { ...base, sub: 'ready' }, effects }
  return { state: { ...base, sub: 'waiting' }, effects: [...effects, { e: 'resolve', target: step.target }] }
}

/** Open the nav and/or the step's dialog, then look. */
function open(rt: RunnableTour, base: Running, step: Step, effects: TourEffect[]): Result {
  const opening: TourEffect[] = []
  if (step.where?.nav) opening.push({ e: 'openNav' })
  const surface = step.where?.surface
  if (surface) opening.push({ e: 'openSurface', surface, opener: rt.def.surfaces![surface].openTarget })
  if (opening.length) return { state: { ...base, sub: 'opening' }, effects: [...effects, ...opening] }
  return look(base, step, effects)
}

/** Start step i: go to its page first, then open what it needs, then look. */
function enter(rt: RunnableTour, i: number, now: number, lead: TourEffect[]): Result {
  const at = Math.max(0, Math.min(i, rt.steps.length - 1))
  const step = rt.steps[at]
  const base: Running = { phase: 'running', tourId: rt.def.id, i: at, sub: 'waiting', since: now, typed: false }
  const effects = [...lead]
  if (!step.where?.nav) effects.push({ e: 'closeNav' })
  if (step.where?.route) {
    return { state: { ...base, sub: 'navigating' }, effects: [...effects, { e: 'navigate', route: step.where.route }] }
  }
  return open(rt, base, step, effects)
}

/** On to the next step, or finish after the last. */
function advance(rt: RunnableTour, s: Running, now: number, lead: TourEffect[] = []): Result {
  const nextI = s.i + 1
  if (nextI >= rt.steps.length) {
    return {
      state: { phase: 'done', tourId: s.tourId },
      effects: [...lead, { e: 'closeNav' }, record(s.tourId, 'completed', s.i, rt.steps[s.i])],
    }
  }
  return enter(rt, nextI, now, [...lead, record(s.tourId, 'step', nextI, rt.steps[nextI])])
}

const waitLimit = (step: Step) => (step.optional ? OPTIONAL_MS : MISSING_MS)

export function reduce(state: TourState, action: TourAction, env: MachineEnv): Result {
  const { now } = env

  if (action.t === 'STOP') return { state: IDLE, effects: state.phase === 'idle' ? [] : [{ e: 'closeNav' }] }

  if (action.t === 'START') {
    const rt = env.tour(action.tourId)
    if (!rt || !rt.steps.length) return same(state)
    const from = Math.max(0, Math.min(action.from ?? 0, rt.steps.length - 1))
    return enter(rt, from, now, [record(rt.def.id, 'started', from, rt.steps[from])])
  }

  switch (state.phase) {
    case 'idle': {
      if (action.t !== 'OFFER' || !env.tour(action.tourId)) return same(state)
      return { state: { phase: 'offer', tourId: action.tourId }, effects: [record(action.tourId, 'offered', null)] }
    }

    case 'offer': {
      const rt = env.tour(state.tourId)
      if (!rt) return { state: IDLE, effects: [] }
      if (action.t === 'ACCEPT') return enter(rt, 0, now, [record(state.tourId, 'started', 0, rt.steps[0])])
      if (action.t === 'LATER') return { state: IDLE, effects: [record(state.tourId, 'snoozed', null)] }
      if (action.t === 'NEVER') return { state: IDLE, effects: [record(state.tourId, 'dismissed', null)] }
      return same(state)
    }

    case 'paused': {
      const rt = env.tour(state.tourId)
      if (!rt) return { state: IDLE, effects: [] }
      if (action.t === 'RESUME') return enter(rt, state.i, now, [record(state.tourId, 'resumed', state.i, rt.steps[state.i])])
      return same(state)
    }

    case 'done':
      return action.t === 'CLOSE' ? { state: IDLE, effects: [] } : same(state)

    case 'running': {
      const rt = env.tour(state.tourId)
      if (!rt) return { state: IDLE, effects: [{ e: 'closeNav' }] }
      const step = rt.steps[state.i]

      switch (action.t) {
        case 'ARRIVED':
          if (state.sub === 'navigating') return open(rt, { ...state, since: now }, step, [])
          if (state.sub === 'opening') return look({ ...state, since: now }, step, [])
          return same(state)

        case 'PLACED':
          if (action.ok && (state.sub === 'waiting' || state.sub === 'missing')) return same({ ...state, sub: 'ready' })
          if (!action.ok && state.sub === 'ready') return same({ ...state, sub: 'waiting', since: now })
          return same(state)

        case 'TICK': {
          const waited = now - state.since
          const placing = state.sub === 'navigating' || state.sub === 'opening'
          const late = placing ? waited > PLACE_TIMEOUT_MS : state.sub === 'waiting' && waited > waitLimit(step)
          if (!late) return same(state)
          return step.optional ? advance(rt, state, now) : same({ ...state, sub: 'missing' })
        }

        case 'NEXT':
          if (state.sub === 'missing') return advance(rt, state, now)
          if (state.sub !== 'ready' || step.kind === 'click') return same(state)
          if (step.kind === 'type' && !state.typed) return same(state)
          return advance(rt, state, now)

        case 'SKIP_MISSING':
          return state.sub === 'missing' ? advance(rt, state, now) : same(state)

        case 'BACK':
          if (state.i === 0) return same(state)
          return enter(rt, state.i - 1, now, [record(state.tourId, 'step', state.i - 1, rt.steps[state.i - 1])])

        case 'ACTION_DONE':
          if (state.sub !== 'ready' && state.sub !== 'waiting') return same(state)
          if (step.kind === 'click') return advance(rt, state, now)
          if (step.kind === 'type') return same({ ...state, typed: true })
          return same(state)

        case 'DO_IT':
          if (state.sub !== 'ready' || !step.target || step.realAction) return same(state)
          if (step.kind === 'click') return advance(rt, state, now, [{ e: 'doIt', target: step.target, kind: 'click' }])
          if (step.kind === 'type') return { state, effects: [{ e: 'doIt', target: step.target, kind: 'type' }] }
          return same(state)

        case 'PAUSE':
          return {
            state: { phase: 'paused', tourId: state.tourId, i: state.i },
            effects: [{ e: 'closeNav' }, record(state.tourId, 'paused', state.i, step)],
          }

        default:
          return same(state)
      }
    }
  }
}

/** The tour the state is about, if any. */
export const tourIdOf = (state: TourState): TourId | null => (state.phase === 'idle' ? null : state.tourId)

/** A card, a running step or the finished card is on screen (a paused tour isn't). */
export const isOnScreen = (state: TourState) => state.phase === 'offer' || state.phase === 'running' || state.phase === 'done'
