// src/lib/leaveGuard.ts
// A form with edits that save only with a button (the classwork form on a
// posted, scheduled or new-assessment item) must not lose them to a stray
// click (final review I1): a click on any in-app link asks first, closing or
// reloading the tab asks (beforeunload), and a way out that can't be stopped
// (browser Back) keeps the edits for the session so reopening the form brings
// them back (keepEdits / takeEdits). Pure, unit-tested (leaveGuard.test.ts).

export interface LinkClick {
  /** The anchor's resolved href (a.href), or null for none. */
  href: string | null
  /** The anchor's target attribute. */
  target: string | null
  download: boolean
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  /** The form handles this link itself (its own Close and Cancel ask already). */
  handled: boolean
}

/**
 * Where a click would take the person inside the app ("/classes/x?tab=y"), or
 * null when the click leaves this page alone: a new tab or window, a
 * download, another site, a same-page anchor, or a link the form handles.
 */
export function guardedLinkTarget(click: LinkClick, current: { origin: string; pathname: string; search: string }): string | null {
  if (click.handled || !click.href || click.download) return null
  if (click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return null
  if (click.target && click.target !== '_self') return null
  let url: URL
  try {
    url = new URL(click.href, current.origin)
  } catch {
    return null
  }
  if (url.origin !== current.origin) return null
  if (url.pathname === current.pathname && url.search === current.search) return null
  return `${url.pathname}${url.search}${url.hash}`
}

// Edits kept for the session when a guarded form was left without saving, by key
// ("item-edits:{userId}:{itemId}", or ":new:{classId}:{kind}" for a new one).
const kept = new Map<string, unknown>()

/** Keeps unsaved edits for when the form opens again. */
export function keepEdits<T>(key: string, values: T): void {
  kept.set(key, values)
}

/** The edits kept under `key`, once (they are forgotten as they are handed back), or null. */
export function takeEdits<T>(key: string): T | null {
  if (!kept.has(key)) return null
  const values = kept.get(key) as T
  kept.delete(key)
  return values
}

/** Tests only. */
export function resetKeptEdits(): void {
  kept.clear()
}
