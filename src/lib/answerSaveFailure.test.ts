import { describe, it, expect, beforeEach } from 'vitest'
import {
  classifyAnswerSaveError,
  clearRefusedAnswers,
  forgetRefusedAnswer,
  recallRefusedAnswer,
  rememberRefusedAnswer,
  setRefusedAnswerStorage,
} from './answerSaveFailure'

const apiError = (code: string | null, message: string, status = 409) => Object.assign(new Error(message), { name: 'ApiError', status, code })

describe('classifyAnswerSaveError', () => {
  it('treats a 409 ALREADY_SUBMITTED as settled, in plain words', () => {
    const verdict = classifyAnswerSaveError(apiError('ALREADY_SUBMITTED', "You've turned this in. Unsubmit it to make changes."))
    expect(verdict).toEqual({ message: 'This was already turned in, so your last words were not saved.' })
  })

  it('treats a 409 ITEM_CLOSED as settled and gives the server\'s reason', () => {
    expect(classifyAnswerSaveError(apiError('ITEM_CLOSED', 'This assignment is closed. Ask your teacher.'))).toEqual({
      message: 'This assignment is closed. Ask your teacher. Your last words were not saved.',
    })
    expect(classifyAnswerSaveError(apiError('ITEM_CLOSED', 'Your teacher has already graded this.'))).toEqual({
      message: 'Your teacher has already graded this. Your last words were not saved.',
    })
  })

  it('falls back to a plain reason when the server sent none', () => {
    expect(classifyAnswerSaveError(apiError('ITEM_CLOSED', ''))).toEqual({
      message: 'This assignment is closed. Ask your teacher. Your last words were not saved.',
    })
  })

  it('leaves every other failure to be retried: a server error, a bad answer, no connection', () => {
    expect(classifyAnswerSaveError(apiError(null, 'Boom', 500))).toBeNull()
    expect(classifyAnswerSaveError(apiError('TEXT_TOO_LONG', 'Too long', 400))).toBeNull()
    expect(classifyAnswerSaveError(apiError(null, 'Conflict', 409))).toBeNull()
    expect(classifyAnswerSaveError(new TypeError('Failed to fetch'))).toBeNull()
    expect(classifyAnswerSaveError('nope')).toBeNull()
    expect(classifyAnswerSaveError(null)).toBeNull()
  })
})

describe('refused answers', () => {
  beforeEach(() => {
    setRefusedAnswerStorage(null) // no browser storage here: the in-memory copy
    forgetRefusedAnswer('answer:u1:i1')
  })

  it('keeps the words a refused save left behind, with the reason', () => {
    rememberRefusedAnswer('answer:u1:i1', 'Plant cells have a wall.', 'Closed.')
    expect(recallRefusedAnswer('answer:u1:i1')).toEqual({ text: 'Plant cells have a wall.', message: 'Closed.' })
  })

  it('is per student and item', () => {
    rememberRefusedAnswer('answer:u1:i1', 'a', 'x')
    expect(recallRefusedAnswer('answer:u1:i2')).toBeNull()
    expect(recallRefusedAnswer('answer:u2:i1')).toBeNull()
  })

  it('takes the newest words', () => {
    rememberRefusedAnswer('answer:u1:i1', 'first', 'x')
    rememberRefusedAnswer('answer:u1:i1', 'second', 'y')
    expect(recallRefusedAnswer('answer:u1:i1')).toEqual({ text: 'second', message: 'y' })
  })

  it('forgets on request', () => {
    rememberRefusedAnswer('answer:u1:i1', 'a', 'x')
    forgetRefusedAnswer('answer:u1:i1')
    expect(recallRefusedAnswer('answer:u1:i1')).toBeNull()
  })

  it('does not keep a blank answer: there is nothing to rescue', () => {
    rememberRefusedAnswer('answer:u1:i1', '   ', 'x')
    expect(recallRefusedAnswer('answer:u1:i1')).toBeNull()
  })
})

describe('refused answers in the tab\'s storage', () => {
  const makeStorage = () => {
    const data = new Map<string, string>()
    return {
      data,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    }
  }

  it('survives the page reloading (a new module state reads the same storage)', () => {
    const storage = makeStorage()
    setRefusedAnswerStorage(storage)
    rememberRefusedAnswer('answer:u1:i1', 'Words I wrote.', 'Closed.')
    setRefusedAnswerStorage(storage) // what a reload does: nothing in memory, the same tab storage
    expect(recallRefusedAnswer('answer:u1:i1')).toEqual({ text: 'Words I wrote.', message: 'Closed.' })
  })

  it('is removed from storage when forgotten', () => {
    const storage = makeStorage()
    setRefusedAnswerStorage(storage)
    rememberRefusedAnswer('answer:u1:i1', 'a', 'x')
    forgetRefusedAnswer('answer:u1:i1')
    expect(storage.data.size).toBe(0)
    expect(recallRefusedAnswer('answer:u1:i1')).toBeNull()
  })

  it('still works when storage throws (blocked or full)', () => {
    setRefusedAnswerStorage({
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('full') },
      removeItem: () => { throw new Error('blocked') },
    })
    rememberRefusedAnswer('answer:u1:i1', 'kept in memory', 'x')
    expect(recallRefusedAnswer('answer:u1:i1')).toEqual({ text: 'kept in memory', message: 'x' })
  })

  it('is all removed when a session ends, for every student and item, and nothing else is touched', () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
      key: (i: number) => [...data.keys()][i] ?? null,
      get length() {
        return data.size
      },
    }
    setRefusedAnswerStorage(storage)
    storage.setItem('sm.filters.v1:u1:none:/student/todo', 'tab=missing')
    rememberRefusedAnswer('answer:u1:i1', 'a', 'x')
    rememberRefusedAnswer('answer:u2:i9', 'b', 'y')
    // Written by an earlier page load, so this module's memory never saw it.
    storage.setItem('sm.refusedAnswer.v1:answer:u3:i3', JSON.stringify({ text: 'c', message: 'z' }))

    clearRefusedAnswers()

    expect(recallRefusedAnswer('answer:u1:i1')).toBeNull()
    expect(recallRefusedAnswer('answer:u2:i9')).toBeNull()
    expect(recallRefusedAnswer('answer:u3:i3')).toBeNull()
    expect([...data.keys()]).toEqual(['sm.filters.v1:u1:none:/student/todo'])
  })

  it('clears the in-memory copies too when the storage cannot be listed', () => {
    setRefusedAnswerStorage(null)
    rememberRefusedAnswer('answer:u1:i1', 'a', 'x')
    clearRefusedAnswers()
    expect(recallRefusedAnswer('answer:u1:i1')).toBeNull()
  })

  it('does not throw when storage is blocked', () => {
    setRefusedAnswerStorage({
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    })
    rememberRefusedAnswer('answer:u1:i1', 'kept in memory', 'x')
    expect(() => clearRefusedAnswers()).not.toThrow()
    expect(recallRefusedAnswer('answer:u1:i1')).toBeNull()
  })

  it('ignores a damaged entry', () => {
    const storage = makeStorage()
    setRefusedAnswerStorage(storage)
    storage.setItem('sm.refusedAnswer.v1:answer:u1:i1', '{not json')
    expect(recallRefusedAnswer('answer:u1:i1')).toBeNull()
  })
})
