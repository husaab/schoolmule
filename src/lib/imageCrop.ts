// src/lib/imageCrop.ts
// Center-crops an image the user picked to a fixed size in the browser, so
// uploads arrive small and in the right shape: class banners at 1200 x 300,
// profile photos as a square. The server checks type and size only; it never
// resizes, so this is where large phone photos get scaled down.

export interface CropRect {
  sx: number
  sy: number
  sw: number
  sh: number
}

/** The part of a srcW x srcH image that fills an outW x outH frame, centered. */
export function centerCropRect(srcW: number, srcH: number, outW: number, outH: number): CropRect {
  if (!(srcW > 0 && srcH > 0 && outW > 0 && outH > 0)) throw new Error('The image has no size')
  const ratio = outW / outH
  if (srcW / srcH > ratio) {
    const sw = Math.round(srcH * ratio)
    return { sx: Math.round((srcW - sw) / 2), sy: 0, sw, sh: srcH }
  }
  const sh = Math.round(srcW / ratio)
  return { sx: 0, sy: Math.round((srcH - sh) / 2), sw: srcW, sh }
}

export const UNREADABLE_IMAGE = 'Use a JPEG, PNG or WebP image'

interface Decoded {
  source: CanvasImageSource
  width: number
  height: number
  release: () => void
}

async function decode(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
    } catch {
      // Fall through to an <img>, which some browsers decode more formats with.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) }
  } catch {
    URL.revokeObjectURL(url)
    throw new Error(UNREADABLE_IMAGE)
  }
}

export interface CropOptions {
  width: number
  height: number
  /** JPEG quality, 0 to 1. */
  quality?: number
  /** Never enlarge: a smaller picture keeps its own size (same shape). */
  shrinkOnly?: boolean
}

/** Center-crops `file` to width x height and returns it as a JPEG. */
export async function cropImageFile(file: Blob, { width, height, quality = 0.9, shrinkOnly = false }: CropOptions): Promise<Blob> {
  if (file.type && !file.type.startsWith('image/')) throw new Error(UNREADABLE_IMAGE)
  const image = await decode(file)
  try {
    const rect = centerCropRect(image.width, image.height, width, height)
    const scale = shrinkOnly ? Math.min(1, rect.sw / width) : 1
    const outW = Math.max(1, Math.round(width * scale))
    const outH = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('This browser cannot prepare the image')
    // JPEG has no transparency: put a transparent PNG on white, not black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outW, outH)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image.source, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, outW, outH)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('This browser cannot prepare the image'))),
        'image/jpeg',
        quality,
      )
    })
  } finally {
    image.release()
  }
}

/** A profile photo: the middle square, at most 512 x 512. */
export const cropProfilePhoto = (file: Blob) => cropImageFile(file, { width: 512, height: 512, shrinkOnly: true })
