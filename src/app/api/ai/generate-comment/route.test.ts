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
  describe('a grade that includes modified marks', () => {
    const generate = async (coverage: Record<string, number>) => {
      const req = new Request('http://localhost/api/ai/generate-comment', { method: 'POST', body: JSON.stringify({ ...BASE, grade: 72, coverage }) })
      await POST(req as never)
      return sent!.messages.map((m) => m.content).join('\n')
    }

    it('tells the model, and not to compare the grade', async () => {
      const prompt = await generate({ assessed: 3, total: 3, modifiedCount: 2 })
      expect(prompt).toContain('includes 2 modified assessments, which are not comparable with the class')
      expect(prompt).toContain('Some marks are for a modified version of the work; do not compare the grade with the class or other students.')
    })

    it('uses the singular for one', async () => {
      expect(await generate({ assessed: 3, total: 3, modifiedCount: 1 })).toContain('includes 1 modified assessment, which is not comparable with the class')
    })

    it('never names a plan', async () => {
      expect(await generate({ assessed: 3, total: 3, modifiedCount: 2 })).not.toMatch(/\biep\b/i)
    })

    it('says nothing with none', async () => {
      expect(await generate({ assessed: 3, total: 3, modifiedCount: 0 })).not.toMatch(/modified/i)
      expect(await generate({ assessed: 3, total: 3 })).not.toMatch(/modified/i)
    })
  })

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
