// src/store/useMuleyStore.ts
// Muley's panel: whether it is open, what is typed, and the conversation on
// screen. Only the panel's place (open, the conversation id, the draft) is
// kept, in this tab's session storage, under the person and view it belongs
// to; the messages themselves always come back from the server.
//
// A change Muley prepared is saved, undone or dismissed only from here, when
// the person presses the button on its card. A save tells any open page that
// shows the same data to reload (lib/muley/dataChanges).

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { muleyReducer } from '@/lib/muley/reducer'
import { EMPTY_THREAD, type ActionConflict, type ActionProblem, type ProposedAction, type StreamEvent, type ThreadState } from '@/lib/muley/types'
import { announceDataChange } from '@/lib/muley/dataChanges'
import { isApiError } from '@/services/apiClient'
import {
  applyAction,
  dismissAction,
  undoAction,
  deleteConversation as removeConversation,
  getConversation,
  getMuleySettings,
  listConversations,
  streamTurn,
  TurnRefused,
  type ConversationStub,
  type TurnBody,
} from '@/services/muleyService'
import type { MuleyConfig } from '@/lib/muley/visibility'

type Client = {
  streamTurn: typeof streamTurn
  getMuleySettings: typeof getMuleySettings
  getConversation: typeof getConversation
  listConversations: typeof listConversations
  deleteConversation: typeof removeConversation
  applyAction: typeof applyAction
  undoAction: typeof undoAction
  dismissAction: typeof dismissAction
}

const REAL: Client = { streamTurn, getMuleySettings, getConversation, listConversations, deleteConversation: removeConversation, applyAction, undoAction, dismissAction }
let client: Client = REAL
/** Tests swap the backend for a fake. */
export const setMuleyClient = (replacement: Partial<Client> | null) => {
  client = replacement ? { ...client, ...replacement } : REAL
}

type Step = 'apply' | 'undo' | 'dismiss'

