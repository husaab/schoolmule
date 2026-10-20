import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The AI routes spend the OpenAI key: only a live staff session gets through,
// and the backend's /auth/me is what decides.

const backendFetch = vi.fn()

const request = (authorization?: string) =>
  new Request('http://app.test/api/ai/dashboard-briefing', {
    method: 'POST',
    headers: authorization ? { authorization } : {},
  })

const me = (data: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify({ success: status === 200, data }), { status, headers: { 'Content-Type': 'application/json' } })

describe('requireStaffSession', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://backend.test/api')
    vi.stubGlobal('fetch', backendFetch)
    backendFetch.mockReset()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const load = async () => (await import('./aiSession')).requireStaffSession

  it('refuses a request without a Bearer token, without asking the backend', async () => {
    const check = await (await load())(request())
    expect(check.ok).toBe(false)
    if (!check.ok) expect(check.response.status).toBe(401)
    expect(backendFetch).not.toHaveBeenCalled()
  })

  it('asks the backend who the token belongs to', async () => {
    backendFetch.mockResolvedValue(me({ userId: 'u-1', role: 'TEACHER', school: 'TEST', permissions: ['analytics'], isFullAdmin: false }))
    const check = await (await load())(request('Bearer session-token'))
    expect(backendFetch).toHaveBeenCalledWith('https://backend.test/api/auth/me', expect.objectContaining({ headers: { Authorization: 'Bearer session-token' } }))
    expect(check).toEqual({ ok: true, session: { userId: 'u-1', role: 'TEACHER', school: 'TEST' } })
  })

  it('refuses a dead or revoked session', async () => {
    backendFetch.mockResolvedValue(me({}, 401))
    const check = await (await load())(request('Bearer old-token'))
    expect(check.ok).toBe(false)
    if (!check.ok) expect(check.response.status).toBe(401)
  })

  it('refuses parents and students', async () => {
    for (const role of ['PARENT', 'STUDENT']) {
      backendFetch.mockResolvedValue(me({ userId: 'u-2', role, permissions: [] }))
      const check = await (await load())(request('Bearer t'))
      expect(check.ok, role).toBe(false)
      if (!check.ok) expect(check.response.status).toBe(403)
    }
  })

  it('needs the permission a route names', async () => {
    backendFetch.mockResolvedValue(me({ userId: 'u-3', role: 'ADMIN', permissions: ['users'], isFullAdmin: false }))
    const denied = await (await load())(request('Bearer t'), { permission: 'analytics' })
    expect(denied.ok).toBe(false)
    if (!denied.ok) expect(denied.response.status).toBe(403)

    backendFetch.mockResolvedValue(me({ userId: 'u-3', role: 'ADMIN', permissions: ['users'], isFullAdmin: false }))
    expect((await (await load())(request('Bearer t'))).ok).toBe(true)
  })

  it('reads an older backend without access fields by role (a teacher keeps analytics)', async () => {
    backendFetch.mockResolvedValue(me({ userId: 'u-4', role: 'TEACHER' }))
    expect((await (await load())(request('Bearer t'), { permission: 'analytics' })).ok).toBe(true)
  })

  it('fails closed when the backend cannot be reached', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    backendFetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const check = await (await load())(request('Bearer t'))
    expect(check.ok).toBe(false)
    if (!check.ok) expect(check.response.status).toBe(503)
  })
})
