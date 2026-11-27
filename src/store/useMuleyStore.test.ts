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
const { ApiError } = await import('@/services/apiClient')
const { onDataChange } = await import('@/lib/muley/dataChanges')
import type { ProposedAction, StreamEvent } from '@/lib/muley/types'

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

describe('prepared changes', () => {
  const action = (over: Partial<ProposedAction> = {}): ProposedAction => ({
    id: 'a1', kind: 'scores', status: 'pending', title: 'Quiz 1 · Math', hash: 'h1', expiresAt: '2026-11-28T12:00:00.000Z',
    applyLabel: 'Save 2 scores', doneLabel: 'Saved 2 scores', undoLabel: 'Undo', undoneLabel: 'Undone. 2 scores put back as they were.',
    canUndo: false, topics: ['scores:class-1'], error: null, ...over,
  })
  const prepare = async (prepared = action()) => {
    setMuleyClient({ streamTurn: scripted([{ t: 'start', v: 1, conversationId: 'c', turnId: 't' }, { t: 'action', action: prepared }, { t: 'done', reason: 'end' }]) })
    await useMuleyStore.getState().send('enter the marks')
  }
  const entry = () => useMuleyStore.getState().thread.actions.a1

  it('saves with the hash it was shown, then tells open pages what changed', async () => {
    await prepare()
    const heard: string[][] = []
    const stop = onDataChange((topics) => heard.push(topics))
    const applyAction = vi.fn(async () => action({ status: 'applied', canUndo: true }))
    setMuleyClient({ applyAction })

    await useMuleyStore.getState().applyAction('a1')
    stop()

    expect(applyAction).toHaveBeenCalledWith('a1', 'h1', expect.any(String))
    expect(entry()).toMatchObject({ busy: null, problem: null, action: { status: 'applied' } })
    expect(heard).toEqual([['scores:class-1']])
  })

  it('shows the students that changed since the preview, and saves nothing', async () => {
    await prepare()
    const conflicts = [{ name: 'Yusuf', was: '14 / 20', now: '16 / 20' }]
    setMuleyClient({ applyAction: vi.fn(async () => { throw new ApiError('Some of these changed after Muley showed you the preview, so nothing was saved.', { status: 409, code: 'STALE', data: { conflicts } }) }) })

    await useMuleyStore.getState().applyAction('a1')

    expect(entry()).toMatchObject({ busy: null, action: { status: 'pending' }, problem: { code: 'STALE', conflicts } })
  })

  it('takes the change as the server says it now stands (expired)', async () => {
    await prepare()
    setMuleyClient({ applyAction: vi.fn(async () => { throw new ApiError('This preview is out of date.', { status: 410, code: 'EXPIRED', data: { action: action({ status: 'expired' }) } }) }) })
    await useMuleyStore.getState().applyAction('a1')
    expect(entry()).toMatchObject({ action: { status: 'expired' }, problem: { code: 'EXPIRED' } })
  })

  it('sends the same key again after a dropped connection, and a new one for the next press', async () => {
    await prepare()
    const keys: string[] = []
    const applyAction = vi.fn(async (_id: string, _hash: string, key: string) => {
      keys.push(key)
      if (keys.length === 1) throw new TypeError('Failed to fetch')
      return action({ status: 'applied', canUndo: true })
    })
    setMuleyClient({ applyAction })

    await useMuleyStore.getState().applyAction('a1')
    expect(entry().problem).toMatchObject({ code: 'offline' })
    await useMuleyStore.getState().applyAction('a1')

    expect(keys).toHaveLength(2)
    expect(keys[1]).toBe(keys[0])

    const undoKeys: string[] = []
    setMuleyClient({ undoAction: vi.fn(async (_id: string, key: string) => { undoKeys.push(key); return action({ status: 'undone' }) }) })
    await useMuleyStore.getState().undoAction('a1')
    expect(undoKeys[0]).not.toBe(keys[0])
    expect(entry().action.status).toBe('undone')
  })

  it('only presses what the change allows: no save twice, no undo before a save, dismiss only while pending', async () => {
    await prepare(action({ status: 'applied', canUndo: false }))
    const applyAction = vi.fn()
    const undoAction = vi.fn()
    const dismissAction = vi.fn()
    setMuleyClient({ applyAction, undoAction, dismissAction })

    await useMuleyStore.getState().applyAction('a1')
    await useMuleyStore.getState().undoAction('a1') // too late to undo
    await useMuleyStore.getState().dismissAction('a1')
    await useMuleyStore.getState().applyAction('missing')

    expect(applyAction).not.toHaveBeenCalled()
    expect(undoAction).not.toHaveBeenCalled()
    expect(dismissAction).not.toHaveBeenCalled()
  })

  it('dismisses a pending change without telling any page', async () => {
    await prepare()
    const heard: string[][] = []
    const stop = onDataChange((topics) => heard.push(topics))
    setMuleyClient({ dismissAction: vi.fn(async () => action({ status: 'rejected' })) })
    await useMuleyStore.getState().dismissAction('a1')
    stop()
    expect(entry().action.status).toBe('rejected')
    expect(heard).toEqual([])
  })

  it('reads whether the school lets Muley prepare changes', async () => {
    setMuleyClient({ getMuleySettings: vi.fn(async () => ({ enabled: true, capabilities: { writes: true }, maxMessageLength: 4000 })) })
    await useMuleyStore.getState().loadConfig()
    expect(useMuleyStore.getState().config).toEqual({ status: 'ready', enabled: true, maxMessageLength: 4000, writes: true })
  })
})

