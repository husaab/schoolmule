import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAutosaver, createScoreAutosaver, PartialSaveError, type SaveOptions, type ScoreSaveItem } from './scoreAutosaver'

// One fake server call: the test decides when (and how) it answers.
interface Call {
  items: ScoreSaveItem[]
  opts: SaveOptions
  resolve: (res: { status: string; data: unknown[] }) => void
  reject: (err: unknown) => void
}

function setup() {
  const calls: Call[] = []
  const save = vi.fn(
    (items: ScoreSaveItem[], opts: SaveOptions) =>
      new Promise<{ status: string; data: unknown[] }>((resolve, reject) => {
        calls.push({ items, opts, resolve, reject })
      }),
  )
  const autosaver = createScoreAutosaver({ save })
  const win = new EventTarget()
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState })
  return { calls, save, autosaver, win, doc }
}

const ok = { status: 'success', data: [] }

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('createScoreAutosaver', () => {
  it('typing "1" then "0" within 600 ms sends one value: 10', async () => {
    const { calls, autosaver } = setup()
    autosaver.queue('s1|a1', 1)
    vi.advanceTimersByTime(300)
    autosaver.queue('s1|a1', 10)
    vi.advanceTimersByTime(599)
    expect(calls).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(calls).toHaveLength(1)
    expect(calls[0].items).toEqual([{ studentId: 's1', assessmentId: 'a1', score: 10 }])
    expect(autosaver.getState().inFlight).toEqual({ 's1|a1': 10 })
  })

  it('leaving the cell (flush) saves at once, without waiting for the debounce', async () => {
    const { calls, autosaver } = setup()
    autosaver.queue('s1|a1', 7)
    void autosaver.flush()
    expect(calls).toHaveLength(1)
    expect(calls[0].opts).toEqual({})
    calls[0].resolve(ok)
    await vi.runAllTimersAsync()
    expect(autosaver.getState()).toEqual({ pending: {}, inFlight: {}, failed: {} })
    // The debounce timer was cancelled: nothing is sent twice.
    expect(calls).toHaveLength(1)
  })

  it('sends one batch at a time, then whatever was typed meanwhile (latest wins)', async () => {
    const { calls, autosaver } = setup()
    const saved = vi.fn()
    autosaver.onSaved(saved)
    autosaver.queue('s1|a1', 8)
    const done = autosaver.flush()
    autosaver.queue('s1|a1', 9)
    autosaver.queue('s2|a1', 4)
    void autosaver.flush()
    expect(calls).toHaveLength(1)
    calls[0].resolve(ok)
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toHaveLength(2)
    expect(calls[1].items).toEqual([
      { studentId: 's1', assessmentId: 'a1', score: 9 },
      { studentId: 's2', assessmentId: 'a1', score: 4 },
    ])
    calls[1].resolve(ok)
    await done // flush() resolves only once everything typed so far is saved
    expect(saved).toHaveBeenCalledTimes(2)
    expect(autosaver.getState()).toEqual({ pending: {}, inFlight: {}, failed: {} })
  })

  it('a failed save keeps the value (outlined, Retry) and Retry sends it again', async () => {
    const { calls, autosaver } = setup()
    const failed = vi.fn()
    autosaver.onFailed(failed)
    autosaver.queue('s1|a1', 8)
    const done = autosaver.flush()
    calls[0].reject(new Error('Error saving scores'))
    await done
    expect(autosaver.getState().failed).toEqual({ 's1|a1': { value: 8, message: 'Error saving scores' } })
    expect(failed).toHaveBeenCalledWith('Error saving scores')

    const retried = autosaver.retry()
    expect(calls).toHaveLength(2)
    expect(calls[1].items).toEqual([{ studentId: 's1', assessmentId: 'a1', score: 8 }])
    calls[1].resolve(ok)
    await retried
    expect(autosaver.getState().failed).toEqual({})
  })

  it('Discard forgets a rejected value for good (the cell shows the saved score again)', async () => {
    const { calls, autosaver } = setup()
    autosaver.queue('s1|a1', 12)
    const done = autosaver.flush()
    calls[0].reject(new Error('Score must be between 0 and 10 for "Quiz"'))
    await done
    expect(autosaver.getState().failed['s1|a1'].value).toBe(12)
    autosaver.discard()
    expect(autosaver.getState()).toEqual({ pending: {}, inFlight: {}, failed: {} })
    await autosaver.retry()
    expect(calls).toHaveLength(1) // nothing left to resend
  })

  it('typing a cell back to its saved value sends nothing', () => {
    const { calls, autosaver } = setup()
    autosaver.queue('s1|a1', 8, 5)
    autosaver.queue('s1|a1', 5, 5)
    vi.advanceTimersByTime(1000)
    expect(calls).toHaveLength(0)
    expect(autosaver.getState().pending).toEqual({})
    // Re-typing the saved value of an untouched cell is not a change either.
    autosaver.queue('s2|a1', 3, '3.00' as unknown as number)
    vi.advanceTimersByTime(1000)
    expect(calls).toHaveLength(0)
  })

  it('a value typed back to the saved one while the edit is in flight is still sent', async () => {
    const { calls, autosaver } = setup()
    autosaver.queue('s1|a1', 8, 5)
    void autosaver.flush()
    autosaver.queue('s1|a1', 5, 5)
    calls[0].resolve(ok)
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toHaveLength(2)
    expect(calls[1].items).toEqual([{ studentId: 's1', assessmentId: 'a1', score: 5 }])
  })
})

