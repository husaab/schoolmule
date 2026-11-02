import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/server/aiSession', () => ({
  requireStaffSession: vi.fn(async () => ({ ok: true, session: { userId: 'u1', role: 'TEACHER', school: 'ALHAADIACADEMY' } })),
}))

import { POST } from './route'

type OpenAiBody = { messages: { role: string; content: string }[]; max_tokens: number }

const BASE = { studentName: 'Layla Haddad', gender: 'female', subject: 'Math', workHabits: 'G', behavior: 'G', term: 'Term 1', grade: 78.3 }

let sent: OpenAiBody | null = null

beforeEach(() => {
  sent = null
  process.env.OPENAI_API_KEY = 'test-key'
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: { body: string }) => {
      sent = JSON.parse(init.body)
      return new Response(JSON.stringify({ choices: [{ message: { content: 'A comment.' } }] }), { status: 200 })
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const call = async (body: Record<string, unknown>) => {
  const req = new Request('http://localhost/api/ai/generate-comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t' },
    body: JSON.stringify(body),
  })
  const res = await POST(req as never)
  expect(res.status).toBe(200)
  const prompt = sent!.messages.find((m) => m.role === 'user')!.content
  return { prompt, maxTokens: sent!.max_tokens }
}

describe('generate-comment', () => {
  it("sends today's prompt when no details are given", async () => {
    const { prompt, maxTokens } = await call(BASE)
    expect(prompt).toContain('- Work Habits Rating: Good')
    expect(prompt).toContain('- Keep the comment between 2-4 sentences')
    expect(prompt).not.toContain('What the teacher observed')
    expect(prompt).not.toContain('Do not invent specifics')
    expect(maxTokens).toBe(200)
  })

  it("adds the teacher's observations and guidelines when details are given", async () => {
    const { prompt, maxTokens } = await call({ ...BASE, details: { understanding: 'most', bogus: 'x' }, note: 'Strong at mental math.' })
    expect(prompt).toContain('What the teacher observed in Math:\n- Understanding of concepts: Understands most concepts')
    expect(prompt).toContain("Teacher's note: Strong at mental math.")
    expect(prompt).toContain('Do not invent specifics')
    expect(prompt).toContain('- Keep the comment between 3-5 sentences')
    expect(prompt).not.toContain('- Keep the comment between 2-4 sentences')
    expect(prompt).toContain('one clear next step')
    expect(prompt).toContain('follow the observations')
    expect(prompt).toContain('Do not mention medical, health or family matters')
    expect(prompt).not.toContain('bogus')
    expect(maxTokens).toBe(300)
  })

  it('treats details it does not know, and a blank note, as none', async () => {
    const { prompt, maxTokens } = await call({ ...BASE, details: { bogus: 'x' }, note: '   ' })
    expect(prompt).not.toContain('What the teacher observed')
    expect(prompt).toContain('- Keep the comment between 2-4 sentences')
    expect(maxTokens).toBe(200)
  })
})
