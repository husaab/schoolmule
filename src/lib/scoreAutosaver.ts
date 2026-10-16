// src/lib/scoreAutosaver.ts
// Drives the autosave queue (scoreAutosaveQueue.ts) for one class: a 600 ms
// debounce after the last keystroke, an immediate flush when the teacher
// leaves a cell, one save in flight at a time, and every way out of the page
// saving first. Framework-free so the "nothing is lost on the way out" rules
// are unit-tested; src/hooks/useScoreAutosave.ts binds it to React.
//
// Ways out, and what each does:
//   - the Grades view unmounts (a sidebar link, another class tab, a sub-tab
//     switch): the view's disconnect() flushes with a plain request;
//   - the page is hidden or unloaded (pagehide, visibilitychange → hidden):
//     flush with `keepalive` so the request outlives the page; a refused
//     keepalive request is retried as a plain one;
//   - beforeunload while a save is pending or has failed: the browser asks
//     the teacher to confirm, and the pending save goes out at once.
// The autosaver outlives the view (useScoreAutosave keeps one per class), so a
// save that fails after the teacher left is still there, outlined with Retry,
// when they come back to Grades.
//
// createAutosaver is generic over what a key holds: createScoreAutosaver
// queues one score per "studentId|assessmentId"; report card and progress
// comments queue one entry per student (src/lib/commentAutosave.ts).

import {
  ackBatch,
  drop as dropKey,
  emptyQueue,
  enqueue,
  failBatch,
  retryFailed,
  sameScore,
  statusOf,
  takeBatch,
  type CellValue,
  type QueueState,
} from './scoreAutosaveQueue'

export const AUTOSAVE_DEBOUNCE_MS = 600

export interface ScoreSaveItem {
  studentId: string
  assessmentId: string
  score: CellValue
}

export interface SaveOptions {
  keepalive?: boolean
}

export type SaveScores<R> = (items: ScoreSaveItem[], opts: SaveOptions) => Promise<R>

/** Saves one batch of [key, value] pairs (the latest value of each key). */
export type SaveBatch<V, R> = (batch: [string, V][], opts: SaveOptions) => Promise<R>

/** The page's window and document, or stand-ins in tests. */
export type LifecycleTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>
export type VisibilityTarget = LifecycleTarget & { visibilityState: DocumentVisibilityState }

export interface Autosaver<V, R> {
  getState(): QueueState<V>
  subscribe(listener: () => void): () => void
  /** The teacher typed `value`; `saved` (when given) lets a cell typed back to its saved value send nothing. */
  queue(key: string, value: V, saved?: V): void
  /** Save now. Resolves once everything typed so far has been saved (or has failed). */
  flush(opts?: SaveOptions): Promise<void>
  /** Send every failed value again. */
  retry(): Promise<void>
  /** Forget the unsent and failed value of one cell (it was just flagged missing/excused). */
  drop(key: string): void
  /** Called with the server's answer and the batch it answered. */
  onSaved(handler: (res: R, batch: [string, V][]) => void): () => void
  onFailed(handler: (message: string) => void): () => void
  /** A view starts showing this class's grid; the returned disconnect saves on the way out. */
  connect(win: LifecycleTarget, doc: VisibilityTarget): () => void
  isConnected(): boolean
}

export type ScoreAutosaver<R> = Autosaver<CellValue, R>

interface Timers {
  set: (fn: () => void, ms: number) => unknown
  clear: (handle: unknown) => void
}

const defaultTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
}

const LEAVE_WARNING = 'Some grades have not saved yet. Leave anyway?'

export const toScoreItem = ([key, score]: [string, CellValue]): ScoreSaveItem => {
  const [studentId, assessmentId] = key.split('|')
  return { studentId, assessmentId, score }
}

const messageOf = (err: unknown) => (err instanceof Error && err.message ? err.message : 'Could not save')

/** The score autosave: one score per "studentId|assessmentId", saved as ScoreSaveItems. */
export function createScoreAutosaver<R>({
  save,
  debounceMs,
  timers,
}: {
  save: SaveScores<R>
  debounceMs?: number
  timers?: Timers
}): ScoreAutosaver<R> {
  return createAutosaver<CellValue, R>({
    save: (batch, opts) => save(batch.map(toScoreItem), opts),
    same: sameScore,
    debounceMs,
    timers,
  })
}

