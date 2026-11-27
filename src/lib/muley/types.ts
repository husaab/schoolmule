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
  /** A change Muley prepared: what each student has now and what they would have. Saved only when the person presses Save. */
  | {
      type: 'change'
      actionId: string
      title: string
      subtitle?: string | null
      columns: string[]
      rows: { name: string; now: string; next: string }[]
      /** Rows past the ones shown. */
      hiddenCount: number
      /** How the day would end up ("Present 21", "Absent 2"), for attendance. */
      tally: { label: string; count: number }[] | null
      note: string | null
    }

/**
 * A prepared change as the server tracks it. pending → applying → applied →
 * undoing → undone; rejected is dismissed, expired is a preview too old to save.
 */
export type ActionStatus = 'pending' | 'applying' | 'applied' | 'undoing' | 'undone' | 'rejected' | 'expired'

export type ProposedAction = {
  id: string
  kind: string
  status: ActionStatus
  title: string
  /** Sent back with Save, so the server saves exactly the change the person was shown. */
  hash: string
  expiresAt: string
  applyLabel: string
  doneLabel: string
  undoLabel: string
  undoneLabel: string
  canUndo: boolean
  /** What a save touches ("scores:<classId>"), so an open page can reload it. */
  topics: string[]
  error: string | null
}

/** A student whose value changed after the preview, so nothing was saved. */
export type ActionConflict = { name: string; was: string; now: string }

export type ActionProblem = { code: string; message: string; conflicts: ActionConflict[] }

/** A prepared change on screen: the server's view of it, and what the person's last press came to. */
export type ActionEntry = {
  action: ProposedAction
  busy: 'apply' | 'undo' | 'dismiss' | null
  problem: ActionProblem | null
}

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
  /** A tool prepared a change; its card follows. */
  | { t: 'action'; action: ProposedAction }
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
  /** The changes prepared in this conversation, by id. */
  actions: Record<string, ActionEntry>
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
  | { t: 'local:loaded'; conversationId: string; messages: ShownMessage[]; actions?: ProposedAction[] }
  | { t: 'local:action-busy'; id: string; busy: 'apply' | 'undo' | 'dismiss' }
  /** A press came back: the change as it now stands (when the server said), and what went wrong (or null). */
  | { t: 'local:action-settled'; id: string; action: ProposedAction | null; problem: ActionProblem | null }
  | { t: 'local:reset' }

export const EMPTY_THREAD: ThreadState = { conversationId: null, contextLabel: null, messages: [], status: 'idle', error: null, actions: {} }
