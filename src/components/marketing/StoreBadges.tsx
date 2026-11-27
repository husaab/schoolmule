'use client'
import Image from 'next/image'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/lib/marketing/site'
import { trackEvent } from './film/filmEvents'
import { cx } from './ui'

// Apple's "Download on the App Store" and Google's "Get it on Google Play"
// badges, exactly as each company publishes them (public/badges). The brand
// rules that shape this component:
//   - Apple (developer.apple.com/app-store/marketing/guidelines): the black
//     badge whenever other store badges are shown, placed first, at least
//     40px tall on screen, with clear space of a quarter of its height, never
//     modified or animated, and only one App Store badge per page.
//   - Google (Partner Marketing Hub, Google Play badges): the same size as or
//     larger than the other store badges, at least 28px tall, with the same
//     quarter-height clear space, never modified.
// Both credit lines are in the footer (components/prefooter/Footer).
//
// Google's file is its public PNG: the SVG is only in Google's partner hub.
// The PNG draws its 564×168 badge inside a 41px transparent margin, which is
// exactly the quarter-height clear space. The margin is positioned outside
// the link, never cropped, so the visible badges are the same height.
//
// The copy around a placement should make clear the app is for people at a
// SchoolMule school ("Already at a SchoolMule school? Get the app."): the
// school creates or approves every account.

const APPLE = { src: '/badges/download-on-the-app-store.svg', width: 119.66407, height: 40 }
const GOOGLE = { src: '/badges/get-it-on-google-play.png', width: 646, height: 250, badgeWidth: 564, badgeHeight: 168, margin: 41 }

const HEIGHTS = { md: 40, lg: 48 } as const

/**
 * The two store badges, App Store first, each opening its listing in a new tab.
 * `size` sets the badges' visible height (md 40px, Apple's minimum; lg 48px).
 * `placement="page"` marks badges in a page's own content, which hides the
 * footer's (one App Store badge per page: see .mk-footer-app in globals.css).
 */
export default function StoreBadges({
  from,
  size = 'md',
  align = 'start',
  placement = 'page',
  className,
}: {
  /** Where the badges are, for the click events (like DemoLink's `from`). */
  from: string
  size?: keyof typeof HEIGHTS
  align?: 'start' | 'center'
  placement?: 'page' | 'footer'
  className?: string
}) {
  const h = HEIGHTS[size]
  const scale = h / GOOGLE.badgeHeight
  const link =
    'relative block shrink-0 rounded-[0.4rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/35'

  return (
    <ul
      data-store-badges={placement}
      aria-label="The SchoolMule app"
      className={cx('flex flex-wrap items-center', align === 'center' ? 'justify-center' : 'justify-start', className)}
      // Wider than the quarter-height clear space both companies ask for.
      style={{ gap: Math.round(h * 0.4) }}
    >
      <li>
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('store_badge_click', { store: 'app-store', from })}
          className={link}
          style={{ width: (APPLE.width * h) / APPLE.height, height: h }}
        >
          <Image
            src={APPLE.src}
            alt="Download SchoolMule on the App Store"
            width={120}
            height={40}
            unoptimized
            className="block size-full max-w-none"
          />
        </a>
      </li>
      <li>
        <a
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('store_badge_click', { store: 'google-play', from })}
          className={link}
          style={{ width: GOOGLE.badgeWidth * scale, height: h }}
        >
          <Image
            src={GOOGLE.src}
            alt="Get SchoolMule on Google Play"
            width={GOOGLE.width}
            height={GOOGLE.height}
            unoptimized
            className="pointer-events-none absolute block max-w-none"
            style={{
              left: -GOOGLE.margin * scale,
              top: -GOOGLE.margin * scale,
              width: GOOGLE.width * scale,
              height: GOOGLE.height * scale,
            }}
          />
        </a>
      </li>
    </ul>
  )
}
