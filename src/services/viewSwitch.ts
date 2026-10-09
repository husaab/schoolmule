// services/viewSwitch.ts
// Switching a dual-role account (staff who are also parents) between its
// Teacher/Administrator view and its Parent view. The backend reissues the
// session token with `role` set to the new view; this side swaps the token,
// drops every store that belongs to the old view, and does a full page load
// on purpose, exactly like admin impersonation: the in-memory stores
// (messaging counts, schedules, analytics, planner…) and AuthGuard's
// once-per-mount refreshes are all keyed to the previous view, and a hard
// navigation is the one way to be sure none of it leaks across.

import apiClient from './apiClient'
import { setToken } from './authService'
import type { LoginResponse } from './types/auth'
import { useUserStore } from '@/store/useUserStore'
import { useSelectedChildStore } from '@/store/useSelectedChildStore'
import { useMessagingStore } from '@/store/useMessagingStore'
import { landingPathFor, switchFlashFor } from '@/lib/viewSwitch'

// A one-shot message shown after the reload that completes a switch.
const FLASH_KEY = 'view_switch_flash'

type ViewResponse = { status: 'success' | 'failed'; message?: string; data: LoginResponse['data'] }

// Set once a switch is under way so a double click cannot fire two reissues.
let switching = false

/** The views the backend knows. The database role is asked for under its own name. */
export type View = 'ADMIN' | 'TEACHER' | 'PARENT'
export const isView = (v: string): v is View => v === 'ADMIN' || v === 'TEACHER' || v === 'PARENT'

/**
 * Ask the backend for another view and reload into it. Rejects with the
 * server's message when the view is refused, so the caller can toast it.
 */
export const switchView = async (view: View): Promise<void> => {
  if (switching) return
  switching = true
  try {
    const res = await apiClient<ViewResponse, { view: string }>('/auth/view', { method: 'POST', body: { view } })
    const data = res.data

    // Parent-only state belongs to the view being left (or is stale for the
    // one being entered: ChildSwitcher refetches). The messaging summary is
    // computed per view; clear it so a late response cannot paint the old
    // badge before the navigation lands. The school-year selection is kept:
    // same person, same school.
    useSelectedChildStore.getState().clearChildren()
    useMessagingStore.getState().clear()

    setToken(data.token)
    const current = useUserStore.getState().user
    useUserStore.getState().setUser({
      ...current,
      id: data.userId,
      username: data.username,
      email: data.email,
      school: data.school,
      role: data.role,
      baseRole: data.baseRole ?? data.role,
      roles: data.roles ?? [data.role],
      isVerifiedEmail: data.isVerified,
      isVerifiedSchool: data.isVerifiedSchool,
      activeTerm: data.activeTerm || null,
      isPlatformOwner: Boolean(data.isPlatformOwner),
    })

    try {
      sessionStorage.setItem(FLASH_KEY, switchFlashFor(data.role, data.baseRole ?? data.role))
    } catch {
      // sessionStorage can be unavailable (private mode); the message is a nicety.
    }

    window.location.href = landingPathFor(data.role)
  } catch (err) {
    switching = false
    throw err
  }
}

/** Read and clear the post-switch message, if one was left. */
export const takeViewSwitchFlash = (): string | null => {
  try {
    const msg = sessionStorage.getItem(FLASH_KEY)
    if (msg) sessionStorage.removeItem(FLASH_KEY)
    return msg
  } catch {
    return null
  }
}