export function createAutosaver<V, R>({
  save,
  same,
  debounceMs = AUTOSAVE_DEBOUNCE_MS,
  timers = defaultTimers,
}: {
  save: SaveBatch<V, R>
  /** Two values are the same (a key typed back to its saved value sends nothing). */
  same?: (a: V, b: V) => boolean
  debounceMs?: number
  timers?: Timers
}): Autosaver<V, R> {
  let state = emptyQueue<V>()
  let timer: unknown = null
  let running: Promise<void> | null = null
  let connections = 0
  let detach: (() => void) | null = null
  const listeners = new Set<() => void>()
  const savedHandlers = new Set<(res: R, batch: [string, V][]) => void>()
  const failedHandlers = new Set<(message: string) => void>()

  const commit = (next: QueueState<V>) => {
    state = next
    listeners.forEach((l) => l())
  }

  const clearTimer = () => {
    if (timer !== null) {
      timers.clear(timer)
      timer = null
    }
  }

  const send = async (batch: [string, V][], opts: SaveOptions): Promise<R> => {
    try {
      return await save(batch, opts)
    } catch (err) {
      // A browser that refuses the keepalive request (a TypeError, before
      // anything reached the server) gets the same save as a plain request.
      if (opts.keepalive && err instanceof TypeError) return save(batch, {})
      throw err
    }
  }

  // Sends batches until nothing is pending: whatever the teacher typed while
  // a batch was in flight goes in the next one.
  const run = async (opts: SaveOptions) => {
    for (;;) {
      const { state: next, batch } = takeBatch(state)
      if (batch.length === 0) return
      commit(next)
      try {
        const res = await send(batch, opts)
        savedHandlers.forEach((h) => {
          try {
            h(res, batch)
          } catch (err) {
            console.error('Applying saved scores failed:', err)
          }
        })
        commit(ackBatch(state))
      } catch (err) {
        const message = messageOf(err)
        commit(failBatch(state, message))
        failedHandlers.forEach((h) => h(message))
      }
    }
  }

  const flush = (opts: SaveOptions = {}): Promise<void> => {
    clearTimer()
    if (running) {
      // The page is going away while a batch is in flight: the next batch
      // would never be sent, so send the newer values now as well. They stay
      // pending and go out again (idempotently) if the page lives on. On a
      // real unload this request can race the in-flight one for the same key;
      // the alternative (waiting) would lose the newer value for certain.
      if (opts.keepalive) {
        const entries = Object.entries(state.pending)
        if (entries.length) void send(entries, { keepalive: true }).catch(() => {})
      }
      return running
    }
    if (Object.keys(state.pending).length === 0) return Promise.resolve()
    running = run(opts).finally(() => {
      running = null
    })
    return running
  }

  const queue = (key: string, value: V, saved?: V) => {
    if (saved !== undefined && same && same(value, saved) && !(key in state.inFlight)) {
      // Back to what the server already holds: nothing to send.
      if (key in state.pending || key in state.failed) commit(dropKey(state, key))
      return
    }
    commit(enqueue(state, key, value))
    clearTimer()
    timer = timers.set(() => {
      timer = null
      void flush()
    }, debounceMs)
  }

  const attach = (win: LifecycleTarget, doc: VisibilityTarget) => {
    const hide = () => void flush({ keepalive: true })
    const onVisibility = () => {
      if (doc.visibilityState === 'hidden') hide()
    }
    const onBeforeUnload = (e: Event) => {
      const status = statusOf(state)
      if (status === 'saved') return
      if (status === 'saving') hide()
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
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    queue,
    flush,
    retry() {
      commit(retryFailed(state))
      return flush()
    },
    drop(key) {
      commit(dropKey(state, key))
    },
    onSaved(handler) {
      savedHandlers.add(handler)
      return () => {
        savedHandlers.delete(handler)
      }
    },
    onFailed(handler) {
      failedHandlers.add(handler)
      return () => {
        failedHandlers.delete(handler)
      }
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
    isConnected: () => connections > 0,
  }
}
