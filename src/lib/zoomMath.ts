// src/lib/zoomMath.ts
// Where a zoomed picture sits. The web's pointer handlers and the app's
// gestures share these sums, so a pinch behaves the same on both; the app runs
// them on its UI thread, which is what the 'worklet' lines are for (on the web
// they are plain strings that do nothing). Points are measured from the middle
// of the stage. Pure, so it is unit-tested (zoomMath.test.ts).

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

/** How far the picture is zoomed, and how far its middle has moved from the stage's. */
export interface ZoomView extends Point {
  scale: number
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 5
/** Where a double-tap (or a click) lands. */
export const TAP_ZOOM = 2.5
export const FIT_VIEW: ZoomView = { scale: 1, x: 0, y: 0 }

/** The picture's box before it is turned, so that once turned it fits the stage. Never larger than the file itself. */
export function fitSize(natural: Size, stage: Size, quarterTurns: number): Size {
  const sideways = quarterTurns % 2 !== 0
  const fit = Math.min(
    stage.width / (sideways ? natural.height : natural.width),
    stage.height / (sideways ? natural.width : natural.height),
    1,
  )
  return { width: natural.width * fit, height: natural.height * fit }
}

/** The room a box takes up on screen once turned. */
export function turnedSize(box: Size, quarterTurns: number): Size {
  return quarterTurns % 2 !== 0 ? { width: box.height, height: box.width } : box
}

const within = (value: number, min: number, max: number): number => {
  'worklet'
  // The + 0 turns a -0 (clamping a negative into no room at all) into a plain 0.
  return Math.min(max, Math.max(min, value)) + 0
}

/** Keeps the zoom in range and the picture covering the stage: no dragging it off into the dark. */
export function clampView(view: ZoomView, content: Size, stage: Size): ZoomView {
  'worklet'
  const scale = within(view.scale, MIN_ZOOM, MAX_ZOOM)
  const roomX = Math.max(0, (content.width * scale - stage.width) / 2)
  const roomY = Math.max(0, (content.height * scale - stage.height) / 2)
  return { scale, x: within(view.x, -roomX, roomX), y: within(view.y, -roomY, roomY) }
}

/** Zooms to `scale` with the spot under `at` staying where it is. */
export function zoomAt(view: ZoomView, scale: number, at: Point): ZoomView {
  'worklet'
  const next = within(scale, MIN_ZOOM, MAX_ZOOM)
  const ratio = next / view.scale
  return { scale: next, x: at.x - (at.x - view.x) * ratio, y: at.y - (at.y - view.y) * ratio }
}

/** A pinch in progress: what it started from, how much it has spread, and where the fingers have moved to. */
export function pinchView(start: ZoomView, startAt: Point, spread: number, at: Point): ZoomView {
  'worklet'
  const zoomed = zoomAt(start, start.scale * spread, startAt)
  return { scale: zoomed.scale, x: zoomed.x + at.x - startAt.x, y: zoomed.y + at.y - startAt.y }
}

/** A tap or click: in when fitted, back out when zoomed. */
export function toggleZoom(view: ZoomView, at: Point): ZoomView {
  'worklet'
  return view.scale > MIN_ZOOM ? FIT_VIEW : zoomAt(view, TAP_ZOOM, at)
}

/** Whether a point is on the picture rather than the dark around it. */
export function isOnContent(view: ZoomView, content: Size, at: Point): boolean {
  'worklet'
  return (
    Math.abs(at.x - view.x) <= (content.width * view.scale) / 2 &&
    Math.abs(at.y - view.y) <= (content.height * view.scale) / 2
  )
}
