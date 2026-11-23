// src/lib/adminPins.ts
// The admin panel tools a person pinned to the top, saved on their device per
// account and school (adminPins.test.ts). Hrefs are stored, not names, so a
// renamed tool stays pinned. A pin for a tool the person can no longer open
// is hidden, not deleted, so it comes back if their role does. Pure; the
// storage is the caller's (web localStorage, the app's localStore).

import type { AdminTool, AdminToolGroup } from '@/lib/adminTools'

export const pinsKey = (userId: string | null | undefined, school: string | null | undefined): string =>
  `sm.adminPins:${userId ?? ''}:${school ?? ''}`

/** Saved pins, oldest first. Anything unreadable is no pins. */
export const parsePins = (raw: string | null | undefined): string[] => {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string'))] : []
  } catch {
    return []
  }
}

export const togglePin = (pins: readonly string[], href: string): string[] =>
  pins.includes(href) ? pins.filter((p) => p !== href) : [...pins, href]

/** The pinned tools the person can open, in the order they pinned them. */
export const pinnedTools = (pins: readonly string[], groups: readonly AdminToolGroup[]): AdminTool[] => {
  const byHref = new Map(groups.flatMap((g) => g.tools).map((t) => [t.href, t]))
  return pins.map((href) => byHref.get(href)).filter((t): t is AdminTool => Boolean(t))
}
