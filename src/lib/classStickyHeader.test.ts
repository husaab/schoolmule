import { describe, expect, it } from 'vitest'
import {
  CLASS_CRUMB_PX,
  CLASS_STICKY_BOTTOM_PX,
  CLASS_TABS_STRIP_PX,
  NAVBAR_PX,
  classBannerStickyTop,
} from './classStickyHeader'

describe('classBannerStickyTop', () => {
  it('slides a tall banner up under the breadcrumb until only the tab strip shows', () => {
    const top = classBannerStickyTop(162)
    expect(top).toBeLessThan(NAVBAR_PX + CLASS_CRUMB_PX)
    expect(top + 162).toBe(NAVBAR_PX + CLASS_CRUMB_PX + CLASS_TABS_STRIP_PX)
  })

  it('leaves the same strip for the slim Grades bar', () => {
    expect(classBannerStickyTop(113) + 113).toBe(CLASS_STICKY_BOTTOM_PX)
  })

  it('pins a banner no taller than the strip right under the breadcrumb', () => {
    expect(classBannerStickyTop(40)).toBe(NAVBAR_PX + CLASS_CRUMB_PX)
  })
})

describe('CLASS_STICKY_BOTTOM_PX', () => {
  it('is where the stuck class bars end: navbar, breadcrumb, then the tab strip', () => {
    expect(CLASS_STICKY_BOTTOM_PX).toBe(NAVBAR_PX + CLASS_CRUMB_PX + CLASS_TABS_STRIP_PX)
  })
})
