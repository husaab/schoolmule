import { describe, expect, it } from 'vitest'
import { createNdjsonParser } from './ndjson'
import { muleyReducer } from './reducer'
import { EMPTY_THREAD, type StreamEvent, type ThreadState } from './types'
import { muleyVisible } from './visibility'
import { pageContextFor, pageLabel, startersFor } from './pageContext'
import { isAppPath, splitText } from './inlineText'

const CLASS = '11111111-2222-4333-8444-555555555555'

describe('the stream parser', () => {
  const collect = (chunks: string[], end = true) => {
    const out: unknown[] = []
    const parser = createNdjsonParser((value) => out.push(value))
    chunks.forEach((c) => parser.push(c))
    if (end) parser.end()
    return out
  }

  it('reads lines split across chunks, several in one chunk, and CRLF', () => {
    expect(collect(['{"t":"te', 'xt","d":"Hi"}\n{"t":"ping"}\r\n{"t":"done"', ',"reason":"end"}\n'])).toEqual([
      { t: 'text', d: 'Hi' }, { t: 'ping' }, { t: 'done', reason: 'end' },
    ])
  })

  it('skips blank and broken lines without losing the rest', () => {
    expect(collect(['\n\n{"t":"text","d":"a"}\nnot json\n{"t":"text","d":"b"}\n'])).toEqual([{ t: 'text', d: 'a' }, { t: 'text', d: 'b' }])
  })

  it('keeps a last line without a newline until the end', () => {
    expect(collect(['{"t":"ping"}'], false)).toEqual([])
    expect(collect(['{"t":"ping"}'])).toEqual([{ t: 'ping' }])
  })
})

