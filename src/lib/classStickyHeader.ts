// The class page keeps its breadcrumb ("Classes › Grade 5 Science") and its
// tabs on screen while the page scrolls. The breadcrumb bar sticks right
// under the fixed navbar. The banner sticks with a negative top: it slides up
// behind the breadcrumb until only its last CLASS_TABS_STRIP_PX show (the tab
// row and a sliver of the class colour above it). At the top of the page it
// looks exactly as before.

/** The fixed navbar's height (Navbar.tsx, h-20). */
export const NAVBAR_PX = 80
/** The breadcrumb bar's fixed height, its bottom border included. */
export const CLASS_CRUMB_PX = 61
/** What stays of the banner once stuck: the 45px tab row plus 7px of class colour. */
export const CLASS_TABS_STRIP_PX = 52
/** Where the stuck class bars end, so anything sticky below them (Settings' section nav) starts here. */
export const CLASS_STICKY_BOTTOM_PX = NAVBAR_PX + CLASS_CRUMB_PX + CLASS_TABS_STRIP_PX

/** The banner's sticky `top` for its measured height; a banner no taller than the strip pins whole. */
export const classBannerStickyTop = (bannerHeight: number): number =>
  Math.min(NAVBAR_PX + CLASS_CRUMB_PX, CLASS_STICKY_BOTTOM_PX - bannerHeight)
