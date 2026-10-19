// src/lib/imageDownscale.ts
// Phone photos are 4000 px and several MB. Before a picture goes up it is
// redrawn on a canvas, no longer than 2000 px on its long edge, as a JPEG at
// 85 % quality: the reader sees a sharp page and the upload is quick on school
// wifi. Anything a canvas cannot or should not redraw (GIFs, HEIC, PDFs, Word
// files, a picture the browser cannot decode) is returned untouched, and so is
// a redraw that came out bigger than the original.
//
// Options for the other upload points (src/lib/uploadPrep.ts presets):
//   - keepPng: a PNG stays a PNG (screenshots, diagrams and logos keep crisp
//     text and their see-through parts). It is only redrawn when it is too big
//     (longer than maxEdge, or heavier than maxBytes), never just re-encoded.
//   - maxBytes: a redraw (or a PNG kept as a PNG) still heavier than this is
//     drawn again as a JPEG, so a size limit after the resize can be met.
//   - decodeAny: also try HEIC/HEIF (Safari decodes them), as a JPEG. Off by
//     default: an upload point that takes HEIC as it is keeps it untouched.
//
// The fitting, the naming and the plan are pure and unit-tested
// (imageDownscale.test.ts); the canvas part needs a browser.

export const DEFAULT_MAX_EDGE = 2000
export const DEFAULT_QUALITY = 0.85

export interface DownscaleOptions {
  /** The longest edge, in pixels. */
  maxEdge?: number
  /** JPEG quality, 0 to 1. */
  quality?: number
  /** Keep a PNG a PNG, redrawn only when it is too big (see above). */
  keepPng?: boolean
  /** A result heavier than this is drawn again as a JPEG. */
  maxBytes?: number
  /** Also decode HEIC/HEIF where the browser can, as a JPEG. */
  decodeAny?: boolean
}

const REDRAWABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const REDRAWABLE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const HEIC_TYPES = ['image/heic', 'image/heif']
const HEIC_EXTENSIONS = ['.heic', '.heif']

const extensionOf = (name: string): string => {
  const m = /\.[a-z0-9]+$/i.exec(name)
  return m ? m[0].toLowerCase() : ''
}

/** Whether a canvas should redraw this file: JPEG, PNG or WebP. GIFs would lose their motion; HEIC and the rest are not pictures a canvas reads. */
export function isDownscalable(file: Pick<File, 'name' | 'type'>): boolean {
  const type = (file.type || '').toLowerCase()
  if (type) return REDRAWABLE_TYPES.includes(type)
  return REDRAWABLE_EXTENSIONS.includes(extensionOf(file.name))
}

/** A HEIC/HEIF photo (an iPhone's own format). */
export function isHeic(file: Pick<File, 'name' | 'type'>): boolean {
  const type = (file.type || '').toLowerCase()
  if (type) return HEIC_TYPES.includes(type)
  return HEIC_EXTENSIONS.includes(extensionOf(file.name))
}

const isPng = (file: Pick<File, 'name' | 'type'>): boolean => {
  const type = (file.type || '').toLowerCase()
  return type ? type === 'image/png' : extensionOf(file.name) === '.png'
}

/** The size a picture is drawn at: its long edge cut to `maxEdge`, the shape kept. */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number; scaled: boolean } {
  const longEdge = Math.max(width, height)
  if (longEdge <= maxEdge) return { width, height, scaled: false }
  const ratio = maxEdge / longEdge
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)), scaled: true }
}

/** "plant-cell.png" → "plant-cell.jpg". */
export function downscaledName(name: string): string {
  const stem = name.replace(/\.[a-z0-9]+$/i, '')
  return `${stem || 'photo'}.jpg`
}

/** Whether this file is one the options let a canvas redraw at all. */
export function canRedraw(file: Pick<File, 'name' | 'type'>, opts: Pick<DownscaleOptions, 'decodeAny'> = {}): boolean {
  return isDownscalable(file) || (Boolean(opts.decodeAny) && isHeic(file))
}

export interface RedrawPlan {
  width: number
  height: number
  type: 'image/jpeg' | 'image/png'
  /** Keep the original when the redraw comes out no smaller. */
  onlyIfSmaller: boolean
}

/**
 * How a decoded picture is redrawn, or null to upload it as it is. Pure.
 *   - A PNG with keepPng: only when it is bigger than maxEdge or heavier than
 *     maxBytes, and as a PNG.
 *   - HEIC (decodeAny): always, as a JPEG (the upload point can't take HEIC).
 *   - Anything else: as a JPEG, shrunk to maxEdge; one that already fits is
 *     kept unless the JPEG is smaller.
 */
export function planRedraw(
  file: Pick<File, 'name' | 'type' | 'size'>,
  width: number,
  height: number,
  { maxEdge = DEFAULT_MAX_EDGE, keepPng = false, maxBytes }: DownscaleOptions = {},
): RedrawPlan | null {
  const fit = fitWithin(width, height, maxEdge)
  const tooHeavy = maxBytes !== undefined && file.size > maxBytes
  if (keepPng && isPng(file)) {
    if (!fit.scaled && !tooHeavy) return null
    return { width: fit.width, height: fit.height, type: 'image/png', onlyIfSmaller: !fit.scaled }
  }
  if (isHeic(file)) return { width: fit.width, height: fit.height, type: 'image/jpeg', onlyIfSmaller: false }
  return { width: fit.width, height: fit.height, type: 'image/jpeg', onlyIfSmaller: !fit.scaled && !tooHeavy }
}

/** The picture as pixels, upright as the camera held it. Null when this browser cannot decode it. */
export async function decodeImage(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void } | null> {
  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
    }
  } catch {
    // Fall through to an <img> element.
  }
  if (typeof document === 'undefined' || typeof URL === 'undefined') return null
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) }
  } catch {
    URL.revokeObjectURL(url)
    return null
  }
}

async function draw(source: CanvasImageSource, width: number, height: number, type: RedrawPlan['type'], quality: number): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  if (type === 'image/jpeg') {
    // A PNG with see-through parts would turn black as a JPEG.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(source, 0, 0, width, height)
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, type === 'image/jpeg' ? quality : undefined))
}

/**
 * The picture redrawn per `planRedraw`, or the file itself when it is not a
 * picture a canvas should redraw, cannot be decoded, or would not get smaller.
 * Never throws: the worst case is uploading the original.
 */
export async function downscaleImage(file: File, opts: DownscaleOptions = {}): Promise<File> {
  const { quality = DEFAULT_QUALITY, maxBytes } = opts
  if (!canRedraw(file, opts) || typeof document === 'undefined') return file
  const decoded = await decodeImage(file)
  if (!decoded) return file
  try {
    const plan = planRedraw(file, decoded.width, decoded.height, opts)
    if (!plan) return file
    let type = plan.type
    let blob = await draw(decoded.source, plan.width, plan.height, type, quality)
    // A PNG still too heavy for the upload point: a JPEG of it instead.
    if (blob && type === 'image/png' && maxBytes !== undefined && blob.size > maxBytes) {
      type = 'image/jpeg'
      blob = await draw(decoded.source, plan.width, plan.height, type, quality)
    }
    if (!blob) return file
    if (plan.onlyIfSmaller && blob.size >= file.size) return file
    const name = type === 'image/png' ? file.name : downscaledName(file.name)
    return new File([blob], name, { type, lastModified: file.lastModified })
  } catch {
    return file
  } finally {
    decoded.release()
  }
}
