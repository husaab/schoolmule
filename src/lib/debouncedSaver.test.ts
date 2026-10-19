import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedSaver, PartialDebouncedSaveError, type DebouncedSaveOptions } from './debouncedSaver'

interface Call<T> {
  value: T
  opts: DebouncedSaveOptions
  resolve: () => void
  reject: (err: unknown) => void
}

function setup<T>(merge?: (a: T, b: T) => T, delayMs?: number) {
  const calls: Call<T>[] = []
  const save = vi.fn(
    (value: T, opts: DebouncedSaveOptions) =>
      new Promise<void>((resolve, reject) => {
        calls.push({ value, opts, resolve, reject })
      }),
  )
  const saver = createDebouncedSaver<T>({ save, merge, delayMs })
  const win = new EventTarget()
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState })
  return { calls, save, saver, win, doc }
}

type Edits = Record<string, { score?: number | null; feedback?: string }>
const mergeEdits = (a: Edits, b: Edits): Edits => {
  const out: Edits = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = { ...out[k], ...v }
  return out
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('createDebouncedSaver', () => {
  it('saves 600 ms after the last change, once, with the latest value', async () => {
    const { calls, saver } = setup<string>()
    saver.schedule('H')
    vi.advanceTimersByTime(300)
    saver.schedule('Hi')
    vi.advanceTimersByTime(599)
    expect(calls).toHaveLength(0)
    expect(saver.getState().status).toBe('saving')
    vi.advanceTimersByTime(1)
    expect(calls.map((c) => c.value)).toEqual(['Hi'])
    calls[0].resolve()
    await vi.runAllTimersAsync()
    expect(saver.getState().status).toBe('saved')
    expect(calls).toHaveLength(1)
  })

  it('takes a custom delay', () => {
    const { calls, saver } = setup<string>(undefined, 1000)
    saver.schedule('a')
    vi.advanceTimersByTime(999)
    expect(calls).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(calls).toHaveLength(1)
  })

  it('flush saves at once and resolves when the save is done', async () => {
    const { calls, saver } = setup<string>()
    saver.schedule('x')
    let done = false
    void saver.flush().then(() => {
      done = true
    })
    expect(calls).toHaveLength(1)
    expect(calls[0].opts).toEqual({})
    await Promise.resolve()
    expect(done).toBe(false)
    calls[0].resolve()
    await vi.runAllTimersAsync()
    expect(done).toBe(true)
    // The debounce timer was cancelled: nothing goes out twice.
    expect(calls).toHaveLength(1)
  })

  it('flush with nothing pending resolves at once and sends nothing', async () => {
    const { calls, saver } = setup<string>()
    await saver.flush()
    expect(calls).toHaveLength(0)
  })

  it('a change made while a save is in flight goes out next, latest wins', async () => {
    const { calls, saver } = setup<string>()
    saver.schedule('one')
    const first = saver.flush()
    saver.schedule('two')
    saver.schedule('three')
    const second = saver.flush() // waits for the running save
    calls[0].resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(calls.map((c) => c.value)).toEqual(['one', 'three'])
    calls[1].resolve()
    await Promise.all([first, second])
    expect(saver.getState().status).toBe('saved')
  })

  it('merges changes typed before a save goes out (score then feedback both reach the server)', async () => {
    const { calls, saver } = setup<Edits>(mergeEdits)
    saver.schedule({ s1: { score: 8 } })
    saver.schedule({ s1: { feedback: 'Nice' } })
    saver.schedule({ s2: { score: 6 } })
    void saver.flush()
    expect(calls[0].value).toEqual({ s1: { score: 8, feedback: 'Nice' }, s2: { score: 6 } })
  })

  it('a failed save keeps the value for Retry, and Retry sends it again', async () => {
    const { calls, saver } = setup<string>()
    saver.schedule('keep me')
    const flushed = saver.flush()
    calls[0].reject(new Error('Network down'))
    await flushed
    expect(saver.getState()).toMatchObject({ status: 'error', error: 'Network down' })
    expect(saver.peek()).toBe('keep me')
    const retried = saver.retry()
    expect(calls.map((c) => c.value)).toEqual(['keep me', 'keep me'])
    calls[1].resolve()
    await retried
    expect(saver.getState()).toMatchObject({ status: 'saved', error: null })
    expect(saver.peek()).toBeNull()
  })

  it('a new change after a failure carries the failed one with it (nothing older is resent over it later)', async () => {
    const { calls, saver } = setup<Edits>(mergeEdits)
    saver.schedule({ s1: { score: 5, feedback: 'Good' } })
    const flushed = saver.flush()
    calls[0].reject(new Error('500'))
    await flushed
    saver.schedule({ s1: { score: 6 } })
    expect(saver.getState().status).toBe('saving')
    void saver.flush()
    expect(calls[1].value).toEqual({ s1: { score: 6, feedback: 'Good' } })
    calls[1].resolve()
    await vi.runAllTimersAsync()
    // Retry has nothing left to resend: the 5 can never overwrite the 6.
    expect(saver.getState().status).toBe('saved')
    await saver.retry()
    expect(calls).toHaveLength(2)
  })

  it('a change typed while the failing save was in flight is kept with it', async () => {
    const { calls, saver } = setup<Edits>(mergeEdits)
    saver.schedule({ s1: { score: 5 } })
    const flushed = saver.flush()
    saver.schedule({ s1: { feedback: 'Later' } })
    calls[0].reject(new Error('500'))
    await flushed
    expect(saver.getState().status).toBe('error')
    expect(saver.peek()).toEqual({ s1: { score: 5, feedback: 'Later' } })
    expect(calls).toHaveLength(1)
  })

  it('a partial failure keeps only what did not save', async () => {
    const { calls, saver } = setup<Edits>(mergeEdits)
    saver.schedule({ s1: { score: 5 }, s2: { score: 7 } })
    const flushed = saver.flush()
    calls[0].reject(new PartialDebouncedSaveError<Edits>({ s2: { score: 7 } }, 'Student not found'))
    await flushed
    expect(saver.peek()).toEqual({ s2: { score: 7 } })
    expect(saver.getState().error).toBe('Student not found')
  })

  it('discard forgets what failed', async () => {
    const { calls, saver } = setup<string>()
    saver.schedule('bad')
    const flushed = saver.flush()
    calls[0].reject(new Error('400'))
    await flushed
    saver.discard()
    expect(saver.getState().status).toBe('saved')
    expect(saver.peek()).toBeNull()
  })

  it('cancel forgets what waits and what failed, and lets a save in flight land', async () => {
    const { calls, saver } = setup<string>()
    saver.schedule('first')
    const flushed = saver.flush()
    saver.schedule('second')
    saver.cancel()
    await vi.advanceTimersByTimeAsync(2000)
    expect(calls).toHaveLength(1)
    calls[0].resolve()
    await flushed
    expect(calls).toHaveLength(1)
    expect(saver.getState().status).toBe('saved')
    expect(saver.peek()).toBeNull()

    saver.schedule('bad')
    const again = saver.flush()
    calls[1].reject(new Error('500'))
    await again
    saver.cancel()
    expect(saver.getState().status).toBe('saved')
    expect(saver.peek()).toBeNull()
  })

  it('peek shows failed < in flight < pending, merged', async () => {
    const { calls, saver } = setup<Edits>(mergeEdits)
    saver.schedule({ s1: { score: 1 } })
    void saver.flush()
    saver.schedule({ s1: { feedback: 'f' } })
    expect(saver.peek()).toEqual({ s1: { score: 1, feedback: 'f' } })
    calls[0].resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(saver.peek()).toEqual({ s1: { feedback: 'f' } })
  })

  it('saves through the newest handlers (a view that re-rendered)', async () => {
    const { calls, saver } = setup<string>()
    const later = vi.fn(() => Promise.resolve())
    saver.setHandlers({ save: later })
    saver.schedule('x')
    await saver.flush()
    expect(calls).toHaveLength(0)
    expect(later).toHaveBeenCalledWith('x', {})
  })

  it('subscribers hear every state change', () => {
    const { saver } = setup<string>()
    const listener = vi.fn()
    const off = saver.subscribe(listener)
    saver.schedule('a')
    expect(listener).toHaveBeenCalled()
    off()
    listener.mockClear()
    saver.schedule('b')
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('leaving the page never loses a typed value', () => {
  it('disconnect (the view unmounts) saves at once with a plain request', () => {
    const { calls, saver, win, doc } = setup<string>()
    const disconnect = saver.connect(win, doc)
    saver.schedule('typed')
    disconnect()
    expect(calls).toHaveLength(1)
    expect(calls[0].opts).toEqual({})
  })

  it('pagehide sends with keepalive', () => {
    const { calls, saver, win, doc } = setup<string>()
    saver.connect(win, doc)
    saver.schedule('typed')
    win.dispatchEvent(new Event('pagehide'))
    expect(calls).toHaveLength(1)
    expect(calls[0].opts).toEqual({ keepalive: true })
  })

  it('visibilitychange to hidden sends with keepalive', () => {
    const { calls, saver, win, doc } = setup<string>()
    saver.connect(win, doc)
    saver.schedule('typed')
    doc.visibilityState = 'hidden'
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(calls[0].opts).toEqual({ keepalive: true })
  })

  it('a page hide during an in-flight save still sends the newer value', () => {
    const { calls, saver, win, doc } = setup<string>()
    saver.connect(win, doc)
    saver.schedule('first')
    void saver.flush()
    saver.schedule('second')
    win.dispatchEvent(new Event('pagehide'))
    expect(calls.map((c) => [c.value, c.opts])).toEqual([
      ['first', {}],
      ['second', { keepalive: true }],
    ])
  })

  it('a refused keepalive request is retried as a plain one', async () => {
    const { calls, saver, win, doc } = setup<string>()
    saver.connect(win, doc)
    saver.schedule('typed')
    win.dispatchEvent(new Event('pagehide'))
    calls[0].reject(new TypeError('Failed to fetch'))
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toHaveLength(2)
    expect(calls[1]).toMatchObject({ value: 'typed', opts: {} })
  })

  it('beforeunload asks while a save is pending or has failed', async () => {
    const { calls, saver, win, doc } = setup<string>()
    saver.connect(win, doc)
    const quiet = new Event('beforeunload', { cancelable: true })
    win.dispatchEvent(quiet)
    expect(quiet.defaultPrevented).toBe(false)

    saver.schedule('typed')
    const pending = new Event('beforeunload', { cancelable: true })
    win.dispatchEvent(pending)
    expect(pending.defaultPrevented).toBe(true)
    // …and the pending save goes out at once.
    expect(calls).toHaveLength(1)

    calls[0].reject(new Error('500'))
    await vi.advanceTimersByTimeAsync(0)
    const failed = new Event('beforeunload', { cancelable: true })
    win.dispatchEvent(failed)
    expect(failed.defaultPrevented).toBe(true)
  })

  it('the listeners detach after the last view disconnects', () => {
    const { calls, saver, win, doc } = setup<string>()
    const a = saver.connect(win, doc)
    const b = saver.connect(win, doc)
    a()
    saver.schedule('x')
    win.dispatchEvent(new Event('pagehide'))
    expect(calls).toHaveLength(1)
    calls[0].resolve()
    b()
    saver.schedule('y')
    win.dispatchEvent(new Event('pagehide'))
    // Not connected: only the timer will send it.
    expect(calls).toHaveLength(1)
  })
})
