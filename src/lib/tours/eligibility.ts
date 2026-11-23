// src/lib/tours/eligibility.ts
// Who a tour is for, whether to offer it now, and what the ? menu lists.

import { canAny } from '@/lib/permissions'
import { stepsFor } from './registry'
import type { ProgressMap, TourCtx, TourDefinition, TourProgress, TourStatus } from './types'

/**
 * Welcome tours are offered only to accounts created on or after this
 * moment (midnight in Toronto on the day the framework shipped). Everyone
 * older finds them in the ? menu instead.
 */
export const TOURS_LAUNCH_AT = '2026-11-22T05:00:00.000Z'

const before = (iso: string | undefined, now: Date) => !iso || Date.parse(iso) <= now.getTime()
const notAfter = (iso: string | undefined, now: Date) => !iso || now.getTime() <= Date.parse(iso)

/** The tour is for this person on this platform (dates and progress aside). */
export function isAudience(def: TourDefinition, ctx: TourCtx): boolean {
  const role = (ctx.user.role ?? '').toUpperCase()
  if (!def.audience.roles.some((r) => r.toUpperCase() === role)) return false
  if (def.audience.anyPermission?.length && !canAny(ctx.user, def.audience.anyPermission)) return false
  if (def.audience.schools?.length && !def.audience.schools.includes(ctx.user.school ?? '')) return false
  if (def.audience.when?.some((c) => !ctx.conditions?.includes(c))) return false
  return stepsFor(def, ctx.platform).length > 0
}

/** Progress that counts for this version of the tour (an older version's row doesn't). */
const current = (def: TourDefinition, progress: TourProgress | undefined) =>
  progress && progress.version >= def.version ? progress : undefined

/** Whether to show the New card for this tour right now. */
export function isOfferable(def: TourDefinition, ctx: TourCtx, progress: TourProgress | undefined): boolean {
  if (ctx.impersonating || !isAudience(def, ctx)) return false
  if (!before(def.offer.from, ctx.now) || !notAfter(def.offer.until, ctx.now)) return false
  if (def.offer.newAccountsOnly) {
    if (!ctx.userCreatedAt || Date.parse(ctx.userCreatedAt) < Date.parse(TOURS_LAUNCH_AT)) return false
  }
  // A feature tour is news only to people who had an account when it launched;
  // a newer account gets the welcome tour, and finds this one under ?.
  if (def.offer.kind === 'feature' && def.offer.from && ctx.userCreatedAt) {
    if (Date.parse(ctx.userCreatedAt) >= Date.parse(def.offer.from)) return false
  }
  const row = current(def, progress)
  if (!row) return true
  if (row.status !== 'offered') return false // in progress, finished or dismissed: the ? menu has it
  return !row.snoozedUntil || Date.parse(row.snoozedUntil) <= ctx.now.getTime()
}

export type MenuStatus = 'new' | 'in_progress' | 'done'

export interface MenuEntry {
  def: TourDefinition
  status: MenuStatus
  /** Where Resume picks up (in_progress only). */
  stepIndex: number
  stepCount: number
}

const menuStatus = (status: TourStatus | undefined): MenuStatus =>
  status === 'in_progress' ? 'in_progress' : status === 'completed' ? 'done' : 'new'

/**
 * The ? menu: every tour for this person that has started being offered,
 * whatever its end date or the new-accounts rule, so a finished tour can be
 * replayed and a welcome tour found by anyone. Unfinished first.
 */
export function listForMenu(ctx: TourCtx, progress: ProgressMap, tours: TourDefinition[]): MenuEntry[] {
  if (ctx.impersonating) return []
  const order: Record<MenuStatus, number> = { in_progress: 0, new: 1, done: 2 }
  return tours
    .filter((def) => isAudience(def, ctx) && before(def.offer.from, ctx.now))
    .map((def) => {
      const row = current(def, progress[def.id])
      const steps = stepsFor(def, ctx.platform)
      // Resume at the same step by id: the web and the app number their steps differently.
      const byId = row?.stepId ? steps.findIndex((s) => s.id === row.stepId) : -1
      return {
        def,
        status: menuStatus(row?.status),
        stepIndex: byId >= 0 ? byId : Math.min(row?.stepIndex ?? 0, steps.length - 1),
        stepCount: steps.length,
      }
    })
    .sort((a, b) => order[a.status] - order[b.status] || (a.def.offer.kind === 'welcome' ? -1 : 0) - (b.def.offer.kind === 'welcome' ? -1 : 0))
}