// The production bug this replaces: a score typed into the gradebook was
// silently lost when the teacher left through the Feedback menu or a sidebar
// link. In the Grades tab every way out saves first.
describe('leaving the Grades tab never loses a typed score', () => {
  it('unmounting (a sidebar link, another class tab, a sub-tab switch) saves at once', () => {
    const { calls, autosaver, win, doc } = setup()
    const disconnect = autosaver.connect(win, doc)
    autosaver.queue('s1|a1', 9)
    expect(calls).toHaveLength(0) // still inside the 600 ms debounce
    disconnect()
    expect(calls).toHaveLength(1)
    expect(calls[0].items).toEqual([{ studentId: 's1', assessmentId: 'a1', score: 9 }])
    expect(calls[0].opts).toEqual({})
  })

  it('the save sent on the way out survives the view being gone, and a failure is kept for Retry', async () => {
    const { calls, autosaver, win, doc } = setup()
    const disconnect = autosaver.connect(win, doc)
    autosaver.queue('s1|a1', 9)
    disconnect()
    expect(autosaver.isConnected()).toBe(false)
    calls[0].reject(new Error('Failed to fetch'))
    await autosaver.flush() // resolves once the outgoing save has settled
    // Still there when the teacher comes back to Grades (the autosaver outlives the view).
    expect(autosaver.getState().failed['s1|a1']).toEqual({ value: 9, message: 'Failed to fetch' })
  })

  it('closing or reloading the page (pagehide) sends the score with keepalive', () => {
    const { calls, autosaver, win, doc } = setup()
    autosaver.connect(win, doc)
    autosaver.queue('s1|a1', 9)
    win.dispatchEvent(new Event('pagehide'))
    expect(calls).toHaveLength(1)
    expect(calls[0].opts).toEqual({ keepalive: true })
  })

  it('hiding the tab (visibilitychange → hidden) sends the score with keepalive', () => {
    const { calls, autosaver, win, doc } = setup()
    autosaver.connect(win, doc)
    autosaver.queue('s1|a1', 9)
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(calls).toHaveLength(0)
    doc.visibilityState = 'hidden'
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(calls).toHaveLength(1)
    expect(calls[0].opts).toEqual({ keepalive: true })
  })

  it('a page hidden while a batch is in flight still sends the newer values at once', () => {
    const { calls, autosaver, win, doc } = setup()
    autosaver.connect(win, doc)
    autosaver.queue('s1|a1', 8)
    void autosaver.flush()
    autosaver.queue('s2|a1', 6)
    win.dispatchEvent(new Event('pagehide'))
    expect(calls).toHaveLength(2)
    expect(calls[1].items).toEqual([{ studentId: 's2', assessmentId: 'a1', score: 6 }])
    expect(calls[1].opts).toEqual({ keepalive: true })
  })

  it('a refused keepalive request is retried as a plain one', async () => {
    const { calls, autosaver, win, doc } = setup()
    autosaver.connect(win, doc)
    autosaver.queue('s1|a1', 9)
    win.dispatchEvent(new Event('pagehide'))
    calls[0].reject(new TypeError('Failed to fetch'))
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toHaveLength(2)
    expect(calls[1].opts).toEqual({})
    calls[1].resolve(ok)
    await vi.advanceTimersByTimeAsync(0)
    expect(autosaver.getState().failed).toEqual({})
  })

  it('beforeunload asks the browser to confirm while a save is pending or has failed', async () => {
    const { calls, autosaver, win, doc } = setup()
    autosaver.connect(win, doc)

    const idle = new Event('beforeunload', { cancelable: true })
    win.dispatchEvent(idle)
    expect(idle.defaultPrevented).toBe(false)

    autosaver.queue('s1|a1', 9)
    const busy = new Event('beforeunload', { cancelable: true })
    win.dispatchEvent(busy)
    expect(busy.defaultPrevented).toBe(true)
    expect(calls).toHaveLength(1) // and the save went out straight away

    calls[0].reject(new Error('Error saving scores'))
    await vi.advanceTimersByTimeAsync(0)
    const failed = new Event('beforeunload', { cancelable: true })
    win.dispatchEvent(failed)
    expect(failed.defaultPrevented).toBe(true)
  })

  it('stops listening once the last view disconnects', () => {
    const { calls, autosaver, win, doc } = setup()
    const a = autosaver.connect(win, doc)
    const b = autosaver.connect(win, doc)
    a()
    expect(autosaver.isConnected()).toBe(true)
    b()
    b() // a second call is a no-op
    expect(autosaver.isConnected()).toBe(false)
    autosaver.queue('s1|a1', 9)
    win.dispatchEvent(new Event('pagehide'))
    expect(calls).toHaveLength(0)
  })
})

