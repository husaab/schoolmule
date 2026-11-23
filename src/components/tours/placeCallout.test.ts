import { describe, expect, it } from 'vitest'
import { MARGIN, placeCallout } from './placeCallout'

const W = 320
const H = 260
const VW = 1440
const VH = 900
const box = (left: number, top: number, width = 160, height = 44) => ({ left, top, width, height })
const bottomOf = (p: { y: number }, h = H) => p.y + h

describe('placeCallout', () => {
  it('keeps the bubble no lower than a target near the bottom of the window', () => {
    // The Book button sitting just above the bottom edge.
    const target = box(60, 780)
    const p = placeCallout(target, W, H, 'auto', VW, VH)
    expect(p.side).toBe('right')
    expect(bottomOf(p)).toBeLessThanOrEqual(target.top + target.height)
    // The arrow still points at the target's middle.
    expect(p.y + p.arrow).toBeCloseTo(target.top + target.height / 2, 0)
  })

  it('keeps the bubble no higher than a target near the top', () => {
    const target = box(60, 100)
    const p = placeCallout(target, W, H, 'auto', VW, VH)
    expect(p.side).toBe('right')
    expect(p.y).toBeGreaterThanOrEqual(target.top)
    expect(p.y + p.arrow).toBeCloseTo(target.top + target.height / 2, 0)
  })

  it('a tall target keeps its bubble centred beside it', () => {
    const target = box(60, 200, 160, 500)
    const p = placeCallout(target, W, H, 'auto', VW, VH)
    expect(p.y).toBeCloseTo(target.top + target.height / 2 - H / 2, 0)
  })

  it('goes above a wide target in the lower half and below one in the upper half', () => {
    const wide = (top: number) => box(20, top, VW - 40, 60)
    expect(placeCallout(wide(600), W, H, 'auto', VW, VH).side).toBe('top')
    expect(placeCallout(wide(150), W, H, 'auto', VW, VH).side).toBe('bottom')
  })

  it('honours a placement the step asks for when it fits', () => {
    expect(placeCallout(box(900, 400), W, H, 'left', VW, VH).side).toBe('left')
  })

  it('never leaves the window, even when the target is pinned to its bottom edge', () => {
    const p = placeCallout(box(60, VH - 50), W, H, 'auto', VW, VH)
    expect(p.y).toBeGreaterThanOrEqual(MARGIN)
    expect(bottomOf(p)).toBeLessThanOrEqual(VH - MARGIN)
  })

  it('docks on the far side when nothing fits beside the target', () => {
    const huge = box(0, 220, VW, 600)
    const p = placeCallout(huge, W, H, 'auto', VW, VH)
    expect(p.side).toBe('none')
    expect(p.y).toBe(MARGIN)
  })

  it('docks a phone sheet away from the target', () => {
    expect(placeCallout(box(20, 600), 360, 200, 'auto', 390, 844).y).toBe(MARGIN + 8)
    expect(placeCallout(box(20, 100), 360, 200, 'auto', 390, 844).y).toBe(844 - 200 - MARGIN)
    expect(placeCallout(null, 360, 200, 'auto', 390, 844).sheet).toBe(true)
  })
})