describe('the conversation reducer', () => {
  const run = (events: (StreamEvent | Parameters<typeof muleyReducer>[1])[], from: ThreadState = EMPTY_THREAD) => events.reduce(muleyReducer, from)
  const answerOf = (state: ThreadState) => {
    const last = state.messages[state.messages.length - 1]
    if (last.role !== 'assistant') throw new Error('no answer')
    return last
  }

  it('builds an answer from words, a tool and a card, in order', () => {
    const state = run([
      { t: 'local:sent', id: 'm1', text: 'Who is absent?' },
      { t: 'start', v: 1, conversationId: 'conv-1', turnId: 't1' },
      { t: 'context', label: 'Math · Grade 6' },
      { t: 'tool', id: 'c1', state: 'started', name: 'get_class_attendance', label: 'Reading attendance' },
      { t: 'tool', id: 'c1', state: 'finished', ok: true, summary: '20 of 24 marked' },
      { t: 'card', id: 'c1', card: { type: 'link', label: 'Open Class Attendance', href: '/attendance/class' } },
      { t: 'text', d: 'Two ' },
      { t: 'text', d: 'students.' },
      { t: 'usage', in: 1, cachedIn: 0, out: 1 },
      { t: 'done', reason: 'end' },
    ])
    expect(state.conversationId).toBe('conv-1')
    expect(state.contextLabel).toBe('Math · Grade 6')
    expect(state.status).toBe('idle')
    expect(state.messages[0]).toEqual({ id: 'm1', role: 'user', text: 'Who is absent?' })
    expect(answerOf(state).status).toBe('done')
    expect(answerOf(state).blocks).toEqual([
      { kind: 'trace', id: 'c1', label: 'Reading attendance', state: 'done', summary: '20 of 24 marked' },
      { kind: 'card', id: 'c1', card: { type: 'link', label: 'Open Class Attendance', href: '/attendance/class' } },
      { kind: 'text', text: 'Two students.' },
    ])
  })

  it('starts a new paragraph for words that follow a tool', () => {
    const state = run([
      { t: 'local:sent', id: 'm1', text: 'x' },
      { t: 'text', d: 'Let me check.' },
      { t: 'tool', id: 'c1', state: 'started', name: 'n', label: 'Reading' },
      { t: 'text', d: 'Done.' },
    ])
    expect(answerOf(state).blocks.map((b) => b.kind)).toEqual(['text', 'trace', 'text'])
    expect(state.status).toBe('streaming')
  })

  it('marks a failed tool, and a tool still running when the turn ends', () => {
    const state = run([
      { t: 'local:sent', id: 'm1', text: 'x' },
      { t: 'tool', id: 'a', state: 'started', name: 'n', label: 'Reading the gradebook' },
      { t: 'tool', id: 'a', state: 'finished', ok: false, summary: null },
      { t: 'tool', id: 'b', state: 'started', name: 'n', label: 'Reading' },
      { t: 'error', code: 'limit', message: 'Too many steps.', retryable: false },
      { t: 'done', reason: 'limit' },
    ])
    expect(answerOf(state).blocks.map((b) => b.kind === 'trace' && b.state)).toEqual(['failed', 'failed'])
    expect(answerOf(state).status).toBe('error')
    expect(state.error).toEqual({ code: 'limit', message: 'Too many steps.', retryable: false })
  })

  it('closes a question once an option is picked', () => {
    let state = run([
      { t: 'local:sent', id: 'm1', text: 'how is Yusuf?' },
      { t: 'choices', id: 'ask', question: 'Which Yusuf?', options: [{ id: 'o1', label: 'Yusuf R', ref: 's2' }, { id: 'o2', label: 'Yusuf S', ref: 's3' }] },
      { t: 'done', reason: 'choices' },
    ])
    state = run([{ t: 'local:picked', choicesId: 'ask', optionId: 'o2' }, { t: 'local:sent', id: 'm2', text: 'Yusuf S' }], state)
    const question = state.messages[1]
    expect(question.role === 'assistant' && question.blocks[0]).toMatchObject({ kind: 'choices', picked: 'o2' })
    expect(state.messages).toHaveLength(4)
  })

  it('records a stop, a failure before the stream, and a reset', () => {
    const stopped = run([{ t: 'local:sent', id: 'm1', text: 'x' }, { t: 'text', d: 'Part' }, { t: 'done', reason: 'aborted' }])
    expect(answerOf(stopped).status).toBe('stopped')
    const refused = run([{ t: 'local:sent', id: 'm1', text: 'x' }, { t: 'local:failed', error: { code: 'AI_LIMIT_USER_DAILY', message: 'Limit', retryable: false } }])
    expect(refused.status).toBe('idle')
    expect(refused.error?.code).toBe('AI_LIMIT_USER_DAILY')
    expect(run([{ t: 'local:reset' }], stopped)).toEqual(EMPTY_THREAD)
  })

  it('ignores what it does not know, and anything before an answer exists', () => {
    const state = run([{ t: 'text', d: 'orphan' }, { t: 'surprise' } as unknown as StreamEvent, { t: 'ping' }])
    expect(state).toEqual(EMPTY_THREAD)
  })

  it('rebuilds a stored conversation: each run between two of the person\'s messages is one answer', () => {
    const state = muleyReducer(EMPTY_THREAD, {
      t: 'local:loaded',
      conversationId: 'conv-1',
      messages: [
        { id: '1', role: 'user', text: 'where are report templates?' },
        { id: '2', role: 'tool', toolCallId: 'c1', label: 'Checking where that is', ok: true, summary: 'Found "Report Templates"', card: { type: 'link', label: 'Open Report Templates', href: '/admin-panel/report-templates' } },
        { id: '3', role: 'assistant', text: 'Open Admin Panel.' },
        { id: '4', role: 'user', text: 'which Yusuf?' },
        { id: '5', role: 'tool', toolCallId: 'c2', label: 'Asking you to choose', ok: true, summary: null, choices: { question: 'Which?', options: [{ id: 'o1', label: 'A', ref: null }] } },
      ],
    })
    expect(state.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant'])
    const first = state.messages[1]
    expect(first.role === 'assistant' && first.blocks.map((b) => b.kind)).toEqual(['trace', 'card', 'text'])
    const last = state.messages[3]
    expect(last.role === 'assistant' && last.blocks[1]).toMatchObject({ kind: 'choices', picked: '' })
  })
})

describe('where Muley shows', () => {
  const teacher = { id: 'u1', role: 'TEACHER', isVerifiedEmail: true, isVerifiedSchool: true }
  const on = { status: 'ready' as const, enabled: true }
  const visible = (over: Partial<Parameters<typeof muleyVisible>[0]> = {}) =>
    muleyVisible({ pathname: '/dashboard', user: teacher, previewing: false, config: on, ...over })

  it('shows for staff once the server says it is on', () => {
    expect(visible()).toBe(true)
    expect(visible({ user: { ...teacher, role: 'ADMIN' }, pathname: '/admin-panel/school-assets' })).toBe(true)
  })

  it('stays hidden until the server answers, and when it is off', () => {
    expect(visible({ config: { status: 'unknown' } })).toBe(false)
    expect(visible({ config: { status: 'ready', enabled: false } })).toBe(false)
  })

  it('never shows signed out, unverified, for a student, in a preview, or on sign-in and public pages', () => {
    expect(visible({ user: { ...teacher, id: null } })).toBe(false)
    expect(visible({ user: { ...teacher, isVerifiedEmail: false } })).toBe(false)
    expect(visible({ user: { ...teacher, role: 'STUDENT' }, pathname: '/student' })).toBe(false)
    expect(visible({ pathname: '/student/classes' })).toBe(false)
    expect(visible({ previewing: true })).toBe(false)
    for (const pathname of ['/login', '/observe/alerts', '/verify-email', '/qr']) expect(visible({ pathname })).toBe(false)
  })
})

describe('the page context', () => {
  it('finds the class on a class page and sends nothing else', () => {
    expect(pageContextFor(`/gradebook/${CLASS}?tab=1`)).toEqual({ route: `/gradebook/${CLASS}`, kind: 'gradebook', classId: CLASS })
    expect(pageContextFor(`/gradebook/jk/${CLASS}`).classId).toBe(CLASS)
    expect(pageContextFor(`/attendance/class/${CLASS}`)).toMatchObject({ kind: 'class-attendance', classId: CLASS })
    expect(pageContextFor(`/classes/${CLASS}/edit`)).toMatchObject({ kind: 'class', classId: CLASS })
    expect(pageContextFor('/classes/not-an-id')).toMatchObject({ kind: 'other', classId: null })
  })

  it('names the page before the server does, and offers starters for it', () => {
    expect(pageLabel(pageContextFor('/admin-panel/school-assets'))).toBe('Admin Panel')
    expect(pageLabel(pageContextFor('/settings'))).toBeNull()
    expect(startersFor(pageContextFor(`/gradebook/${CLASS}`))).toContain('How do I leave a student out of the class average?')
    expect(startersFor(pageContextFor('/settings')).length).toBeGreaterThan(0)
  })
})

describe('text and links', () => {
  it('splits an answer into paragraphs and lists, without markdown leftovers', () => {
    expect(splitText('First line\nstill first.\n\n- one\n- **two**\n\nAfter.')).toEqual([
      { kind: 'paragraph', text: 'First line still first.' },
      { kind: 'list', items: ['one', 'two'] },
      { kind: 'paragraph', text: 'After.' },
    ])
    expect(splitText('1. a\n2) b')).toEqual([{ kind: 'list', items: ['a', 'b'] }])
  })

  it('follows only links inside the app', () => {
    expect(isAppPath('/admin-panel/report-templates')).toBe(true)
    for (const bad of ['https://evil.test', '//evil.test', 'javascript:alert(1)', '/a b', '/x"onmouseover', 42, null]) expect(isAppPath(bad)).toBe(false)
  })
})
