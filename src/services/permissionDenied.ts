// services/permissionDenied.ts
// What a 403 PERMISSION_DENIED means for the signed-in user: their access
// changed under them (an admin edited their role mid-session) or the page
// offered something their role doesn't cover. Say so once, then re-read the
// session from /auth/me so the menus and the router catch up; a page they
// lost sends them home (AuthGuard re-runs on the store change).
//
// Several requests usually fail together (a page loads four lists at once),
// so the toast and the refresh run at most once per window. During a "view
// as" preview the claims come from the impersonate payload and /auth/me is
// left alone, exactly as AuthGuard does.

import { getToken, validateSession } from './authService'
import { refreshAccessFlags } from './sessionSync'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useImpersonationStore } from '@/store/useImpersonationStore'

export const PERMISSION_DENIED_MESSAGE = "You don't have permission to do that"

const WINDOW_MS = 10_000
let lastHandledAt: number | null = null

export const handlePermissionDenied = async (now: number = Date.now()): Promise<void> => {
  if (lastHandledAt !== null && now - lastHandledAt < WINDOW_MS) return
  lastHandledAt = now

  useNotificationStore.getState().showNotification(PERMISSION_DENIED_MESSAGE, 'error')

  if (useImpersonationStore.getState().session) return
  const token = getToken()
  if (!token) return
  try {
    const res = await validateSession()
    if (res.success && res.data) refreshAccessFlags(res.data, token)
  } catch {
    // A dead session is apiClient's to handle (401 signs out); the toast stands.
  }
}

/** Tests only: forget the last refusal. */
export const resetPermissionDenied = (): void => {
  lastHandledAt = null
}
