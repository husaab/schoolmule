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
