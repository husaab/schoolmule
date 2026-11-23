// src/lib/tours/defineTour.ts
// How a tour file declares its tour: checks it, freezes it and registers it,
// so a broken tour fails the moment its file loads (and in the catalog test),
// never halfway through someone's walkthrough.

import { registerTour } from './registry'
import type { TourDefinition } from './types'

export const TOUR_ID_PATTERN = /^[a-z0-9-]{1,64}$/

/** Every problem with a tour, as sentences. Empty when it is fine. */
export function tourProblems(def: TourDefinition): string[] {
  const problems: string[] = []
  if (!TOUR_ID_PATTERN.test(def.id)) problems.push(`id "${def.id}" must be lowercase letters, digits and dashes`)
  if (!Number.isInteger(def.version) || def.version < 1) problems.push('version must be a whole number from 1')
  if (!def.audience.roles.length) problems.push('audience.roles is empty')
  if (!def.offer.title.trim() || !def.offer.blurb.trim()) problems.push('the offer needs a title and a blurb')
  if (def.offer.kind === 'feature' && !def.offer.from) problems.push('a feature tour needs offer.from, the day the feature launched')
  if (def.offer.from && Number.isNaN(Date.parse(def.offer.from))) problems.push('offer.from is not a date')
  if (def.offer.until && Number.isNaN(Date.parse(def.offer.until))) problems.push('offer.until is not a date')
  if (!def.steps.length) problems.push('a tour needs at least one step')

  const ids = new Set<string>()
  def.steps.forEach((step, i) => {
    const at = `step ${i + 1} ("${step.id}")`
    if (!step.id || ids.has(step.id)) problems.push(`${at}: step ids must be present and unique`)
    ids.add(step.id)
    if (!step.title.trim() || !step.body.trim()) problems.push(`${at}: needs a title and a body`)
    if ((step.kind === 'click' || step.kind === 'type') && !step.target) problems.push(`${at}: a ${step.kind} step needs a target`)
    if (step.kind === 'type' && step.realAction) problems.push(`${at}: a type step can't be a real action`)
    const surface = step.where?.surface
    if (surface && !def.surfaces?.[surface]) problems.push(`${at}: surface "${surface}" isn't declared in surfaces`)
    if (step.platforms && !step.platforms.length) problems.push(`${at}: platforms is empty`)
  })
  return problems
}

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value)) deepFreeze(v)
  }
  return value
}

export function defineTour(def: TourDefinition): TourDefinition {
  const problems = tourProblems(def)
  if (problems.length) throw new Error(`Tour "${def.id}" is broken:\n- ${problems.join('\n- ')}`)
  const frozen = deepFreeze(def)
  registerTour(frozen)
  return frozen
}
