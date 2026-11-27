// services/muleyService.ts
// Muley's backend (/api/assistant). A turn is a POST whose answer is a stream
// of JSON lines, read as it arrives; everything else is plain JSON through
// apiClient. The stream carries the same token and school year apiClient
// sends, and a dead session signs out the same way.

import apiClient, { handleSessionFailure } from './apiClient'
import { getToken } from './authService'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { createNdjsonParser } from '@/lib/muley/ndjson'
import type { ShownMessage, StreamEvent } from '@/lib/muley/types'

const baseURL = process.env.NEXT_PUBLIC_BASE_URL

export type MuleySettings = {
  enabled: boolean
  reason?: string
  message?: string
  view?: string
  capabilities?: { writes: boolean }
  maxMessageLength?: number
}

export type ConversationStub = { id: string; title: string | null; createdAt: string; lastMessageAt: string }
export type StoredConversation = { id: string; title: string | null; messages: ShownMessage[] }

export type TurnBody = {
  message: string
  conversationId?: string | null
  choice?: { ref: string | null } | null
  pageContext?: { route: string; classId: string | null } | null
}

/** A turn refused before it started (the server answered with an error, not a stream). */
export class TurnRefused extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
    this.name = 'TurnRefused'
  }
}

// The server pings every 15 seconds while it works: this long with nothing at all means the connection is gone.
const SILENCE_MS = 45_000

/**
 * Send one message and hand every event of the answer to onEvent as it
 * arrives. Resolves when the stream ends. Throws TurnRefused when the server
 * refuses the turn, and an AbortError when `signal` stops it.
 */
export async function streamTurn(body: TurnBody, onEvent: (event: StreamEvent) => void, { signal }: { signal?: AbortSignal } = {}): Promise<void> {
  const token = getToken()
  const year = useSchoolYearStore.getState().selectedYearId
  const silence = new AbortController()
  const stop = () => silence.abort()
  signal?.addEventListener('abort', stop)

  let timer: ReturnType<typeof setTimeout> | undefined
  const wake = () => {
    clearTimeout(timer)
    timer = setTimeout(stop, SILENCE_MS)
  }
  wake()

  try {
    const res = await fetch(`${baseURL}/assistant/turns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/x-ndjson',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(year && { 'X-School-Year': year }),
      },
      body: JSON.stringify(body),
      signal: silence.signal,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      await handleSessionFailure(res.status, data, token)
      throw new TurnRefused(res.status, data?.code || 'REFUSED', data?.message || "Muley couldn't answer that.")
    }

    const parser = createNdjsonParser((value) => {
      if (value && typeof value === 'object' && typeof (value as { t?: unknown }).t === 'string') onEvent(value as StreamEvent)
    })
    const reader = res.body?.getReader()
    if (!reader) {
      parser.push(await res.text())
      parser.end()
      return
    }
    const decoder = new TextDecoder()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      wake()
      parser.push(decoder.decode(value, { stream: true }))
    }
    parser.push(decoder.decode())
    parser.end()
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', stop)
  }
}

export const getMuleySettings = async (): Promise<MuleySettings> =>
  (await apiClient<{ status: string; data: MuleySettings }>('/assistant/settings')).data

export const listConversations = async (): Promise<ConversationStub[]> =>
  (await apiClient<{ status: string; data: ConversationStub[] }>('/assistant/conversations')).data

export const getConversation = async (id: string): Promise<StoredConversation> =>
  (await apiClient<{ status: string; data: StoredConversation }>(`/assistant/conversations/${encodeURIComponent(id)}`)).data

export const renameConversation = (id: string, title: string) =>
  apiClient(`/assistant/conversations/${encodeURIComponent(id)}`, { method: 'PATCH', body: { title } })

export const deleteConversation = (id: string) =>
  apiClient(`/assistant/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' })