// One key per press, kept until the server has answered it: pressing again
// after a dropped connection is the same press, and the server saves it once.
const pressKeys = new Map<string, string>()
// Not a secret: it only tells two tries of one press apart from two presses.
const newKey = () => {
  const random = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  return typeof random?.randomUUID === 'function' ? random.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

/** What a refused press means for the card, and whether the server answered at all. */
function problemOf(err: unknown, step: Step): { problem: ActionProblem; action: ProposedAction | null; answered: boolean } {
  if (isApiError(err)) {
    const data = (err.data && typeof err.data === 'object' ? err.data : {}) as { conflicts?: ActionConflict[]; action?: ProposedAction }
    return {
      problem: { code: err.code || 'FAILED', message: err.message, conflicts: Array.isArray(data.conflicts) ? data.conflicts : [] },
      action: data.action ?? null,
      answered: true,
    }
  }
  const message = step === 'dismiss'
    ? "School Mule couldn't be reached. Check your connection and try again."
    : `School Mule couldn't be reached. Press ${step === 'apply' ? 'Save' : 'Undo'} again: it won't be done twice.`
  return { problem: { code: 'offline', message, conflicts: [] }, action: null, answered: false }
}

let running: AbortController | null = null
let nextId = 0
const localId = () => `local-${Date.now().toString(36)}-${(nextId += 1)}`

type MuleyStore = {
  /** Whose panel this is ("userId:VIEW"): the conversation and the draft are theirs only. */
  owner: string | null
  open: boolean
  view: 'chat' | 'history'
  draft: string
  config: MuleyConfig
  thread: ThreadState
  conversations: ConversationStub[] | null
  /** The last message sent, for Retry. */
  lastSent: TurnBody | null

  claim: (owner: string | null) => void
  loadConfig: () => Promise<void>
  setOpen: (open: boolean) => void
  setView: (view: 'chat' | 'history') => void
  setDraft: (draft: string) => void
  send: (text: string, extra?: { choice?: { ref: string | null }; choicesId?: string; optionId?: string; pageContext?: TurnBody['pageContext'] }) => Promise<void>
  retry: () => Promise<void>
  stop: () => void
  newConversation: () => void
  openConversation: (id: string) => Promise<void>
  loadConversations: () => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  /** Save the prepared change the person was shown. */
  applyAction: (id: string) => Promise<void>
  /** Put a saved change back as it was. */
  undoAction: (id: string) => Promise<void>
  /** The person doesn't want a prepared change. */
  dismissAction: (id: string) => Promise<void>
  reset: () => void
}

const FRESH = { open: false, view: 'chat' as const, draft: '', thread: EMPTY_THREAD, conversations: null, lastSent: null }

export const useMuleyStore = create<MuleyStore>()(
  persist(
    (set, get) => {
      const dispatch = (event: StreamEvent | Parameters<typeof muleyReducer>[1]) => set((state) => ({ thread: muleyReducer(state.thread, event) }))

      const press = async (id: string, step: Step, call: (key: string) => Promise<ProposedAction>) => {
        dispatch({ t: 'local:action-busy', id, busy: step })
        const slot = `${id}:${step}`
        const key = pressKeys.get(slot) ?? newKey()
        pressKeys.set(slot, key)
        try {
          const action = await call(key)
          pressKeys.delete(slot)
          dispatch({ t: 'local:action-settled', id, action, problem: null })
          if (step !== 'dismiss') announceDataChange(action.topics)
        } catch (err) {
          const { problem, action, answered } = problemOf(err, step)
          if (answered) pressKeys.delete(slot)
          dispatch({ t: 'local:action-settled', id, action, problem })
        }
      }
      const entryOf = (id: string) => get().thread.actions?.[id]

      return {
        owner: null,
        config: { status: 'unknown' },
        ...FRESH,

        claim: (owner) => {
          if (get().owner === owner) return
          running?.abort()
          set({ owner, config: { status: 'unknown' }, ...FRESH })
        },

        loadConfig: async () => {
          try {
            const settings = await client.getMuleySettings()
            set({ config: { status: 'ready', enabled: Boolean(settings.enabled), maxMessageLength: settings.maxMessageLength, writes: Boolean(settings.capabilities?.writes) } })
          } catch {
            set({ config: { status: 'ready', enabled: false } })
          }
        },

        setOpen: (open) => {
          set({ open })
          const { thread } = get()
          // Reopened after a reload: bring the conversation back from the server.
          if (open && thread.conversationId && thread.messages.length === 0) void get().openConversation(thread.conversationId)
        },
        setView: (view) => {
          set({ view })
          if (view === 'history') void get().loadConversations()
        },
        setDraft: (draft) => set({ draft }),

        send: async (text, extra = {}) => {
          const message = text.trim()
          if (!message || get().thread.status === 'streaming') return
          const body: TurnBody = {
            message,
            conversationId: get().thread.conversationId,
            choice: extra.choice ?? null,
            pageContext: extra.pageContext ?? null,
          }
          if (extra.choicesId && extra.optionId) dispatch({ t: 'local:picked', choicesId: extra.choicesId, optionId: extra.optionId })
          dispatch({ t: 'local:sent', id: localId(), text: message })
          set({ draft: extra.choice ? get().draft : '', lastSent: body, view: 'chat' })

          const controller = new AbortController()
          running = controller
          let ended = false
          try {
            await client.streamTurn(body, (event) => {
              if (event.t === 'done') ended = true
              dispatch(event)
            }, { signal: controller.signal })
            if (!ended) dispatch({ t: 'local:failed', error: { code: 'interrupted', message: 'The connection dropped before Muley finished.', retryable: true } })
          } catch (err) {
            if (controller.signal.aborted && running !== controller) return // replaced or reset
            if (controller.signal.aborted) {
              dispatch({ t: 'done', reason: 'aborted' })
            } else if (err instanceof TurnRefused) {
              dispatch({ t: 'local:failed', error: { code: err.code, message: err.message, retryable: err.status >= 500 || err.status === 409 } })
            } else {
              dispatch({ t: 'local:failed', error: { code: 'offline', message: "Muley couldn't be reached. Check your connection and try again.", retryable: true } })
            }
          } finally {
            if (running === controller) running = null
          }
        },

        retry: async () => {
          const last = get().lastSent
          if (!last) return
          set((state) => {
            // Take the failed exchange back off the screen; it is sent again.
            const messages = [...state.thread.messages]
            if (messages[messages.length - 1]?.role === 'assistant') messages.pop()
            if (messages[messages.length - 1]?.role === 'user') messages.pop()
            return { thread: { ...state.thread, messages, error: null } }
          })
          await get().send(last.message, { choice: last.choice ?? undefined, pageContext: last.pageContext })
        },

        stop: () => running?.abort(),

        newConversation: () => {
          running?.abort()
          set({ thread: EMPTY_THREAD, view: 'chat', draft: '', lastSent: null })
        },

        openConversation: async (id) => {
          running?.abort()
          set({ view: 'chat' })
          try {
            const stored = await client.getConversation(id)
            dispatch({ t: 'local:loaded', conversationId: stored.id, messages: stored.messages, actions: stored.actions })
          } catch {
            // Deleted elsewhere, or not this person's: start afresh.
            set({ thread: EMPTY_THREAD })
          }
        },

        loadConversations: async () => {
          try {
            set({ conversations: await client.listConversations() })
          } catch {
            set({ conversations: [] })
          }
        },

        deleteConversation: async (id) => {
          await client.deleteConversation(id)
          set((state) => ({
            conversations: (state.conversations || []).filter((c) => c.id !== id),
            thread: state.thread.conversationId === id ? EMPTY_THREAD : state.thread,
          }))
        },

        applyAction: async (id) => {
          const entry = entryOf(id)
          if (!entry || entry.busy || entry.action.status !== 'pending') return
          await press(id, 'apply', (key) => client.applyAction(id, entry.action.hash, key))
        },

        undoAction: async (id) => {
          const entry = entryOf(id)
          if (!entry || entry.busy || entry.action.status !== 'applied' || !entry.action.canUndo) return
          await press(id, 'undo', (key) => client.undoAction(id, key))
        },

        dismissAction: async (id) => {
          const entry = entryOf(id)
          if (!entry || entry.busy || entry.action.status !== 'pending') return
          await press(id, 'dismiss', () => client.dismissAction(id))
        },

        reset: () => {
          running?.abort()
          set({ owner: null, config: { status: 'unknown' }, ...FRESH })
        },
      }
    },
    {
      name: 'muley-panel',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ owner: state.owner, open: state.open, draft: state.draft, thread: { ...EMPTY_THREAD, conversationId: state.thread.conversationId } }),
      // A tab saved by an older version has a thread without some fields: fill them in.
      merge: (persisted, current) => {
        const saved = (persisted && typeof persisted === 'object' ? persisted : {}) as Partial<MuleyStore>
        return { ...current, ...saved, thread: { ...EMPTY_THREAD, ...(saved.thread || {}) } }
      },
    },
  ),
)
