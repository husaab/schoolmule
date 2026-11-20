import { describe, expect, it } from 'vitest'
import {
  MAX_STROKES,
  extendStroke,
  hasEnoughInk,
  inkLength,
  padSize,
  penWidth,
  startStroke,
  strokesPath,
  toDrawing,
  undoStroke,
  type Stroke,
} from './signatureStrokes'

/** A horizontal line drawn point by point. */
function line(from: [number, number], to: [number, number], steps = 20): Stroke[] {
  let strokes = startStroke([], from)
  for (let i = 1; i <= steps; i += 1) {
    strokes = extendStroke(strokes, [from[0] + ((to[0] - from[0]) * i) / steps, from[1] + ((to[1] - from[1]) * i) / steps])
  }
  return strokes
}

describe('signature strokes', () => {
  it('keeps the pad 3:1', () => {
    expect(padSize(600)).toEqual({ width: 600, height: 200 })
    expect(padSize(40)).toEqual({ width: 150, height: 50 })
  })

  it('records strokes point by point, skipping points that barely moved', () => {
    let s = startStroke([], [10, 10])
    s = extendStroke(s, [10.4, 10.3])
    expect(s).toEqual([[[10, 10]]])
    s = extendStroke(s, [20.04, 10])
    expect(s).toEqual([[[10, 10], [20, 10]]])
    expect(extendStroke([], [5, 5])).toEqual([]) // no stroke started
  })

  it('undoes the last stroke without touching the others', () => {
    const two = [...line([0, 0], [100, 0]), ...line([0, 50], [100, 50])]
    expect(undoStroke(two)).toEqual([two[0]])
    expect(two).toHaveLength(2)
  })

  it('needs some ink before it can be saved', () => {
    expect(hasEnoughInk(line([10, 10], [20, 10]), 600)).toBe(false)
    expect(hasEnoughInk(line([10, 10], [200, 10]), 600)).toBe(true)
    expect(inkLength(line([0, 0], [30, 40], 1))).toBe(50)
  })

  it('sends points inside the pad, or nothing while there is too little ink', () => {
    expect(toDrawing(line([10, 10], [12, 10]), 600, 200)).toBeNull()
    const drawing = toDrawing([[[-5, 10], [700, 250]]], 600, 200)
    expect(drawing).toEqual({ width: 600, height: 200, strokes: [[[0, 10], [600, 200]]] })
  })

  it('draws a path, a tap as a dot', () => {
    expect(strokesPath([[[1, 2], [3, 4]], [[5, 6]]])).toBe('M1 2L3 4M5 6l0.1 0')
    expect(penWidth(600, 200)).toBeCloseTo(2.73, 2)
  })

  it('stops adding strokes at the cap', () => {
    let s: Stroke[] = []
    for (let i = 0; i < MAX_STROKES + 5; i += 1) s = startStroke(s, [i, i])
    expect(s).toHaveLength(MAX_STROKES)
  })
})
