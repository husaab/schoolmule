import { describe, expect, it } from 'vitest'
import { clampView, FIT_VIEW, fitSize, isOnContent, MAX_ZOOM, pinchView, TAP_ZOOM, toggleZoom, turnedSize, zoomAt } from './zoomMath'

const stage = { width: 400, height: 800 }

describe('fitSize', () => {
  it('shrinks a large photo to the stage', () => {
    expect(fitSize({ width: 4000, height: 3000 }, stage, 0)).toEqual({ width: 400, height: 300 })
  })

  it('fits a turned photo by its turned shape', () => {
    // 4000x3000 turned is 3000 wide on screen, so the 400 stage sets the scale.
    const box = fitSize({ width: 4000, height: 3000 }, stage, 1)
    expect(box.height).toBeCloseTo(400)
    expect(box.width).toBeCloseTo(533.33, 1)
    expect(turnedSize(box, 1)).toEqual({ width: box.height, height: box.width })
  })

  it('never enlarges past the file', () => {
    expect(fitSize({ width: 100, height: 50 }, stage, 0)).toEqual({ width: 100, height: 50 })
  })
})

describe('clampView', () => {
  const content = { width: 400, height: 300 }

  it('keeps a fitted picture centred', () => {
    expect(clampView({ scale: 1, x: 90, y: -40 }, content, stage)).toEqual(FIT_VIEW)
  })

  it('lets a zoomed picture move only until its edge reaches the stage', () => {
    // 2x is 800 wide on a 400 stage: 200 either way. 600 tall still fits 800: no vertical room.
    expect(clampView({ scale: 2, x: 500, y: 90 }, content, stage)).toEqual({ scale: 2, x: 200, y: 0 })
  })

  it('holds the zoom in range', () => {
    expect(clampView({ scale: 40, x: 0, y: 0 }, content, stage).scale).toBe(MAX_ZOOM)
    expect(clampView({ scale: 0.2, x: 0, y: 0 }, content, stage).scale).toBe(1)
  })
})

describe('zoomAt', () => {
  it('keeps the spot under the pointer in place', () => {
    const at = { x: 100, y: -50 }
    const view = zoomAt(FIT_VIEW, 2, at)
    // The spot was `at` from the picture's middle; doubled, the middle moves away by the same again.
    expect(view).toEqual({ scale: 2, x: -100, y: 50 })
    expect(view.x + at.x * 2).toBe(at.x)
  })

  it('stops at the limits', () => {
    expect(zoomAt(FIT_VIEW, 99, { x: 0, y: 0 }).scale).toBe(MAX_ZOOM)
    const out = zoomAt({ scale: 3, x: 10, y: 10 }, 0.1, { x: 0, y: 0 })
    expect(out.scale).toBe(1)
    expect(out.x).toBeCloseTo(10 / 3)
  })
})

describe('pinchView', () => {
  it('spreads about where the fingers started', () => {
    expect(pinchView(FIT_VIEW, { x: 50, y: 0 }, 2, { x: 50, y: 0 })).toEqual({ scale: 2, x: -50, y: 0 })
  })

  it('follows the fingers as they move together', () => {
    expect(pinchView(FIT_VIEW, { x: 0, y: 0 }, 1, { x: 30, y: -20 })).toEqual({ scale: 1, x: 30, y: -20 })
  })
})

describe('toggleZoom', () => {
  it('goes in at the tap, then back out', () => {
    const inView = toggleZoom(FIT_VIEW, { x: 40, y: 0 })
    expect(inView.scale).toBe(TAP_ZOOM)
    expect(toggleZoom(inView, { x: 40, y: 0 })).toEqual(FIT_VIEW)
  })
})

describe('isOnContent', () => {
  const content = { width: 200, height: 100 }

  it('tells the picture from the dark around it', () => {
    expect(isOnContent(FIT_VIEW, content, { x: 99, y: 49 })).toBe(true)
    expect(isOnContent(FIT_VIEW, content, { x: 101, y: 0 })).toBe(false)
  })

  it('follows the zoom and the pan', () => {
    expect(isOnContent({ scale: 2, x: 100, y: 0 }, content, { x: 290, y: 90 })).toBe(true)
    expect(isOnContent({ scale: 2, x: 100, y: 0 }, content, { x: -110, y: 0 })).toBe(false)
  })
})
