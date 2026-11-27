import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StoreBadges from './StoreBadges'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/lib/marketing/site'

// The store badges follow Apple's and Google's badge rules (see the comment in
// StoreBadges.tsx). These pin the parts a later edit could quietly break.

const render = (props: Partial<Parameters<typeof StoreBadges>[0]> = {}) =>
  renderToStaticMarkup(createElement(StoreBadges, { from: 'test', ...props }))

const links = (html: string) => [...html.matchAll(/<a [^>]*>/g)].map((m) => m[0])
const px = (tag: string, prop: string) => Number(new RegExp(`${prop}:(-?[\\d.]+)px`).exec(tag)?.[1])

describe('StoreBadges', () => {
  it('puts the App Store first and links each badge to its listing in a new tab', () => {
    const [apple, google] = links(render())
    expect(apple).toContain(`href="${APP_STORE_URL}"`)
    expect(google).toContain(`href="${GOOGLE_PLAY_URL}"`)
    for (const a of [apple, google]) {
      expect(a).toContain('target="_blank"')
      expect(a).toContain('rel="noopener noreferrer"')
    }
  })

  it('names each link for screen readers', () => {
    const html = render()
    expect(html).toContain('alt="Download SchoolMule on the App Store"')
    expect(html).toContain('alt="Get SchoolMule on Google Play"')
  })

  it('links the App Store without a country code, so Apple picks the storefront', () => {
    expect(APP_STORE_URL).toBe('https://apps.apple.com/app/id6825004676')
  })

  it.each([
    ['md', 40],
    ['lg', 48],
  ] as const)('draws both badges %s at the same height, never under Apple’s 40px', (size, height) => {
    const [apple, google] = links(render({ size }))
    expect(px(apple, 'height')).toBe(height)
    expect(px(google, 'height')).toBe(height)
    // Google's badge must be the same size as or larger than the others.
    expect(px(google, 'width')).toBeGreaterThanOrEqual(px(apple, 'width'))
  })

  it('places the Google PNG’s transparent margin outside the link instead of cropping it', () => {
    const html = render()
    const img = /<img[^>]*get-it-on-google-play[^>]*>/.exec(html)?.[0] ?? ''
    // 41px of margin around a 168px-tall badge, scaled to 40px.
    expect(px(img, 'left')).toBeCloseTo((-41 * 40) / 168, 3)
    expect(px(img, 'top')).toBeCloseTo((-41 * 40) / 168, 3)
    expect(px(img, 'height')).toBeCloseTo((250 * 40) / 168, 3)
  })

  it('marks where the badges are, so a page with its own hides the footer’s', () => {
    expect(render()).toContain('data-store-badges="page"')
    expect(render({ placement: 'footer' })).toContain('data-store-badges="footer"')
  })
})
