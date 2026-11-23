// src/components/tours/findTarget.ts
// Finding what a tour step points at on the page: the first [data-tour=name]
// that is actually on screen. A nav link in the closed phone sidebar sits
// off-screen (translated left), so it doesn't count until the sidebar opens;
// the desktop sidebar and the phone tab bar can both carry the same name and
// whichever is showing wins.

const NAVBAR_PX = 88 // the fixed top bar, plus a little air

export function findTarget(name: string | null | undefined): HTMLElement | null {
  if (!name || typeof document === 'undefined') return null
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${CSS.escape(name)}"]`)
  for (const el of all) {
    if (el.closest('[data-tour-layer]')) continue
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    if (r.right <= 0 || r.left >= window.innerWidth) continue
    const style = getComputedStyle(el)
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue
    return el
  }
  return null
}

export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * The boxes that cut off what the target shows: every ancestor that clips its
 * overflow, such as a dialog's scrolling body. The page itself (body, html) is
 * the window, which visiblePart always applies.
 */
export function clippersOf(el: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = []
  for (let at = el.parentElement; at && at !== document.body && at !== document.documentElement; at = at.parentElement) {
    const style = getComputedStyle(at)
    if (style.overflowX !== 'visible' || style.overflowY !== 'visible') out.push(at)
  }
  return out
}

/**
 * The part of the target someone can actually see: inside the window and
 * inside every clipping box (inside their scrollbars). A list taller than a
 * dialog's body is highlighted where it shows, not down past the dialog's
 * buttons, and the highlight stays put while the list scrolls under it. Once
 * the target has scrolled out of a box, a sliver at that box's edge.
 */
export function visiblePart(el: HTMLElement, clippers: readonly HTMLElement[]): Box {
  // What can show at all: the window, cut down by each clipping box.
  const clip: Box = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
  for (const box of clippers) {
    const b = box.getBoundingClientRect()
    const x = b.left + box.clientLeft
    const y = b.top + box.clientTop
    clip.left = Math.max(clip.left, x)
    clip.top = Math.max(clip.top, y)
    clip.right = Math.min(clip.right, x + box.clientWidth)
    clip.bottom = Math.min(clip.bottom, y + box.clientHeight)
  }
  return cut(el.getBoundingClientRect(), clip)
}

/** `r` inside `clip`; when none of it is inside, a zero-width or zero-height edge on the side it went. */
export function cut(r: Box, clip: Box): Box {
  const [left, right] = r.right <= clip.left ? [clip.left, clip.left] : r.left >= clip.right ? [clip.right, clip.right] : [Math.max(r.left, clip.left), Math.min(r.right, clip.right)]
  const [top, bottom] = r.bottom <= clip.top ? [clip.top, clip.top] : r.top >= clip.bottom ? [clip.bottom, clip.bottom] : [Math.max(r.top, clip.top), Math.min(r.bottom, clip.bottom)]
  return { left, top, right, bottom }
}

/**
 * What "Do it for me" presses: the target itself, or, for a group of choices
 * marked data-tour-choices (a row of times), its first choice. A click on the
 * group's box would choose nothing.
 */
export function pressable(el: HTMLElement): HTMLElement {
  if (!el.hasAttribute('data-tour-choices')) return el
  return el.querySelector<HTMLElement>('button:not([disabled]), a[href], [role="button"]:not([aria-disabled="true"])') ?? el
}

/** Scroll the target into view once, clear of the fixed top bar. */
export function ensureVisible(el: HTMLElement): void {
  const r = el.getBoundingClientRect()
  const inView = r.top >= NAVBAR_PX && r.bottom <= window.innerHeight - 16
  if (inView) return
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
  // Taller than the window (a whole day's schedule): show its top, under the
  // top bar, rather than the middle of it.
  if (r.height > window.innerHeight - NAVBAR_PX - 16) {
    const before = el.style.scrollMarginTop
    el.style.scrollMarginTop = `${NAVBAR_PX}px`
    el.scrollIntoView({ block: 'start', inline: 'nearest', behavior })
    el.style.scrollMarginTop = before
    return
  }
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior })
}

/** Focus the field a type step points at (the element itself, or the first field inside it). */
export function focusField(el: HTMLElement): void {
  const field = el.matches('input, textarea, [contenteditable="true"]')
    ? el
    : el.querySelector<HTMLElement>('input, textarea, [contenteditable="true"]')
  field?.focus()
}

/** The length of what has been typed into a field event's target. */
export function typedLength(target: EventTarget | null): number {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return target.value.trim().length
  if (target instanceof HTMLElement && target.isContentEditable) return (target.textContent ?? '').trim().length
  return 0
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const isTypingIn = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
