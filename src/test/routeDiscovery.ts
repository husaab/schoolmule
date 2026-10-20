// src/test/routeDiscovery.ts
// Test helper (vitest only: it reads the filesystem). Every page in the app,
// discovered from src/app, so a route added later is covered by the routing
// and permission tests without touching them. Route groups like (user) are
// dropped and dynamic segments get a placeholder ('[classId]' -> 'x-classId').

import fs from 'fs'
import path from 'path'

export const APP_DIR = path.resolve(__dirname, '../app')

export const discoverRoutes = (dir: string, segments: string[] = []): string[] => {
  const routes: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const name = entry.name
      if (name.startsWith('_') || name.startsWith('@')) continue
      const next = /^\(.*\)$/.test(name) ? segments : [...segments, name.replace(/^\[+\.*(.*?)\]+$/, 'x-$1')]
      routes.push(...discoverRoutes(path.join(dir, name), next))
    } else if (/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      routes.push(`/${segments.join('/')}`)
    }
  }
  return routes
}

/** Every page in the app. */
export const appRoutes = (): string[] => [...new Set(discoverRoutes(APP_DIR))]

/** The pages AuthGuard wraps (src/app/(user)/layout.tsx). */
export const guardedRoutes = (): string[] => [...new Set(discoverRoutes(path.join(APP_DIR, '(user)')))]
