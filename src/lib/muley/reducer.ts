// src/lib/muley/reducer.ts
// A conversation with Muley as the panel draws it, built one event at a
// time: the stream's events as they arrive, and the few things the app does
// itself (sending, picking an option, reopening a stored conversation).
// Pure, so the web panel and the mobile sheet share it and a test can replay
// any stream.

import { EMPTY_THREAD } from './types'
import type { ActionEntry, Block, LocalEvent, ShownMessage, StreamEvent, ThreadMessage, ThreadState } from './types'

type Assistant = Extract<ThreadMessage, { role: 'assistant' }>

/** Change the answer being written (the last message), if there is one. */
const withAnswer = (state: ThreadState, change: (answer: Assistant) => Assistant): ThreadState => {
  const last = state.messages[state.messages.length - 1]
  if (!last || last.role !== 'assistant') return state
  return { ...state, messages: [...state.messages.slice(0, -1), change(last)] }
}

const addBlock = (state: ThreadState, block: Block): ThreadState =>
  withAnswer(state, (answer) => ({ ...answer, blocks: [...answer.blocks, block] }))

/** Change one prepared change, if it is on screen. A session stored before changes existed has no `actions`. */
const withAction = (state: ThreadState, id: string, change: (entry: ActionEntry) => ActionEntry): ThreadState => {
  const entry = state.actions?.[id]
  if (!entry) return state
  return { ...state, actions: { ...state.actions, [id]: change(entry) } }
}

/** A stored conversation as thread messages: each run of tool results and words between two of the person's messages is one answer. */
function fromStored(messages: ShownMessage[]): ThreadMessage[] {
  const thread: ThreadMessage[] = []
  const answer = (id: string): Assistant => {
    const last = thread[thread.length - 1]
    if (last && last.role === 'assistant') return last
    const fresh: Assistant = { id, role: 'assistant', blocks: [], status: 'done' }
    thread.push(fresh)
    return fresh
  }
  for (const message of messages) {
    if (message.role === 'user') {
      thread.push({ id: message.id, role: 'user', text: message.text })
    } else if (message.role === 'assistant') {
      answer(message.id).blocks.push({ kind: 'text', text: message.text })
    } else if (message.role === 'tool') {
      const into = answer(message.id)
      if (message.label) {
        into.blocks.push({ kind: 'trace', id: message.toolCallId, label: message.label, state: message.ok === false ? 'failed' : 'done', summary: message.summary ?? null })
      }
      if (message.card) into.blocks.push({ kind: 'card', id: message.toolCallId, card: message.card })
      // An old question can't be answered again: it is shown as already closed.
      if (message.choices) into.blocks.push({ kind: 'choices', id: message.toolCallId, ...message.choices, picked: '' })
    }
  }
  return thread
}

export function muleyReducer(state: ThreadState, event: StreamEvent | LocalEvent): ThreadState {
  switch (event.t) {
    case 'local:sent':
      return {
        ...state,
        status: 'streaming',
        error: null,
        messages: [
          ...state.messages,
          { id: event.id, role: 'user', text: event.text },
          { id: `${event.id}:answer`, role: 'assistant', blocks: [], status: 'streaming' },
        ],
      }

    case 'start':
      return { ...state, conversationId: event.conversationId }

    case 'context':
      return { ...state, contextLabel: event.label }

    case 'text':
      return withAnswer(state, (answer) => {
        const last = answer.blocks[answer.blocks.length - 1]
        // Words that follow a tool or a card start a new paragraph of their own.
        if (last && last.kind === 'text') {
          return { ...answer, blocks: [...answer.blocks.slice(0, -1), { kind: 'text', text: last.text + event.d }] }
        }
        return { ...answer, blocks: [...answer.blocks, { kind: 'text', text: event.d }] }
      })

    case 'tool':
      if (event.state === 'started') {
        return addBlock(state, { kind: 'trace', id: event.id, label: event.label, state: 'running', summary: null })
      }
      return withAnswer(state, (answer) => ({
        ...answer,
        blocks: answer.blocks.map((block) =>
          block.kind === 'trace' && block.id === event.id
            ? { ...block, state: event.ok ? 'done' : 'failed', summary: event.summary }
            : block,
        ),
      }))

    case 'card':
      return addBlock(state, { kind: 'card', id: event.id, card: event.card })

    case 'choices':
      return addBlock(state, { kind: 'choices', id: event.id, question: event.question, options: event.options, picked: null })

    case 'action':
      return { ...state, actions: { ...state.actions, [event.action.id]: { action: event.action, busy: null, problem: null } } }

    case 'local:action-busy':
      return withAction(state, event.id, (entry) => ({ ...entry, busy: event.busy, problem: null }))

    case 'local:action-settled':
      return withAction(state, event.id, (entry) => ({ action: event.action ?? entry.action, busy: null, problem: event.problem }))

    case 'error':
      return { ...state, error: { code: event.code, message: event.message, retryable: event.retryable } }

    case 'done': {
      const ended = withAnswer(state, (answer) => ({
        ...answer,
        status: event.reason === 'aborted' ? 'stopped' : event.reason === 'error' || event.reason === 'limit' ? 'error' : 'done',
        // A tool still marked as running when the turn ends did not finish.
        blocks: answer.blocks.map((block) => (block.kind === 'trace' && block.state === 'running' ? { ...block, state: 'failed' as const } : block)),
      }))
      return { ...ended, status: 'idle' }
    }

    case 'local:failed': {
      const ended = withAnswer(state, (answer) => ({ ...answer, status: 'error' }))
      return { ...ended, status: 'idle', error: event.error }
    }

    case 'local:picked':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.role === 'assistant'
            ? { ...message, blocks: message.blocks.map((block) => (block.kind === 'choices' && block.id === event.choicesId ? { ...block, picked: event.optionId } : block)) }
            : message,
        ),
      }

    case 'local:loaded':
      return {
        conversationId: event.conversationId,
        contextLabel: null,
        messages: fromStored(event.messages),
        status: 'idle',
        error: null,
        actions: Object.fromEntries((event.actions || []).map((action) => [action.id, { action, busy: null, problem: null }])),
      }

    case 'local:reset':
      return EMPTY_THREAD

    default:
      // usage, ping, and anything a newer backend sends that this app doesn't know
      return state
  }
}
