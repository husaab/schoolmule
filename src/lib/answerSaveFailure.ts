// src/lib/answerSaveFailure.ts
// What a refused typed-answer autosave means. A save the server answers with
// 409 ITEM_CLOSED (the due time passed, or the work was graded) or 409
// ALREADY_SUBMITTED (turned in from another tab or device) is not a failure to
// retry: it will be refused every time. The page says why, reloads to show the
// true state, and keeps the refused words where the student can copy them (here,
// for this browser tab, so they survive the page reloading or the student leaving).
// Any other failure (a server error, no connection) stays an ordinary failed
// save with Retry. Pure, so it is unit-tested (answerSaveFailure.test.ts).

const CLOSED_FALLBACK = 'This assignment is closed. Ask your teacher.'
const ALREADY_TURNED_IN = 'This was already turned in, so your last words were not saved.'
const NOT_SAVED = 'Your last words were not saved.'

/** Set when the server will not take this answer (and will not take it again). */
export interface SettledAnswerSave {
  /** Plain words for the student: why, and that the last words were not saved. */
  message: string
}

const field = (err: unknown, key: string): unknown =>
  typeof err === 'object' && err !== null ? (err as Record<string, unknown>)[key] : undefined

/** The verdict on a failed save: settled (stop retrying, explain, reload), or null (a failure to retry). */
export function classifyAnswerSaveError(err: unknown): SettledAnswerSave | null {
  const code = field(err, 'code')
  if (code === 'ALREADY_SUBMITTED') return { message: ALREADY_TURNED_IN }
  if (code === 'ITEM_CLOSED') {
    const said = field(err, 'message')
    const reason = typeof said === 'string' && said.trim() ? said.trim() : CLOSED_FALLBACK
    return { message: `${reason} ${NOT_SAVED}` }
  }
  return null
}

export interface RefusedAnswer {
  text: string
  message: string
}

// The words a refused save left behind, by saver key ("answer:{user}:{item}"). Kept in this browser tab's
// sessionStorage so they survive the page reloading, with a plain Map when storage is not available.
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const PREFIX = 'sm.refusedAnswer.v1:'
const fallback = new Map<string, RefusedAnswer>()
let override: Store | null | undefined

function storage(): Store | null {
  if (override !== undefined) return override
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null // blocked storage
  }
}

/** Tests only: use this storage (or none: null), or `undefined` to go back to sessionStorage. */
export const setRefusedAnswerStorage = (store: Store | null | undefined): void => {
  override = store
  fallback.clear()
}

/** Keep the refused words. A blank answer has nothing to rescue. */
export function rememberRefusedAnswer(key: string, text: string, message: string): void {
  if (!text.trim()) return
  const value: RefusedAnswer = { text, message }
  fallback.set(key, value)
  try {
    storage()?.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the in-memory copy still serves this visit.
  }
}

export function recallRefusedAnswer(key: string): RefusedAnswer | null {
  try {
    const raw = storage()?.getItem(PREFIX + key)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RefusedAnswer>
      if (typeof parsed.text === 'string' && typeof parsed.message === 'string') return { text: parsed.text, message: parsed.message }
    }
  } catch {
    // Unreadable: fall back to the in-memory copy.
  }
  return fallback.get(key) ?? null
}

export function forgetRefusedAnswer(key: string): void {
  fallback.delete(key)
  try {
    storage()?.removeItem(PREFIX + key)
  } catch {
    // Nothing more to do.
  }
}
