// src/store/useTourStore.ts
// The running guided tour and everyone's progress. dispatch() runs the shared
// state machine (lib/tours/machine); `record` effects are saved here (shown
// at once, then sent to the server in order), and every other effect goes to
// the platform's host (setRunner), which navigates, opens things and finds
// targets. Copied to the app, where TOUR_PLATFORM is 'app'.
import { create } from 'zustand'
import { applyEvent, getTour, IDLE, reduce, runnable } from '@/lib/tours'
import type { TourAction, TourEffect, TourPlatform, TourProgress, TourState } from '@/lib/tours'
import { getTourProgress, postTourEvent } from '@/services/tourService'

export const TOUR_PLATFORM: TourPlatform = 'web'

/** Carries out a non-record effect (the host's job). */
export type TourRunner = (effect: TourEffect) => void

type TourStore = {
  /** Progress came back from the server: only then is anything offered. */
  loaded: boolean
  progress: Record<string, TourProgress>
  /** users.created_at, for "new accounts only". */
  createdAt: string | null
  /** serverNow − Date.now(), so a wrong device clock can't break Later or a tour's dates. */
  skewMs: number
  state: TourState
  /** A New card has been shown since sign-in (or since the page loaded): no second one this visit. */
  offeredThisVisit: boolean
  now: () => number
  load: () => Promise<void>
  dispatch: (action: TourAction) => void
  setRunner: (runner: TourRunner | null) => void
  /** Sign-out or a "View as" preview: forget everything. */
  reset: () => void
}

let runner: TourRunner | null = null
// Actions dispatched while one is being handled (a host answering an effect
// at once) wait their turn, so effects always run in the order produced.
const pending: TourAction[] = []
let busy = false
// Event writes go out one at a time, in order: "started" before "step".
let writes: Promise<unknown> = Promise.resolve()
// Bumped by reset(), so a write that lands after sign-out is ignored.
let epoch = 0

export const useTourStore = create<TourStore>((set, get) => {
  const save = (effect: Extract<TourEffect, { e: 'record' }>) => {
    const def = getTour(effect.tourId)
    if (!def) return
    const version = def.version
    const input = { event: effect.event, version, stepIndex: effect.stepIndex, stepId: effect.stepId }
    set((s) => ({
      progress: { ...s.progress, [effect.tourId]: applyEvent(effect.tourId, s.progress[effect.tourId], input, new Date(s.now())) },
    }))
    const mine = epoch
    writes = writes
      // Still queued when they signed out or switched account: never send it as the next person.
      .then(() => (mine === epoch ? postTourEvent(effect.tourId, { ...input, platform: TOUR_PLATFORM }) : null))
      .then((res) => {
        if (mine === epoch && res?.data) set((s) => ({ progress: { ...s.progress, [effect.tourId]: res.data } }))
      })
      .catch(() => {
        // Offline or refused: the change stays on this screen; the server's
        // copy catches up on the next event or load.
      })
  }

  const handle = (action: TourAction) => {
    const { state } = get()
    const result = reduce(state, action, { now: get().now(), tour: (id) => runnable(id, TOUR_PLATFORM) })
    if (result.state !== state) set({ state: result.state, ...(result.state.phase === 'offer' ? { offeredThisVisit: true } : {}) })
    for (const effect of result.effects) {
      if (effect.e === 'record') save(effect)
      else runner?.(effect)
    }
  }

  return {
    loaded: false,
    progress: {},
    createdAt: null,
    skewMs: 0,
    state: IDLE,
    offeredThisVisit: false,
    now: () => Date.now() + get().skewMs,

    load: async () => {
      const mine = epoch
      try {
        const res = await getTourProgress()
        if (mine !== epoch) return
        const progress: Record<string, TourProgress> = {}
        for (const row of res.data.progress) progress[row.tourId] = row
        const serverNow = Date.parse(res.data.serverNow)
        set({
          loaded: true,
          progress,
          createdAt: res.data.createdAt,
          skewMs: Number.isNaN(serverNow) ? 0 : serverNow - Date.now(),
        })
      } catch {
        // Not loaded: nothing is offered, the ? menu still works.
      }
    },

    dispatch: (action) => {
      pending.push(action)
      if (busy) return
      busy = true
      try {
        while (pending.length) handle(pending.shift()!)
      } finally {
        busy = false
      }
    },

    setRunner: (next) => {
      runner = next
    },

    reset: () => {
      epoch += 1
      pending.length = 0
      set({ loaded: false, progress: {}, createdAt: null, skewMs: 0, state: IDLE, offeredThisVisit: false })
    },
  }
})
