// src/lib/tours/types.ts
// Guided tours: the shapes every tour, host and test share. Tours are plain
// data (no functions, no DOM), so the same file runs on the web and in the
// app (copied with src/lib). See catalog/ for the tours themselves.

import type { AccessUser, Permission } from '@/lib/permissions'

export type TourId = string
/** A `data-tour="…"` name on the web, a `<TourTarget id="…">` in the app. */
export type TargetName = string
export type TourPlatform = 'web' | 'app'

/**
 * A page, by name rather than by URL: the web and the app route differently,
 * so each host maps a name to its own path (components/tours/tourRoutes).
 */
export type RouteName = 'home'

export interface Audience {
  /** Active views that see the tour (uppercase, as the session spells them). */
  roles: string[]
  /** At least one of these permission keys (lib/permissions canAny). Staff views only. */
  anyPermission?: Permission[]
  /** Limit to these schools (the school enum value). */
  schools?: string[]
}

export interface Offer {
  /** Welcome tours are offered before any feature tour. */
  kind: 'welcome' | 'feature'
  /** ISO date the tour starts being offered (feature tours). */
  from?: string
  /** ISO date after which it is no longer offered (still listed in the ? menu). */
  until?: string
  /** Offer only to accounts created on or after TOURS_LAUNCH_AT. */
  newAccountsOnly?: boolean
  /** The New card's heading and sentence. */
  title: string
  blurb: string
  /** Higher wins among feature tours offered at the same time. */
  priority?: number
  /** Offer it only on this page. Anywhere when absent. */
  on?: RouteName
}

export type StepKind = 'look' | 'click' | 'type'

/** Where a step happens. The host gets there before it looks for the target. */
export interface Where {
  route?: RouteName
  /** A named dialog/sheet/menu (TourDefinition.surfaces) that must be open. */
  surface?: string
  /** The target lives in the main navigation: open the drawer on a phone. */
  nav?: 'sidebar'
}

export interface Step {
  /** Stable id: saved with progress events, so steps can be reordered. */
  id: string
  kind: StepKind
  /** null = a centred card that points at nothing. */
  target: TargetName | null
  title: string
  body: string
  where?: Where
  /** Sends, publishes or books something for real: hides "Do it for me". */
  realAction?: boolean
  /** Type steps: characters needed before Next unlocks. Default 3. */
  typeMin?: number
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right'
  /** Only on these platforms (welcome tours point at different nav on each). */
  platforms?: TourPlatform[]
  /** Skip quietly when the target isn't on screen (e.g. a tab only phones have). */
  optional?: boolean
}

/** "Click this target to open the surface." Declarative: no functions in tours. */
export interface SurfaceOpener {
  openTarget: TargetName
}

export interface TourDefinition {
  /** Matches /^[a-z0-9-]{1,64}$/ (the server checks the same). */
  id: TourId
  /** Bump to offer the tour again to people who finished or dismissed it. */
  version: number
  audience: Audience
  offer: Offer
  surfaces?: Record<string, SurfaceOpener>
  steps: Step[]
}

/** Who is looking, and what is around them. Built by each host. */
export interface TourCtx {
  now: Date
  platform: TourPlatform
  user: AccessUser & { school?: string | null }
  /** users.created_at, from GET /api/tours/progress. */
  userCreatedAt: string | null
  /** An admin's "View as" preview: never offer, never write. */
  impersonating: boolean
  /** Something else has the screen (What's New is open or about to open). */
  blocked: boolean
  /** The page the person is on, when it has a tour route name. */
  here: RouteName | null
}

export type TourStatus = 'offered' | 'in_progress' | 'completed' | 'dismissed'

/** One row of user_tour_progress, as the API returns it. */
export interface TourProgress {
  tourId: TourId
  version: number
  status: TourStatus
  stepIndex: number
  /** The step's id: the web and the app show different steps, so resuming on the other goes by it. */
  stepId?: string | null
  snoozedUntil: string | null
  completedAt: string | null
  updatedAt?: string
}

export type ProgressMap = Readonly<Record<TourId, TourProgress | undefined>>

export type TourEvent = 'offered' | 'started' | 'step' | 'paused' | 'resumed' | 'completed' | 'dismissed' | 'snoozed'

/** A tour as one platform runs it: only its steps. */
export interface RunnableTour {
  def: TourDefinition
  steps: Step[]
}
