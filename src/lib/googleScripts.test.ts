import { afterEach, describe, expect, it, vi } from 'vitest'

// A minimal document: just enough for loadScript to append <script> tags and
// for the test to fire their load/error events.
type FakeScript = { src: string; async: boolean; onload?: () => void; onerror?: () => void; remove: () => void }

const setupDocument = () => {
  const appended: FakeScript[] = []
  vi.stubGlobal('document', {
    createElement: () => {
      const el: FakeScript = { src: '', async: false, remove: () => appended.splice(appended.indexOf(el), 1) }
      return el
    },
    head: { appendChild: (el: FakeScript) => appended.push(el) },
  })
  return appended
}

const freshModule = async () => {
  vi.resetModules()
  return import('./googleScripts')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadScript', () => {
  it('appends one tag per script and makes a second caller wait for the same load', async () => {
    const appended = setupDocument()
    const { loadScript, GIS_SRC } = await freshModule()

    let firstDone = false
    const first = loadScript(GIS_SRC).then(() => { firstDone = true })
    const second = loadScript(GIS_SRC)

    expect(appended).toHaveLength(1)
    expect(appended[0]).toMatchObject({ src: GIS_SRC, async: true })

    // Still loading: neither caller may resolve before the script runs.
    await Promise.resolve()
    expect(firstDone).toBe(false)

    appended[0].onload?.()
    await expect(Promise.all([first, second])).resolves.toBeDefined()
    expect(firstDone).toBe(true)
  })

  it('lets a later call retry after a failed load', async () => {
    const appended = setupDocument()
    const { loadScript, GIS_SRC } = await freshModule()

    const failed = loadScript(GIS_SRC)
    appended[0].onerror?.()
    await expect(failed).rejects.toThrow(/Could not load/)
    expect(appended).toHaveLength(0)

    const retry = loadScript(GIS_SRC)
    expect(appended).toHaveLength(1)
    appended[0].onload?.()
    await expect(retry).resolves.toBeUndefined()
  })
})
