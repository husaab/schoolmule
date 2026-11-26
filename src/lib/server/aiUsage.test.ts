import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The AI routes report to the backend before and after they spend the key.
// A limit stops the request; nothing else does.

const session = { userId: 'u-1', role: 'TEACHER', school: 'TEST', token: 'session-token' }
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

const load = async () => {
  vi.resetModules()
  return import('./aiUsage')
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_BASE_URL = 'https://backend.test/api'
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('startAiRequest', () => {
  it('asks the backend with the caller\'s token and lets the request through', async () => {
    const backend = vi.fn().mockResolvedValue(json(200, { status: 'success' }))
    vi.stubGlobal('fetch', backend)
    const { startAiRequest } = await load()

    expect(await startAiRequest(session, 'generate_comment')).toBeNull()
    const [url, init] = backend.mock.calls[0]
    expect(url).toBe('https://backend.test/api/ai-usage/start')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer session-token' })
    expect(JSON.parse(init.body)).toEqual({ feature: 'generate_comment' })
  })

  it('answers 429 with the backend\'s message when a limit is reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      json(429, { status: 'failed', code: 'AI_LIMIT_USER_DAILY', message: "You've reached today's limit for AI features. It resets tomorrow." }),
    ))
    const { startAiRequest } = await load()

    const refused = await startAiRequest(session, 'analytics_chat')
    expect(refused?.status).toBe(429)
    expect(await refused?.json()).toEqual({
      error: "You've reached today's limit for AI features. It resets tomorrow.",
      code: 'AI_LIMIT_USER_DAILY',
    })
  })

  it.each([
    ['the general rate limiter\'s 429', () => json(429, { message: 'Too many requests' })],
    ['a preview session\'s 403', () => json(403, { code: 'IMPERSONATION_READ_ONLY' })],
    ['a backend without the endpoint', () => json(404, {})],
    ['a backend error', () => json(500, {})],
  ])('lets the request through on %s', async (_label, answer) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer()))
    const { startAiRequest } = await load()
    expect(await startAiRequest(session, 'generate_comment')).toBeNull()
  })

  it('lets the request through when the backend can\'t be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { startAiRequest } = await load()
    expect(await startAiRequest(session, 'generate_comment')).toBeNull()
  })

  it('makes no call without a token or a backend address', async () => {
    const backend = vi.fn()
    vi.stubGlobal('fetch', backend)
    const { startAiRequest } = await load()
    expect(await startAiRequest({ ...session, token: undefined }, 'generate_comment')).toBeNull()

    delete process.env.NEXT_PUBLIC_BASE_URL
    const unset = await load()
    expect(await unset.startAiRequest(session, 'generate_comment')).toBeNull()
    expect(backend).not.toHaveBeenCalled()
  })
})

describe('recordAiUsage', () => {
  it('sends the tokens an answer used', async () => {
    const backend = vi.fn().mockResolvedValue(json(200, {}))
    vi.stubGlobal('fetch', backend)
    const { recordAiUsage } = await load()

    await recordAiUsage(session, 'generate_comment', { prompt_tokens: 900, completion_tokens: 120, prompt_tokens_details: { cached_tokens: 300 } })

    const [url, init] = backend.mock.calls[0]
    expect(url).toBe('https://backend.test/api/ai-usage/record')
    expect(JSON.parse(init.body)).toEqual({ feature: 'generate_comment', inputTokens: 900, cachedInputTokens: 300, outputTokens: 120 })
  })

  it('does nothing without usage, and never throws', async () => {
    const backend = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', backend)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { recordAiUsage } = await load()

    await recordAiUsage(session, 'generate_comment', undefined)
    expect(backend).not.toHaveBeenCalled()
    await expect(recordAiUsage(session, 'generate_comment', { prompt_tokens: 1 })).resolves.toBeUndefined()
  })
})
