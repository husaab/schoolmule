// src/lib/tours/queue.ts
// Which one tour (if any) gets the New card now. One at a time, never while
// What's New or a running tour has the screen, never in a "View as" preview.

import { isOfferable } from './eligibility'
import type { ProgressMap, TourCtx, TourDefinition } from './types'

const rank = (def: TourDefinition) => [
  def.offer.kind === 'welcome' ? 0 : 1, // welcome first
  -(def.offer.priority ?? 0), // then higher priority
  -(def.offer.from ? Date.parse(def.offer.from) : 0), // then the newest
]

const compare = (a: TourDefinition, b: TourDefinition) => {
  const [x, y] = [rank(a), rank(b)]
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]
  return a.id.localeCompare(b.id)
}

export function pickOffer(ctx: TourCtx, progress: ProgressMap, tours: TourDefinition[], tourActive: boolean): TourDefinition | null {
  if (tourActive || ctx.blocked || ctx.impersonating) return null
  const candidates = tours.filter(
    (def) => isOfferable(def, ctx, progress[def.id]) && (!def.offer.on || def.offer.on === ctx.here)
  )
  return candidates.sort(compare)[0] ?? null
}
