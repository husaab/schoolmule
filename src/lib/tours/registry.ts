// src/lib/tours/registry.ts
// Every tour, by id. A tour file registers itself when catalog/index.ts
// imports it (defineTour → registerTour); nothing is discovered at runtime.

import type { RunnableTour, TargetName, TourDefinition, TourId, TourPlatform } from './types'

const tours = new Map<TourId, TourDefinition>()

/** Called by defineTour. Re-registering an id replaces it (hot reload); the catalog test catches real duplicates. */
export function registerTour(def: TourDefinition): void {
  tours.set(def.id, def)
}

export const allTours = (): TourDefinition[] => [...tours.values()]

export const getTour = (id: TourId): TourDefinition | undefined => tours.get(id)

/** The steps this platform runs. */
export const stepsFor = (def: TourDefinition, platform: TourPlatform) =>
  def.steps.filter((s) => !s.platforms || s.platforms.includes(platform))

export const runnable = (id: TourId, platform: TourPlatform): RunnableTour | undefined => {
  const def = tours.get(id)
  return def ? { def, steps: stepsFor(def, platform) } : undefined
}

/** Every element a tour can point at or click open, on one platform. */
export function tourTargets(def: TourDefinition, platform: TourPlatform): TargetName[] {
  const names = new Set<TargetName>()
  for (const step of stepsFor(def, platform)) {
    if (step.target) names.add(step.target)
    const surface = step.where?.surface
    if (surface && def.surfaces?.[surface]) names.add(def.surfaces[surface].openTarget)
  }
  return [...names]
}

export const allTargetNames = (platform: TourPlatform): TargetName[] =>
  [...new Set(allTours().flatMap((t) => tourTargets(t, platform)))].sort()
