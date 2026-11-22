// Guided tours: the shared core. Web and app hosts import from here; the
// catalog import registers every tour.
import './catalog'

export * from './types'
export { defineTour, tourProblems, TOUR_ID_PATTERN } from './defineTour'
export { allTours, getTour, runnable, stepsFor, tourTargets, allTargetNames } from './registry'
export { isAudience, isOfferable, listForMenu, TOURS_LAUNCH_AT, type MenuEntry, type MenuStatus } from './eligibility'
export { pickOffer } from './queue'
export { applyEvent, SNOOZE_DAYS } from './progress'
export {
  reduce,
  IDLE,
  tourIdOf,
  isOnScreen,
  MISSING_MS,
  OPTIONAL_MS,
  PLACE_TIMEOUT_MS,
  type TourState,
  type TourAction,
  type TourEffect,
  type RunSub,
  type MachineEnv,
} from './machine'
