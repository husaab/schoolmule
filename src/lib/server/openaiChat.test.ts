import { afterEach, describe, expect, it, vi } from 'vitest'
import { AI_MODEL, chatBody, openaiChat, withoutRefused } from './openaiChat'

const messages = [{ role: 'user', content: 'Hello' }]

const answer = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const refusal = (param: string) =>
  answer(400, { error: { message: `Unsupported parameter: '${param}'`, param, code: 'unsupported_parameter' } })

const sentBodies = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('chatBody', () => {
  it('uses the replacement for gpt-4o-mini by default', () => {
    expect(AI_MODEL).toBe('gpt-6-luna')
    expect(chatBody({ messages, maxTokens: 300 }).model).toBe('gpt-6-luna')
  })

  it('switches thinking off and names the output limit the newer way', () => {
    expect(chatBody({ messages, maxTokens: 300, temperature: 0.4 })).toEqual({
      model: 'gpt-6-luna',
      messages,
      max_completion_tokens: 300,
      reasoning_effort: 'none',
      temperature: 0.4,
    })
  })

  it('keeps the old request shape for a gpt-4 model', () => {
    expect(chatBody({ messages, maxTokens: 300, temperature: 0.4, model: 'gpt-4o-mini' })).toEqual({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 300,
      temperature: 0.4,
    })
  })

  it('asks for a stream only when told to', () => {
    expect(chatBody({ messages, maxTokens: 10 })).not.toHaveProperty('stream')
    expect(chatBody({ messages, maxTokens: 10, stream: true }).stream).toBe(true)
  })
})

describe('withoutRefused', () => {
  const body = { model: 'm', messages, max_completion_tokens: 50, reasoning_effort: 'none', temperature: 0.7 }

  it('drops a refused temperature or thinking setting', () => {
    expect(withoutRefused(body, 'temperature')).not.toHaveProperty('temperature')
    expect(withoutRefused(body, 'reasoning_effort')).not.toHaveProperty('reasoning_effort')
  })

  it('renames the output limit either way, keeping its value', () => {
    expect(withoutRefused(body, 'max_completion_tokens')).toMatchObject({ max_tokens: 50 })
    expect(withoutRefused({ model: 'm', max_tokens: 50 }, 'max_tokens')).toEqual({ model: 'm', max_completion_tokens: 50 })
  })

  it('changes nothing for a setting it does not send or does not know', () => {
    expect(withoutRefused(body, 'messages')).toBeNull()
    expect(withoutRefused(body, 'top_p')).toBeNull()
    expect(withoutRefused(body, null)).toBeNull()
  })
})

describe('openaiChat', () => {
  it('posts once with the key and returns the response untouched', async () => {
    const ok = answer(200, { choices: [{ message: { content: 'Hi' } }] })
    const fetchMock = vi.fn().mockResolvedValue(ok)
    vi.stubGlobal('fetch', fetchMock)

    const response = await openaiChat('sk-test', { messages, maxTokens: 50, temperature: 0.7 })

    expect(response).toBe(ok)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/chat/completions')
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer sk-test' })
  })

  it('sends the request again without a setting the API refuses', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(refusal('temperature'))
      .mockResolvedValueOnce(answer(200, { choices: [] }))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const response = await openaiChat('sk-test', { messages, maxTokens: 50, temperature: 0.7 })

    expect(response.status).toBe(200)
    const [first, second] = sentBodies(fetchMock)
    expect(first.temperature).toBe(0.7)
    expect(second).not.toHaveProperty('temperature')
    expect(second.max_completion_tokens).toBe(50)
  })

  it('gives up after two adjustments and returns the refusal', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(refusal('temperature'))
      .mockResolvedValueOnce(refusal('reasoning_effort'))
      .mockResolvedValueOnce(refusal('max_completion_tokens'))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const response = await openaiChat('sk-test', { messages, maxTokens: 50, temperature: 0.7 })

    expect(response.status).toBe(400)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('does not retry a 400 that is about something else, or any other failure', async () => {
    const badRequest = vi.fn().mockResolvedValue(answer(400, { error: { message: 'Bad messages', param: 'messages' } }))
    vi.stubGlobal('fetch', badRequest)
    expect((await openaiChat('sk-test', { messages, maxTokens: 50 })).status).toBe(400)
    expect(badRequest).toHaveBeenCalledTimes(1)

    const limited = vi.fn().mockResolvedValue(answer(429, { error: { message: 'Slow down' } }))
    vi.stubGlobal('fetch', limited)
    expect((await openaiChat('sk-test', { messages, maxTokens: 50 })).status).toBe(429)
    expect(limited).toHaveBeenCalledTimes(1)
  })

  it('leaves the refusal readable by the caller', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(400, { error: { message: 'Bad messages', param: 'messages' } })))
    const response = await openaiChat('sk-test', { messages, maxTokens: 50 })
    expect(await response.json()).toEqual({ error: { message: 'Bad messages', param: 'messages' } })
  })
})
