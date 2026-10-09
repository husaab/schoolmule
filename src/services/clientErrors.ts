// src/services/clientErrors.ts
// Collects browser-side failures and sends them to the backend in small
// batches. Fire-and-forget: nothing here may throw or loop on its own
// failures, so the reporter never reports itself.
export type ClientEventKind = 'js_error' | 'unhandled_rejection' | 'api_failure' | 'render_error'

export interface ClientEvent {
  kind: ClientEventKind
  message: string
  stack?: string | null
  page?: string | null
  requestId?: string | null
  status?: number | null
}

const ENDPOINT = `${process.env.NEXT_PUBLIC_BASE_URL}/observe/client-events`
const MAX_BATCH = 20
const FLUSH_MS = 5000
const queue: ClientEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null

const clip = (s: string | null | undefined, n: number) => (typeof s === 'string' ? s.slice(0, n) : null)

const token = () => (typeof window === 'undefined' ? null : localStorage.getItem('auth_token'))

// `keepalive` lets the request outlive a page unload (the pagehide flush),
// which is what sendBeacon would give us, except sendBeacon cannot carry
// the bearer token the endpoint needs.
export function flushClientEvents(): void {
  if (typeof window === 'undefined' || queue.length === 0) return
  const t = token()
  if (!t) {
    queue.length = 0
    return
  }
  const events = queue.splice(0, MAX_BATCH)
  try {
    fetch(ENDPOINT, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ events }),
    }).catch(() => {})
  } catch {
    // never surface
  }
  if (queue.length > 0) schedule()
}

function schedule(): void {
  if (timer) return
  timer = setTimeout(() => {
    timer = null
    flushClientEvents()
  }, FLUSH_MS)
}

export function reportClientEvent(event: ClientEvent): void {
  if (typeof window === 'undefined') return
  if (event.message && event.message.includes('/observe/client-events')) return
  queue.push({
    kind: event.kind,
    message: clip(event.message, 500) || 'Unknown error',
    stack: clip(event.stack, 2000),
    page: clip(event.page ?? window.location.pathname, 300),
    requestId: clip(event.requestId, 100),
    status: Number.isInteger(event.status) ? (event.status as number) : null,
  })
  if (queue.length >= MAX_BATCH) flushClientEvents()
  else schedule()
}
