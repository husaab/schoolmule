import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { recallRefusedAnswer, rememberRefusedAnswer, setRefusedAnswerStorage } from '@/lib/answerSaveFailure'
import { useUserStore } from './useUserStore'

// The store persists itself to localStorage, which this node test run does not have.
vi.hoisted(() => {
  const saved = new Map<string, string>()
  Object.assign(globalThis, {
    localStorage: {
      getItem: (k: string) => saved.get(k) ?? null,
      setItem: (k: string, v: string) => void saved.set(k, v),
      removeItem: (k: string) => void saved.delete(k),
    },
  })
})

// Every sign-out path (AuthGuard, the logout modal, an expired session, another tab, ending a preview) ends in
// clearUser, so a student's refused words are removed there and nowhere else needs to remember to.
describe('clearUser', () => {
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

  beforeEach(() => {
    data.clear()
    setRefusedAnswerStorage(storage)
  })
  afterEach(() => {
    setRefusedAnswerStorage(undefined)
  })

  it('forgets the words a refused save left behind, whoever wrote them', () => {
    rememberRefusedAnswer('answer:u1:i1', 'Plant cells have a wall.', 'Closed.')
    // Left by an earlier page load of the same tab, so this module's memory never saw it.
    storage.setItem('sm.refusedAnswer.v1:answer:u2:i9', JSON.stringify({ text: 'More words.', message: 'Closed.' }))

    useUserStore.getState().clearUser()

    expect(recallRefusedAnswer('answer:u1:i1')).toBeNull()
    expect(recallRefusedAnswer('answer:u2:i9')).toBeNull()
    expect(data.size).toBe(0)
  })

  it('still signs the user out', () => {
    useUserStore.getState().setUser({
      id: 'u1',
      username: 'amal',
      role: 'STUDENT',
      email: null,
      school: 'Example School',
      isVerifiedEmail: true,
      isVerifiedSchool: true,
      activeTerm: null,
    })
    useUserStore.getState().clearUser()
    expect(useUserStore.getState().user.id).toBeNull()
    expect(useUserStore.getState().user.role).toBeNull()
  })
})
