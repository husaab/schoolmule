// src/lib/muley/types.ts
// Muley, the assistant: what its backend streams and what a conversation
// looks like on screen. The stream is one JSON object per line
// (schoolmule-backend/services/assistant/stream/ndjson.js); a reader ignores
// any `t` it doesn't know, so the backend can add events without breaking
// an older app.

/** What a tool shows beside Muley's words. An unknown type is not drawn. */
export type MuleyCard =
  | {
      type: 'table'
      title: string
      subtitle?: string
      tier?: 'read'
      columns: { key: string; label: string; align?: 'right' }[]
      rows: Record<string, string | number | null>[]
    }
  | { type: 'link'; label: string; href: string }

export type ChoiceOption = { id: string; label: string; ref: string | null }

export type StreamEvent =
  | { t: 'start'; v: number; conversationId: string; turnId: string }
  /** What the server confirmed the person is looking at, when it is a page Muley understands. */
  | { t: 'context'; label: string | null }
  | { t: 'text'; d: string }
  | { t: 'tool'; id: string; state: 'started'; name: string; label: string }
  | { t: 'tool'; id: string; state: 'finished'; ok: boolean; summary: string | null }
  | { t: 'card'; id: string; card: MuleyCard }
  | { t: 'choices'; id: string; question: string; options: ChoiceOption[] }
  | { t: 'usage'; in: number; cachedIn: number; out: number }
  | { t: 'error'; code: string; message: string; retryable: boolean }
  | { t: 'ping' }
  | { t: 'done'; reason: 'end' | 'choices' | 'limit' | 'error' | 'aborted' }

/** One piece of an answer, in the order it arrived. */
export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'trace'; id: string; label: string; state: 'running' | 'done' | 'failed'; summary: string | null }
  | { kind: 'card'; id: string; card: MuleyCard }
  | { kind: 'choices'; id: string; question: string; options: ChoiceOption[]; picked: string | null }

export type ThreadMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; blocks: Block[]; status: 'streaming' | 'done' | 'stopped' | 'error' }

export type ThreadError = { code: string; message: string; retryable: boolean }

export type ThreadState = {
  conversationId: string | null
  /** "Math · Grade 6": the class the server confirmed for the last turn. */
  contextLabel: string | null
  messages: ThreadMessage[]
  status: 'idle' | 'streaming'
  error: ThreadError | null
}

/** A stored message as GET /assistant/conversations/:id returns it. */
export type ShownMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string }
  | {
      id: string
      role: 'tool'
      toolCallId: string
      label?: string
      ok?: boolean
      summary?: string | null
      card?: MuleyCard | null
      choices?: { question: string; options: ChoiceOption[] } | null
    }

/** What the app does itself, told to the reducer the same way as a stream event. */
export type LocalEvent =
  | { t: 'local:sent'; id: string; text: string }
  | { t: 'local:picked'; choicesId: string; optionId: string }
  | { t: 'local:failed'; error: ThreadError }
  | { t: 'local:loaded'; conversationId: string; messages: ShownMessage[] }
  | { t: 'local:reset' }

export const EMPTY_THREAD: ThreadState = { conversationId: null, contextLabel: null, messages: [], status: 'idle', error: null }
