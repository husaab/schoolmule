// The catalog: every tour file is imported (so it is registered), every tour
// is valid, and ids are unique.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { allTours, getTour, isAudience, pickOffer, tourProblems, type TourCtx } from './index'
import { CATALOG as CATALOG_FOR_TEST } from './catalog'

const dir = join(__dirname, 'catalog')

describe('tour catalog', () => {
  it('imports every tour file', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.test.ts'))
    const index = readFileSync(join(dir, 'index.ts'), 'utf8')
    for (const f of files) expect(index, `catalog/index.ts doesn't import ${f}`).toContain(`'./${f.replace(/\.ts$/, '')}'`)
    expect(CATALOG_FOR_TEST.length).toBe(files.length)
  })

  it('has unique ids, all registered and valid', () => {
    const ids = CATALOG_FOR_TEST.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(allTours().map((t) => t.id).sort()).toEqual([...ids].sort())
    for (const t of CATALOG_FOR_TEST) expect(tourProblems(t)).toEqual([])
  })
})

describe('tourProblems', () => {
  it('names what is wrong with a broken tour', () => {
    const problems = tourProblems({
      id: 'Bad Id',
      version: 0,
      audience: { roles: [] },
      offer: { kind: 'feature', title: '', blurb: '' },
      steps: [
        { id: 'a', kind: 'click', target: null, title: 'A', body: 'A' },
        { id: 'a', kind: 'look', target: 'x', title: 'B', body: 'B', where: { surface: 'nope' } },
      ],
    })
    expect(problems.join('\n')).toMatch(/lowercase/)
    expect(problems.join('\n')).toMatch(/version/)
    expect(problems.join('\n')).toMatch(/needs a target/)
    expect(problems.join('\n')).toMatch(/unique/)
    expect(problems.join('\n')).toMatch(/surface "nope"/)
    expect(problems.join('\n')).toMatch(/feature tour needs offer.from/)
  })
})

describe('progress-report-layout', () => {
  const at = (user: TourCtx['user'], userCreatedAt = '2026-09-01T12:00:00Z'): TourCtx => ({
    now: new Date('2026-11-23T15:00:00Z'),
    platform: 'web',
    user,
    userCreatedAt,
    impersonating: false,
    blocked: false,
    here: 'home',
  })
  const office = { role: 'ADMIN', isFullAdmin: true, school: 'ALHAADIACADEMY' }

  it('is for staff who can set up the school', () => {
    const def = getTour('progress-report-layout')!
    expect(isAudience(def, at(office))).toBe(true)
    expect(isAudience(def, at({ role: 'TEACHER', permissions: ['school_setup'], isFullAdmin: false }))).toBe(true)
    expect(isAudience(def, at({ role: 'TEACHER', permissions: ['students'], isFullAdmin: false }))).toBe(false)
    expect(isAudience(def, at({ role: 'PARENT' }))).toBe(false)
  })

  it('greets the office on the home page once meetings setup has had its turn', () => {
    expect(pickOffer(at(office), {}, allTours(), false)?.id).toBe('meetings-setup')
    const seen = { tourId: 'meetings-setup', version: 1, status: 'dismissed' as const, stepIndex: 0, snoozedUntil: null, completedAt: null }
    expect(pickOffer(at(office), { 'meetings-setup': seen }, allTours(), false)?.id).toBe('progress-report-layout')
    // An account made since the feature launched gets the welcome tour, and finds this one under ?.
    expect(pickOffer(at(office, '2026-11-23T12:00:00Z'), { 'meetings-setup': seen }, allTours(), false)?.id).toBe('welcome-staff')
  })
})
