// src/components/tours/placeCallout.ts
// Where a step's bubble goes on the web. Beside the target when it fits,
// otherwise below or above it on the side facing the middle of the window.
//
// The bubble never reaches further toward the window's edge than its target
// does: next to a target in the lower half it grows upward from the target,
// in the upper half downward. A target someone can see brings its bubble
// with it, even when the bottom of the window is cut off (a short window, or
// another window over the browser).
import type { SpotRect } from './Spotlight'

export const GAP = 14
export const MARGIN = 12
export const PHONE_PX = 640
/** The arrow keeps this far from the bubble's corners. */
const ARROW_INSET = 18

export type Side = 'top' | 'bottom' | 'left' | 'right' | 'none'
type Beside = Exclude<Side, 'none'>

export interface Placement {
  x: number
  y: number
  side: Side
  /** The arrow's offset along the bubble's edge. */
  arrow: number
  /** A phone: a full-width card docked to the top or bottom. */
  sheet: boolean
}

export function placeCallout(
  rect: SpotRect | null,
  w: number,
  h: number,
  pref: 'auto' | Beside | undefined,
  vw: number,
  vh: number,
): Placement {
  const lower = !!rect && rect.top + rect.height / 2 > vh / 2
  if (vw < PHONE_PX) {
    return { x: MARGIN, y: lower ? MARGIN + 8 : vh - h - MARGIN, side: 'none', arrow: 0, sheet: true }
  }
  if (!rect) return { x: (vw - w) / 2, y: (vh - h) / 2, side: 'none', arrow: 0, sheet: false }

  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const fits: Record<Beside, boolean> = {
    right: rect.left + rect.width + GAP + w <= vw - MARGIN,
    bottom: rect.top + rect.height + GAP + h <= vh - MARGIN,
    top: rect.top - GAP - h >= MARGIN,
    left: rect.left - GAP - w >= MARGIN,
  }
  // Below a target in the top half, above one in the bottom half.
  const order: Beside[] = [
    ...(pref && pref !== 'auto' ? [pref] : []),
    'right',
    ...(lower ? (['top', 'bottom'] as const) : (['bottom', 'top'] as const)),
    'left',
  ]
  const side = order.find((s) => fits[s])
  const clampX = (x: number) => Math.max(MARGIN, Math.min(vw - w - MARGIN, x))
  const clampY = (y: number) => Math.max(MARGIN, Math.min(vh - h - MARGIN, y))
  const arrowAt = (offset: number, length: number) => Math.max(ARROW_INSET, Math.min(length - ARROW_INSET, offset))

  switch (side) {
    case 'right':
    case 'left': {
      // Centred on the target, then pulled back so it ends no further out than the target.
      const reach = Math.max(rect.height / 2, ARROW_INSET)
      const centred = clampY(cy - h / 2)
      const y = lower ? Math.max(MARGIN, Math.min(centred, cy + reach - h)) : Math.min(vh - h - MARGIN, Math.max(centred, cy - reach))
      const x = side === 'right' ? rect.left + rect.width + GAP : rect.left - GAP - w
      return { x, y, side, arrow: arrowAt(cy - y, h), sheet: false }
    }
    case 'bottom':
    case 'top': {
      const x = clampX(cx - w / 2)
      const y = side === 'bottom' ? rect.top + rect.height + GAP : rect.top - GAP - h
      return { x, y, side, arrow: arrowAt(cx - x, w), sheet: false }
    }
    default:
      // Nowhere beside it: dock on the far side of the window from the target.
      return { x: clampX(cx - w / 2), y: lower ? MARGIN : vh - h - MARGIN, side: 'none', arrow: 0, sheet: false }
  }
}