// Report card and progress comments (controller ruling, D17): the same
// autosaver, one entry per student. Typed text must survive every way out.
describe('leaving the Grades tab never loses a typed comment', () => {
  interface Entry {
    studentId: string
    classId: string
    term: string
    workHabits?: string
    behavior?: string
    comment?: string
  }
  function setupComments() {
    const calls: { batch: [string, Entry][]; opts: SaveOptions; resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = []
    const autosaver = createAutosaver<Entry, unknown>({
      save: (batch, opts) => new Promise((resolve, reject) => calls.push({ batch, opts, resolve, reject })),
      debounceMs: 1000,
    })
    const win = new EventTarget()
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState })
    return { calls, autosaver, win, doc }
  }
  const base: Entry = { studentId: 's1', classId: 'c1', term: 'Term 1', workHabits: 'G' }

  it('unmounting while the comment is still being typed saves the whole entry at once', () => {
    const { calls, autosaver, win, doc } = setupComments()
    const disconnect = autosaver.connect(win, doc)
    autosaver.queue('s1', { ...base, comment: 'Works hard' })
    autosaver.queue('s1', { ...base, comment: 'Works hard every day.' })
    disconnect()
    expect(calls).toHaveLength(1)
    expect(calls[0].batch).toEqual([['s1', { ...base, comment: 'Works hard every day.' }]])
  })

  it('closing the page sends the comment with keepalive', () => {
    const { calls, autosaver, win, doc } = setupComments()
    autosaver.connect(win, doc)
    autosaver.queue('s1', { ...base, comment: 'Kind to classmates.' })
    win.dispatchEvent(new Event('pagehide'))
    expect(calls).toHaveLength(1)
    expect(calls[0].opts).toEqual({ keepalive: true })
    expect(calls[0].batch[0][1].comment).toBe('Kind to classmates.')
  })

  it('text typed while a save is in flight goes out next (latest wins)', async () => {
    const { calls, autosaver } = setupComments()
    autosaver.queue('s1', { ...base, comment: 'Good' })
    const done = autosaver.flush()
    autosaver.queue('s1', { ...base, comment: 'Good effort.' })
    calls[0].resolve({ status: 'success' })
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toHaveLength(2)
    expect(calls[1].batch).toEqual([['s1', { ...base, comment: 'Good effort.' }]])
    calls[1].resolve({ status: 'success' })
    await done
    expect(autosaver.getState()).toEqual({ pending: {}, inFlight: {}, failed: {} })
  })

  it('a failed save keeps the text, and Retry sends it again', async () => {
    const { calls, autosaver } = setupComments()
    autosaver.queue('s1', { ...base, comment: 'Reads every night.' })
    const done = autosaver.flush()
    calls[0].reject(new Error('Failed to save feedback'))
    await done
    expect(autosaver.getState().failed.s1.value.comment).toBe('Reads every night.')
    const retried = autosaver.retry()
    expect(calls[1].batch[0][1].comment).toBe('Reads every night.')
    calls[1].resolve({ status: 'success' })
    await retried
    expect(autosaver.getState().failed).toEqual({})
  })
})

