import { describe, expect, it } from 'vitest'
import { centerCropRect } from './imageCrop'

// The source rectangle a center crop draws from, for banners (4:1) and photos (1:1).

describe('centerCropRect', () => {
  it('trims the top and bottom of an image taller than 4:1', () => {
    expect(centerCropRect(1200, 900, 1200, 300)).toEqual({ sx: 0, sy: 300, sw: 1200, sh: 300 })
  })

  it('trims the sides of an image wider than 4:1', () => {
    expect(centerCropRect(3000, 300, 1200, 300)).toEqual({ sx: 900, sy: 0, sw: 1200, sh: 300 })
  })

  it('keeps an image that is already the right shape', () => {
    expect(centerCropRect(2400, 600, 1200, 300)).toEqual({ sx: 0, sy: 0, sw: 2400, sh: 600 })
  })

  it('crops a landscape photo to the middle square', () => {
    expect(centerCropRect(1600, 1200, 512, 512)).toEqual({ sx: 200, sy: 0, sw: 1200, sh: 1200 })
  })

  it('crops a portrait photo to the middle square', () => {
    expect(centerCropRect(1000, 1500, 512, 512)).toEqual({ sx: 0, sy: 250, sw: 1000, sh: 1000 })
  })

  it('rounds to whole pixels', () => {
    const r = centerCropRect(1001, 333, 1200, 300)
    for (const v of Object.values(r)) expect(Number.isInteger(v)).toBe(true)
    expect(r.sw / r.sh).toBeCloseTo(4, 1)
  })

  it('refuses an image with no size', () => {
    expect(() => centerCropRect(0, 100, 1200, 300)).toThrow()
  })
})
