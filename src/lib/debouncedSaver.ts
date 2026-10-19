// src/lib/debouncedSaver.ts
// One autosaved value (D17): a teacher's draft grade and feedback, a
// student's typed answer. Each change is scheduled; it saves after a quiet
// spell (600 ms), at once on flush (a field loses focus, the student panel
// switches), and on every way out of the page. One save is in flight at a
// time; a change made meanwhile goes out next (latest wins, or `merge`
// combines it with what is still unsent). A save that fails keeps its value
// for Retry, and the next change carries it along, so an older value can
// never be resent over a newer one. A keyed value (the grading view's edits,
// one per student) can pass `split` instead: then a new change replaces only
// the failed parts it names, and the rest waits for Retry rather than riding
// along with an unrelated change (final review M1: a failed draft for one
// student must not be re-sent, unasked, over a grade typed for them since in
// the gradebook). Framework-free so these rules are
// unit-tested (debouncedSaver.test.ts); src/hooks/useDebouncedSave.ts binds
// it to React.
//
// Ways out, as in the gradebook's autosave (scoreAutosaver.ts):
//   - the view unmounts: its disconnect() flushes with a plain request;
//   - pagehide, visibilitychange → hidden: flush with `keepalive`; a browser
//     that refuses the keepalive request gets the same save as a plain one;
//   - beforeunload while a save is pending or has failed: the browser asks.

import type { LifecycleTarget, VisibilityTarget } from './scoreAutosaver'

export const DEBOUNCED_SAVE_MS = 600

export interface DebouncedSaveOptions {
  keepalive?: boolean
}

export type DebouncedSaveStatus = 'saved' | 'saving' | 'error'

export interface DebouncedSaverState {
  status: DebouncedSaveStatus
  /** The last failure's message, while something is failed. */
  error: string | null
}

/**
 * Thrown by a save that saved part of its value: only `remaining` is kept
 * for Retry (e.g. one student's grade out of two).
 */
export class PartialDebouncedSaveError<T> extends Error {
  remaining: T
  constructor(remaining: T, message: string) {
    super(message)
    this.name = 'PartialDebouncedSaveError'
    this.remaining = remaining
  }
}

export interface DebouncedSaver<T> {
  getState(): DebouncedSaverState
  subscribe(listener: () => void): () => void
  /** A change: saves after the quiet spell. */
  schedule(value: T): void
  /** Save now; resolves once everything scheduled so far has saved or failed. */
  flush(opts?: DebouncedSaveOptions): Promise<void>
  /** Send what failed again (with anything newer). */
  retry(): Promise<void>
  /** Forget what failed. */
  discard(): void
  /** Forget what is waiting to be sent and what failed (a draft being thrown away); a save in flight still lands. */
  cancel(): void
  /** Everything not confirmed by the server yet (failed < in flight < pending), or null. */
  peek(): T | null
  /** Whether a save has failed, read now. */
  hasFailures(): boolean
  /** A view shows this value; the returned disconnect saves on the way out. */
  connect(win: LifecycleTarget, doc: VisibilityTarget): () => void
  /** Swap in newer save / merge functions (a React view re-renders with fresh closures). */
  setHandlers(handlers: { save?: SaveFn<T>; merge?: MergeFn<T>; split?: SplitFn<T> }): void
  /** Called after a save fails (the failed value is already kept). */
  onFailed(handler: (message: string) => void): () => void
  /** Some view is showing this value (between connect and its disconnect). */
  isConnected(): boolean
}

type SaveFn<T> = (value: T, opts: DebouncedSaveOptions) => Promise<void>
type MergeFn<T> = (older: T, newer: T) => T
/** What of a failed value a newer change does not replace (null: nothing left). */
type SplitFn<T> = (failed: T, newer: T) => T | null

interface Timers {
  set: (fn: () => void, ms: number) => unknown
  clear: (handle: unknown) => void
}

const defaultTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
}

const LEAVE_WARNING = 'Some changes have not saved yet. Leave anyway?'

const messageOf = (err: unknown) => (err instanceof Error && err.message ? err.message : 'Could not save')

const newest = <T,>(_older: T, newer: T): T => newer

