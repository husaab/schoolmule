import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// sessionStorage is the browser's; the store only needs it to exist.
const memory = new Map<string, string>()
vi.stubGlobal('sessionStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
})

const { useMuleyStore, setMuleyClient } = await import('./useMuleyStore')
const { TurnRefused } = await import('@/services/muleyService')
import type { StreamEvent } from '@/lib/muley/types'

const scripted = (events: StreamEvent[]) => vi.fn(async (_body: unknown, onEvent: (e: StreamEvent) => void) => { events.forEach(onEvent) })

beforeEach(() => {
  useMuleyStore.getState().reset()
  useMuleyStore.getState().claim('u1:TEACHER')
})
afterEach(() => setMuleyClient(null))

describe('the Muley store', () => {
  it('sends a message with the page, and keeps the conversation it starts', async () => {
    const streamTurn = scripted([
      { t: 'start', v: 1, conversationId: 'conv-1', turnId: 't' },
      { t: 'text', d: 'Hello.' },
      { t: 'done', reason: 'end' },
    ])
    setMuleyClient({ streamTurn })
    useMuleyStore.getState().setDraft('hi')

    await useMuleyStore.getState().send('hi', { pageContext: { route: '/dashboard', classId: null } })

    expect(streamTurn.mock.calls[0][0]).toEqual({ message: 'hi', conversationId: null, choice: null, pageContext: { route: '/dashboard', classId: null } })
    const { thread, draft } = useMuleyStore.getState()
    expect(draft).toBe('')
    expect(thread.conversationId).toBe('conv-1')
    expect(thread.status).toBe('idle')

    await useMuleyStore.getState().send('again')
    expect(streamTurn.mock.calls[1][0]).toMatchObject({ conversationId: 'conv-1' })
  })

  it('shows a refusal and a dropped connection, and can try again', async () => {
    setMuleyClient({ streamTurn: vi.fn(async () => { throw new TurnRefused(429, 'AI_LIMIT_USER_DAILY', "You've reached today's limit.") }) })
    await useMuleyStore.getState().send('one')
    expect(useMuleyStore.getState().thread.error).toEqual({ code: 'AI_LIMIT_USER_DAILY', message: "You've reached today's limit.", retryable: false })

    setMuleyClient({ streamTurn: scripted([{ t: 'start', v: 1, conversationId: 'c', turnId: 't' }, { t: 'text', d: 'partial' }]) })
    await useMuleyStore.getState().send('two')
    expect(useMuleyStore.getState().thread.error?.code).toBe('interrupted')

    const again = scripted([{ t: 'text', d: 'whole' }, { t: 'done', reason: 'end' }])
    setMuleyClient({ streamTurn: again })
    await useMuleyStore.getState().retry()
    expect(again.mock.calls[0][0]).toMatchObject({ message: 'two' })
    const messages = useMuleyStore.getState().thread.messages
    expect(messages.filter((m) => m.role === 'user').map((m) => m.role === 'user' && m.text)).toEqual(['one', 'two'])
    expect(useMuleyStore.getState().thread.error).toBeNull()
  })

  it('sends a picked option as a choice', async () => {
    const streamTurn = scripted([{ t: 'done', reason: 'end' }])
    setMuleyClient({ streamTurn })
    await useMuleyStore.getState().send('Yusuf Siddiqui', { choice: { ref: 's3' }, choicesId: 'ask', optionId: 'o2' })
    expect(streamTurn.mock.calls[0][0]).toMatchObject({ message: 'Yusuf Siddiqui', choice: { ref: 's3' } })
  })

  it('belongs to one person: another owner starts empty', async () => {
    setMuleyClient({ streamTurn: scripted([{ t: 'start', v: 1, conversationId: 'conv-1', turnId: 't' }, { t: 'done', reason: 'end' }]) })
    await useMuleyStore.getState().send('mine')
    useMuleyStore.getState().setOpen(true)
    useMuleyStore.getState().claim('u2:ADMIN')
    const state = useMuleyStore.getState()
    expect(state.thread.messages).toEqual([])
    expect(state.open).toBe(false)
    expect(state.config).toEqual({ status: 'unknown' })
  })

  it('reopens a stored conversation, lists and deletes them', async () => {
    setMuleyClient({
      getConversation: vi.fn(async () => ({ id: 'conv-9', title: 'T', messages: [{ id: '1', role: 'user' as const, text: 'hello' }, { id: '2', role: 'assistant' as const, text: 'hi' }] })),
      listConversations: vi.fn(async () => [{ id: 'conv-9', title: 'T', createdAt: '', lastMessageAt: '' }]),
      deleteConversation: vi.fn(async () => ({})),
    })
    await useMuleyStore.getState().openConversation('conv-9')
    expect(useMuleyStore.getState().thread.messages).toHaveLength(2)
    await useMuleyStore.getState().loadConversations()
    expect(useMuleyStore.getState().conversations).toHaveLength(1)
    await useMuleyStore.getState().deleteConversation('conv-9')
    expect(useMuleyStore.getState().conversations).toEqual([])
    expect(useMuleyStore.getState().thread.conversationId).toBeNull()
  })

  it('treats a failed settings check as off', async () => {
    setMuleyClient({ getMuleySettings: vi.fn(async () => { throw new Error('offline') }) })
    await useMuleyStore.getState().loadConfig()
    expect(useMuleyStore.getState().config).toEqual({ status: 'ready', enabled: false })
  })
})
