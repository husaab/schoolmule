import { describe, expect, it } from 'vitest'
import { CLASS_STICKY_BOTTOM_PX, CLASS_TABS_STRIP_PX, NAVBAR_PX, classHeaderStickyTop } from './classStickyHeader'

describe('classHeaderStickyTop', () => {
  it('slides a tall banner up until only the tab strip shows under the navbar', () => {
    const top = classHeaderStickyTop(223)
    expect(top).toBeLessThan(0)
    expect(top + 223).toBe(NAVBAR_PX + CLASS_TABS_STRIP_PX)
  })

  it('leaves the same strip for the slim Grades bar', () => {
    expect(classHeaderStickyTop(174) + 174).toBe(CLASS_STICKY_BOTTOM_PX)
  })

  it('pins a header no taller than the strip right under the navbar', () => {
    expect(classHeaderStickyTop(40)).toBe(NAVBAR_PX)
  })
})

describe('CLASS_STICKY_BOTTOM_PX', () => {
  it('is where the stuck strip ends: the navbar plus the strip', () => {
    expect(CLASS_STICKY_BOTTOM_PX).toBe(NAVBAR_PX + CLASS_TABS_STRIP_PX)
  })
})
