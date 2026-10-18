// src/lib/imageDownscale.ts
// Phone photos are 4000 px and several MB. Before a student's photo goes up it
// is redrawn on a canvas, no longer than 2000 px on its long edge, as a JPEG
// at 85 % quality: the teacher sees a sharp page and the upload is quick on
// school wifi. Anything a canvas cannot or should not redraw (GIFs, HEIC, PDFs,
// Word files, a picture the browser cannot decode) is returned untouched, and
// so is a redraw that came out bigger than the original. The fitting and the
// naming are pure and unit-tested (imageDownscale.test.ts); the canvas part
// needs a browser.

export const DEFAULT_MAX_EDGE = 2000
export const DEFAULT_QUALITY = 0.85

export interface DownscaleOptions {
  /** The longest edge, in pixels. */
  maxEdge?: number
  /** JPEG quality, 0 to 1. */
  quality?: number
}

const REDRAWABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const REDRAWABLE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

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

/** The picture as pixels, upright as the camera held it. Null when this browser cannot decode it. */
async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void } | null> {
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

/**
 * A JPEG no longer than `maxEdge` on its long edge, or the file itself when it
 * is not a picture a canvas should redraw, cannot be decoded, or would not get
 * smaller. Never throws: the worst case is uploading the original.
 */
export async function downscaleImage(file: File, { maxEdge = DEFAULT_MAX_EDGE, quality = DEFAULT_QUALITY }: DownscaleOptions = {}): Promise<File> {
  if (!isDownscalable(file) || typeof document === 'undefined') return file
  const decoded = await decode(file)
  if (!decoded) return file
  try {
    const { width, height, scaled } = fitWithin(decoded.width, decoded.height, maxEdge)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    // A PNG with see-through parts would turn black as a JPEG.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(decoded.source, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) return file
    // A small picture that did not need shrinking is only worth redrawing if that saved something.
    if (!scaled && blob.size >= file.size) return file
    return new File([blob], downscaledName(file.name), { type: 'image/jpeg', lastModified: file.lastModified })
  } catch {
    return file
  } finally {
    decoded.release()
  }
}