// JK/SK competency documents (controller ruling, D17): one whole-document
// snapshot per "studentId|document". A rating or comment must survive every
// way out of the Grades tab.
describe('leaving the Grades tab never loses a JK/SK rating', () => {
  interface Doc {
    studentId: string
    doc: string
    ratings: Record<string, string>
    comments: Record<string, string>
  }
  function setupDocs() {
    const calls: { batch: [string, Doc][]; opts: SaveOptions; resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = []
    const autosaver = createAutosaver<Doc, unknown>({
      save: (batch, opts) => new Promise((resolve, reject) => calls.push({ batch, opts, resolve, reject })),
      debounceMs: 1000,
    })
    const win = new EventTarget()
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState })
    return { calls, autosaver, win, doc }
  }
  const base: Doc = { studentId: 'k1', doc: 'progress_report', ratings: { sk1: 'D' }, comments: {} }

  it('picking a rating and leaving at once (sidebar, class tab) saves the document', () => {
    const { calls, autosaver, win, doc } = setupDocs()
    const disconnect = autosaver.connect(win, doc)
    autosaver.queue('k1|progress_report', { ...base, ratings: { sk1: 'D', sk2: 'B' } })
    disconnect()
    expect(calls).toHaveLength(1)
    expect(calls[0].batch).toEqual([['k1|progress_report', { ...base, ratings: { sk1: 'D', sk2: 'B' } }]])
  })

  it('closing the page sends it with keepalive', () => {
    const { calls, autosaver, win, doc } = setupDocs()
    autosaver.connect(win, doc)
    autosaver.queue('k1|progress_report', { ...base, comments: { d1: 'Counts to 20.' } })
    win.dispatchEvent(new Event('pagehide'))
    expect(calls[0].opts).toEqual({ keepalive: true })
  })

  it('the newest document wins, and switching student keeps both students apart', async () => {
    const { calls, autosaver } = setupDocs()
    autosaver.queue('k1|progress_report', { ...base, ratings: { sk1: 'B' } })
    autosaver.queue('k1|progress_report', { ...base, ratings: { sk1: 'I' } })
    autosaver.queue('k2|progress_report', { ...base, studentId: 'k2', ratings: { sk1: 'D' } })
    void autosaver.flush()
    expect(calls[0].batch).toEqual([
      ['k1|progress_report', { ...base, ratings: { sk1: 'I' } }],
      ['k2|progress_report', { ...base, studentId: 'k2', ratings: { sk1: 'D' } }],
    ])
  })

  it('one failing document in a batch does not mark the others failed', async () => {
    const { calls, autosaver } = setupDocs()
    autosaver.queue('k1|progress_report', base)
    autosaver.queue('k2|progress_report', { ...base, studentId: 'k2' })
    const done = autosaver.flush()
    calls[0].reject(new PartialSaveError(['k1|progress_report'], 'Failed to save'))
    await done
    expect(Object.keys(autosaver.getState().failed)).toEqual(['k1|progress_report'])
    expect(autosaver.getState().inFlight).toEqual({})
  })

  it('a failed save keeps the document for Retry (or Discard)', async () => {
    const { calls, autosaver } = setupDocs()
    autosaver.queue('k1|report_card', { ...base, doc: 'report_card', comments: { d1: 'Shares toys.' } })
    const done = autosaver.flush()
    calls[0].reject(new Error('Failed to save'))
    await done
    expect(autosaver.getState().failed['k1|report_card'].value.comments.d1).toBe('Shares toys.')
    const retried = autosaver.retry()
    expect(calls[1].batch[0][1].comments.d1).toBe('Shares toys.')
    calls[1].resolve(undefined)
    await retried
    expect(autosaver.getState().failed).toEqual({})
  })
})
