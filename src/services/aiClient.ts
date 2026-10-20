// services/aiClient.ts
// Calls to the app's own AI routes (src/app/api/ai/**). They spend the
// OpenAI key, so every route checks the caller's session
// (lib/server/aiSession); this sends the same Bearer token apiClient sends
// to the backend. Callers read the Response themselves (some stream it).

import { getToken } from './authService'
import { handleSessionFailure } from './apiClient'

export const aiFetch = async (path: string, body: unknown, init: { signal?: AbortSignal } = {}): Promise<Response> => {
  const token = getToken()
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
    signal: init.signal,
  })
  // A dead session signs out exactly as an API call would.
  if (res.status === 401) await handleSessionFailure(401, null, token)
  return res
}
