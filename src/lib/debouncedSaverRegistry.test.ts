import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetSessionSavers, sessionDebouncedSaver, setFailedAway } from './debouncedSaverRegistry'
import type { DebouncedSaveOptions } from './debouncedSaver'

type Edits = Record<string, { draftScore?: number | null; feedback?: string }>
const mergeEdits = (a: Edits, b: Edits): Edits => {
  const out: Edits = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = { ...out[k], ...v }
  return out
}

interface Call {
  value: Edits
  opts: DebouncedSaveOptions
  resolve: () => void
  reject: (err: unknown) => void
}

function server() {
  const calls: Call[] = []
  const save = vi.fn(
    (value: Edits, opts: DebouncedSaveOptions) =>
      new Promise<void>((resolve, reject) => {
        calls.push({ value, opts, resolve, reject })
      }),
  )
  return { calls, save }
}

const page = () => ({
  win: new EventTarget(),
  doc: Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState }),
})

beforeEach(() => {
  vi.useFakeTimers()
  resetSessionSavers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('sessionDebouncedSaver', () => {
  it('one saver per key for the whole session', () => {
    const notify = vi.fn()
    const a = sessionDebouncedSaver<Edits>('grading:u1:item1', { notify })
    const b = sessionDebouncedSaver<Edits>('grading:u1:item1', { notify })
    const c = sessionDebouncedSaver<Edits>('grading:u1:item2', { notify })
    expect(a).toBe(b)
    expect(c).not.toBe(a)
  })
})

describe('leaving never loses a score or feedback', () => {
  it('a save that fails after the view is gone is kept, announced, and retried on return', async () => {
    const notify = vi.fn()
    const { calls, save } = server()
    const key = 'grading:u1:item1'
    const saver = sessionDebouncedSaver<Edits>(key, { notify })
    saver.setHandlers({ save, merge: mergeEdits })
    setFailedAway(key, (failed) => `${Object.keys((failed as Edits) ?? {}).length} grading change didn't save.`)

    // The teacher types a score and feedback, then leaves through a link.
    const view = page()
    const disconnect = saver.connect(view.win, view.doc)
    saver.schedule({ s1: { draftScore: 8 } })
    saver.schedule({ s1: { feedback: 'Clear labels.' } })
    disconnect()
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ value: { s1: { draftScore: 8, feedback: 'Clear labels.' } }, opts: {} })

    // The save fails while nobody is looking: a toast says so.
    calls[0].reject(new Error('Network down'))
    await vi.advanceTimersByTimeAsync(0)
    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledWith("1 grading change didn't save.")

    // Back on the page: the edit is still there, failed, and Retry sends it.
    const back = page()
    saver.connect(back.win, back.doc)
    expect(saver.getState()).toMatchObject({ status: 'error', error: 'Network down' })
    expect(saver.peek()).toEqual({ s1: { draftScore: 8, feedback: 'Clear labels.' } })
    const retried = saver.retry()
    expect(calls[1].value).toEqual({ s1: { draftScore: 8, feedback: 'Clear labels.' } })
    calls[1].resolve()
    await retried
    expect(saver.getState().status).toBe('saved')
  })

  it('a value still waiting when the view goes is saved, not dropped', async () => {
    const notify = vi.fn()
    const { calls, save } = server()
    const saver = sessionDebouncedSaver<Edits>('grading:u1:item1', { notify })
    saver.setHandlers({ save, merge: mergeEdits })
    const view = page()
    const disconnect = saver.connect(view.win, view.doc)
    saver.schedule({ s2: { draftScore: 7 } })
    disconnect()
    calls[0].resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(saver.getState().status).toBe('saved')
    expect(notify).not.toHaveBeenCalled()
  })

  it('a failure while the view is open shows on its pill, with no toast', async () => {
    const notify = vi.fn()
    const { calls, save } = server()
    const saver = sessionDebouncedSaver<Edits>('grading:u1:item1', { notify })
    saver.setHandlers({ save, merge: mergeEdits })
    const view = page()
    saver.connect(view.win, view.doc)
    saver.schedule({ s1: { draftScore: 5 } })
    const flushed = saver.flush()
    calls[0].reject(new Error('500'))
    await flushed
    expect(saver.getState().status).toBe('error')
    expect(notify).not.toHaveBeenCalled()
  })

  it('pagehide sends with keepalive', () => {
    const { calls, save } = server()
    const saver = sessionDebouncedSaver<Edits>('grading:u1:item1', { notify: vi.fn() })
    saver.setHandlers({ save, merge: mergeEdits })
    const view = page()
    saver.connect(view.win, view.doc)
    saver.schedule({ s1: { feedback: 'Neat.' } })
    view.win.dispatchEvent(new Event('pagehide'))
    expect(calls[0].opts).toEqual({ keepalive: true })
  })
})
