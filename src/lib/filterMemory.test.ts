import { describe, expect, it } from 'vitest'
import {
  FILTER_MEMORY_PREFIX,
  clearFilterMemory,
  filterMemoryKey,
  hasFilterParams,
  onlyTransient,
  recallQuery,
  rememberQuery,
  rememberedHref,
  resolveQuery,
  stripTransient,
  subscribeFilterMemory,
  type MemoryStorage,
} from './filterMemory'

// Minimal in-memory Storage: vitest runs in node, no DOM.
const makeStorage = (seed: Record<string, string> = {}): MemoryStorage => {
  const map = new Map(Object.entries(seed))
  return {
    get length() {
      return map.size
    },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

describe('filterMemoryKey', () => {
  it('scopes by user, year and pathname', () => {
    expect(filterMemoryKey('u1', 'y1', '/students')).toBe(`${FILTER_MEMORY_PREFIX}u1:y1:/students`)
  })
  it('uses a placeholder when no year is selected', () => {
    expect(filterMemoryKey('u1', null, '/students')).toBe(`${FILTER_MEMORY_PREFIX}u1:none:/students`)
  })
})

describe('stripTransient / hasFilterParams / onlyTransient', () => {
  it('removes transient keys and keeps the rest in order', () => {
    expect(stripTransient('grade=2&thread=abc&q=ali')).toBe('grade=2&q=ali')
  })
  it('treats a transient-only query as having no filters', () => {
    expect(hasFilterParams('thread=abc')).toBe(false)
    expect(hasFilterParams('thread=abc&tab=announcements')).toBe(true)
    expect(hasFilterParams('')).toBe(false)
  })
  it('keeps only the transient keys', () => {
    expect(onlyTransient('grade=2&thread=abc')).toBe('thread=abc')
    expect(onlyTransient('grade=2')).toBe('')
  })
  it('honours a custom transient list', () => {
    expect(stripTransient('grade=2&step=3', ['step'])).toBe('grade=2')
  })
})

describe('rememberQuery / recallQuery', () => {
  it('round-trips a query string without its transient keys', () => {
    const storage = makeStorage()
    rememberQuery(storage, 'k', 'grade=2&thread=abc')
    expect(recallQuery(storage, 'k')).toBe('grade=2')
  })
  it('remembers an explicit clear as the empty string, distinct from never visited', () => {
    const storage = makeStorage()
    expect(recallQuery(storage, 'k')).toBeNull()
    rememberQuery(storage, 'k', '')
    expect(recallQuery(storage, 'k')).toBe('')
  })
  it('tolerates a missing storage', () => {
    expect(() => rememberQuery(null, 'k', 'a=1')).not.toThrow()
    expect(recallQuery(null, 'k')).toBeNull()
  })
  it('swallows storage write failures', () => {
    const broken: MemoryStorage = {
      ...makeStorage(),
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(() => rememberQuery(broken, 'k', 'a=1')).not.toThrow()
  })
})

describe('resolveQuery', () => {
  it('lets the URL win whenever it carries anything', () => {
    expect(resolveQuery('grade=3', 'grade=2')).toBe('grade=3')
    expect(resolveQuery('thread=abc', 'grade=2')).toBe('thread=abc')
  })
  it('re-expands a bare URL from memory', () => {
    expect(resolveQuery('', 'grade=2')).toBe('grade=2')
  })
  it('stays bare when the page was cleared or never visited', () => {
    expect(resolveQuery('', '')).toBe('')
    expect(resolveQuery('', null)).toBe('')
  })
})

describe('clearFilterMemory', () => {
  it('removes only filter-memory entries', () => {
    const storage = makeStorage({
      [`${FILTER_MEMORY_PREFIX}u1:y1:/students`]: 'grade=2',
      [`${FILTER_MEMORY_PREFIX}u2:y1:/classes`]: 'term=T2',
      impersonation_flash: 'kept',
    })
    clearFilterMemory(storage)
    expect(storage.length).toBe(1)
    expect(storage.getItem('impersonation_flash')).toBe('kept')
  })
  it('tolerates a missing storage', () => {
    expect(() => clearFilterMemory(null)).not.toThrow()
  })
})

describe('rememberedHref', () => {
  it('appends the remembered query to a bare path', () => {
    const storage = makeStorage({ k: 'grade=2' })
    expect(rememberedHref(storage, 'k', '/students')).toBe('/students?grade=2')
  })
  it('leaves a path alone when nothing (or an empty clear) is remembered', () => {
    expect(rememberedHref(makeStorage(), 'k', '/students')).toBe('/students')
    expect(rememberedHref(makeStorage({ k: '' }), 'k', '/students')).toBe('/students')
  })
  it('never touches an href that already carries a query', () => {
    expect(rememberedHref(makeStorage({ k: 'grade=2' }), 'k', '/messages?thread=x')).toBe('/messages?thread=x')
  })
})

describe('subscribeFilterMemory', () => {
  it('notifies on a changed write and on clear, not on an identical write', () => {
    const storage = makeStorage()
    let calls = 0
    const unsubscribe = subscribeFilterMemory(() => {
      calls += 1
    })
    rememberQuery(storage, `${FILTER_MEMORY_PREFIX}u:y:/a`, 'q=1')
    rememberQuery(storage, `${FILTER_MEMORY_PREFIX}u:y:/a`, 'q=1')
    expect(calls).toBe(1)
    clearFilterMemory(storage)
    expect(calls).toBe(2)
    unsubscribe()
    rememberQuery(storage, `${FILTER_MEMORY_PREFIX}u:y:/a`, 'q=2')
    expect(calls).toBe(2)
  })
})
