// The catalog: every tour file is imported (so it is registered), every tour
// is valid, and ids are unique.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { allTours, tourProblems } from './index'
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
