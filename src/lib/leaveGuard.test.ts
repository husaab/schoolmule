import { beforeEach, describe, expect, it } from 'vitest'
import { guardedLinkTarget, keepEdits, resetKeptEdits, takeEdits, type LinkClick } from './leaveGuard'

const here = { origin: 'https://app.schoolmule.ca', pathname: '/classes/c1/items/i1/edit', search: '' }
const click = (over: Partial<LinkClick> = {}): LinkClick => ({
  href: 'https://app.schoolmule.ca/classes/c1?tab=classwork',
  target: null,
  download: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  handled: false,
  ...over,
})

describe('guardedLinkTarget', () => {
  it('asks before an in-app link takes the teacher away', () => {
    expect(guardedLinkTarget(click(), here)).toBe('/classes/c1?tab=classwork')
    expect(guardedLinkTarget(click({ href: '/dashboard#top' }), here)).toBe('/dashboard#top')
    expect(guardedLinkTarget(click({ target: '_self' }), here)).toBe('/classes/c1?tab=classwork')
  })

  it("leaves alone what doesn't leave the form", () => {
    // A new tab or window, a download, a modified click.
    expect(guardedLinkTarget(click({ target: '_blank' }), here)).toBeNull()
    expect(guardedLinkTarget(click({ download: true }), here)).toBeNull()
    expect(guardedLinkTarget(click({ metaKey: true }), here)).toBeNull()
    expect(guardedLinkTarget(click({ ctrlKey: true }), here)).toBeNull()
    expect(guardedLinkTarget(click({ button: 1 }), here)).toBeNull()
    // Another site, an anchor on this page, no href.
    expect(guardedLinkTarget(click({ href: 'https://www.youtube.com/watch?v=x' }), here)).toBeNull()
    expect(guardedLinkTarget(click({ href: 'https://app.schoolmule.ca/classes/c1/items/i1/edit#files' }), here)).toBeNull()
    expect(guardedLinkTarget(click({ href: null }), here)).toBeNull()
    // The form's own Close and Cancel ask already.
    expect(guardedLinkTarget(click({ handled: true }), here)).toBeNull()
  })
})

describe('keepEdits / takeEdits', () => {
  beforeEach(() => resetKeptEdits())

  it('hands kept edits back once', () => {
    keepEdits('item-edits:u1:i1', { title: 'Plant cells v2' })
    expect(takeEdits('item-edits:u1:i1')).toEqual({ title: 'Plant cells v2' })
    expect(takeEdits('item-edits:u1:i1')).toBeNull()
  })

  it('keeps them per user and item', () => {
    keepEdits('item-edits:u1:i1', { title: 'A' })
    expect(takeEdits('item-edits:u2:i1')).toBeNull()
    expect(takeEdits('item-edits:u1:i2')).toBeNull()
    expect(takeEdits('item-edits:u1:i1')).toEqual({ title: 'A' })
  })
})
