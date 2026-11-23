// Every tour step points at something a web screen really has. A target is
// either a literal data-tour="name" in the source (or data-tour={… ? 'name' : undefined}
// on one item of a list), or a main-nav name from
// navTargets.ts (the sidebars and the student tab bar tag their links with it).
// Renaming a button's data-tour, or dropping it, fails here instead of
// breaking someone's walkthrough.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { allTours, stepsFor } from '@/lib/tours'
import { NAV_TOUR_TARGETS } from './navTargets'

const SRC = join(__dirname, '..', '..')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : sourceFiles(path)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

const files = sourceFiles(SRC).map((path) => ({ path, text: readFileSync(path, 'utf8') }))
const literal = new Set(
  files.flatMap(({ text }) =>
    [...text.matchAll(/data-tour=(?:"([^"]+)"|\{'([^']+)'\}|\{[^{}]*\?\s*'([^']+)'\s*:\s*undefined\})/g)].map((m) => m[1] ?? m[2] ?? m[3]),
  ),
)
const navUsers = files.filter(({ text, path }) => /data-tour=\{navTourTarget\(/.test(text) && !path.endsWith('navTargets.ts'))
const navNames = new Set(Object.values(NAV_TOUR_TARGETS))
const onScreen = new Set([...literal, ...(navUsers.length ? navNames : [])])

describe('tour targets (web)', () => {
  it('the main nav carries its tour names', () => {
    const where = navUsers.map(({ path }) => relative(SRC, path)).sort()
    expect(where).toEqual(['components/sidebar/Sidebar.tsx', 'components/studentPortal/StudentBottomNav.tsx', 'components/studentPortal/StudentSidebar.tsx'])
  })

  for (const tour of allTours()) {
    it(`${tour.id}: every target exists on a web screen`, () => {
      const missing: string[] = []
      for (const step of stepsFor(tour, 'web')) {
        if (step.target && !onScreen.has(step.target)) missing.push(`step "${step.id}" → ${step.target}`)
        const surface = step.where?.surface
        const opener = surface ? tour.surfaces?.[surface]?.openTarget : undefined
        if (opener && !onScreen.has(opener)) missing.push(`step "${step.id}" opens with → ${opener}`)
      }
      expect(missing, `No data-tour for:\n${missing.join('\n')}`).toEqual([])
    })
  }
})