export function createDebouncedSaver<T>({
  save: initialSave,
  merge: initialMerge,
  split: initialSplit,
  delayMs = DEBOUNCED_SAVE_MS,
  timers = defaultTimers,
}: {
  save: SaveFn<T>
  /** Combines an older unsent value with a newer one (default: the newer wins). */
  merge?: MergeFn<T>
  /** A keyed value: a new change takes over only the failed parts it names; the rest waits for Retry. */
  split?: SplitFn<T>
  delayMs?: number
  timers?: Timers
}): DebouncedSaver<T> {
  let save: SaveFn<T> = initialSave
  let merge: MergeFn<T> = initialMerge ?? newest
  let split: SplitFn<T> | null = initialSplit ?? null
  let pending: T | null = null
  let inFlight: T | null = null
  let failed: { value: T; message: string } | null = null
  let snapshot: DebouncedSaverState = { status: 'saved', error: null }
  let timer: unknown = null
  let running: Promise<void> | null = null
  let connections = 0
  let detach: (() => void) | null = null
  const listeners = new Set<() => void>()
  const failedHandlers = new Set<(message: string) => void>()

  const combine = (older: T | null, newer: T | null): T | null =>
    older === null ? newer : newer === null ? older : merge(older, newer)

  const changed = () => {
    const status: DebouncedSaveStatus = pending !== null || inFlight !== null ? 'saving' : failed ? 'error' : 'saved'
    const error = failed ? failed.message : null
    if (status !== snapshot.status || error !== snapshot.error) snapshot = { status, error }
    listeners.forEach((l) => l())
  }

  const clearTimer = () => {
    if (timer !== null) {
      timers.clear(timer)
      timer = null
    }
  }

  const send = async (value: T, opts: DebouncedSaveOptions): Promise<void> => {
    try {
      await save(value, opts)
    } catch (err) {
      if (opts.keepalive && err instanceof TypeError) return save(value, {})
      throw err
    }
  }

  const run = async (opts: DebouncedSaveOptions) => {
    while (pending !== null) {
      inFlight = pending
      pending = null
      changed()
      try {
        await send(inFlight, opts)
        inFlight = null
        changed()
      } catch (err) {
        const remaining = err instanceof PartialDebouncedSaveError ? (err.remaining as T) : (inFlight as T)
        // A change typed while this save was in flight stays with what failed (and so does an older failure
        // a keyed change left waiting).
        failed = { value: combine(combine(failed?.value ?? null, remaining), pending) as T, message: messageOf(err) }
        pending = null
        inFlight = null
        changed()
        const message = failed.message
        failedHandlers.forEach((h) => {
          try {
            h(message)
          } catch (handlerError) {
            console.error('A save-failure handler failed:', handlerError)
          }
        })
        return
      }
    }
  }

  const flush = (opts: DebouncedSaveOptions = {}): Promise<void> => {
    clearTimer()
    if (running) {
      // The page is going away while a save is in flight: the next save
      // would never be sent, so send the newer value now as well (it stays
      // pending and goes out again, idempotently, if the page lives on).
      if (opts.keepalive && pending !== null) void send(pending, { keepalive: true }).catch(() => {})
      return running
    }
    if (pending === null) return Promise.resolve()
    running = run(opts).finally(() => {
      running = null
    })
    return running
  }

  const schedule = (value: T) => {
    if (split && failed) {
      // A keyed value: the change replaces the failed parts it names; the others wait for Retry.
      const rest = split(failed.value, value)
      failed = rest === null ? null : { value: rest, message: failed.message }
      pending = combine(pending, value)
    } else {
      // What failed rides along with the new change, under it.
      pending = combine(combine(failed?.value ?? null, pending), value)
      failed = null
    }
    changed()
    clearTimer()
    timer = timers.set(() => {
      timer = null
      void flush()
    }, delayMs)
  }

  const attach = (win: LifecycleTarget, doc: VisibilityTarget) => {
    const hide = () => void flush({ keepalive: true })
    const onVisibility = () => {
      if (doc.visibilityState === 'hidden') hide()
    }
    const onBeforeUnload = (e: Event) => {
      if (snapshot.status === 'saved') return
      if (snapshot.status === 'saving') hide()
      e.preventDefault()
      try {
        ;(e as BeforeUnloadEvent).returnValue = LEAVE_WARNING
      } catch {
        // Not a BeforeUnloadEvent (tests): preventDefault is enough.
      }
    }
    win.addEventListener('pagehide', hide)
    doc.addEventListener('visibilitychange', onVisibility)
    win.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      win.removeEventListener('pagehide', hide)
      doc.removeEventListener('visibilitychange', onVisibility)
      win.removeEventListener('beforeunload', onBeforeUnload)
    }
  }

  return {
    getState: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    schedule,
    flush,
    retry() {
      if (failed) {
        pending = combine(failed.value, pending)
        failed = null
        changed()
      }
      return flush()
    },
    discard() {
      if (!failed) return
      failed = null
      changed()
    },
    cancel() {
      clearTimer()
      if (pending === null && !failed) return
      pending = null
      failed = null
      changed()
    },
    peek: () => combine(combine(failed?.value ?? null, inFlight), pending),
    hasFailures: () => failed !== null,
    onFailed(handler) {
      failedHandlers.add(handler)
      return () => {
        failedHandlers.delete(handler)
      }
    },
    isConnected: () => connections > 0,
    setHandlers(handlers) {
      if (handlers.save) save = handlers.save
      if (handlers.merge) merge = handlers.merge
      if (handlers.split) split = handlers.split
    },
    connect(win, doc) {
      connections += 1
      if (connections === 1) detach = attach(win, doc)
      let done = false
      return () => {
        if (done) return
        done = true
        connections -= 1
        if (connections === 0 && detach) {
          detach()
          detach = null
        }
        void flush()
      }
    },
  }
}
