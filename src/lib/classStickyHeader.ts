// The class page's tabs stay on screen while the page scrolls. The whole
// class header is sticky with a negative top: it slides up under the fixed
// navbar until only its last CLASS_TABS_STRIP_PX show (the tab row and a
// sliver of the class colour above it). At the top of the page it looks
// exactly as before.

/** The fixed navbar's height (Navbar.tsx, h-20). */
export const NAVBAR_PX = 80
/** What stays of the class header once stuck: the 45px tab row plus 7px of class colour. */
export const CLASS_TABS_STRIP_PX = 52
/** Where the stuck strip ends, so anything sticky below it (Settings' section nav) starts here. */
export const CLASS_STICKY_BOTTOM_PX = NAVBAR_PX + CLASS_TABS_STRIP_PX

/** The header's sticky `top` for its measured height; a header no taller than the strip pins whole. */
export const classHeaderStickyTop = (headerHeight: number): number =>
  Math.min(NAVBAR_PX, CLASS_STICKY_BOTTOM_PX - headerHeight)
