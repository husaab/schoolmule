import { beforeEach, describe, expect, it, vi } from 'vitest'

// The in-preview switch must never touch /auth/view (the preview token is
// refused on every POST); it re-mints the preview through the impersonate
// endpoint with the parked admin token.

const apiClient = vi.fn()
const impersonateSchoolUser = vi.fn()
const startImpersonation = vi.fn()
const setToken = vi.fn()
const clearChildren = vi.fn()
const clearMessaging = vi.fn()
let session: unknown = null

vi.mock('./apiClient', () => ({ default: (...args: unknown[]) => apiClient(...args) }))
vi.mock('./adminUserService', () => ({ impersonateSchoolUser: (...args: unknown[]) => impersonateSchoolUser(...args) }))
vi.mock('./impersonation', () => ({ startImpersonation: (...args: unknown[]) => startImpersonation(...args) }))
vi.mock('./authService', () => ({ setToken: (...args: unknown[]) => setToken(...args) }))
vi.mock('@/store/useUserStore', () => ({ useUserStore: { getState: () => ({ user: {}, setUser: vi.fn() }) } }))
vi.mock('@/store/useSelectedChildStore', () => ({ useSelectedChildStore: { getState: () => ({ clearChildren }) } }))
vi.mock('@/store/useMessagingStore', () => ({ useMessagingStore: { getState: () => ({ clear: clearMessaging }) } }))
vi.mock('@/store/useImpersonationStore', () => ({ useImpersonationStore: { getState: () => ({ session }) } }))

const preview = {
  adminToken: 'admin-token',
  admin: { userId: 'admin-1', fullName: 'Amira Admin' },
  target: { userId: 'teacher-1', fullName: 'Tariq Teacher', role: 'TEACHER', baseRole: 'TEACHER' },
  startedAt: '2026-10-12T20:00:00.000Z',
}

const parentPreview = {
  userId: 'teacher-1',
  username: 'tariq',
  fullName: 'Tariq Teacher',
  email: 'tariq@example.test',
  school: 'TEST',
  role: 'PARENT',
  baseRole: 'TEACHER',
  roles: ['TEACHER', 'PARENT'],
  isVerified: true,
  isVerifiedSchool: true,
  activeTerm: 'Term 1',
  activeSchoolYear: null,
  schoolYears: [],
  impersonator: { userId: 'admin-1', username: 'amira', fullName: 'Amira Admin' },
  token: 'preview-token-2',
}

describe('switchView inside an admin preview', () => {
  beforeEach(() => {
    vi.resetModules()
    apiClient.mockReset()
    impersonateSchoolUser.mockReset()
    startImpersonation.mockReset()
    setToken.mockReset()
    clearChildren.mockReset()
    clearMessaging.mockReset()
    const store = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    })
    vi.stubGlobal('window', { location: { href: '' } })
  })

  it('re-mints the preview in the other portal with the admin token instead of calling /auth/view', async () => {
    session = preview
    impersonateSchoolUser.mockResolvedValue({ status: 'success', data: parentPreview })
    const { switchView, takeViewSwitchFlash } = await import('./viewSwitch')

    await switchView('PARENT')

    expect(apiClient).not.toHaveBeenCalled()
    expect(impersonateSchoolUser).toHaveBeenCalledWith('teacher-1', 'PARENT', 'admin-token')
    expect(clearChildren).toHaveBeenCalled()
    expect(clearMessaging).toHaveBeenCalled()
    // The same preview continues: same admin token, original start time.
    expect(startImpersonation).toHaveBeenCalledWith('admin-token', parentPreview, {
      startedAt: preview.startedAt,
      keepSelectedYear: true,
    })
    expect(takeViewSwitchFlash()).toBe("You're now in Parent view")
  })

  it("refuses the admin view for a teacher's preview, which can't hold it", async () => {
    session = preview
    const { switchView } = await import('./viewSwitch')

    await expect(switchView('ADMIN')).rejects.toThrow(/views this account holds/)
    expect(impersonateSchoolUser).not.toHaveBeenCalled()
    expect(startImpersonation).not.toHaveBeenCalled()
  })

  it('takes a restricted admin previewed as a parent back to their admin view', async () => {
    session = { ...preview, target: { userId: 'admin-2', fullName: 'Office Staff test user', role: 'PARENT', baseRole: 'ADMIN' } }
    const adminPreview = { ...parentPreview, userId: 'admin-2', role: 'ADMIN', baseRole: 'ADMIN', roles: ['ADMIN', 'PARENT'], isFullAdmin: false, permissions: ['users'] }
    impersonateSchoolUser.mockResolvedValue({ status: 'success', data: adminPreview })
    const { switchView } = await import('./viewSwitch')

    await switchView('ADMIN')

    expect(impersonateSchoolUser).toHaveBeenCalledWith('admin-2', 'ADMIN', 'admin-token')
    expect(startImpersonation).toHaveBeenCalledWith('admin-token', adminPreview, expect.objectContaining({ keepSelectedYear: true }))
  })

  it('surfaces the server refusal and lets the next click try again', async () => {
    session = preview
    impersonateSchoolUser
      .mockRejectedValueOnce(new Error('This account has no parent view'))
      .mockResolvedValueOnce({ status: 'success', data: parentPreview })
    const { switchView } = await import('./viewSwitch')

    await expect(switchView('PARENT')).rejects.toThrow('This account has no parent view')
    await switchView('PARENT')
    expect(startImpersonation).toHaveBeenCalledTimes(1)
  })

  it('still uses /auth/view for a real dual-role session', async () => {
    session = null
    apiClient.mockResolvedValue({
      status: 'success',
      data: { ...parentPreview, token: 'session-token' },
    })
    const { switchView } = await import('./viewSwitch')

    await switchView('PARENT')

    expect(apiClient).toHaveBeenCalledWith('/auth/view', { method: 'POST', body: { view: 'PARENT' } })
    expect(impersonateSchoolUser).not.toHaveBeenCalled()
    expect(setToken).toHaveBeenCalledWith('session-token')
  })
})
