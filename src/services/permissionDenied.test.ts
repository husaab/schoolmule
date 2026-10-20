import { beforeEach, describe, expect, it, vi } from 'vitest'

// A 403 PERMISSION_DENIED toasts once and re-reads the session, however many
// requests fail together; a preview never touches /auth/me.

const showNotification = vi.fn()
const validateSession = vi.fn()
const refreshAccessFlags = vi.fn()
let previewing = false

vi.mock('./authService', () => ({
  getToken: () => 'session-token',
  validateSession: () => validateSession(),
}))
vi.mock('./sessionSync', () => ({ refreshAccessFlags: (...args: unknown[]) => refreshAccessFlags(...args) }))
vi.mock('@/store/useNotificationStore', () => ({ useNotificationStore: { getState: () => ({ showNotification }) } }))
vi.mock('@/store/useImpersonationStore', () => ({
  useImpersonationStore: { getState: () => ({ session: previewing ? { adminToken: 'admin' } : null }) },
}))

const { handlePermissionDenied, resetPermissionDenied, PERMISSION_DENIED_MESSAGE } = await import('./permissionDenied')

const me = { success: true, message: 'ok', data: { userId: 'user-1', role: 'ADMIN', permissions: ['users'] } }

describe('handlePermissionDenied', () => {
  beforeEach(() => {
    resetPermissionDenied()
    showNotification.mockReset()
    validateSession.mockReset().mockResolvedValue(me)
    refreshAccessFlags.mockReset()
    previewing = false
  })

  it('says so and refreshes the session from /auth/me', async () => {
    await handlePermissionDenied(1_000)
    expect(showNotification).toHaveBeenCalledWith(PERMISSION_DENIED_MESSAGE, 'error')
    expect(refreshAccessFlags).toHaveBeenCalledWith(me.data, 'session-token')
  })

  it('handles a burst of refusals once', async () => {
    await Promise.all([handlePermissionDenied(1_000), handlePermissionDenied(1_200), handlePermissionDenied(5_000)])
    expect(showNotification).toHaveBeenCalledTimes(1)
    expect(validateSession).toHaveBeenCalledTimes(1)
    await handlePermissionDenied(20_000)
    expect(showNotification).toHaveBeenCalledTimes(2)
  })

  it('leaves /auth/me alone during a preview', async () => {
    previewing = true
    await handlePermissionDenied(1_000)
    expect(showNotification).toHaveBeenCalledTimes(1)
    expect(validateSession).not.toHaveBeenCalled()
  })

  it('keeps the toast when the refresh fails', async () => {
    validateSession.mockRejectedValue(new Error('offline'))
    await handlePermissionDenied(1_000)
    expect(showNotification).toHaveBeenCalledTimes(1)
    expect(refreshAccessFlags).not.toHaveBeenCalled()
  })
})
