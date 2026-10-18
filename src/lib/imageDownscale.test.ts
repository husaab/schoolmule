import { describe, it, expect } from 'vitest'
import { DEFAULT_MAX_EDGE, DEFAULT_QUALITY, downscaleImage, downscaledName, fitWithin, isDownscalable } from './imageDownscale'

const file = (name: string, type: string, size = 10) => new File([new Uint8Array(size)], name, { type })

describe('fitWithin', () => {
  it('keeps a picture that already fits', () => {
    expect(fitWithin(1600, 1200, 2000)).toEqual({ width: 1600, height: 1200, scaled: false })
    expect(fitWithin(2000, 2000, 2000)).toEqual({ width: 2000, height: 2000, scaled: false })
  })

  it('shrinks the long edge to the limit and keeps the shape', () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500, scaled: true })
    expect(fitWithin(3000, 4000, 2000)).toEqual({ width: 1500, height: 2000, scaled: true })
  })

  it('rounds to whole pixels and never goes below one', () => {
    expect(fitWithin(4001, 3001, 2000)).toEqual({ width: 2000, height: 1500, scaled: true })
    expect(fitWithin(10000, 1, 2000)).toEqual({ width: 2000, height: 1, scaled: true })
  })
})

describe('isDownscalable', () => {
  it('takes photos a canvas can redraw', () => {
    expect(isDownscalable(file('a.jpg', 'image/jpeg'))).toBe(true)
    expect(isDownscalable(file('a.png', 'image/png'))).toBe(true)
    expect(isDownscalable(file('a.webp', 'image/webp'))).toBe(true)
  })

  it('leaves GIFs, HEIC, PDFs and everything else alone', () => {
    expect(isDownscalable(file('a.gif', 'image/gif'))).toBe(false)
    expect(isDownscalable(file('a.heic', 'image/heic'))).toBe(false)
    expect(isDownscalable(file('a.heif', 'image/heif'))).toBe(false)
    expect(isDownscalable(file('a.pdf', 'application/pdf'))).toBe(false)
    expect(isDownscalable(file('a.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))).toBe(false)
  })

  it('reads a missing type from the extension, and HEIC stays out either way', () => {
    expect(isDownscalable(file('IMG_1.JPG', ''))).toBe(true)
    expect(isDownscalable(file('IMG_1.heic', ''))).toBe(false)
    expect(isDownscalable(file('notes.txt', ''))).toBe(false)
  })
})

describe('downscaledName', () => {
  it('names the JPEG after the picture', () => {
    expect(downscaledName('plant-cell.png')).toBe('plant-cell.jpg')
    expect(downscaledName('IMG_0412.JPEG')).toBe('IMG_0412.jpg')
    expect(downscaledName('photo.final.webp')).toBe('photo.final.jpg')
  })

  it('adds an extension to a name that has none', () => {
    expect(downscaledName('photo')).toBe('photo.jpg')
  })
})

describe('downscaleImage', () => {
  it('has the brief defaults', () => {
    expect(DEFAULT_MAX_EDGE).toBe(2000)
    expect(DEFAULT_QUALITY).toBe(0.85)
  })

  it('hands a non-image back unchanged', async () => {
    const pdf = file('worksheet.pdf', 'application/pdf')
    expect(await downscaleImage(pdf)).toBe(pdf)
  })

  it('hands a GIF back unchanged', async () => {
    const gif = file('wiggle.gif', 'image/gif')
    expect(await downscaleImage(gif)).toBe(gif)
  })

  it('hands a HEIC photo back unchanged', async () => {
    const heic = file('IMG_0412.heic', 'image/heic')
    expect(await downscaleImage(heic)).toBe(heic)
  })

  it('hands the original back when the browser cannot decode it (no canvas here)', async () => {
    const jpg = file('photo.jpg', 'image/jpeg')
    expect(await downscaleImage(jpg)).toBe(jpg)
  })
})