describe('attached images', () => {
  const blob = () => new Blob(['png']) as unknown as Parameters<ReturnType<typeof useMuleyStore.getState>['attach']>[0]

  it('uploads a picked image, sends it with the next message, and empties the composer', async () => {
    const uploadAttachment = vi.fn(async () => ({ id: 'abc.png', name: 'stamp.png', size: 3 }))
    const streamTurn = scripted([{ t: 'done', reason: 'end' }])
    setMuleyClient({ uploadAttachment, streamTurn })

    await useMuleyStore.getState().attach(blob(), { name: 'stamp.png', previewUrl: 'blob:1' })
    expect(useMuleyStore.getState().attachments).toEqual([expect.objectContaining({ status: 'ready', id: 'abc.png', name: 'stamp.png' })])

    await useMuleyStore.getState().send('')
    expect(streamTurn.mock.calls[0][0]).toMatchObject({ message: 'I attached an image.', attachments: [{ id: 'abc.png', name: 'stamp.png' }] })
    expect(useMuleyStore.getState().attachments).toEqual([])
    expect(useMuleyStore.getState().thread.messages[0]).toMatchObject({ role: 'user', attachments: [{ name: 'stamp.png', previewUrl: 'blob:1' }] })
  })

  it('waits while an image is uploading, keeps a refused one with the reason, and never sends one with a tapped option', async () => {
    let finish: (value: { id: string; name: string; size: number }) => void = () => {}
    const streamTurn = scripted([{ t: 'done', reason: 'end' }])
    setMuleyClient({ uploadAttachment: vi.fn(() => new Promise<{ id: string; name: string; size: number }>((resolve) => { finish = resolve })), streamTurn })
    const uploading = useMuleyStore.getState().attach(blob(), { name: 'a.png', previewUrl: null })
    await useMuleyStore.getState().send('use this')
    expect(streamTurn).not.toHaveBeenCalled()
    finish({ id: 'a.png', name: 'a.png', size: 1 })
    await uploading

    // A tapped option goes without the image; the next typed message takes it.
    await useMuleyStore.getState().send('Yusuf Rahman', { choice: { ref: 's2' } })
    expect(streamTurn.mock.calls[0][0]).not.toHaveProperty('attachments')
    expect(useMuleyStore.getState().attachments).toHaveLength(1)

    const { AttachmentRefused } = await import('@/services/muleyService')
    setMuleyClient({ uploadAttachment: vi.fn(async () => { throw new AttachmentRefused(400, 'FILE_TOO_LARGE', 'Keep the image under 5 MB.') }) })
    await useMuleyStore.getState().attach(blob(), { name: 'huge.png', previewUrl: null })
    expect(useMuleyStore.getState().attachments.at(-1)).toMatchObject({ status: 'failed', error: 'Keep the image under 5 MB.' })
    useMuleyStore.getState().removeAttachment(useMuleyStore.getState().attachments.at(-1)!.localId)
    expect(useMuleyStore.getState().attachments).toHaveLength(1)
  })
})

