import { describe, it, expect } from 'vitest'
import { categoryFlag, isFullWidthTab, readGridDensity, scoreTone, writeGridDensity } from './gradesLayout'

describe('isFullWidthTab', () => {
  it('gives only the Grades tab the whole page width', () => {
    expect(isFullWidthTab('grades')).toBe(true)
    for (const tab of ['stream', 'classwork', 'people', 'settings'] as const) expect(isFullWidthTab(tab)).toBe(false)
  })
})

describe('scoreTone', () => {
  it('colours a percentage by band, grey when there is nothing yet', () => {
    expect(scoreTone(null)).toBe('text-slate-400')
    expect(scoreTone(80)).toBe('text-emerald-700')
    expect(scoreTone(79.9)).toBe('text-slate-900')
    expect(scoreTone(70)).toBe('text-slate-900')
    expect(scoreTone(69.9)).toBe('text-amber-700')
    expect(scoreTone(60)).toBe('text-amber-700')
    expect(scoreTone(59.9)).toBe('text-rose-700')
    expect(scoreTone(0)).toBe('text-rose-700')
  })
})

describe('categoryFlag', () => {
  it('spells out what is inside a category instead of a coloured dot', () => {
    expect(categoryFlag('missing')).toEqual({ text: 'Missing work', className: 'text-rose-700' })
    expect(categoryFlag('waiting')).toEqual({ text: 'To grade', className: 'text-cyan-700' })
    expect(categoryFlag(null)).toBeNull()
  })
})

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = { ...initial }
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v
    },
  }
}
const brokenStorage = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
}

describe('grid density', () => {
  it('defaults to comfortable rows', () => {
    expect(readGridDensity(memoryStorage())).toBe('comfortable')
    expect(readGridDensity(memoryStorage({ 'grades.density': 'nonsense' }))).toBe('comfortable')
    expect(readGridDensity(null)).toBe('comfortable')
  })

  it('remembers compact rows for this browser', () => {
    const store = memoryStorage()
    writeGridDensity(store, 'compact')
    expect(store.data['grades.density']).toBe('compact')
    expect(readGridDensity(store)).toBe('compact')
  })

  it('never throws when storage is blocked', () => {
    expect(readGridDensity(brokenStorage)).toBe('comfortable')
    expect(() => writeGridDensity(brokenStorage, 'compact')).not.toThrow()
  })
})
