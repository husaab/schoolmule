// src/lib/gradesLayout.ts
// How the Grades tab lays out (UX review E1, Option A): the tab uses the
// whole page width, scores are coloured by band, a category says in words
// what is waiting inside it, and each browser remembers compact or
// comfortable rows.

import type { ClassTab } from '@/lib/classroomRoutes'
import type { CategoryDot } from '@/lib/gridOverlay'

/** Tabs whose body drops the page's reading width and fills the screen. */
export const isFullWidthTab = (tab: ClassTab): boolean => tab === 'grades'

/** Text colour for a percentage: green 80+, dark 70–79, amber 60–69, rose below. */
export const scoreTone = (pct: number | null): string => {
  if (pct == null) return 'text-slate-400'
  if (pct >= 80) return 'text-emerald-700'
  if (pct >= 70) return 'text-slate-900'
  if (pct >= 60) return 'text-amber-700'
  return 'text-rose-700'
}

/** The words under a category score, replacing the old coloured dot. */
export const categoryFlag = (dot: CategoryDot): { text: string; className: string } | null => {
  if (dot === 'missing') return { text: 'Missing work', className: 'text-rose-700' }
  if (dot === 'waiting') return { text: 'To grade', className: 'text-cyan-700' }
  return null
}

export type GridDensity = 'comfortable' | 'compact'

type DensityStore = Pick<Storage, 'getItem' | 'setItem'> | null | undefined

const DENSITY_KEY = 'grades.density'

/** This browser's row density; comfortable when unset, unreadable or blocked. */
export const readGridDensity = (store: DensityStore): GridDensity => {
  try {
    return store?.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'comfortable'
  } catch {
    return 'comfortable'
  }
}

/** Remembers the density for this browser; a blocked storage is ignored. */
export const writeGridDensity = (store: DensityStore, density: GridDensity): void => {
  try {
    store?.setItem(DENSITY_KEY, density)
  } catch {
    // Private windows and blocked site data: the choice lasts this visit only.
  }
}
