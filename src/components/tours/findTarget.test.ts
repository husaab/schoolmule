import { describe, expect, it } from 'vitest'
import { cut } from './findTarget'

// A dialog's scrolling body, 600px tall, under a header.
const body = { left: 200, top: 150, right: 1000, bottom: 750 }

describe('cut: the part of a target that shows inside its clipping boxes', () => {
  it('lights only the visible part of a list taller than the dialog body', () => {
    const list = { left: 220, top: 300, right: 980, bottom: 1900 }
    expect(cut(list, body)).toEqual({ left: 220, top: 300, right: 980, bottom: 750 })
  })

  it('stays put while the list scrolls under it', () => {
    const scrolled = (by: number) => cut({ left: 220, top: 100 - by, right: 980, bottom: 1700 - by }, body)
    expect(scrolled(0)).toEqual(scrolled(200))
    expect(scrolled(0)).toEqual({ left: 220, top: 150, right: 980, bottom: 750 })
  })

  it('keeps a target that fits as it is', () => {
    const button = { left: 300, top: 400, right: 420, bottom: 440 }
    expect(cut(button, body)).toEqual(button)
  })

  it('becomes an edge on the side the target scrolled away to', () => {
    expect(cut({ left: 220, top: -400, right: 980, bottom: 100 }, body)).toEqual({ left: 220, top: 150, right: 980, bottom: 150 })
    expect(cut({ left: 220, top: 900, right: 980, bottom: 1300 }, body)).toEqual({ left: 220, top: 750, right: 980, bottom: 750 })
    expect(cut({ left: 1100, top: 300, right: 1200, bottom: 340 }, body)).toEqual({ left: 1000, top: 300, right: 1000, bottom: 340 })
  })
})
