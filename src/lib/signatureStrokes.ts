// src/lib/signatureStrokes.ts
// A drawn signature as strokes of points, shared by the web pad (canvas) and
// the app's pad (react-native-svg). The server draws the image from these
// numbers itself (backend services/profile/signatures.js), so both platforms
// print the same signature. Pure: copied verbatim into the app.

export type Point = [number, number]
export type Stroke = Point[]

/** What PUT /profile/signature takes: the strokes in the pad's own units. */
export interface SignatureDrawing {
  width: number
  height: number
  strokes: Stroke[]
}

/** The pad is three times as wide as it is tall. */
export const SIGNATURE_ASPECT = 3
/** Below this much ink (in pad units, a share of the pad's width) Save stays off. */
const MIN_INK_SHARE = 0.05
/** The server's limits are higher; staying under them keeps the body small. */
export const MAX_STROKES = 200
export const MAX_POINTS = 4000
/** Points closer than this (pad units) to the last one add nothing. */
const MIN_STEP = 1

const round = (n: number) => Math.round(n * 10) / 10
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** The pad's size for a container this wide (keeps the 3:1 shape). */
export function padSize(containerWidth: number): { width: number; height: number } {
  const width = Math.max(150, Math.floor(containerWidth))
  return { width, height: Math.round(width / SIGNATURE_ASPECT) }
}

/** Starts a new stroke at `p` (a pen/finger/mouse went down). */
export function startStroke(strokes: Stroke[], p: Point): Stroke[] {
  if (strokes.length >= MAX_STROKES) return strokes
  return [...strokes, [[round(p[0]), round(p[1])]]]
}

/** Adds `p` to the last stroke, skipping a point that barely moved. */
export function extendStroke(strokes: Stroke[], p: Point): Stroke[] {
  const last = strokes[strokes.length - 1]
  if (!last || pointCount(strokes) >= MAX_POINTS) return strokes
  const prev = last[last.length - 1]
  if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) < MIN_STEP) return strokes
  return [...strokes.slice(0, -1), [...last, [round(p[0]), round(p[1])]]]
}

/** Removes the last stroke. */
export const undoStroke = (strokes: Stroke[]): Stroke[] => strokes.slice(0, -1)

export const pointCount = (strokes: Stroke[]) => strokes.reduce((n, s) => n + s.length, 0)

/** Total length of the strokes, in pad units. */
export function inkLength(strokes: Stroke[]): number {
  let length = 0
  for (const s of strokes) {
    for (let i = 1; i < s.length; i += 1) length += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1])
  }
  return length
}

/** Is there enough ink to save (a dot or a scratch isn't a signature)? */
export const hasEnoughInk = (strokes: Stroke[], width: number) => inkLength(strokes) >= Math.max(width, 1) * MIN_INK_SHARE

/** An SVG path for the strokes (the app's pad and previews draw it; a tap is a dot). */
export function strokesPath(strokes: Stroke[]): string {
  return strokes
    .filter((s) => s.length > 0)
    .map((s) => {
      const [[x, y], ...rest] = s
      const tail = rest.length ? rest.map(([px, py]) => `L${px} ${py}`).join('') : 'l0.1 0'
      return `M${x} ${y}${tail}`
    })
    .join('')
}

/** The pen width for a pad this wide (the server draws with the same rule). */
export const penWidth = (width: number, height: number) => Math.max(Math.max(width, height) / 220, 1.2)

/**
 * The drawing to send: points kept inside the pad, rounded to a tenth.
 * Null when there isn't enough ink yet.
 */
export function toDrawing(strokes: Stroke[], width: number, height: number): SignatureDrawing | null {
  const kept = strokes
    .filter((s) => s.length > 0)
    .map((s) => s.map(([x, y]): Point => [round(clamp(x, 0, width)), round(clamp(y, 0, height))]))
  if (!hasEnoughInk(kept, width)) return null
  return { width: round(width), height: round(height), strokes: kept }
}
